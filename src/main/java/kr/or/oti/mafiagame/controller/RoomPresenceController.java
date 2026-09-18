package kr.or.oti.mafiagame.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.RoomAccess;
import kr.or.oti.mafiagame.service.RoomGameService;
import kr.or.oti.mafiagame.service.RoomPresenceService;

@Controller
public class RoomPresenceController {
    private final RoomPresenceService roomPresenceService;
    private final RoomGameService roomGameService;

    @Autowired
    public RoomPresenceController(RoomPresenceService roomPresenceService, RoomGameService roomGameService) {
        this.roomPresenceService = roomPresenceService;
        this.roomGameService = roomGameService;
    }

    public RoomPresenceController(RoomPresenceService roomPresenceService) {
        this(roomPresenceService, null);
    }

    @MessageMapping("/rooms/{roomId}/join")
    @SendToUser(value = "/queue/room-joined", broadcast = false)
    public kr.or.oti.mafiagame.dto.RoomPresenceState join(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        return roomPresenceService.join(
                roomId,
                headers.getSessionId(),
                principal,
                RoomAccess.isGranted(headers.getSessionAttributes(), roomId));
    }

    @MessageMapping("/rooms/{roomId}/ready")
    public void updateReady(
            @DestinationVariable("roomId") long roomId,
            RoomReadyRequest request,
            SimpMessageHeaderAccessor headers) {
        roomPresenceService.updateReady(roomId, headers.getSessionId(), request);
    }

    @MessageMapping("/rooms/{roomId}/presence/sync")
    @SendToUser(value = "/queue/presence-synced", broadcast = false)
    public RoomPresenceState syncPresence(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers) {
        return roomPresenceService.syncPresence(roomId, headers.getSessionId());
    }

    @MessageMapping("/rooms/{roomId}/start")
    public void startGame(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers) {
        RoomPresenceState state = roomPresenceService.startGame(roomId, headers.getSessionId());
        if (roomGameService != null) {
            roomGameService.startGame(
                    roomId,
                    state.participants(),
                    roomPresenceService.currentPrincipalNames(roomId));
        }
    }

    @MessageMapping("/rooms/presence")
    public void sendRoomCounts() {
        roomPresenceService.broadcastRoomCounts();
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handlePresenceException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
