package kr.or.oti.mafiagame.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.RoomAccess;
import kr.or.oti.mafiagame.service.RoomPresenceService;

@Controller
public class RoomPresenceController {
    private final RoomPresenceService roomPresenceService;

    public RoomPresenceController(RoomPresenceService roomPresenceService) {
        this.roomPresenceService = roomPresenceService;
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
