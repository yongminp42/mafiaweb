package kr.or.oti.mafiagame.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.GameActionRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.service.RoomGameService;

@Controller
public class RoomGameController {
    private final RoomGameService roomGameService;

    public RoomGameController(RoomGameService roomGameService) {
        this.roomGameService = roomGameService;
    }

    @MessageMapping("/rooms/{roomId}/game")
    public void submitAction(
            @DestinationVariable("roomId") long roomId,
            GameActionRequest request,
            Principal principal) {
        roomGameService.submitAction(roomId, principal, request);
    }

    @MessageMapping("/rooms/{roomId}/game/sync")
    public void syncState(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        roomGameService.broadcastCurrentState(roomId, principal);
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleGameException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
