package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.locks.ReentrantLock;

import jakarta.annotation.PreDestroy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import kr.or.oti.mafiagame.dto.GameActionRequest;
import kr.or.oti.mafiagame.dto.ChatChannel;
import kr.or.oti.mafiagame.dto.ChatMessage;
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
    private static final String MAFIA_CHAT_DESTINATION = "/queue/mafia-chat";
    private static final String DEAD_CHAT_DESTINATION = "/queue/dead-chat";
    private static final String CHAT_DESTINATION = "/topic/rooms/%d/chat";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomPresenceService roomPresenceService;
    private final GameResultStatsService gameResultStatsService;
    private final GamePhaseScheduler phaseScheduler;
    private final Map<Long, GameRoom> gamesByRoom = new ConcurrentHashMap<>();

    public RoomGameService(SimpMessagingTemplate messagingTemplate) {
        this(messagingTemplate, null, null);
    }

    public RoomGameService(
            SimpMessagingTemplate messagingTemplate,
            RoomPresenceService roomPresenceService) {
        this(messagingTemplate, roomPresenceService, null);
    }

    @Autowired
    public RoomGameService(
            SimpMessagingTemplate messagingTemplate,
            RoomPresenceService roomPresenceService,
            GameResultStatsService gameResultStatsService) {
        this.messagingTemplate = messagingTemplate;
        this.roomPresenceService = roomPresenceService;
        this.gameResultStatsService = gameResultStatsService;
        this.phaseScheduler = new GamePhaseScheduler();
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

        GameRoom game = new GameRoom(roomId);
        for (RoomParticipant participant : participants) {
            game.players.putIfAbsent(
                    participant.userId(),
                    new GamePlayerState(participant.userId(), participant.nickname()));
        }
        if (principalNames != null) {
            game.principalNames.putAll(principalNames);
        }
        // 새 게임을 공개하기 전에 역할을 배정한다. 공개 후의 페이즈 변경과
        // 타이머 예약은 방별 잠금 안에서 처리한다.
        RoomGameRules.assignRoles(game.players);

        try {
            RoomGameState state;
            List<RoleDelivery> roleDeliveries;
            game.lock.lock();
            try {
                // 같은 방에서 이전 게임의 타이머가 남아 있을 수 있으므로 먼저 취소한다.
                phaseScheduler.cancel(roomId);
                gamesByRoom.put(roomId, game);
                moveTo(game, GamePhase.ROLE_ASSIGNMENT, System.currentTimeMillis(),
                        "본인의 역할을 확인해 주세요.");
                state = snapshot(game, System.currentTimeMillis());
                roleDeliveries = roleDeliveries(game);
                scheduleNextPhase(game);
            } finally {
                game.lock.unlock();
            }

            broadcast(state);
            broadcastPhaseSystemMessage(null, state);
            broadcastRoleAssignments(roleDeliveries);
        } catch (RuntimeException | Error startFailure) {
            if (gamesByRoom.remove(roomId, game)) {
                phaseScheduler.cancel(roomId);
            }
            throw startFailure;
        }
    }

    public void broadcastCurrentState(long roomId) {
        broadcastCurrentState(roomId, null);
    }

    public void broadcastCurrentState(long roomId, Principal principal) {
        RoomGameState state;
        GameRoleAssignment roleAssignment = null;
        GameResult gameResult = null;
        String principalName = principal == null ? null : principal.getName();
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            state = null;
        } else {
            game.lock.lock();
            try {
                if (!isCurrentGame(game)) {
                    state = null;
                } else {
                    // 새로고침한 클라이언트에는 공개 상태를 재전송하고, 인증된 사용자에게만
                    // 자신의 역할과 종료 결과를 복원한다.
                    state = snapshot(game, System.currentTimeMillis());
                    if (principal != null) {
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
                }
            } finally {
                game.lock.unlock();
            }
        }

        if (state != null) {
            broadcast(state);
        }
        if (roleAssignment != null && principalName != null) {
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    ROLE_DESTINATION,
                    roleAssignment);
        }
        if (gameResult != null && principalName != null) {
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
        String principalName = principal.getName();
        if (principalName == null) {
            throw new RoomWebSocketException("로그인 정보를 확인할 수 없습니다.");
        }

        long userId = PrincipalIdentity.from(principal).userId();
        RoomGameState state;
        GameRoleAssignment confirmedRole = null;
        GamePhase previousPhase = null;
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            throw new RoomWebSocketException("아직 게임이 시작되지 않았습니다.");
        }
        game.lock.lock();
        try {
            // 행동 검증과 기록을 같은 잠금 안에서 수행해 중복 제출과 타이머 경계의 경쟁 상태를 막는다.
            if (!isCurrentGame(game)) {
                throw new RoomWebSocketException("게임 세션이 변경되었습니다.");
            }
            previousPhase = game.phase;
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
                throw new RoomWebSocketException("사망한 참가자는 행동할 수 없습니다.");
            }

            if (game.phase == GamePhase.ROLE_ASSIGNMENT) {
                if (!"ROLE_CONFIRM".equals(request.action())) {
                    throw new RoomWebSocketException("역할을 확인해 주세요.");
                }
                if (!game.confirmedRoleUserIds.add(userId)) {
                    throw new RoomWebSocketException("이미 역할을 확인했습니다.");
                }
                confirmedRole = toRoleAssignment(game, player);
                // 모두 확인하면 대기 시간을 줄인다. 확인하지 않은 참가자가 있어도
                // 역할 확인 타이머가 끝나면 게임이 진행된다.
                if (game.confirmedRoleUserIds.size() == game.players.values().stream()
                        .filter(candidate -> candidate.alive).count()) {
                    moveTo(game, GamePhase.NIGHT, System.currentTimeMillis(),
                            "첫 밤이 시작되었습니다.");
                    scheduleNextPhase(game);
                }
            } else if (game.phase == GamePhase.NOMINATION_VOTE) {
                // 낮 지목 투표는 대상 ID를 기록하고, 페이즈 종료 시 단독 최다 득표를 확정한다.
                submitNomination(game, userId, request.targetUserId());
            } else if (game.phase == GamePhase.EXECUTION_VOTE) {
                // 처형 투표는 찬반만 저장하며, 실제 처형 여부는 타이머 종료 시 과반으로 결정한다.
                submitExecutionVote(game, userId, request.execute());
            } else if (game.phase == GamePhase.NIGHT) {
                // 밤 행동은 역할별로 한 번만 허용한다. 경찰 조사 결과는 밤 정산 후
                // 조사 경찰의 생존 여부를 확인해 개인 큐로 전달한다.
                submitNightAction(game, userId, request);
            } else {
                throw new RoomWebSocketException("현재는 투표할 수 있는 시간이 아닙니다.");
            }
            state = snapshot(game, System.currentTimeMillis());
        } finally {
            game.lock.unlock();
        }

        broadcast(state);
        broadcastPhaseSystemMessage(previousPhase, state);
        if (confirmedRole != null) {
            messagingTemplate.convertAndSendToUser(principalName, ROLE_DESTINATION,
                    confirmedRole);
        }
    }

    /**
     * Chat permissions are checked against the authoritative game state so a client cannot
     * bypass the channel selector by sending a different STOMP destination.
     */
    public void validateChat(long roomId, long userId, ChatChannel requestedChannel) {
        ChatChannel channel = requestedChannel == null ? ChatChannel.PUBLIC : requestedChannel;
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            if (channel == ChatChannel.MAFIA || channel == ChatChannel.DEAD) {
                throw new RoomWebSocketException("해당 채팅 채널을 사용할 수 없습니다.");
            }
            return;
        }

        game.lock.lock();
        try {
            if (!isCurrentGame(game)) {
                throw new RoomWebSocketException("게임 세션이 변경되었습니다.");
            }
            if (game.phase == GamePhase.FINISHED) {
                if (channel != ChatChannel.PUBLIC) {
                    throw new RoomWebSocketException("게임이 종료되어 전체 채널만 사용할 수 있습니다.");
                }
                return;
            }
            GamePlayerState player = game.players.get(userId);
            if (player == null) {
                throw new RoomWebSocketException("게임 참가자 정보를 찾을 수 없습니다.");
            }
            if (game.phase == GamePhase.ROLE_ASSIGNMENT) {
                throw new RoomWebSocketException("역할 확인 중에는 채팅할 수 없습니다.");
            }
            if (channel == ChatChannel.DEAD) {
                if (!player.alive || player.role == GameRole.MEDIUM) {
                    return;
                }
                throw new RoomWebSocketException("사망자 채널을 사용할 수 없습니다.");
            }
            if (!player.alive) {
                if (channel == ChatChannel.MAFIA) {
                    throw new RoomWebSocketException("사망한 참가자는 마피아 채널을 사용할 수 없습니다.");
                }
                return;
            }
            if (channel == ChatChannel.MAFIA && !canUseMafiaChat(player)) {
                throw new RoomWebSocketException("마피아 채팅을 사용할 수 없습니다.");
            }
            if (game.phase == GamePhase.FINAL_DEFENSE && channel == ChatChannel.PUBLIC
                    && !Objects.equals(game.nominatedUserId, userId)) {
                throw new RoomWebSocketException("최종 변론 중에는 지목된 참가자만 전체 채팅을 할 수 있습니다.");
            }
            if (game.phase == GamePhase.NIGHT && channel == ChatChannel.PUBLIC) {
                throw new RoomWebSocketException("밤에는 마피아 채널만 사용할 수 있습니다.");
            }
        } finally {
            game.lock.unlock();
        }
    }

    /**
     * The private channel is sent to current living mafia principals individually. This avoids
     * stale topic subscriptions leaking a previous game's mafia messages during replay.
     */
    public void broadcastMafiaChat(ChatMessage message) {
        if (message == null || message.channel() != ChatChannel.MAFIA) {
            return;
        }

        List<String> recipients = new ArrayList<>();
        GameRoom game = gamesByRoom.get(message.roomId());
        if (game == null) {
            return;
        }
        game.lock.lock();
        try {
            if (!isCurrentGame(game) || game.phase == GamePhase.FINISHED) {
                return;
            }
            for (Map.Entry<Long, String> entry : game.principalNames.entrySet()) {
                GamePlayerState player = game.players.get(entry.getKey());
                if (player != null
                        && canUseMafiaChat(player)
                        && entry.getValue() != null
                        && !entry.getValue().isBlank()) {
                    recipients.add(entry.getValue());
                }
            }
        } finally {
            game.lock.unlock();
        }

        for (String principalName : recipients) {
            if (principalName == null) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    MAFIA_CHAT_DESTINATION,
                    message);
        }
    }

    /**
     * Dead players and the living medium share a private channel. The message is never sent to
     * the public room topic, because living players other than the medium must not see it.
     */
    public void broadcastDeadChat(ChatMessage message, long senderId) {
        if (message == null || message.channel() != ChatChannel.DEAD) {
            return;
        }

        List<String> recipients = new ArrayList<>();
        GameRoom game = gamesByRoom.get(message.roomId());
        if (game == null) {
            return;
        }
        game.lock.lock();
        try {
            if (!isCurrentGame(game) || game.phase == GamePhase.FINISHED) {
                return;
            }
            GamePlayerState sender = game.players.get(senderId);
            if (sender == null || (sender.alive && sender.role != GameRole.MEDIUM)) {
                return;
            }
            for (Map.Entry<Long, String> entry : game.principalNames.entrySet()) {
                GamePlayerState player = game.players.get(entry.getKey());
                if (player != null
                        && (!player.alive || player.role == GameRole.MEDIUM)
                        && entry.getValue() != null
                        && !entry.getValue().isBlank()) {
                    recipients.add(entry.getValue());
                }
            }
        } finally {
            game.lock.unlock();
        }

        for (String principalName : recipients) {
            if (principalName == null || principalName.isBlank()) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    DEAD_CHAT_DESTINATION,
                    message);
        }
    }

    /**
     * Living players use the public topic. A dead sender is routed only to dead users so the
     * public topic can never expose a dead player's message to living users.
     */
    public void broadcastPublicChat(ChatMessage message, long senderId) {
        if (message == null || message.channel() != ChatChannel.PUBLIC) {
            return;
        }

        List<String> deadRecipients = new ArrayList<>();
        boolean deadSender = false;
        boolean finishedGame = false;
        GameRoom game = gamesByRoom.get(message.roomId());
        if (game == null) {
            messagingTemplate.convertAndSend(
                    formatDestination(CHAT_DESTINATION, message.roomId()),
                    message);
            return;
        }

        game.lock.lock();
        try {
            if (!isCurrentGame(game)) {
                return;
            }
            GamePlayerState sender = game.players.get(senderId);
            deadSender = sender != null && !sender.alive;
            finishedGame = game.phase == GamePhase.FINISHED;
            if (deadSender) {
                for (Map.Entry<Long, String> entry : game.principalNames.entrySet()) {
                    GamePlayerState player = game.players.get(entry.getKey());
                    if (player != null
                            && (!player.alive || player.role == GameRole.MEDIUM)
                            && entry.getValue() != null
                            && !entry.getValue().isBlank()) {
                        deadRecipients.add(entry.getValue());
                    }
                }
            }
        } finally {
            game.lock.unlock();
        }

        if (!deadSender || finishedGame) {
            messagingTemplate.convertAndSend(
                    formatDestination(CHAT_DESTINATION, message.roomId()),
                    message);
            return;
        }

        for (String principalName : deadRecipients) {
            if (principalName == null) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    DEAD_CHAT_DESTINATION,
                    message);
        }
    }

    private static boolean canUseMafiaChat(GamePlayerState player) {
        return player != null
                && player.alive
                && (player.role == GameRole.MAFIA
                        || (player.role == GameRole.SPY && player.mafiaChatUnlocked));
    }

    public boolean canAccessMafiaChat(long roomId, long userId) {
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            return false;
        }
        game.lock.lock();
        try {
            GamePlayerState player = game.players.get(userId);
            return isCurrentGame(game)
                    && game.phase != GamePhase.FINISHED
                    && player != null
                    && canUseMafiaChat(player);
        } finally {
            game.lock.unlock();
        }
    }

    public boolean isDepartedPlayer(long roomId, long userId) {
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            return false;
        }
        game.lock.lock();
        try {
            GamePlayerState player = game.players.get(userId);
            return isCurrentGame(game)
                    && game.phase != GamePhase.FINISHED
                    && player != null
                    && !player.alive;
        } finally {
            game.lock.unlock();
        }
    }

    /**
     * 재접속 유예 시간이 지난 뒤에도 돌아오지 않은 참가자를 게임에서 탈락시킨다.
     * 방 세션이 하나라도 남아 있거나 재접속한 참가자는 생존 상태를 유지한다.
     */
    public void handlePlayerDeparture(long roomId, long userId) {
        RoomGameState state = null;
        List<GameResultDelivery> resultDeliveries = List.of();
        GamePhase previousPhase = null;
        GameRoom game = gamesByRoom.get(roomId);
        if (game == null) {
            return;
        }
        game.lock.lock();
        try {
            GamePlayerState player = game.players.get(userId);
            if (!isCurrentGame(game)
                    || player == null
                    || game.phase == GamePhase.FINISHED
                    || !player.alive) {
                return;
            }

            // 이탈자는 투표와 밤 행동에서도 즉시 제외한다.
            previousPhase = game.phase;
            player.alive = false;
            game.nominationVotes.remove(userId);
            game.executionVotes.remove(userId);
            game.nightActions.remove(userId);
            game.confirmedRoleUserIds.remove(userId);

            // 탈주로 생존자 수가 바뀌었으므로 처형과 동일하게 승리 조건을 다시 계산한다.
            GameFaction winner = RoomGameRules.determineWinner(game.players.values());
            if (winner != null) {
                finishGame(game, System.currentTimeMillis(), winner);
                resultDeliveries = gameResultDeliveries(game);
            } else if (game.phase == GamePhase.FINAL_DEFENSE
                    && Objects.equals(game.nominatedUserId, userId)) {
                moveTo(game, GamePhase.NIGHT, System.currentTimeMillis(),
                        "지목된 참가자가 퇴장하여 처형 없이 밤으로 넘어갑니다.");
                scheduleNextPhase(game);
            } else if (game.phase == GamePhase.ROLE_ASSIGNMENT
                    && game.confirmedRoleUserIds.size() == game.players.values().stream()
                            .filter(candidate -> candidate.alive).count()) {
                moveTo(game, GamePhase.NIGHT, System.currentTimeMillis(),
                        "첫 밤이 시작되었습니다.");
                scheduleNextPhase(game);
            }
            state = snapshot(game, System.currentTimeMillis());
        } finally {
            game.lock.unlock();
        }

        broadcast(state);
        broadcastPhaseSystemMessage(previousPhase, state);
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

    private void submitNightAction(
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
        if (action == GameNightAction.MEDIUM_INVESTIGATE) {
            if (target == null || target.alive) {
                throw new RoomWebSocketException("영매는 사망한 참가자만 조사할 수 있습니다.");
            }
        } else {
            if (target == null || !target.alive) {
                throw new RoomWebSocketException("밤 행동 대상이 유효하지 않습니다.");
            }
            if (action == GameNightAction.SPY_INVESTIGATE && target.userId == actorId) {
                throw new RoomWebSocketException("스파이는 다른 참가자를 조사해야 합니다.");
            }
            if (action == GameNightAction.MAFIA_KILL
                    && target.role != null
                    && target.role.isMafiaTeam()) {
                throw new RoomWebSocketException("마피아는 같은 마피아팀을 제거할 수 없습니다.");
            }
        }

        // 마피아 제거·의사 보호·경찰 조사는 밤 정산 시점에 함께 확정한다.
        game.nightActions.put(actorId, new NightAction(actorId, action, target.userId));
    }

    @SuppressWarnings("unused")
    private void advancePhase(long roomId) {
        advancePhase(gamesByRoom.get(roomId));
    }

    private void advancePhase(GameRoom game) {
        RoomGameState state = null;
        List<GameResultDelivery> resultDeliveries = List.of();
        NightDeliveries nightDeliveries = NightDeliveries.empty();
        GamePhase previousPhase = null;
        if (!isCurrentGame(game)) {
            return;
        }
        game.lock.lock();
        try {
            // 이전 게임의 콜백이 새 게임을 변경하지 않도록 현재 세션인지 다시 확인한다.
            if (!isCurrentGame(game)) {
                return;
            }
            previousPhase = game.phase;
            phaseScheduler.complete(game.roomId);
            long now = System.currentTimeMillis();
            if (now < game.phaseEndsAt) {
                // 이전 예약이 조금 일찍 실행됐으면 남은 시간만큼 다시 예약한다.
                scheduleNextPhase(game);
                return;
            }

            // 타이머 콜백은 현재 페이즈의 종료 시점에서 다음 페이즈와 결과를 확정한다.
            switch (game.phase) {
                case ROLE_ASSIGNMENT -> moveTo(game, GamePhase.NIGHT, now,
                        "첫 밤이 시작되었습니다.");
                case DAY_DISCUSSION -> moveTo(
                        game,
                        GamePhase.NOMINATION_VOTE,
                        now,
                        "지목할 참가자를 선택해 주세요.");
                case NOMINATION_VOTE -> moveAfterNominationVote(game, now);
                case FINAL_DEFENSE -> moveTo(game, GamePhase.EXECUTION_VOTE, now,
                        "지목된 참가자를 처형할지 투표해 주세요.");
                case EXECUTION_VOTE -> moveAfterExecutionVote(game, now);
                case NIGHT -> nightDeliveries = moveAfterNight(game, now);
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
            game.lock.unlock();
        }

        if (state != null) {
            broadcast(state);
            broadcastPhaseSystemMessage(previousPhase, state);
        }
        broadcastInvestigationResults(nightDeliveries.investigationDeliveries());
        broadcastSpyContactMessages(nightDeliveries.spyContactDeliveries());
        broadcastGameResults(resultDeliveries);
        if (state != null && state.gameOver() && roomPresenceService != null) {
            roomPresenceService.resetAfterGame(game.roomId);
        }
    }

    private void moveAfterNominationVote(GameRoom game, long now) {
        Long nominee = RoomGameRules.findNominee(game.players, game.nominationVotes);
        game.nominatedUserId = nominee;
        if (nominee == null) {
            // 최다 득표가 동률이거나 유효한 투표가 없으면 처형 없이 밤으로 넘어간다.
            moveTo(game, GamePhase.NIGHT, now, "지목 대상이 없어 밤으로 넘어갑니다.");
            return;
        }

        GamePlayerState target = game.players.get(nominee);
        moveTo(game, GamePhase.FINAL_DEFENSE, now,
                target.nickname + "님의 최종 변론 시간입니다.");
    }

    private void moveAfterExecutionVote(GameRoom game, long now) {
        GamePlayerState target = game.nominatedUserId == null
                ? null
                : game.players.get(game.nominatedUserId);
        boolean executed = target != null
                && target.alive
                && RoomGameRules.hasExecutionMajority(game.players, game.executionVotes);
        if (executed && target != null) {
            // 지목된 참가자 본인의 표는 제외한 찬성표가 반대표보다 많을 때만 처형한다.
            target.alive = false;
        }

        // 사망 반영 후 승리를 판정한다. 마피아 전멸이면 시민 승리가 우선한다.
        GameFaction winner = RoomGameRules.determineWinner(game.players.values());
        if (winner != null) {
            finishGame(game, now, winner);
        } else if (executed && target != null) {
            moveTo(game, GamePhase.NIGHT, now, target.nickname + "님이 처형되었습니다. 밤이 시작됩니다.");
        } else {
            moveTo(game, GamePhase.NIGHT, now, "처형되지 않았습니다. 밤이 시작됩니다.");
        }
    }

    private NightDeliveries moveAfterNight(GameRoom game, long now) {
        // 마피아팀의 공격과 의사의 보호를 합산해 밤 결과를 먼저 확정한다.
        RoomGameRules.NightOutcome resolution = RoomGameRules.resolveNightActions(
                game.players,
                game.nightActions.values(),
                ThreadLocalRandom.current());
        // 경찰이 같은 밤에 사망했다면 조사 결과를 보내지 않는다. 행동 제출 시점이
        // 아니라 밤 결과가 확정된 뒤 생존 여부를 확인해야 이 규칙을 지킬 수 있다.
        NightDeliveries nightDeliveries = buildInvestigationDeliveries(game);
        GameFaction winner = RoomGameRules.determineWinner(game.players.values());
        if (winner != null) {
            finishGame(game, now, winner);
            return nightDeliveries;
        }
        GamePlayerState killedPlayer = resolution.killedPlayerId() == null
                ? null
                : game.players.get(resolution.killedPlayerId());
        if (killedPlayer != null) {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    killedPlayer.nickname + "님이 밤에 사망했습니다. 낮 토론이 시작되었습니다.");
        } else if (resolution.soldierSavedPlayerId() != null) {
            GamePlayerState soldier = game.players.get(resolution.soldierSavedPlayerId());
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    (soldier == null ? "군인" : soldier.nickname)
                            + "님은 군인의 능력으로 마피아의 공격을 막아냈습니다. 군인임이 공개되었습니다. "
                            + "낮 토론이 시작됩니다.");
        } else if (resolution.protectedTarget()) {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    "의사의 보호로 밤 동안 사망자가 없었습니다. 낮 토론이 시작되었습니다.");
        } else {
            moveTo(game, GamePhase.DAY_DISCUSSION, now,
                    "밤 동안 사망자가 없었습니다. 낮 토론이 시작되었습니다.");
        }
        return nightDeliveries;
    }

    private void finishGame(GameRoom game, long now, GameFaction winner) {
        if (gameResultStatsService != null) {
            List<GameResultStatsService.PlayerOutcome> outcomes = game.players.values().stream()
                    .map(player -> {
                        boolean mafiaTeam = player.role != null && player.role.isMafiaTeam();
                        boolean won = (winner == GameFaction.MAFIA) == mafiaTeam;
                        return new GameResultStatsService.PlayerOutcome(player.userId, won);
                    })
                    .toList();
            gameResultStatsService.recordCompletedGame(game.gameId, game.roomId, winner, outcomes);
        }
        game.winningFaction = winner;
        moveTo(game, GamePhase.FINISHED, now, winner.label() + " 승리!");
    }

    private void moveTo(GameRoom game, GamePhase phase, long now, String message) {
        // 페이즈 전환 시 새 페이즈에서만 유효한 투표와 행동을 초기화한다.
        game.phase = phase;
        game.phaseEndsAt = now + phase.durationSeconds() * 1_000L;
        game.message = message;
        if (phase == GamePhase.ROLE_ASSIGNMENT) {
            game.confirmedRoleUserIds.clear();
            game.nominatedUserId = null;
            game.nominationVotes.clear();
            game.executionVotes.clear();
            game.nightActions.clear();
        } else if (phase == GamePhase.DAY_DISCUSSION) {
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
        long delay = Math.max(1L, game.phaseEndsAt - System.currentTimeMillis());
        phaseScheduler.schedule(game.roomId, delay, () -> advancePhase(game));
    }

    private boolean isCurrentGame(GameRoom game) {
        return game != null && gamesByRoom.get(game.roomId) == game;
    }

    private RoomGameState snapshot(GameRoom game, long now) {
        // 공개 상태에는 역할을 포함하지 않는다. 역할과 결과는 개인 큐에서 별도로 전달한다.
        List<GamePlayer> players = new ArrayList<>(game.players.size());
        int eligibleVoters = 0;
        for (GamePlayerState player : game.players.values()) {
            GameRole publicRole = game.phase == GamePhase.FINISHED ? player.role : null;
            players.add(new GamePlayer(player.userId, player.nickname, player.alive, publicRole));
            if (player.alive) {
                eligibleVoters++;
            }
        }

        int submittedVotes = switch (game.phase) {
            case ROLE_ASSIGNMENT -> game.confirmedRoleUserIds.size();
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

    private void broadcastPhaseSystemMessage(GamePhase previousPhase, RoomGameState state) {
        if (state == null || state.phase() == null
                || (previousPhase != null && previousPhase.name().equals(state.phase()))) {
            return;
        }

        messagingTemplate.convertAndSend(
                formatDestination(CHAT_DESTINATION, state.roomId()),
                ChatMessage.system(state.roomId(), phaseSystemMessage(state)));
    }

    private static String phaseSystemMessage(RoomGameState state) {
        String title;
        String guidance;
        switch (state.phase()) {
            case "ROLE_ASSIGNMENT" -> {
                title = "역할 확인";
                guidance = "각자에게 전달된 역할을 확인하고 역할 확인 완료를 눌러 주세요. "
                        + "자신의 역할은 다른 참가자에게 공개하지 마세요.";
            }
            case "DAY_DISCUSSION" -> {
                title = "낮 토론";
                guidance = "생존자들은 자유롭게 토론하세요. 밤의 결과와 참가자들의 발언을 근거로 "
                        + "마피아를 추리합니다. 시간이 끝나면 지목 투표가 시작됩니다.";
            }
            case "NOMINATION_VOTE" -> {
                title = "지목 투표";
                guidance = "살아있는 참가자 중 의심되는 한 명을 지목하세요. 최다 득표자가 최종 변론을 하며, "
                        + "동률이면 처형 없이 밤으로 넘어갑니다.";
            }
            case "FINAL_DEFENSE" -> {
                title = "최종 변론";
                guidance = "지목된 참가자만 전체 채널에서 최종 변론을 할 수 있습니다. "
                        + "다른 생존자는 변론을 들은 뒤 처형 여부를 판단하세요.";
            }
            case "EXECUTION_VOTE" -> {
                title = "처형 투표";
                guidance = "지목된 참가자를 처형할지 찬반 투표하세요. 지목된 참가자는 투표할 수 없으며, "
                        + "찬성이 반대보다 많으면 처형됩니다.";
            }
            case "NIGHT" -> {
                title = "밤";
                guidance = "밤 행동을 제출하세요. 마피아는 제거, 스파이는 직업 조사, 의사는 보호, "
                        + "경찰은 진영 조사, 영매사는 사망자 직업 조사를 선택합니다. "
                        + "군인은 마피아 공격을 한 번 막을 수 있고, 시민은 행동 없이 기다립니다. "
                        + "역할별 밤 행동은 한 번만 제출할 수 있습니다.";
            }
            case "FINISHED" -> {
                title = "게임 종료";
                guidance = "게임이 종료되었습니다. 공개된 역할과 승리 진영을 확인하고 다음 게임을 준비하세요.";
            }
            default -> {
                title = "게임 안내";
                guidance = "현재 게임 진행 상황을 확인해 주세요.";
            }
        }

        String transition = state.message();
        if (transition == null || transition.isBlank()) {
            transition = title + " 페이즈가 시작되었습니다.";
        }
        return "【" + title + " 안내】\n" + transition + "\n" + guidance;
    }

    private void broadcast(RoomGameState state) {
        messagingTemplate.convertAndSend(
                formatDestination(GAME_DESTINATION, state.roomId()),
                state);
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
                player.role.label(),
                game.confirmedRoleUserIds.contains(player.userId),
                player.mafiaChatUnlocked);
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
            String principalName = delivery.principalName();
            GameRoleAssignment assignment = delivery.assignment();
            if (principalName == null || assignment == null) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    ROLE_DESTINATION,
                    assignment);
        }
    }

    private void broadcastGameResults(List<GameResultDelivery> deliveries) {
        for (GameResultDelivery delivery : deliveries) {
            String principalName = delivery.principalName();
            GameResult result = delivery.result();
            if (principalName == null || result == null) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    RESULT_DESTINATION,
                    result);
        }
    }

    private NightDeliveries buildInvestigationDeliveries(GameRoom game) {
        List<InvestigationDelivery> investigationDeliveries = new ArrayList<>();
        List<SpyContactDelivery> spyContactDeliveries = new ArrayList<>();
        for (NightAction action : game.nightActions.values()) {
            if (action.action != GameNightAction.POLICE_INVESTIGATE
                    && action.action != GameNightAction.SPY_INVESTIGATE
                    && action.action != GameNightAction.MEDIUM_INVESTIGATE) {
                continue;
            }

            GamePlayerState investigator = game.players.get(action.actorId);
            GamePlayerState target = game.players.get(action.targetUserId);
            String principalName = game.principalNames.get(action.actorId);
            if (investigator == null
                    || !investigator.alive
                    || target == null
                    || principalName == null
                    || principalName.isBlank()) {
                continue;
            }

            GameFaction faction = target.role != null && target.role.isMafiaTeam()
                    ? GameFaction.MAFIA
                    : GameFaction.CITIZEN;
            GameInvestigationResult result;
            if (action.action == GameNightAction.POLICE_INVESTIGATE) {
                result = new GameInvestigationResult(
                        game.roomId,
                        target.userId,
                        target.nickname,
                        faction.name(),
                        faction.investigationLabel());
            } else {
                result = new GameInvestigationResult(
                        game.roomId,
                        target.userId,
                        target.nickname,
                        faction.name(),
                        faction.investigationLabel(),
                        target.role == null ? null : target.role.name(),
                        target.role == null ? null : target.role.label(),
                        action.action == GameNightAction.SPY_INVESTIGATE
                                && target.role == GameRole.MAFIA
                                        ? mafiaPlayers(game)
                                        : null);
            }
            investigationDeliveries.add(new InvestigationDelivery(principalName, result));

            if (action.action == GameNightAction.SPY_INVESTIGATE
                    && target.role == GameRole.MAFIA) {
                investigator.mafiaChatUnlocked = true;
                spyContactDeliveries.add(new SpyContactDelivery(
                        game.roomId,
                        investigator.nickname));
            }
        }
        return new NightDeliveries(
                List.copyOf(investigationDeliveries),
                List.copyOf(spyContactDeliveries));
    }

    private static List<GamePlayer> mafiaPlayers(GameRoom game) {
        List<GamePlayer> mafiaPlayers = new ArrayList<>();
        for (GamePlayerState player : game.players.values()) {
            if (player.role == GameRole.MAFIA) {
                mafiaPlayers.add(new GamePlayer(
                        player.userId,
                        player.nickname,
                        player.alive,
                        player.role));
            }
        }
        return List.copyOf(mafiaPlayers);
    }

    private void broadcastInvestigationResults(List<InvestigationDelivery> deliveries) {
        for (InvestigationDelivery delivery : deliveries) {
            String principalName = delivery.principalName();
            GameInvestigationResult result = delivery.result();
            if (principalName == null || result == null) {
                continue;
            }
            messagingTemplate.convertAndSendToUser(
                    principalName,
                    NIGHT_RESULT_DESTINATION,
                    result);
        }
    }

    private void broadcastSpyContactMessages(List<SpyContactDelivery> deliveries) {
        for (SpyContactDelivery delivery : deliveries) {
            broadcastMafiaChat(ChatMessage.system(
                    delivery.roomId(),
                    delivery.nickname() + "님이 마피아를 찾아 접선했습니다. 이제 마피아 채널을 사용할 수 있습니다.",
                    ChatChannel.MAFIA));
        }
    }

    private static @NonNull String formatDestination(String template, long roomId) {
        String destination = template.formatted(roomId);
        if (destination == null) {
            throw new IllegalStateException("WebSocket destination must not be null.");
        }
        return destination;
    }

    @PreDestroy
    void shutdownPhaseExecutor() {
        phaseScheduler.close();
    }

    private static final class GameRoom {
        private final ReentrantLock lock = new ReentrantLock();
        private final String gameId = UUID.randomUUID().toString();
        private final long roomId;
        private final Map<Long, GamePlayerState> players = new LinkedHashMap<>();
        private final Map<Long, String> principalNames = new HashMap<>();
        private final Map<Long, Long> nominationVotes = new HashMap<>();
        private final Map<Long, Boolean> executionVotes = new HashMap<>();
        private final Map<Long, NightAction> nightActions = new HashMap<>();
        private final Set<Long> confirmedRoleUserIds = new HashSet<>();
        private GamePhase phase;
        private long phaseEndsAt;
        private Long nominatedUserId;
        private String message;
        private GameFaction winningFaction;

        private GameRoom(long roomId) {
            this.roomId = roomId;
        }
    }

    private static final class GamePlayerState implements RoomGameRules.GameRulePlayer {
        private final long userId;
        private final String nickname;
        private GameRole role;
        private boolean alive = true;
        private boolean mafiaChatUnlocked;
        private boolean soldierShieldAvailable = true;

        private GamePlayerState(long userId, String nickname) {
            this.userId = userId;
            this.nickname = nickname;
        }

        @Override
        public long userId() {
            return userId;
        }

        @Override
        public GameRole role() {
            return role;
        }

        @Override
        public boolean alive() {
            return alive;
        }

        @Override
        public boolean mafiaChatUnlocked() {
            return mafiaChatUnlocked;
        }

        @Override
        public void setRole(GameRole role) {
            this.role = role;
        }

        @Override
        public void setAlive(boolean alive) {
            this.alive = alive;
        }

        @Override
        public boolean soldierShieldAvailable() {
            return role == GameRole.SOLDIER && soldierShieldAvailable;
        }

        @Override
        public boolean consumeSoldierShield() {
            if (!soldierShieldAvailable()) {
                return false;
            }
            soldierShieldAvailable = false;
            return true;
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

    private record InvestigationDelivery(
            String principalName,
            GameInvestigationResult result) {
    }

    private record SpyContactDelivery(
            long roomId,
            String nickname) {
    }

    private record NightDeliveries(
            List<InvestigationDelivery> investigationDeliveries,
            List<SpyContactDelivery> spyContactDeliveries) {

        private static NightDeliveries empty() {
            return new NightDeliveries(List.of(), List.of());
        }
    }

    private record NightAction(
            long actorId,
            GameNightAction action,
            long targetUserId) implements RoomGameRules.GameRuleNightAction {
    }

}
