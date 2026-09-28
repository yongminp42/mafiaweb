package kr.or.oti.mafiagame.controller;

import java.security.Principal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.ChatChannel;
import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.PrincipalIdentity;
import kr.or.oti.mafiagame.service.ChatService;
import kr.or.oti.mafiagame.service.RoomGameService;

@Controller
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final RoomGameService roomGameService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this(messagingTemplate, chatService, null);
    }

    @Autowired
    public ChatController(
            SimpMessagingTemplate messagingTemplate,
            ChatService chatService,
            RoomGameService roomGameService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.roomGameService = roomGameService;
    }

    @MessageMapping("/rooms/{roomId}/chat")
    public void sendMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        ChatMessage message = chatService.createMessage(
                roomId,
                request,
                principal,
                headers == null ? null : headers.getSessionId());
        if (roomGameService == null || principal == null) {
            messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/chat", message);
        } else {
            roomGameService.broadcastPublicChat(
                    message,
                    PrincipalIdentity.from(principal).userId());
        }
    }

    @MessageMapping("/rooms/{roomId}/mafia-chat")
    public void sendMafiaMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        sendPrivateMessage(roomId, request, headers, principal, ChatChannel.MAFIA);
    }

    @MessageMapping("/rooms/{roomId}/dead-chat")
    public void sendDeadMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        sendPrivateMessage(roomId, request, headers, principal, ChatChannel.DEAD);
    }

    private void sendPrivateMessage(
            long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal,
            ChatChannel channel) {
        ChatMessage message = chatService.createMessage(
                roomId,
                request,
                principal,
                headers == null ? null : headers.getSessionId(),
                channel);
        if (roomGameService == null || principal == null) {
            throw new RoomWebSocketException(channel == ChatChannel.MAFIA
                    ? "마피아 채팅을 사용할 수 없습니다."
                    : "사망자 채널을 사용할 수 없습니다.");
        }
        if (channel == ChatChannel.MAFIA) {
            // Deliver individually so a role from a previous game cannot keep receiving the channel.
            roomGameService.broadcastMafiaChat(message);
        } else {
            roomGameService.broadcastDeadChat(
                    message,
                    PrincipalIdentity.from(principal).userId());
        }
    }

    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleRoomWebSocketException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
