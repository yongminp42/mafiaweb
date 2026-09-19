package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

import jakarta.annotation.PreDestroy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import kr.or.oti.mafiagame.dto.GameActionRequest;
import kr.or.oti.mafiagame.dto.GameFaction;
import kr.or.oti.mafiagame.dto.GameInvestigationResult;
import kr.or.oti.mafiagame.dto.GameNightAction;
import kr.or.oti.mafiagame.dto.GamePhase;
import kr.or.oti.mafiagame.dto.GamePlayer;
import kr.or.oti.mafiagame.dto.GameResult;
import kr.or.oti.mafiagame.dto.GameRole;
import kr.or.oti.mafiagame.dto.GameRoleAssignment;
import kr.or.oti.mafiagame.dto.RoomGameState;
import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.PrincipalIdentity;

@Service
public class RoomGameService {
    private static final String GAME_DESTINATION = "/topic/rooms/%d/game";
    private static final String ROLE_DESTINATION = "/queue/game-role";
    private static final String RESULT_DESTINATION = "/queue/game-result";
    private static final String NIGHT_RESULT_DESTINATION = "/queue/night-result";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomPresenceService roomPresenceService;
    private final ReentrantLock gameLock = new ReentrantLock();
    private final ScheduledExecutorService phaseExecutor;
    private final Map<Long, GameRoom> gamesByRoom = new HashMap<>();
    private final Map<Long, ScheduledFuture<?>> phaseTasksByRoom = new HashMap<>();

    public RoomGameService(SimpMessagingTemplate messagingTemplate) {
        this(messagingTemplate, null);
    }

