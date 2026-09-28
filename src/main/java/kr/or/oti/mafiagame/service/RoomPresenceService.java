package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.locks.Lock;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

import jakarta.annotation.PreDestroy;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import kr.or.oti.mafiagame.dto.OnlinePlayerCount;
import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.dto.RoomPresenceCount;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.PrincipalIdentity;

@Service
public class RoomPresenceService {
    private static final Duration DEFAULT_GAME_DEPARTURE_GRACE_PERIOD = Duration.ofSeconds(30);
    private static final Duration DEFAULT_HOST_TRANSFER_GRACE_PERIOD = Duration.ofSeconds(10);
    private static final long LOBBY_COUNT_REQUEST_INTERVAL_NANOS = TimeUnit.SECONDS.toNanos(1);
    private static final long LOBBY_COUNT_BROADCAST_INTERVAL_NANOS = TimeUnit.MILLISECONDS.toNanos(250);
    private static final Logger log = LoggerFactory.getLogger(RoomPresenceService.class);
    private static final String PRESENCE_DESTINATION = "/topic/rooms/%d/presence";
    private static final String LOBBY_PRESENCE_DESTINATION = "/topic/rooms/presence";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final RoomGameService roomGameService;
    private final Duration gameDepartureGracePeriod;
    private final Duration hostTransferGracePeriod;
    private final ReentrantReadWriteLock presenceLock = new ReentrantReadWriteLock();
    private final Lock readLock = presenceLock.readLock();
    private final Lock writeLock = presenceLock.writeLock();
    private final ReentrantLock lobbyBroadcastLock = new ReentrantLock();
    private final Duration emptyRoomCleanupDelay;
    private final ScheduledExecutorService cleanupExecutor;
    private final ScheduledExecutorService lobbyCountExecutor;
    private final Map<Long, Map<String, ParticipantPresence>> participantsByRoom = new HashMap<>();
    private final Map<String, Long> roomBySession = new HashMap<>();
    private final Map<String, String> participantKeyBySession = new HashMap<>();
    private final Map<String, Set<String>> sessionsByParticipant = new HashMap<>();
    private final Map<String, String> onlineParticipantKeyBySession = new HashMap<>();
    private final Map<String, Set<String>> onlineSessionsByParticipant = new HashMap<>();
    private final Map<Long, Long> hostUserByRoom = new HashMap<>();
    private final Map<Long, String> roomStatusByRoom = new HashMap<>();
    private final Map<Long, RoomSettingsSnapshot> roomSettingsByRoom = new HashMap<>();
    private final Map<Long, ScheduledFuture<?>> cleanupTasksByRoom = new HashMap<>();
    private final Map<String, ScheduledFuture<?>> gameDepartureTasks = new HashMap<>();
    private final Map<Long, ScheduledFuture<?>> hostTransferTasksByRoom = new HashMap<>();
    private final Set<Long> emptyRoomsPendingCleanup = new LinkedHashSet<>();
    private final Set<Long> roomsBeingDeleted = new HashSet<>();
    private final Map<String, Long> lastLobbyCountRequestNanosBySession = new HashMap<>();
    private final Map<Long, Integer> lastBroadcastLobbyRoomCounts = new HashMap<>();
    private Long lastLobbyCountBroadcastNanos;
    private ScheduledFuture<?> pendingLobbyCountBroadcast;
    private int lastBroadcastOnlinePlayerCount = -1;
    private long roomDeletionGeneration;

    public RoomPresenceService(
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService,
            @Value("${mafiagame.room.empty-cleanup-delay:15s}") Duration emptyRoomCleanupDelay) {
        this(
                messagingTemplate,
                roomService,
                emptyRoomCleanupDelay,
                DEFAULT_GAME_DEPARTURE_GRACE_PERIOD,
                DEFAULT_HOST_TRANSFER_GRACE_PERIOD,
                null);
    }

