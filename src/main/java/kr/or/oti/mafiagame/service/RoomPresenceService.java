package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import kr.or.oti.mafiagame.domain.RoomList;
import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.CustomUserDetails;

@Service
public class RoomPresenceService {
    private static final String PRESENCE_DESTINATION = "/topic/rooms/%d/presence";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final Object monitor = new Object();
    private final Map<Long, Map<String, RoomParticipant>> participantsByRoom = new HashMap<>();
    private final Map<String, Long> roomBySession = new HashMap<>();

    public RoomPresenceService(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    public void join(long roomId, String sessionId, Principal principal) {
        if (sessionId == null || sessionId.isBlank() || principal == null) {
            throw new RoomWebSocketException("게임방 연결 정보를 확인할 수 없습니다.");
        }

        RoomList room = requireRoom(roomId);
        UserIdentity identity = resolveIdentity(principal);
        RoomPresenceState currentState;
        RoomPresenceState previousState = null;

        synchronized (monitor) {
            Long previousRoomId = roomBySession.put(sessionId, roomId);
            if (previousRoomId != null && previousRoomId != roomId) {
                previousState = removeSession(previousRoomId, sessionId);
            }

            Map<String, RoomParticipant> participants = participantsByRoom
                    .computeIfAbsent(roomId, ignored -> new HashMap<>());
            RoomParticipant previous = participants.get(sessionId);
            boolean ready = previous != null && previous.ready();
            participants.put(sessionId, new RoomParticipant(
                    identity.userId(),
                    identity.nickname(),
                    identity.userId() == room.getHostUserId(),
                    ready));
            currentState = snapshot(roomId);
        }

        if (previousState != null) {
            broadcast(previousState);
        }
        broadcast(currentState);
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

            participants.put(sessionId, new RoomParticipant(
                    participant.userId(),
                    participant.nickname(),
                    participant.host(),
                    request.ready()));
            currentState = snapshot(roomId);
        }

        broadcast(currentState);
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

    private RoomList requireRoom(long roomId) {
        RoomList room = roomService.getRoom(roomId);
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
            return null;
        }
        return snapshot(roomId);
    }

    private RoomPresenceState snapshot(long roomId) {
        List<RoomParticipant> participants = new ArrayList<>(participantsByRoom.get(roomId).values());
        participants.sort(Comparator
                .comparing(RoomParticipant::host)
                .reversed()
                .thenComparing(RoomParticipant::nickname)
                .thenComparingLong(RoomParticipant::userId));
        return new RoomPresenceState(roomId, List.copyOf(participants));
    }

    private void broadcast(RoomPresenceState state) {
        messagingTemplate.convertAndSend(
                PRESENCE_DESTINATION.formatted(state.roomId()),
                state);
    }

    private UserIdentity resolveIdentity(Principal principal) {
        if (principal instanceof Authentication authentication
                && authentication.getPrincipal() instanceof CustomUserDetails user) {
            return new UserIdentity(user.getUserId(), user.getNickname());
        }
        return new UserIdentity(-1L, principal.getName());
    }

    private record UserIdentity(long userId, String nickname) {
    }
}