    @Autowired
    public RoomGameService(
            SimpMessagingTemplate messagingTemplate,
            RoomPresenceService roomPresenceService) {
        this.messagingTemplate = messagingTemplate;
        this.roomPresenceService = roomPresenceService;
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "room-game-phase");
            thread.setDaemon(true);
            return thread;
        };
        this.phaseExecutor = Executors.newScheduledThreadPool(1, threadFactory);
    }

    public void startGame(long roomId, List<RoomParticipant> participants) {
        startGame(roomId, participants, Map.of());
    }

    public void startGame(
            long roomId,
            List<RoomParticipant> participants,
            Map<Long, String> principalNames) {
        if (participants == null || participants.isEmpty()) {
            throw new RoomWebSocketException("게임 시작에는 참가자가 필요합니다.");
        }

        RoomGameState state;
        List<RoleDelivery> roleDeliveries;
        gameLock.lock();
        try {
            // 같은 방에서 이전 게임의 타이머가 남아 있을 수 있으므로 먼저 취소한다.
            cancelPhaseTask(roomId);
            GameRoom game = new GameRoom(roomId);
            for (RoomParticipant participant : participants) {
                game.players.putIfAbsent(
                        participant.userId(),
                        new GamePlayerState(participant.userId(), participant.nickname()));
            }
            if (principalNames != null) {
                game.principalNames.putAll(principalNames);
            }
            // 역할 배정부터 첫 페이즈 예약까지를 하나의 잠금 안에서 처리한다.
            // 타이머 콜백이 초기화 중인 게임을 관찰하거나 덮어쓰지 못하게 한다.
            assignRoles(game);
            gamesByRoom.put(roomId, game);
            moveTo(game, GamePhase.DAY_DISCUSSION, System.currentTimeMillis(), "낮 토론이 시작되었습니다.");
            state = snapshot(game, System.currentTimeMillis());
            roleDeliveries = roleDeliveries(game);
            scheduleNextPhase(game);
        } finally {
            gameLock.unlock();
        }

        broadcast(state);
        broadcastRoleAssignments(roleDeliveries);
    }

    public void broadcastCurrentState(long roomId) {
        broadcastCurrentState(roomId, null);
    }

    public void broadcastCurrentState(long roomId, Principal principal) {
        RoomGameState state;
        GameRoleAssignment roleAssignment = null;
        GameResult gameResult = null;
        String principalName = principal == null ? null : principal.getName();
        gameLock.lock();
        try {
            // 새로고침한 클라이언트에는 공개 상태를 재전송하고, 인증된 사용자에게만
            // 자신의 역할과 종료 결과를 복원한다.
            GameRoom game = gamesByRoom.get(roomId);
            state = game == null ? null : snapshot(game, System.currentTimeMillis());
            if (game != null && principal != null) {
                long userId = PrincipalIdentity.from(principal).userId();
                String assignedPrincipalName = game.principalNames.get(userId);
                GamePlayerState player = game.players.get(userId);
                if (player != null
                        && player.role != null
                        && Objects.equals(assignedPrincipalName, principalName)) {
                    roleAssignment = toRoleAssignment(game, player);
                    if (game.phase == GamePhase.FINISHED && game.winningFaction != null) {
                        gameResult = toGameResult(game, player);
                    }
                }
            }
        } finally {
            gameLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
        if (roleAssignment != null) {
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    ROLE_DESTINATION,
                    roleAssignment);
        }
        if (gameResult != null) {
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    RESULT_DESTINATION,
                    gameResult);
        }
    }

    public void submitAction(
            long roomId,
            Principal principal,
            GameActionRequest request) {
        if (principal == null) {
            throw new RoomWebSocketException("로그인 후 이용해 주세요.");
        }
        if (request == null) {
            throw new RoomWebSocketException("게임 행동을 확인할 수 없습니다.");
        }

        long userId = PrincipalIdentity.from(principal).userId();
        RoomGameState state;
        GameInvestigationResult investigationResult = null;
        gameLock.lock();
        try {
            // 행동 검증과 기록을 같은 잠금 안에서 수행해 중복 제출과 타이머 경계의 경쟁 상태를 막는다.
            GameRoom game = gamesByRoom.get(roomId);
            if (game == null) {
                throw new RoomWebSocketException("아직 게임이 시작되지 않았습니다.");
            }
            if (game.phase == GamePhase.FINISHED) {
                throw new RoomWebSocketException("게임이 이미 종료되었습니다.");
            }
            if (System.currentTimeMillis() >= game.phaseEndsAt) {
                throw new RoomWebSocketException("현재 페이즈가 종료되었습니다.");
            }

            GamePlayerState player = game.players.get(userId);
            if (player == null) {
                throw new RoomWebSocketException("게임 참가자 정보를 찾을 수 없습니다.");
            }
            if (!player.alive) {
                throw new RoomWebSocketException("탈락한 참가자는 행동할 수 없습니다.");
            }

            if (game.phase == GamePhase.NOMINATION_VOTE) {
                // 낮 지목 투표는 대상 ID를 기록하고, 페이즈 종료 시 단독 최다 득표를 확정한다.
                submitNomination(game, userId, request.targetUserId());
            } else if (game.phase == GamePhase.EXECUTION_VOTE) {
                // 처형 투표는 찬반만 저장하며, 실제 처형 여부는 타이머 종료 시 과반으로 결정한다.
                submitExecutionVote(game, userId, request.execute());
            } else if (game.phase == GamePhase.NIGHT) {
                // 밤 행동은 역할별로 한 번만 허용한다. 경찰 조사 결과는 제출 즉시 개인 큐로 반환한다.
                investigationResult = submitNightAction(game, userId, request);
            } else {
                throw new RoomWebSocketException("현재는 투표할 수 있는 시간이 아닙니다.");
            }
            state = snapshot(game, System.currentTimeMillis());
        } finally {
            gameLock.unlock();
        }

        broadcast(state);
        if (investigationResult != null) {
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    NIGHT_RESULT_DESTINATION,
                    investigationResult);
        }
    }

    /**
     * 재접속 유예 시간이 지난 뒤에도 돌아오지 않은 참가자를 게임에서 탈락시킨다.
     * 방 세션이 하나라도 남아 있거나 재접속한 참가자는 생존 상태를 유지한다.
     */
    public void handlePlayerDeparture(long roomId, long userId) {
        RoomGameState state = null;
        List<GameResultDelivery> resultDeliveries = List.of();
        gameLock.lock();
        try {
            GameRoom game = gamesByRoom.get(roomId);
            GamePlayerState player = game == null ? null : game.players.get(userId);
            if (player == null || game.phase == GamePhase.FINISHED || !player.alive) {
                return;
            }

            // 이탈자는 투표와 밤 행동에서도 즉시 제외한다.
            player.alive = false;
            game.nominationVotes.remove(userId);
            game.executionVotes.remove(userId);
            game.nightActions.remove(userId);

            // 탈주로 생존자 수가 바뀌었으므로 처형과 동일하게 승리 조건을 다시 계산한다.
            GameFaction winner = determineWinner(game);
            if (winner != null) {
                finishGame(game, System.currentTimeMillis(), winner);
                resultDeliveries = gameResultDeliveries(game);
            }
            state = snapshot(game, System.currentTimeMillis());
        } finally {
            gameLock.unlock();
        }

        broadcast(state);
        broadcastGameResults(resultDeliveries);
        if (state.gameOver() && roomPresenceService != null) {
            roomPresenceService.resetAfterGame(roomId);
        }
    }

    private void submitNomination(GameRoom game, long voterId, Long targetUserId) {
        if (targetUserId == null) {
            throw new RoomWebSocketException("지목할 참가자를 선택해 주세요.");
        }
        if (voterId == targetUserId) {
            throw new RoomWebSocketException("자기 자신은 지목할 수 없습니다.");
        }

        GamePlayerState target = game.players.get(targetUserId);
        if (target == null || !target.alive) {
            throw new RoomWebSocketException("지목할 수 없는 참가자입니다.");
        }
        if (game.nominationVotes.containsKey(voterId)) {
            throw new RoomWebSocketException("이미 지목 투표를 제출했습니다.");
        }
        game.nominationVotes.put(voterId, targetUserId);
    }

    private void submitExecutionVote(GameRoom game, long voterId, Boolean execute) {
        if (game.nominatedUserId == null) {
            throw new RoomWebSocketException("처형할 참가자가 정해지지 않았습니다.");
        }
        if (voterId == game.nominatedUserId) {
            throw new RoomWebSocketException("지목된 참가자는 처형 투표에 참여할 수 없습니다.");
        }
        if (game.players.get(game.nominatedUserId) == null
                || !game.players.get(game.nominatedUserId).alive) {
            throw new RoomWebSocketException("처형 투표 대상이 유효하지 않습니다.");
        }
        if (execute == null) {
            throw new RoomWebSocketException("처형 여부를 선택해 주세요.");
        }
        if (game.executionVotes.containsKey(voterId)) {
            throw new RoomWebSocketException("이미 처형 투표를 제출했습니다.");
        }
        game.executionVotes.put(voterId, execute);
    }

    private GameInvestigationResult submitNightAction(
            GameRoom game,
            long actorId,
            GameActionRequest request) {
        GamePlayerState actor = game.players.get(actorId);
        if (game.nightActions.containsKey(actorId)) {
            throw new RoomWebSocketException("이번 밤 행동을 이미 제출했습니다.");
        }

        GameNightAction action;
        try {
            action = GameNightAction.from(request.action());
        } catch (IllegalArgumentException exception) {
            throw new RoomWebSocketException(exception.getMessage());
        }
        if (actor.role != action.requiredRole()) {
            throw new RoomWebSocketException("현재 역할로는 선택할 수 없는 밤 행동입니다.");
        }

        GamePlayerState target = game.players.get(request.targetUserId());
        if (target == null || !target.alive) {
            throw new RoomWebSocketException("밤 행동 대상이 유효하지 않습니다.");
        }
        if (action == GameNightAction.MAFIA_KILL && target.role == GameRole.MAFIA) {
            throw new RoomWebSocketException("마피아는 같은 마피아를 제거할 수 없습니다.");
        }

        // 마피아 제거와 의사 보호는 밤 종료 시 함께 해석하고, 경찰 조사는 제출 즉시 결과를 반환한다.
        game.nightActions.put(actorId, new NightAction(actorId, action, target.userId));
        if (action != GameNightAction.POLICE_INVESTIGATE) {
            return null;
        }

        GameFaction faction = target.role == GameRole.MAFIA
                ? GameFaction.MAFIA
                : GameFaction.CITIZEN;
        return new GameInvestigationResult(
                game.roomId,
                target.userId,
                target.nickname,
                faction.name(),
            faction.investigationLabel());
    }

    private void advancePhase(long roomId) {
        RoomGameState state = null;
        List<GameResultDelivery> resultDeliveries = List.of();
        gameLock.lock();
        try {
            phaseTasksByRoom.remove(roomId);
            GameRoom game = gamesByRoom.get(roomId);
            if (game == null) {
                return;
            }

            long now = System.currentTimeMillis();
            if (now < game.phaseEndsAt) {
                // 이전 예약이 조금 일찍 실행됐으면 남은 시간만큼 다시 예약한다.
                scheduleNextPhase(game);
                return;
            }

            // 타이머 콜백은 현재 페이즈의 종료 시점에서 다음 페이즈와 결과를 확정한다.
            switch (game.phase) {
                case DAY_DISCUSSION -> moveTo(
                        game,
                        GamePhase.NOMINATION_VOTE,
                        now,
                        "지목할 참가자를 선택해 주세요.");
                case NOMINATION_VOTE -> moveAfterNominationVote(game, now);
                case EXECUTION_VOTE -> moveAfterExecutionVote(game, now);
                case NIGHT -> moveAfterNight(game, now);
                case FINISHED -> {
                    // 종료된 게임은 다음 페이즈로 진행하지 않는다.
                }
            }

            state = snapshot(game, now);
            if (game.phase != GamePhase.FINISHED) {
                scheduleNextPhase(game);
            } else {
                // 종료 상태에서는 더 이상 타이머를 예약하지 않고 개인별 결과를 전송한다.
                resultDeliveries = gameResultDeliveries(game);
            }
        } finally {
            gameLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
        broadcastGameResults(resultDeliveries);
        if (state != null && state.gameOver() && roomPresenceService != null) {
            roomPresenceService.resetAfterGame(roomId);
        }
    }

    private void moveAfterNominationVote(GameRoom game, long now) {
        Long nominee = findNominee(game);
        game.nominatedUserId = nominee;
        if (nominee == null) {
            // 최다 득표가 동률이거나 유효한 투표가 없으면 처형 없이 밤으로 넘어간다.
            moveTo(game, GamePhase.NIGHT, now, "지목 대상이 없어 밤으로 넘어갑니다.");
            return;
        }

        GamePlayerState target = game.players.get(nominee);
        moveTo(game, GamePhase.EXECUTION_VOTE, now,
                target.nickname + "님을 처형할지 투표해 주세요.");
    }

    private void moveAfterExecutionVote(GameRoom game, long now) {
        GamePlayerState target = game.nominatedUserId == null
                ? null
                : game.players.get(game.nominatedUserId);
        boolean executed = target != null && target.alive && hasExecutionMajority(game);
        if (executed) {
            // 지목된 참가자 본인의 표는 제외한 찬성표가 반대표보다 많을 때만 처형한다.
            target.alive = false;
        }

        // 사망 반영 후 승리를 판정한다. 마피아 전멸이면 시민 승리가 우선한다.
        GameFaction winner = determineWinner(game);
        if (winner != null) {
            finishGame(game, now, winner);
        } else if (executed) {
            moveTo(game, GamePhase.NIGHT, now, target.nickname + "님이 처형되었습니다. 밤이 시작됩니다.");
        } else {
            moveTo(game, GamePhase.NIGHT, now, "처형되지 않았습니다. 밤이 시작됩니다.");
        }
    }

    private void moveAfterNight(GameRoom game, long now) {
        // 두 마피아의 공격과 의사의 보호를 합산해 밤 결과를 먼저 확정한다.
        NightResolution resolution = resolveNightActions(game);
        GameFaction winner = determineWinner(game);
        if (winner != null) {
            finishGame(game, now, winner);
            return;
        }
        if (resolution.killedPlayer() != null) {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    resolution.killedPlayer().nickname + "님이 밤에 사망했습니다. 낮 토론이 시작되었습니다.");
        } else if (resolution.protectedTarget()) {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    "의사의 보호로 밤 동안 사망자가 없었습니다. 낮 토론이 시작되었습니다.");
        } else {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    "밤 동안 사망자가 없었습니다. 낮 토론이 시작되었습니다.");
        }
    }

    private NightResolution resolveNightActions(GameRoom game) {
        Long mafiaTargetId = findMafiaTarget(game);
        if (mafiaTargetId == null) {
            return new NightResolution(null, false);
        }

        GamePlayerState target = game.players.get(mafiaTargetId);
        if (target == null || !target.alive) {
            return new NightResolution(null, false);
        }

        // 의사가 공격 대상과 같은 사람을 보호하면 사망 처리를 생략한다.
        boolean protectedTarget = game.nightActions.values().stream()
                .anyMatch(action -> action.action == GameNightAction.DOCTOR_PROTECT
                        && action.targetUserId == mafiaTargetId);
        if (protectedTarget) {
            return new NightResolution(null, true);
        }

        target.alive = false;
        return new NightResolution(target, false);
    }

    private Long findMafiaTarget(GameRoom game) {
        // 여러 마피아의 공격을 대상별로 합산한다. 최다 득표 대상이 여러 명이면 그중 하나를 무작위로 선택한다.
        Map<Long, Integer> targetCounts = new HashMap<>();
        for (NightAction action : game.nightActions.values()) {
            if (action.action != GameNightAction.MAFIA_KILL) {
                continue;
            }
            GamePlayerState target = game.players.get(action.targetUserId);
            if (target != null && target.alive && target.role != GameRole.MAFIA) {
                targetCounts.merge(action.targetUserId, 1, Integer::sum);
            }
        }
        if (targetCounts.isEmpty()) {
            return null;
        }

        int highest = targetCounts.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        List<Long> leaders = targetCounts.entrySet().stream()
                .filter(entry -> entry.getValue() == highest)
                .map(Map.Entry::getKey)
                .toList();
        return leaders.get(ThreadLocalRandom.current().nextInt(leaders.size()));
    }

    private GameFaction determineWinner(GameRoom game) {
        int mafiaAlive = 0;
        int citizenFactionAlive = 0;
        for (GamePlayerState player : game.players.values()) {
            if (!player.alive) {
                continue;
            }
            if (player.role == GameRole.MAFIA) {
                mafiaAlive++;
            } else {
                citizenFactionAlive++;
            }
        }

        // 마피아 전멸을 먼저 검사해 마지막 마피아 처형 직후 시민 승리를 보장한다.
        if (mafiaAlive == 0) {
            return GameFaction.CITIZEN;
        }
        // 마피아 수가 시민 진영 생존자 수 이상이면 더 이상 시민이 역전할 수 없다.
        return mafiaAlive >= citizenFactionAlive ? GameFaction.MAFIA : null;
    }

    private void finishGame(GameRoom game, long now, GameFaction winner) {
        game.winningFaction = winner;
        moveTo(game, GamePhase.FINISHED, now, winner.label() + " 승리!");
    }

    private Long findNominee(GameRoom game) {
        Map<Long, Integer> voteCounts = new HashMap<>();
        for (Map.Entry<Long, Long> vote : game.nominationVotes.entrySet()) {
            GamePlayerState voter = game.players.get(vote.getKey());
            GamePlayerState target = game.players.get(vote.getValue());
            if (voter != null && voter.alive && target != null && target.alive
                    && !Objects.equals(voter.userId, target.userId)) {
                voteCounts.merge(target.userId, 1, Integer::sum);
            }
        }
        if (voteCounts.isEmpty()) {
            return null;
        }

        int highest = voteCounts.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        List<Long> leaders = voteCounts.entrySet().stream()
                .filter(entry -> entry.getValue() == highest)
                .map(Map.Entry::getKey)
                .toList();
        return leaders.size() == 1 ? leaders.get(0) : null;
    }

    private boolean hasExecutionMajority(GameRoom game) {
        int yesVotes = 0;
        int noVotes = 0;
        for (Map.Entry<Long, Boolean> vote : game.executionVotes.entrySet()) {
            GamePlayerState voter = game.players.get(vote.getKey());
            if (voter == null || !voter.alive) {
                continue;
            }
            if (Boolean.TRUE.equals(vote.getValue())) {
                yesVotes++;
            } else {
                noVotes++;
            }
        }
        return yesVotes > noVotes;
    }

    private void moveTo(GameRoom game, GamePhase phase, long now, String message) {
        // 페이즈 전환 시 새 페이즈에서만 유효한 투표와 행동을 초기화한다.
        game.phase = phase;
        game.phaseEndsAt = now + phase.durationSeconds() * 1_000L;
        game.message = message;
        if (phase == GamePhase.DAY_DISCUSSION) {
            game.nominatedUserId = null;
            game.nominationVotes.clear();
            game.executionVotes.clear();
            game.nightActions.clear();
        } else if (phase == GamePhase.NOMINATION_VOTE) {
            game.nominatedUserId = null;
            game.nominationVotes.clear();
            game.executionVotes.clear();
        } else if (phase == GamePhase.EXECUTION_VOTE) {
            game.executionVotes.clear();
        } else if (phase == GamePhase.FINISHED) {
            game.nominationVotes.clear();
            game.executionVotes.clear();
            game.nightActions.clear();
        } else if (phase == GamePhase.NIGHT) {
            game.nightActions.clear();
        }
    }

    private void scheduleNextPhase(GameRoom game) {
        // 방마다 하나의 타이머만 유지해 이전 페이즈 콜백이 중복 실행되지 않게 한다.
        cancelPhaseTask(game.roomId);
        long delay = Math.max(1L, game.phaseEndsAt - System.currentTimeMillis());
        phaseTasksByRoom.put(
                game.roomId,
                phaseExecutor.schedule(() -> advancePhase(game.roomId), delay, TimeUnit.MILLISECONDS));
    }

    private void cancelPhaseTask(long roomId) {
        ScheduledFuture<?> task = phaseTasksByRoom.remove(roomId);
        if (task != null) {
            task.cancel(false);
        }
    }

    private RoomGameState snapshot(GameRoom game, long now) {
        // 공개 상태에는 역할을 포함하지 않는다. 역할과 결과는 개인 큐에서 별도로 전달한다.
        List<GamePlayer> players = new ArrayList<>(game.players.size());
        int eligibleVoters = 0;
        for (GamePlayerState player : game.players.values()) {
            players.add(new GamePlayer(player.userId, player.nickname, player.alive));
            if (player.alive) {
                eligibleVoters++;
            }
        }

        int submittedVotes = switch (game.phase) {
            case NOMINATION_VOTE -> game.nominationVotes.size();
            case EXECUTION_VOTE -> game.executionVotes.size();
            default -> 0;
        };
        long remainingMillis = Math.max(0L, game.phaseEndsAt - now);
        int remainingSeconds = (int) Math.min(
                Integer.MAX_VALUE,
                (remainingMillis + 999L) / 1_000L);
        return new RoomGameState(
                game.roomId,
                game.phase.name(),
                game.phaseEndsAt,
                remainingSeconds,
                List.copyOf(players),
                game.nominatedUserId,
                submittedVotes,
                eligibleVoters,
                game.message,
                game.phase == GamePhase.FINISHED,
                game.winningFaction == null ? null : game.winningFaction.name());
    }

    private void broadcast(RoomGameState state) {
        messagingTemplate.convertAndSend(
                GAME_DESTINATION.formatted(state.roomId()),
                state);
    }

    private void assignRoles(GameRoom game) {
        // 역할 목록을 만든 뒤 플레이어 ID를 섞어 역할과 사용자를 무작위로 매칭한다.
        List<Long> playerIds = new ArrayList<>(game.players.keySet());
        List<GameRole> roles = createRoles(playerIds.size());
        Collections.shuffle(playerIds);
        for (int index = 0; index < playerIds.size(); index++) {
            game.players.get(playerIds.get(index)).role = roles.get(index);
        }
    }

    private static List<GameRole> createRoles(int playerCount) {
        // 4~5명은 마피아 1명, 6~8명은 마피아 2명으로 구성하고 나머지는
        // 의사 1명·경찰 1명·시민으로 채운다.
        List<GameRole> roles = new ArrayList<>(playerCount);
        int mafiaCount = playerCount >= 6 ? 2 : 1;
        for (int index = 0; index < mafiaCount && roles.size() < playerCount; index++) {
            roles.add(GameRole.MAFIA);
        }
        if (roles.size() < playerCount) {
            roles.add(GameRole.DOCTOR);
        }
        if (roles.size() < playerCount) {
            roles.add(GameRole.POLICE);
        }
        while (roles.size() < playerCount) {
            roles.add(GameRole.CITIZEN);
        }
        return roles;
    }

    private List<RoleDelivery> roleDeliveries(GameRoom game) {
        List<RoleDelivery> deliveries = new ArrayList<>();
        for (Map.Entry<Long, String> entry : game.principalNames.entrySet()) {
            GamePlayerState player = game.players.get(entry.getKey());
            if (player == null || player.role == null
                    || entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            deliveries.add(new RoleDelivery(
                    entry.getValue(),
                    toRoleAssignment(game, player)));
        }
        return List.copyOf(deliveries);
    }

    private GameRoleAssignment toRoleAssignment(GameRoom game, GamePlayerState player) {
        return new GameRoleAssignment(
                game.roomId,
                player.role.name(),
                player.role.label());
    }

    private GameResult toGameResult(GameRoom game, GamePlayerState player) {
        return new GameResult(
                game.roomId,
                game.winningFaction.name(),
                game.winningFaction.label(),
                player.role.name(),
                player.role.label(),
                player.alive);
    }

    private List<GameResultDelivery> gameResultDeliveries(GameRoom game) {
        if (game.winningFaction == null) {
            return List.of();
        }

        List<GameResultDelivery> deliveries = new ArrayList<>();
        for (Map.Entry<Long, String> entry : game.principalNames.entrySet()) {
            GamePlayerState player = game.players.get(entry.getKey());
            if (player == null || player.role == null
                    || entry.getValue() == null || entry.getValue().isBlank()) {
                continue;
            }
            deliveries.add(new GameResultDelivery(
                    entry.getValue(),
                    toGameResult(game, player)));
        }
        return List.copyOf(deliveries);
    }

    private void broadcastRoleAssignments(List<RoleDelivery> deliveries) {
        for (RoleDelivery delivery : deliveries) {
            messagingTemplate.convertAndSendToUser(
                    delivery.principalName(),
                    ROLE_DESTINATION,
                    delivery.assignment());
        }
    }

    private void broadcastGameResults(List<GameResultDelivery> deliveries) {
        for (GameResultDelivery delivery : deliveries) {
            messagingTemplate.convertAndSendToUser(
                    delivery.principalName(),
                    RESULT_DESTINATION,
                    delivery.result());
        }
    }

    @PreDestroy
    void shutdownPhaseExecutor() {
        phaseExecutor.shutdownNow();
    }

    private static final class GameRoom {
        private final long roomId;
        private final Map<Long, GamePlayerState> players = new LinkedHashMap<>();
        private final Map<Long, String> principalNames = new HashMap<>();
        private final Map<Long, Long> nominationVotes = new HashMap<>();
        private final Map<Long, Boolean> executionVotes = new HashMap<>();
        private final Map<Long, NightAction> nightActions = new HashMap<>();
        private GamePhase phase;
        private long phaseEndsAt;
        private Long nominatedUserId;
        private String message;
        private GameFaction winningFaction;

        private GameRoom(long roomId) {
            this.roomId = roomId;
        }
    }

    private static final class GamePlayerState {
        private final long userId;
        private final String nickname;
        private GameRole role;
        private boolean alive = true;

        private GamePlayerState(long userId, String nickname) {
            this.userId = userId;
            this.nickname = nickname;
        }
    }

    private record RoleDelivery(
            String principalName,
            GameRoleAssignment assignment) {
    }

    private record GameResultDelivery(
            String principalName,
            GameResult result) {
    }

    private record NightAction(
            long actorId,
            GameNightAction action,
            long targetUserId) {
    }

    private record NightResolution(
            GamePlayerState killedPlayer,
            boolean protectedTarget) {
    }
}
