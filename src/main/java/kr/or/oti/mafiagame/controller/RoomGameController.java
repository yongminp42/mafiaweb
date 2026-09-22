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
        // 인증 주체와 행동 요청을 게임 서비스에 전달한다.
        // 페이즈·역할·생존 여부 검증과 상태 변경은 해당 방의 잠금 안에서 처리한다.
        roomGameService.submitAction(roomId, principal, request);
    }

    @MessageMapping("/rooms/{roomId}/game/sync")
    public void syncState(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        // 새로고침/재접속한 클라이언트가 공개 상태와 자신의 개인 역할 결과를 복원한다.
        roomGameService.broadcastCurrentState(roomId, principal);
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleGameException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
