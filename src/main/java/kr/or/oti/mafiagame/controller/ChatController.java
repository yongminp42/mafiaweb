package kr.or.oti.mafiagame.controller;

import java.security.Principal;
import java.time.Instant;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import kr.or.oti.mafiagame.domain.RoomList;
import kr.or.oti.mafiagame.dto.ChatError;
import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.exception.ChatException;
import kr.or.oti.mafiagame.security.CustomUserDetails;
import kr.or.oti.mafiagame.service.RoomService;

@Controller
public class ChatController {
    private static final int MAX_MESSAGE_LENGTH = 300;
    private static final String CHAT_TYPE = "CHAT";
    private static final String ERROR_TYPE = "ERROR";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    public ChatController(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    @MessageMapping("/rooms/{roomId}/chat")
    public void sendMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            Principal principal) {
        if (principal == null) {
            throw new ChatException("로그인 후 채팅을 이용할 수 있습니다.");
        }

        String content = normalizeContent(request);
        RoomList room = roomService.getRoom(roomId);
        if (room == null) {
            throw new ChatException("존재하지 않는 게임방입니다.");
        }

        String sender = resolveNickname(principal);
        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/chat",
                new ChatMessage(roomId, CHAT_TYPE, sender, content, Instant.now()));
    }

    @MessageExceptionHandler(ChatException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleChatException(ChatException exception) {
        return new ChatError(ERROR_TYPE, exception.getMessage());
    }

    private String normalizeContent(ChatMessageRequest request) {
        String content = request == null || request.content() == null
                ? ""
                : request.content().strip();

        if (content.isBlank()) {
            throw new ChatException("메시지를 입력해 주세요.");
        }
        if (content.codePointCount(0, content.length()) > MAX_MESSAGE_LENGTH) {
            throw new ChatException("메시지는 300자 이하로 입력해 주세요.");
        }
        return content;
    }

    private String resolveNickname(Principal principal) {
        if (principal instanceof Authentication authentication
                && authentication.getPrincipal() instanceof CustomUserDetails user) {
            return user.getNickname();
        }
        return principal.getName();
    }
}