    public RoomPresenceService(
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService,
            @Value("${mafiagame.room.empty-cleanup-delay:15s}") Duration emptyRoomCleanupDelay,
            @Value("${mafiagame.room.game-departure-grace-period:30s}") Duration gameDepartureGracePeriod,
            @Lazy RoomGameService roomGameService) {
        this(
                messagingTemplate,
                roomService,
                emptyRoomCleanupDelay,
                gameDepartureGracePeriod,
                DEFAULT_HOST_TRANSFER_GRACE_PERIOD,
                roomGameService);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public RoomPresenceService(
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService,
            @Value("${mafiagame.room.empty-cleanup-delay:15s}") Duration emptyRoomCleanupDelay,
            @Value("${mafiagame.room.game-departure-grace-period:30s}") Duration gameDepartureGracePeriod,
            @Value("${mafiagame.room.host-transfer-grace-period:10s}") Duration hostTransferGracePeriod,
            @Lazy RoomGameService roomGameService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
        this.roomGameService = roomGameService;
        this.emptyRoomCleanupDelay = emptyRoomCleanupDelay.isNegative()
                ? Duration.ZERO
                : emptyRoomCleanupDelay;
        this.gameDepartureGracePeriod = gameDepartureGracePeriod.isNegative()
                ? Duration.ZERO
                : gameDepartureGracePeriod;
        this.hostTransferGracePeriod = hostTransferGracePeriod.isNegative()
                ? Duration.ZERO
                : hostTransferGracePeriod;
        AtomicInteger maintenanceThreadNumber = new AtomicInteger();
        ThreadFactory maintenanceThreadFactory = runnable -> {
            Thread thread = new Thread(
                    runnable,
                    "room-presence-maintenance-" + maintenanceThreadNumber.incrementAndGet());
            thread.setDaemon(true);
            return thread;
        };
        this.cleanupExecutor = Executors.newScheduledThreadPool(2, maintenanceThreadFactory);

        ThreadFactory lobbyThreadFactory = runnable -> {
            Thread thread = new Thread(runnable, "room-presence-lobby-count");
            thread.setDaemon(true);
            return thread;
        };
        this.lobbyCountExecutor = Executors.newSingleThreadScheduledExecutor(lobbyThreadFactory);
    }

    public RoomPresenceState join(long roomId, String sessionId, Principal principal) {
        return join(roomId, sessionId, principal, false);
    }

    public RoomPresenceState join(long roomId, String sessionId, Principal principal, boolean roomAccessGranted) {
        if (sessionId == null || sessionId.isBlank() || principal == null) {
            throw new RoomWebSocketException("게임방 연결 정보를 확인할 수 없습니다.");
        }

        PrincipalIdentity identity = PrincipalIdentity.from(principal);
        String participantKey = participantKey(identity);
        RoomPresenceState currentState = null;
        Map<Long, RoomPresenceState> previousStates = Map.of();
        List<DepartedPlayer> departedPlayers = new ArrayList<>();

        while (true) {
            long observedDeletionGeneration;
            readLock.lock();
            try {
                observedDeletionGeneration = roomDeletionGeneration;
            } finally {
                readLock.unlock();
            }

            // DB 조회는 참가 상태 잠금 밖에서 수행한다. 삭제 작업이 이 조회와 잠금 획득
            // 사이에 완료되면 세대 번호가 바뀌므로 다시 읽고, 삭제 중인 방은 입장시키지 않는다.
            RoomSummary room = roomService.getRoom(roomId);
            writeLock.lock();
            try {
                if (observedDeletionGeneration != roomDeletionGeneration) {
                    continue;
                }
                if (roomsBeingDeleted.contains(roomId) || room == null) {
                    throw new RoomWebSocketException("존재하지 않는 게임방입니다.");
                }

                RoomSettingsSnapshot roomSettings = roomSettingsByRoom.computeIfAbsent(
                        roomId,
                        ignored -> new RoomSettingsSnapshot(room.getMaxPlayers(), room.isLocked()));
                long hostUserId = hostUserByRoom.computeIfAbsent(roomId, ignored -> room.getHostUserId());
                String roomStatus = roomStatusByRoom.computeIfAbsent(roomId, ignored -> room.getStatus());

                // 참가 검증은 상태 변경보다 먼저 수행한다. 실패한 입장 요청이 온라인 인원이나
                // 기존 방 참가 상태를 오염시키지 않도록 검증과 등록은 같은 쓰기 잠금 안에서 처리한다.
                boolean isRoomHost = hostUserId == identity.userId();
                if (roomSettings.locked() && !roomAccessGranted && !isRoomHost) {
                    throw new RoomWebSocketException("게임방 비밀번호를 먼저 확인해 주세요.");
                }
                Map<String, ParticipantPresence> targetParticipants = participantsByRoom.get(roomId);
                boolean alreadyJoined = targetParticipants != null && targetParticipants.containsKey(participantKey);
                boolean returningDeadPlayer = "PLAYING".equals(roomStatus)
                        && !alreadyJoined
                        && roomGameService != null
                        && roomGameService.isDepartedPlayer(roomId, identity.userId());
                if ("PLAYING".equals(roomStatus) && !alreadyJoined && !returningDeadPlayer) {
                    throw new RoomWebSocketException("진행 중인 게임에는 새로 참가할 수 없습니다.");
                }
                if (!alreadyJoined && targetParticipants != null
                        && targetParticipants.size() >= roomSettings.capacity()) {
                    throw new RoomWebSocketException("게임방 정원이 가득 찼습니다.");
                }

                roomStatusByRoom.put(roomId, roomStatus);
                registerOnlineSession(sessionId, principal);
                cancelRoomCleanup(roomId);

                // 한 사용자가 다른 방으로 이동하거나 같은 세션을 다른 사용자로 재사용한 경우,
                // 이전 방의 세션을 먼저 제거해 한 사용자당 하나의 참가자만 유지한다.
                previousStates = new LinkedHashMap<>();
                Set<String> sessionsToLeave = new LinkedHashSet<>();
                Set<String> participantSessions = sessionsByParticipant.get(participantKey);
                if (participantSessions != null) {
                    for (String existingSessionId : participantSessions) {
                        Long existingRoomId = roomBySession.get(existingSessionId);
                        if (existingRoomId != null && !Long.valueOf(roomId).equals(existingRoomId)) {
                            sessionsToLeave.add(existingSessionId);
                        }
                    }
                }
                String currentParticipantKey = participantKeyBySession.get(sessionId);
                if (currentParticipantKey != null && !participantKey.equals(currentParticipantKey)) {
                    sessionsToLeave.add(sessionId);
                }

                for (String sessionToLeave : sessionsToLeave) {
                    Long previousRoomId = roomBySession.get(sessionToLeave);
                    if (previousRoomId == null) {
                        continue;
                    }
                    SessionRemoval removal = removeSession(previousRoomId, sessionToLeave);
                    if (removal.state() != null) {
                        previousStates.put(previousRoomId, removal.state());
                    }
                    if (removal.departedUserId() != null) {
                        departedPlayers.add(new DepartedPlayer(previousRoomId, removal.departedUserId()));
                    }
                }

                Map<String, ParticipantPresence> participants = participantsByRoom
                        .computeIfAbsent(roomId, ignored -> new LinkedHashMap<>());
                if (Objects.equals(hostUserByRoom.get(roomId), identity.userId())) {
                    cancelHostTransfer(roomId);
                }

                ParticipantPresence participant = participants.computeIfAbsent(
                        participantKey,
                        ignored -> new ParticipantPresence(identity));
                participant.nickname = identity.nickname();
                participant.principalName = principal.getName();
                participant.sessions.add(sessionId);
                roomBySession.put(sessionId, roomId);
                participantKeyBySession.put(sessionId, participantKey);
                sessionsByParticipant.computeIfAbsent(participantKey, ignored -> new LinkedHashSet<>())
                        .add(sessionId);

                // 새 세션이 정상적으로 등록됐으므로 F5/재접속 대기 중이던 탈주 예약을 취소한다.
                cancelGameDeparture(roomId, identity.userId());

                currentState = snapshot(roomId);
                break;
            } finally {
                writeLock.unlock();
            }
        }

        // 브로커 전송은 잠금을 해제한 뒤 수행한다. 네트워크 전송이 느려도 참가자 상태
        // 갱신을 막지 않으며, 이동 전 방과 현재 방의 화면을 모두 최신 상태로 맞춘다.
        for (RoomPresenceState previousState : previousStates.values()) {
            broadcast(previousState);
        }
        scheduleDepartures(departedPlayers);
        broadcast(currentState);
        return currentState;
    }

    public Map<Long, String> currentPrincipalNames(long roomId) {
        readLock.lock();
        try {
            return principalNamesFor(participantsByRoom.get(roomId));
        } finally {
            readLock.unlock();
        }
    }

    private Map<Long, String> principalNamesFor(Map<String, ParticipantPresence> participants) {
        if (participants == null) {
            return Map.of();
        }

        Map<Long, String> principalNames = new HashMap<>();
        for (ParticipantPresence participant : participants.values()) {
            if (participant.principalName != null && !participant.principalName.isBlank()) {
                principalNames.put(participant.userId, participant.principalName);
            }
        }
        return Map.copyOf(principalNames);
    }

    public void registerSession(String sessionId, Principal principal) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        boolean registered;
        writeLock.lock();
        try {
            registered = registerOnlineSession(sessionId, principal);
        } finally {
            writeLock.unlock();
        }

        if (registered) {
            broadcastOnlinePlayerCount();
        }
    }

