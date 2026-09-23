package kr.or.oti.mafiagame.controller;

import java.security.Principal;

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
        // 입장 검증과 현재 참가자 목록 생성은 서비스가 담당한다.
        // 컨트롤러는 WebSocket 세션 정보와 HTTP 세션의 방 비밀번호 인증 여부만 전달한다.
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
        roomPresenceService.startGame(roomId, headers.getSessionId());
    }

    @MessageMapping("/rooms/presence")
    public void sendRoomCounts(SimpMessageHeaderAccessor headers) {
        roomPresenceService.broadcastRoomCounts(headers.getSessionId());
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handlePresenceException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
