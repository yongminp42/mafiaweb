package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
    private static final String PRESENCE_DESTINATION = "/topic/rooms/%d/presence";
    private static final String LOBBY_PRESENCE_DESTINATION = "/topic/rooms/presence";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final Object monitor = new Object();
    private final Map<Long, Map<String, RoomParticipant>> participantsByRoom = new HashMap<>();
    private final Map<String, Long> roomBySession = new HashMap<>();
    private final Map<Long, Long> hostUserByRoom = new HashMap<>();

    public RoomPresenceService(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    public void join(long roomId, String sessionId, Principal principal) {
        if (sessionId == null || sessionId.isBlank() || principal == null) {
            throw new RoomWebSocketException("게임방 연결 정보를 확인할 수 없습니다.");
        }

        PrincipalIdentity identity = PrincipalIdentity.from(principal);
        RoomPresenceState currentState;
        RoomPresenceState previousState = null;

        synchronized (monitor) {
            RoomSummary room = requireRoom(roomId);
            Long previousRoomId = roomBySession.put(sessionId, roomId);
            if (previousRoomId != null && previousRoomId != roomId) {
                previousState = removeSession(previousRoomId, sessionId);
            }

            Map<String, RoomParticipant> participants = participantsByRoom
                    .computeIfAbsent(roomId, ignored -> new LinkedHashMap<>());
            hostUserByRoom.putIfAbsent(roomId, room.getHostUserId());
            RoomParticipant previous = participants.get(sessionId);
            boolean ready = previous != null && previous.ready();
            participants.put(sessionId, createParticipant(roomId, identity.userId(), identity.nickname(), ready));
            assignHostIfNeeded(roomId, participants);
            currentState = snapshot(roomId);
        }

        if (previousState != null) {
            broadcast(previousState);
        }
        broadcast(currentState);
    }

    public void broadcastRoomCounts() {
        List<RoomPresenceCount> counts;
        synchronized (monitor) {
            counts = participantsByRoom.entrySet().stream()
                    .map(entry -> new RoomPresenceCount(entry.getKey(), entry.getValue().size()))
                    .toList();
        }

        messagingTemplate.convertAndSend(LOBBY_PRESENCE_DESTINATION, counts);
    }

    public void updateReady(long roomId, String sessionId, RoomReadyRequest request) {
        if (request == null) {
            throw new RoomWebSocketException("준비 상태를 확인할 수 없습니다.");
        }

        RoomPresenceState currentState;
        synchronized (monitor) {
            Long joinedRoomId = roomBySession.get(sessionId);
            if (!Long.valueOf(roomId).equals(joinedRoomId)) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }

            Map<String, RoomParticipant> participants = participantsByRoom.get(roomId);
            RoomParticipant participant = participants == null ? null : participants.get(sessionId);
            if (participant == null) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }

            participants.put(sessionId, createParticipant(
                    roomId,
                    participant.userId(),
                    participant.nickname(),
                    request.ready()));
            currentState = snapshot(roomId);
        }

        broadcast(currentState);
    }

    public boolean isParticipant(long roomId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }

        synchronized (monitor) {
            Map<String, RoomParticipant> participants = participantsByRoom.get(roomId);
            return participants != null && participants.containsKey(sessionId);
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
        synchronized (monitor) {
            Long roomId = roomBySession.remove(sessionId);
            if (roomId == null) {
                return;
            }
            state = removeSession(roomId, sessionId);
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
        Map<String, RoomParticipant> participants = participantsByRoom.get(roomId);
        if (participants == null) {
            return null;
        }

        participants.remove(sessionId);
        if (participants.isEmpty()) {
            participantsByRoom.remove(roomId);
            hostUserByRoom.remove(roomId);
            roomService.deleteRoom(roomId);
            return new RoomPresenceState(roomId, List.of());
        }
        assignHostIfNeeded(roomId, participants);
        return snapshot(roomId);
    }

    private RoomPresenceState snapshot(long roomId) {
        Map<String, RoomParticipant> currentParticipants = participantsByRoom.get(roomId);
        List<RoomParticipant> participants = new ArrayList<>(currentParticipants.size());
        for (RoomParticipant participant : currentParticipants.values()) {
            participants.add(createParticipant(
                    roomId,
                    participant.userId(),
                    participant.nickname(),
                    participant.ready()));
        }
        return new RoomPresenceState(roomId, List.copyOf(participants));
    }

    private RoomParticipant createParticipant(long roomId, long userId, String nickname, boolean ready) {
        return new RoomParticipant(userId, nickname, Objects.equals(hostUserByRoom.get(roomId), userId), ready);
    }

    private void assignHostIfNeeded(long roomId, Map<String, RoomParticipant> participants) {
        if (participants.isEmpty()) {
            hostUserByRoom.remove(roomId);
            return;
        }

        Long currentHostUserId = hostUserByRoom.get(roomId);
        boolean currentHostIsPresent = participants.values().stream()
                .anyMatch(participant -> Objects.equals(currentHostUserId, participant.userId()));
        if (currentHostIsPresent) {
            return;
        }

        RoomParticipant successor = participants.values().iterator().next();
        if (successor.userId() > 0 && !Objects.equals(currentHostUserId, successor.userId())) {
            roomService.transferHost(roomId, successor.userId());
        }
        hostUserByRoom.put(roomId, successor.userId());
    }

    private void broadcast(RoomPresenceState state) {
        messagingTemplate.convertAndSend(
                PRESENCE_DESTINATION.formatted(state.roomId()),
                state);
        messagingTemplate.convertAndSend(
                LOBBY_PRESENCE_DESTINATION,
                new RoomPresenceCount(state.roomId(), state.participants().size()));
    }

}
