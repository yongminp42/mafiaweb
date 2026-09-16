package kr.or.oti.mafiagame.controller;

import java.security.Principal;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.service.ChatService;

@Controller
public class ChatController {
    private static final String ERROR_TYPE = "ERROR";

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    @MessageMapping("/rooms/{roomId}/chat")
    public void sendMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/chat",
                chatService.createMessage(
                        roomId,
                        request,
                        principal,
                        headers == null ? null : headers.getSessionId()));
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleRoomWebSocketException(RoomWebSocketException exception) {
        return new ChatError(ERROR_TYPE, exception.getMessage());
    }
}