    private String participantKey(PrincipalIdentity identity) {
        if (identity.userId() > 0) {
            return "user:" + identity.userId();
        }
        return "principal:" + identity.nickname();
    }

    public RoomPresenceState currentState(long roomId) {
        readLock.lock();
        try {
            if (participantsByRoom.containsKey(roomId)) {
                return snapshot(roomId);
            }
            return emptyRoomsPendingCleanup.contains(roomId)
                    ? new RoomPresenceState(roomId, List.of())
                    : null;
        } finally {
            readLock.unlock();
        }
    }

    public Map<Long, Integer> currentCounts() {
        readLock.lock();
        try {
            Map<Long, Integer> counts = new HashMap<>();
            participantsByRoom.forEach((currentRoomId, participants) ->
                    counts.put(currentRoomId, participants.size()));
            emptyRoomsPendingCleanup.forEach(roomId -> counts.putIfAbsent(roomId, 0));
            return Map.copyOf(counts);
        } finally {
            readLock.unlock();
        }
    }

    public RoomPresenceState updateRoomSettings(
            long roomId,
            long hostUserId,
            Integer maxPlayers,
            boolean passwordEnabled,
            String password) {
        RoomPresenceState currentState = null;
        writeLock.lock();
        try {
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            int currentPlayers = participants == null ? 0 : participants.size();
            roomService.updateRoomSettings(
                    roomId,
                    hostUserId,
                    maxPlayers,
                    passwordEnabled,
                    password,
                    currentPlayers);
            roomSettingsByRoom.put(roomId, new RoomSettingsSnapshot(maxPlayers, passwordEnabled));
            if (participants != null) {
                currentState = snapshot(roomId);
            }
        } finally {
            writeLock.unlock();
        }

        if (currentState != null) {
            broadcast(currentState);
        }
        return currentState;
    }

    public int currentOnlinePlayerCount() {
        readLock.lock();
        try {
            return onlineSessionsByParticipant.size();
        } finally {
            readLock.unlock();
        }
    }

    public void broadcastRoomCounts(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }

        boolean broadcastNow = false;
        writeLock.lock();
        try {
            long now = System.nanoTime();
            Long lastRequest = lastLobbyCountRequestNanosBySession.get(sessionId);
            if (lastRequest != null && now - lastRequest < LOBBY_COUNT_REQUEST_INTERVAL_NANOS) {
                return;
            }
            lastLobbyCountRequestNanosBySession.put(sessionId, now);

            if (lastLobbyCountBroadcastNanos == null
                    || now - lastLobbyCountBroadcastNanos >= LOBBY_COUNT_BROADCAST_INTERVAL_NANOS) {
                lastLobbyCountBroadcastNanos = now;
                broadcastNow = true;
            } else {
                scheduleLobbyCountBroadcast(now);
            }
        } finally {
            writeLock.unlock();
        }

