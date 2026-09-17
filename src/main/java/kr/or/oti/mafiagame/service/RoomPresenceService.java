package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
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

import jakarta.annotation.PreDestroy;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.dto.RoomPresenceCount;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.PrincipalIdentity;

@Service
public class RoomPresenceService {
    private static final Logger log = LoggerFactory.getLogger(RoomPresenceService.class);
    private static final String PRESENCE_DESTINATION = "/topic/rooms/%d/presence";
    private static final String LOBBY_PRESENCE_DESTINATION = "/topic/rooms/presence";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final ReentrantReadWriteLock presenceLock = new ReentrantReadWriteLock();
    private final Lock readLock = presenceLock.readLock();
    private final Lock writeLock = presenceLock.writeLock();
    private final Duration emptyRoomCleanupDelay;
    private final ScheduledExecutorService cleanupExecutor;
    private final Map<Long, Map<String, ParticipantPresence>> participantsByRoom = new HashMap<>();
    private final Map<String, Long> roomBySession = new HashMap<>();
    private final Map<String, String> participantKeyBySession = new HashMap<>();
    private final Map<String, Set<String>> sessionsByParticipant = new HashMap<>();
    private final Map<Long, Long> hostUserByRoom = new HashMap<>();
    private final Map<Long, ScheduledFuture<?>> cleanupTasksByRoom = new HashMap<>();
    private final Set<Long> emptyRoomsPendingCleanup = new LinkedHashSet<>();