        if (broadcastNow) {
            broadcastLobbyCountsSnapshot();
        }
    }

    private void scheduleLobbyCountBroadcast(long now) {
        if (pendingLobbyCountBroadcast != null && !pendingLobbyCountBroadcast.isDone()) {
            return;
        }

        long elapsed = now - lastLobbyCountBroadcastNanos;
        long delay = Math.max(1L, LOBBY_COUNT_BROADCAST_INTERVAL_NANOS - elapsed);
        pendingLobbyCountBroadcast = lobbyCountExecutor.schedule(
                this::broadcastPendingLobbyCounts,
                delay,
                TimeUnit.NANOSECONDS);
    }

    private void broadcastPendingLobbyCounts() {
        boolean broadcastNow = false;
        writeLock.lock();
        try {
            pendingLobbyCountBroadcast = null;
            long now = System.nanoTime();
            if (lastLobbyCountBroadcastNanos != null
                    && now - lastLobbyCountBroadcastNanos < LOBBY_COUNT_BROADCAST_INTERVAL_NANOS) {
                scheduleLobbyCountBroadcast(now);
            } else {
                lastLobbyCountBroadcastNanos = now;
                broadcastNow = true;
            }
        } finally {
            writeLock.unlock();
        }

        if (broadcastNow) {
            broadcastLobbyCountsSnapshot();
        }
    }

    private void broadcastLobbyCountsSnapshot() {
        List<RoomPresenceCount> counts;
        int onlinePlayerCount;
        lobbyBroadcastLock.lock();
        try {
            readLock.lock();
            try {
                Map<Long, Integer> currentCounts = new HashMap<>();
                participantsByRoom.forEach((roomId, participants) ->
                        currentCounts.put(roomId, participants.size()));
                emptyRoomsPendingCleanup.forEach(roomId -> currentCounts.putIfAbsent(roomId, 0));
                counts = currentCounts.entrySet().stream()
                        .map(entry -> new RoomPresenceCount(entry.getKey(), entry.getValue()))
                        .toList();
                onlinePlayerCount = onlineSessionsByParticipant.size();
            } finally {
                readLock.unlock();
            }

            // Snapshot과 증분 메시지는 같은 전송 잠금에서 최신 상태를 읽고 보낸다.
            // 대기 중에는 presence read lock을 잡지 않아 쓰기 작업을 막지 않는다.
            for (RoomPresenceCount count : counts) {
                lastBroadcastLobbyRoomCounts.put(count.roomId(), count.currentPlayers());
            }
            lastBroadcastOnlinePlayerCount = onlinePlayerCount;
            messagingTemplate.convertAndSend(
                    LOBBY_PRESENCE_DESTINATION,
                    Objects.requireNonNull(counts, "Room presence counts must not be null."));
            messagingTemplate.convertAndSend(
                    LOBBY_PRESENCE_DESTINATION,
                    new OnlinePlayerCount(onlinePlayerCount));
        } finally {
            lobbyBroadcastLock.unlock();
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void resetInterruptedGamesAfterRestart() {
        int recoveredRoomCount = roomService.resetInterruptedGamesToWaiting();
        if (recoveredRoomCount > 0) {
            log.warn("Reset {} interrupted game rooms to WAITING during startup.", recoveredRoomCount);
        }
    }

    public void updateReady(long roomId, String sessionId, RoomReadyRequest request) {
        if (request == null) {
            throw new RoomWebSocketException("준비 상태를 확인할 수 없습니다.");
        }

        RoomPresenceState currentState;
        writeLock.lock();
        try {
            // 준비 상태는 WAITING 방에서만 변경할 수 있다. PLAYING 상태에서는 클라이언트가
            // 임의로 준비를 되돌려 시작 조건을 바꾸지 못하게 한다.
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            if (!Long.valueOf(roomId).equals(joinedRoomId) || participantKey == null) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }

            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null
                    ? null
                    : participants.get(participantKey);
            if (participant == null || !participant.sessions.contains(sessionId)) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }
            if (!"WAITING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"))) {
                throw new RoomWebSocketException("이미 시작된 게임에서는 준비 상태를 변경할 수 없습니다.");
            }

            participant.ready = request.ready();
            currentState = snapshot(roomId);
        } finally {
            writeLock.unlock();
        }

        broadcast(currentState);
    }

    public RoomPresenceState syncPresence(long roomId, String sessionId) {
        RoomPresenceState currentState;
        readLock.lock();
        try {
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null
                    ? null
                    : participants.get(participantKey);
            if (!Long.valueOf(roomId).equals(joinedRoomId)
                    || participantKey == null
                    || participant == null
                    || !participant.sessions.contains(sessionId)) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }
            currentState = snapshot(roomId);
        } finally {
            readLock.unlock();
        }

        return currentState;
    }

    public RoomPresenceState startGame(long roomId, String sessionId) {
        RoomPresenceState currentState;
        writeLock.lock();
        try {
            // 방장 세션인지 확인한 뒤, 지원 범위(4~8명)와 전체 준비 여부를 검증한다.
            // 이 메서드가 성공해야만 DB와 메모리의 방 상태를 PLAYING으로 전환한다.
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            if (!Long.valueOf(roomId).equals(joinedRoomId) || participantKey == null) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }

            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            if (participants == null) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }
            ParticipantPresence participant = participants.get(participantKey);
            if (participant == null || !participant.sessions.contains(sessionId)) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }
            if (!Objects.equals(hostUserByRoom.get(roomId), participant.userId)) {
                throw new RoomWebSocketException("방장만 게임을 시작할 수 있습니다.");
            }

            if (!"WAITING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"))) {
                throw new RoomWebSocketException("이미 시작된 게임입니다.");
            }
            if (participants.size() < RoomGameRules.MIN_PLAYERS) {
                throw new RoomWebSocketException("게임 시작에는 최소 4명의 참가자가 필요합니다.");
            }
            if (participants.size() > RoomGameRules.MAX_PLAYERS) {
                throw new RoomWebSocketException("게임 시작에는 최대 8명의 참가자만 허용됩니다.");
            }
            if (participants.values().stream().anyMatch(candidate -> !candidate.ready)) {
                throw new RoomWebSocketException("모든 참가자가 준비를 완료해야 합니다.");
            }
            if (roomGameService == null) {
                throw new IllegalStateException("RoomGameService is not available.");
            }
            if (!roomService.startGame(roomId)) {
                throw new RoomWebSocketException("게임을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.");
            }

            roomStatusByRoom.put(roomId, "PLAYING");
            try {
                currentState = snapshot(roomId);
                roomGameService.startGame(
                        roomId,
                        currentState.participants(),
                        principalNamesFor(participants));
            } catch (RuntimeException | Error startFailure) {
                try {
                    if (!roomService.resetGameToWaiting(roomId)) {
                        throw new IllegalStateException("Could not restore the room to WAITING.");
                    }
                    roomStatusByRoom.put(roomId, "WAITING");
                } catch (RuntimeException | Error rollbackFailure) {
                    roomStatusByRoom.put(roomId, "PLAYING");
                    startFailure.addSuppressed(rollbackFailure);
                    log.error("Game startup and room status rollback both failed. roomId={}", roomId, startFailure);
                    throw new IllegalStateException(
                            "Game startup failed and room status rollback also failed.",
                            startFailure);
                }

                if (startFailure instanceof Error error) {
                    throw error;
                }
                log.warn("Game startup failed; restored room status to WAITING. roomId={}", roomId, startFailure);
                throw new RoomWebSocketException(
                        "게임을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
                        startFailure);
            }
        } finally {
            writeLock.unlock();
        }

        broadcast(currentState);
        return currentState;
    }

    public void resetAfterGame(long roomId) {
        RoomPresenceState currentState = null;
        writeLock.lock();
        try {
            // 게임 서비스가 승리를 확정하면 방은 삭제되지 않고 다시 대기방으로 돌아간다.
            // 참가자는 유지하되 다음 게임을 위해 모든 준비 상태만 초기화한다.
            if (!"PLAYING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"))) {
                return;
            }
            if (!roomService.resetGameToWaiting(roomId)) {
                log.warn("게임 종료 후 방 상태를 대기로 변경하지 못했습니다. roomId={}", roomId);
                return;
            }

            roomStatusByRoom.put(roomId, "WAITING");
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            if (participants != null) {
                participants.values().forEach(participant -> participant.ready = false);
                currentState = snapshot(roomId);
            }
        } finally {
            writeLock.unlock();
        }

        if (currentState != null) {
            broadcast(currentState);
        }
    }

    public boolean isParticipant(long roomId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }

        readLock.lock();
        try {
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null ? null : participants.get(participantKey);
            return Long.valueOf(roomId).equals(joinedRoomId)
                    && participantKey != null
                    && participant != null
                    && participant.sessions.contains(sessionId);
        } finally {
            readLock.unlock();
        }
    }

    @EventListener
    public void handleConnect(SessionConnectEvent event) {
        StompHeaderAccessor headers = StompHeaderAccessor.wrap(event.getMessage());
        registerSession(headers.getSessionId(), headers.getUser());
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        leave(event.getSessionId());
    }

    public void leave(String sessionId) {
        if (sessionId == null) {
            return;
        }

        RoomPresenceState state;
        boolean onlineSessionRemoved;
        Long departedUserId = null;
        Long departedRoomId = null;
        writeLock.lock();
        try {
            // 한 사용자의 마지막 세션이 닫힌 경우에만 게임 참가자 이탈로 간주한다.
            // 같은 사용자가 여러 탭을 열고 있다면 다른 세션이 게임을 계속 유지한다.
            lastLobbyCountRequestNanosBySession.remove(sessionId);
            onlineSessionRemoved = unregisterOnlineSession(sessionId);
            Long roomId = roomBySession.get(sessionId);
            if (roomId == null) {
                state = null;
            } else {
                SessionRemoval removal = removeSession(roomId, sessionId);
                state = removal.state();
                departedUserId = removal.departedUserId();
                departedRoomId = departedUserId == null ? null : roomId;
            }
        } finally {
            writeLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        } else if (onlineSessionRemoved) {
            broadcastOnlinePlayerCount();
        }
        if (departedRoomId != null && departedUserId != null) {
            scheduleDeparture(departedRoomId, departedUserId);
        }
    }

    private SessionRemoval removeSession(long roomId, String sessionId) {
        if (!Long.valueOf(roomId).equals(roomBySession.get(sessionId))) {
            return new SessionRemoval(null, null);
        }

        Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
        if (participants == null) {
            return new SessionRemoval(null, null);
        }

        String participantKey = participantKeyBySession.get(sessionId);
        ParticipantPresence participant = participantKey == null ? null : participants.get(participantKey);
        boolean participantLeaves = participant != null && participant.sessions.size() == 1;
        Long departedUserId = participantLeaves && participant != null ? participant.userId : null;
        boolean retainForReconnect = participantLeaves
                && "PLAYING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"));
        boolean hostLeaves = participant != null
                && participant.sessions.size() == 1
                && Objects.equals(hostUserByRoom.get(roomId), participant.userId)
                && participants.size() > 1;
        // 대기방에서는 설정 저장·F5·일시적인 네트워크 단절로 WebSocket이 먼저
        // 닫힐 수 있으므로, 재접속 유예 시간 동안 기존 방장을 유지한다.
        boolean deferHostTransfer = hostLeaves
                && "WAITING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"))
                && !hostTransferGracePeriod.isZero();
        ParticipantPresence successor = hostLeaves && !deferHostTransfer
                ? participants.values().stream()
                        .filter(candidate -> !candidate.equals(participant)
                                && !candidate.sessions.isEmpty())
                        .findFirst()
                        .orElse(null)
                : null;

        // DB 방장 변경이 실패하면 메모리 상태도 그대로 유지할 수 있도록 먼저 수행한다.
        if (successor != null && successor.userId > 0) {
            roomService.transferHost(roomId, successor.userId);
        }

        roomBySession.remove(sessionId);
        participantKey = participantKeyBySession.remove(sessionId);
        if (participantKey != null) {
            Set<String> participantSessions = sessionsByParticipant.get(participantKey);
            if (participantSessions != null) {
                participantSessions.remove(sessionId);
                if (participantSessions.isEmpty()) {
                    sessionsByParticipant.remove(participantKey);
                }
            }
        }
        if (participant != null) {
            participant.sessions.remove(sessionId);
            if (participant.sessions.isEmpty() && !retainForReconnect) {
                participants.remove(participantKey);
            }
        }

        if (participants.isEmpty()) {
            // 마지막 참가자가 나가면 즉시 방을 지우지 않고 짧은 유예 시간을 둔다.
            // 새로고침으로 바로 재접속하는 사용자가 방을 잃지 않게 하기 위한 처리다.
            participantsByRoom.remove(roomId);
            cancelHostTransfer(roomId);
            hostUserByRoom.remove(roomId);
            roomStatusByRoom.remove(roomId);
            emptyRoomsPendingCleanup.add(roomId);
            scheduleRoomCleanup(roomId);
            return new SessionRemoval(new RoomPresenceState(roomId, List.of()), departedUserId);
        }
        if (deferHostTransfer && participant != null) {
            scheduleHostTransfer(roomId, participant.userId);
        }
        if (successor != null) {
            hostUserByRoom.put(roomId, successor.userId);
        }
        return new SessionRemoval(snapshot(roomId), departedUserId);
    }

    private RoomPresenceState snapshot(long roomId) {
        Map<String, ParticipantPresence> currentParticipants = participantsByRoom.getOrDefault(roomId, Map.of());
        List<RoomParticipant> participants = new ArrayList<>(currentParticipants.size());
        for (ParticipantPresence participant : currentParticipants.values()) {
            participants.add(createParticipant(roomId, participant));
        }
        RoomSettingsSnapshot roomSettings = roomSettingsByRoom.get(roomId);
        return new RoomPresenceState(
                roomId,
                List.copyOf(participants),
                roomStatusByRoom.getOrDefault(roomId, "WAITING"),
                roomSettings == null ? 0 : roomSettings.capacity(),
                roomSettings != null && roomSettings.locked());
    }

    private boolean registerOnlineSession(String sessionId, Principal principal) {
        String participantKey = onlineParticipantKey(sessionId, principal);
        String previousParticipantKey = onlineParticipantKeyBySession.put(sessionId, participantKey);
        if (Objects.equals(previousParticipantKey, participantKey)) {
            return false;
        }

        if (previousParticipantKey != null) {
            removeOnlineSession(previousParticipantKey, sessionId);
        }
        onlineSessionsByParticipant.computeIfAbsent(participantKey, ignored -> new LinkedHashSet<>())
                .add(sessionId);
        return true;
    }

    private boolean unregisterOnlineSession(String sessionId) {
        String participantKey = onlineParticipantKeyBySession.remove(sessionId);
        if (participantKey == null) {
            return false;
        }

        removeOnlineSession(participantKey, sessionId);
        return true;
    }

    private void removeOnlineSession(String participantKey, String sessionId) {
        Set<String> sessions = onlineSessionsByParticipant.get(participantKey);
        if (sessions == null) {
            return;
        }

        sessions.remove(sessionId);
        if (sessions.isEmpty()) {
            onlineSessionsByParticipant.remove(participantKey);
        }
    }

    private String onlineParticipantKey(String sessionId, Principal principal) {
        if (principal == null) {
            return "session:" + sessionId;
        }

        PrincipalIdentity identity = PrincipalIdentity.from(principal);
        if (identity.userId() > 0) {
            return "user:" + identity.userId();
        }
        return identity.nickname() == null || identity.nickname().isBlank()
                ? "session:" + sessionId
                : "principal:" + identity.nickname();
    }

    private RoomParticipant createParticipant(long roomId, ParticipantPresence participant) {
        return new RoomParticipant(
                participant.userId,
                participant.nickname,
                Objects.equals(hostUserByRoom.get(roomId), participant.userId),
                participant.ready);
    }

    private void scheduleRoomCleanup(long roomId) {
        // 빈 방 삭제는 예약 작업으로 미룬다. 그 사이 재입장하면 cancelRoomCleanup이 예약을 취소한다.
        ScheduledFuture<?> previousTask = cleanupTasksByRoom.remove(roomId);
        if (previousTask != null) {
            previousTask.cancel(false);
        }
        cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                () -> cleanupRoomIfStillEmpty(roomId),
                Math.max(0L, emptyRoomCleanupDelay.toMillis()),
                TimeUnit.MILLISECONDS));
    }

    private void cancelRoomCleanup(long roomId) {
        emptyRoomsPendingCleanup.remove(roomId);
        ScheduledFuture<?> cleanupTask = cleanupTasksByRoom.remove(roomId);
        if (cleanupTask != null) {
            cleanupTask.cancel(false);
        }
    }

    private void scheduleHostTransfer(long roomId, long departingHostUserId) {
        ScheduledFuture<?> previousTask = hostTransferTasksByRoom.remove(roomId);
        if (previousTask != null) {
            previousTask.cancel(false);
        }
        if (hostTransferGracePeriod.isZero()) {
            completeScheduledHostTransfer(roomId, departingHostUserId);
            return;
        }

        hostTransferTasksByRoom.put(
                roomId,
                cleanupExecutor.schedule(
                        () -> completeScheduledHostTransfer(roomId, departingHostUserId),
                        hostTransferGracePeriod.toMillis(),
                        TimeUnit.MILLISECONDS));
    }

    private void cancelHostTransfer(long roomId) {
        ScheduledFuture<?> hostTransferTask = hostTransferTasksByRoom.remove(roomId);
        if (hostTransferTask != null) {
            hostTransferTask.cancel(false);
        }
    }

    private void completeScheduledHostTransfer(long roomId, long departingHostUserId) {
        RoomPresenceState state = null;
        writeLock.lock();
        try {
            hostTransferTasksByRoom.remove(roomId);
            if (!Objects.equals(hostUserByRoom.get(roomId), departingHostUserId)
                    || !"WAITING".equals(roomStatusByRoom.getOrDefault(roomId, "WAITING"))) {
                return;
            }

            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            if (participants == null) {
                return;
            }
            boolean hostReconnected = participants.values().stream()
                    .anyMatch(candidate -> candidate.userId == departingHostUserId
                            && !candidate.sessions.isEmpty());
            if (hostReconnected) {
                return;
            }
            ParticipantPresence successor = participants.values().stream()
                    .filter(candidate -> !candidate.sessions.isEmpty())
                    .findFirst()
                    .orElse(null);
            if (successor == null) {
                return;
            }

            roomService.transferHost(roomId, successor.userId);
            hostUserByRoom.put(roomId, successor.userId);
            state = snapshot(roomId);
        } catch (RuntimeException exception) {
            log.warn("방장 변경 예약 작업에 실패했습니다. roomId={}", roomId, exception);
        } finally {
            writeLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
    }

    private void cleanupRoomIfStillEmpty(long roomId) {
        writeLock.lock();
        try {
            if (participantsByRoom.containsKey(roomId)) {
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
                return;
            }
            if (!roomsBeingDeleted.add(roomId)) {
                return;
            }
            roomDeletionGeneration++;
        } finally {
            writeLock.unlock();
        }

        RuntimeException deletionFailure = null;
        try {
            roomService.deleteRoom(roomId);
        } catch (RuntimeException exception) {
            deletionFailure = exception;
        }

        boolean forgetLobbyCount = false;
        writeLock.lock();
        try {
            roomsBeingDeleted.remove(roomId);
            if (deletionFailure == null) {
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
                roomSettingsByRoom.remove(roomId);
                hostUserByRoom.remove(roomId);
                roomStatusByRoom.remove(roomId);
                forgetLobbyCount = true;
            } else if (!participantsByRoom.containsKey(roomId)) {
                cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                        () -> cleanupRoomIfStillEmpty(roomId),
                        Math.max(1L, emptyRoomCleanupDelay.toMillis()),
                        TimeUnit.MILLISECONDS));
            } else {
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
            }
        } finally {
            writeLock.unlock();
        }
        if (forgetLobbyCount) {
            forgetLobbyRoomCount(roomId);
        }
        if (deletionFailure != null) {
            log.warn("방 정리 작업에 실패했습니다. 재시도합니다. roomId={}", roomId, deletionFailure);
        }
    }

    @PreDestroy
    void shutdownCleanupExecutor() {
        cleanupExecutor.shutdownNow();
        lobbyCountExecutor.shutdownNow();
    }

    private void broadcast(RoomPresenceState state) {
        // 방 참가자 화면에는 방별 상태를, 로비에는 방 인원과 전체 온라인 인원을 각각 보낸다.
        messagingTemplate.convertAndSend(
                formatDestination(PRESENCE_DESTINATION, state.roomId()),
                state);

        lobbyBroadcastLock.lock();
        try {
            int currentPlayers;
            int onlinePlayers;
            readLock.lock();
            try {
                // state는 쓰기 잠금 해제 후 전달되므로 대기 중 더 최신 상태가 만들어졌을 수 있다.
                Map<String, ParticipantPresence> participants = participantsByRoom.get(state.roomId());
                currentPlayers = participants == null ? 0 : participants.size();
                onlinePlayers = onlineSessionsByParticipant.size();
            } finally {
                readLock.unlock();
            }

            if (shouldBroadcastLobbyRoomCount(state.roomId(), currentPlayers)) {
                messagingTemplate.convertAndSend(
                        LOBBY_PRESENCE_DESTINATION,
                        new RoomPresenceCount(state.roomId(), currentPlayers));
            }
            if (shouldBroadcastOnlinePlayerCount(onlinePlayers)) {
                messagingTemplate.convertAndSend(
                        LOBBY_PRESENCE_DESTINATION,
                        new OnlinePlayerCount(onlinePlayers));
            }
        } finally {
            lobbyBroadcastLock.unlock();
        }
    }

    private boolean shouldBroadcastLobbyRoomCount(long roomId, int currentPlayers) {
        Integer previousCount = lastBroadcastLobbyRoomCounts.put(roomId, currentPlayers);
        return previousCount == null || previousCount.intValue() != currentPlayers;
    }

    private void forgetLobbyRoomCount(long roomId) {
        lobbyBroadcastLock.lock();
        try {
            lastBroadcastLobbyRoomCounts.remove(roomId);
        } finally {
            lobbyBroadcastLock.unlock();
        }
    }

    private boolean shouldBroadcastOnlinePlayerCount(int onlinePlayerCount) {
        if (lastBroadcastOnlinePlayerCount == onlinePlayerCount) {
            return false;
        }
        lastBroadcastOnlinePlayerCount = onlinePlayerCount;
        return true;
    }

    private static @NonNull String formatDestination(String template, long roomId) {
        String destination = template.formatted(roomId);
        if (destination == null) {
            throw new IllegalStateException("WebSocket destination must not be null.");
        }
        return destination;
    }

    private void broadcastOnlinePlayerCount() {
        int onlinePlayerCount;
        lobbyBroadcastLock.lock();
        try {
            readLock.lock();
            try {
                onlinePlayerCount = onlineSessionsByParticipant.size();
            } finally {
                readLock.unlock();
            }
            if (shouldBroadcastOnlinePlayerCount(onlinePlayerCount)) {
                messagingTemplate.convertAndSend(
                        LOBBY_PRESENCE_DESTINATION,
                        new OnlinePlayerCount(onlinePlayerCount));
            }
        } finally {
            lobbyBroadcastLock.unlock();
        }
    }

    private void notifyDeparture(long roomId, long userId) {
        if (roomGameService != null) {
            roomGameService.handlePlayerDeparture(roomId, userId);
        }
    }

    private void scheduleDepartures(List<DepartedPlayer> departedPlayers) {
        for (DepartedPlayer departedPlayer : departedPlayers) {
            scheduleDeparture(departedPlayer.roomId(), departedPlayer.userId());
        }
    }

    private void scheduleDeparture(long roomId, long userId) {
        if (roomGameService == null) {
            return;
        }

        boolean notifyImmediately = false;
        writeLock.lock();
        try {
            // 게임 중 연결이 잠시 끊긴 F5/네트워크 재접속은 정상 이탈로 처리하지 않는다.
            // 유예 시간 안에 같은 사용자가 다시 들어오지 않을 때만 게임 서비스에 알린다.
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            boolean reconnected = participants != null
                    && participants.values().stream().anyMatch(participant -> participant.userId == userId
                            && !participant.sessions.isEmpty());
            if (reconnected) {
                return;
            }

            String departureKey = departureKey(roomId, userId);
            ScheduledFuture<?> previousTask = gameDepartureTasks.remove(departureKey);
            if (previousTask != null) {
                previousTask.cancel(false);
            }
            if (gameDepartureGracePeriod.isZero()) {
                notifyImmediately = true;
            } else {
                gameDepartureTasks.put(
                        departureKey,
                        cleanupExecutor.schedule(
                                () -> completeScheduledDeparture(roomId, userId),
                                gameDepartureGracePeriod.toMillis(),
                                TimeUnit.MILLISECONDS));
            }
        } finally {
            writeLock.unlock();
        }

        if (notifyImmediately) {
            completeScheduledDeparture(roomId, userId);
        }
    }

    private void completeScheduledDeparture(long roomId, long userId) {
        boolean notify = false;
        RoomPresenceState state = null;
        writeLock.lock();
        try {
            gameDepartureTasks.remove(departureKey(roomId, userId));
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            if (participants == null) {
                notify = true;
            } else {
                String participantKey = null;
                for (Map.Entry<String, ParticipantPresence> entry : participants.entrySet()) {
                    ParticipantPresence participant = entry.getValue();
                    if (participant != null && participant.userId == userId
                            && participant.sessions.isEmpty()) {
                        participantKey = entry.getKey();
                        break;
                    }
                }
                if (participantKey == null) {
                    notify = participants.values().stream()
                            .noneMatch(participant -> participant.userId == userId);
                } else {
                    participants.remove(participantKey);
                    if (Objects.equals(hostUserByRoom.get(roomId), userId)) {
                        ParticipantPresence successor = participants.values().stream()
                                .filter(participant -> !participant.sessions.isEmpty())
                                .findFirst()
                                .orElse(null);
                        if (successor == null) {
                            hostUserByRoom.remove(roomId);
                        } else {
                            hostUserByRoom.put(roomId, successor.userId);
                        }
                    }
                    notify = true;
                    if (participants.isEmpty()) {
                        participantsByRoom.remove(roomId);
                        cancelHostTransfer(roomId);
                        hostUserByRoom.remove(roomId);
                        roomStatusByRoom.remove(roomId);
                        emptyRoomsPendingCleanup.add(roomId);
                        scheduleRoomCleanup(roomId);
                        state = new RoomPresenceState(roomId, List.of());
                    } else {
                        state = snapshot(roomId);
                    }
                }
            }
        } finally {
            writeLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
        if (notify) {
            notifyDeparture(roomId, userId);
        }
    }

    private void cancelGameDeparture(long roomId, long userId) {
        if (userId <= 0) {
            return;
        }
        ScheduledFuture<?> pendingTask = gameDepartureTasks.remove(departureKey(roomId, userId));
        if (pendingTask != null) {
            pendingTask.cancel(false);
        }
    }

    private static String departureKey(long roomId, long userId) {
        return roomId + ":" + userId;
    }

    private record SessionRemoval(
            RoomPresenceState state,
            Long departedUserId) {
    }

    private record DepartedPlayer(
            long roomId,
            long userId) {
    }

    private record RoomSettingsSnapshot(
            int capacity,
            boolean locked) {
    }

    private static final class ParticipantPresence {
        private final long userId;
        private String nickname;
        private String principalName;
        private boolean ready;
        private final Set<String> sessions = new LinkedHashSet<>();

        private ParticipantPresence(PrincipalIdentity identity) {
            this.userId = identity.userId();
            this.nickname = identity.nickname();
        }
    }

}