    public RoomPresenceService(
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService,
            @Value("${mafiagame.room.empty-cleanup-delay:15s}") Duration emptyRoomCleanupDelay) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
        this.emptyRoomCleanupDelay = emptyRoomCleanupDelay.isNegative()
                ? Duration.ZERO
                : emptyRoomCleanupDelay;
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "room-presence-cleanup");
            thread.setDaemon(true);
            return thread;
        };
        this.cleanupExecutor = Executors.newSingleThreadScheduledExecutor(threadFactory);
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
        RoomPresenceState currentState;
        Map<Long, RoomPresenceState> previousStates;

        writeLock.lock();
        try {
            RoomSummary room = requireRoom(roomId);
            if (room.isLocked() && !roomAccessGranted) {
                throw new RoomWebSocketException("게임방 비밀번호를 먼저 확인해 주세요.");
            }
            cancelRoomCleanup(roomId);

            Map<String, ParticipantPresence> targetParticipants = participantsByRoom.get(roomId);
            boolean alreadyJoined = targetParticipants != null && targetParticipants.containsKey(participantKey);
            if (!alreadyJoined && targetParticipants != null
                    && targetParticipants.size() >= room.getMaxPlayers()) {
                throw new RoomWebSocketException("게임방 정원이 가득 찼습니다.");
            }

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
                RoomPresenceState previousState = removeSession(previousRoomId, sessionToLeave);
                if (previousState != null) {
                    previousStates.put(previousRoomId, previousState);
                }
            }

            Map<String, ParticipantPresence> participants = participantsByRoom
                    .computeIfAbsent(roomId, ignored -> new LinkedHashMap<>());
            hostUserByRoom.putIfAbsent(roomId, room.getHostUserId());

            ParticipantPresence participant = participants.computeIfAbsent(
                    participantKey,
                    ignored -> new ParticipantPresence(identity));
            participant.nickname = identity.nickname();
            participant.sessions.add(sessionId);
            roomBySession.put(sessionId, roomId);
            participantKeyBySession.put(sessionId, participantKey);
            sessionsByParticipant.computeIfAbsent(participantKey, ignored -> new LinkedHashSet<>())
                    .add(sessionId);

            currentState = snapshot(roomId);
        } finally {
            writeLock.unlock();
        }

        for (RoomPresenceState previousState : previousStates.values()) {
            broadcast(previousState);
        }
        broadcast(currentState);
        return currentState;
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

    public void broadcastRoomCounts() {
        List<RoomPresenceCount> counts;
        readLock.lock();
        try {
            Map<Long, Integer> currentCounts = new HashMap<>();
            participantsByRoom.forEach((roomId, participants) ->
                    currentCounts.put(roomId, participants.size()));
            emptyRoomsPendingCleanup.forEach(roomId -> currentCounts.putIfAbsent(roomId, 0));
            counts = currentCounts.entrySet().stream()
                    .map(entry -> new RoomPresenceCount(entry.getKey(), entry.getValue()))
                    .toList();
        } finally {
            readLock.unlock();
        }

        messagingTemplate.convertAndSend(LOBBY_PRESENCE_DESTINATION, counts);
    }

    public void updateReady(long roomId, String sessionId, RoomReadyRequest request) {
        if (request == null) {
            throw new RoomWebSocketException("준비 상태를 확인할 수 없습니다.");
        }

        RoomPresenceState currentState;
        writeLock.lock();
        try {
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            if (!Long.valueOf(roomId).equals(joinedRoomId) || participantKey == null) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }

            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null ? null : participants.get(participantKey);
            if (participant == null || !participant.sessions.contains(sessionId)) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }

            participant.ready = request.ready();
            currentState = snapshot(roomId);
        } finally {
            writeLock.unlock();
        }

        broadcast(currentState);
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
    public void handleDisconnect(SessionDisconnectEvent event) {
        leave(event.getSessionId());
    }

    public void leave(String sessionId) {
        if (sessionId == null) {
            return;
        }

        RoomPresenceState state;
        writeLock.lock();
        try {
            Long roomId = roomBySession.get(sessionId);
            if (roomId == null) {
                return;
            }
            state = removeSession(roomId, sessionId);
        } finally {
            writeLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
    }

    private RoomSummary requireRoom(long roomId) {
        RoomSummary room = roomService.getRoom(roomId);
        if (room == null) {
            throw new RoomWebSocketException("존재하지 않는 게임방입니다.");
        }
        return room;
    }

    private RoomPresenceState removeSession(long roomId, String sessionId) {
        if (!Long.valueOf(roomId).equals(roomBySession.get(sessionId))) {
            return null;
        }

        Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
        if (participants == null) {
            return null;
        }

        String participantKey = participantKeyBySession.get(sessionId);
        ParticipantPresence participant = participantKey == null ? null : participants.get(participantKey);
        boolean participantLeaves = participant != null && participant.sessions.size() == 1;
        boolean hostLeaves = participantLeaves
                && Objects.equals(hostUserByRoom.get(roomId), participant.userId)
                && participants.size() > 1;
        ParticipantPresence successor = hostLeaves
                ? participants.values().stream()
                        .filter(candidate -> !candidate.equals(participant))
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
            if (participant.sessions.isEmpty()) {
                participants.remove(participantKey);
            }
        }

        if (participants.isEmpty()) {
            participantsByRoom.remove(roomId);
            hostUserByRoom.remove(roomId);
            emptyRoomsPendingCleanup.add(roomId);
            scheduleRoomCleanup(roomId);
            return new RoomPresenceState(roomId, List.of());
        }
        if (successor != null) {
            hostUserByRoom.put(roomId, successor.userId);
        }
        return snapshot(roomId);
    }

    private RoomPresenceState snapshot(long roomId) {
        Map<String, ParticipantPresence> currentParticipants = participantsByRoom.get(roomId);
        List<RoomParticipant> participants = new ArrayList<>(currentParticipants.size());
        for (ParticipantPresence participant : currentParticipants.values()) {
            participants.add(createParticipant(roomId, participant));
        }
        return new RoomPresenceState(roomId, List.copyOf(participants));
    }

    private RoomParticipant createParticipant(long roomId, ParticipantPresence participant) {
        return new RoomParticipant(
                participant.userId,
                participant.nickname,
                Objects.equals(hostUserByRoom.get(roomId), participant.userId),
                participant.ready);
    }

    private void scheduleRoomCleanup(long roomId) {
        if (emptyRoomCleanupDelay.isZero()) {
            roomService.deleteRoom(roomId);
            emptyRoomsPendingCleanup.remove(roomId);
            return;
        }

        ScheduledFuture<?> previousTask = cleanupTasksByRoom.remove(roomId);
        if (previousTask != null) {
            previousTask.cancel(false);
        }
        cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                () -> cleanupRoomIfStillEmpty(roomId),
                emptyRoomCleanupDelay.toMillis(),
                TimeUnit.MILLISECONDS));
    }

    private void cancelRoomCleanup(long roomId) {
        emptyRoomsPendingCleanup.remove(roomId);
        ScheduledFuture<?> cleanupTask = cleanupTasksByRoom.remove(roomId);
        if (cleanupTask != null) {
            cleanupTask.cancel(false);
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

            try {
                roomService.deleteRoom(roomId);
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
            } catch (RuntimeException exception) {
                log.warn("방 정리 작업에 실패했습니다. 재시도합니다. roomId={}", roomId, exception);
                cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                        () -> cleanupRoomIfStillEmpty(roomId),
                        Math.max(1L, emptyRoomCleanupDelay.toMillis()),
                        TimeUnit.MILLISECONDS));
            }
        } finally {
            writeLock.unlock();
        }
    }

    @PreDestroy
    void shutdownCleanupExecutor() {
        cleanupExecutor.shutdownNow();
    }

    private void broadcast(RoomPresenceState state) {
        messagingTemplate.convertAndSend(
                PRESENCE_DESTINATION.formatted(state.roomId()),
                state);
        messagingTemplate.convertAndSend(
                LOBBY_PRESENCE_DESTINATION,
                new RoomPresenceCount(state.roomId(), state.participants().size()));
    }

    private static final class ParticipantPresence {
        private final long userId;
        private String nickname;
        private boolean ready;
        private final Set<String> sessions = new LinkedHashSet<>();

        private ParticipantPresence(PrincipalIdentity identity) {
            this.userId = identity.userId();
            this.nickname = identity.nickname();
        }
    }

}
