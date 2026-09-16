package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.time.Instant;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.CustomUserDetails;

@Service
public class ChatService {
    private static final int MAX_MESSAGE_LENGTH = 300;
    private static final String CHAT_TYPE = "CHAT";

    private final RoomService roomService;
    private final RoomPresenceService roomPresenceService;

    public ChatService(RoomService roomService, RoomPresenceService roomPresenceService) {
        this.roomService = roomService;
        this.roomPresenceService = roomPresenceService;
    }

    public ChatMessage createMessage(
            long roomId,
            ChatMessageRequest request,
            Principal principal,
            String sessionId) {
        if (principal == null) {
            throw new RoomWebSocketException("로그인 후 채팅을 이용할 수 있습니다.");
        }

        RoomSummary room = roomService.getRoom(roomId);
        if (room == null) {
            throw new RoomWebSocketException("존재하지 않는 게임방입니다.");
        }
        if (!roomPresenceService.isParticipant(roomId, sessionId)) {
            throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
        }

        String content = normalizeContent(request);
        return new ChatMessage(roomId, CHAT_TYPE, resolveNickname(principal), content, Instant.now());
    }

    private String normalizeContent(ChatMessageRequest request) {
        String content = request == null || request.content() == null
                ? ""
                : request.content().strip();

        if (content.isBlank()) {
            throw new RoomWebSocketException("메시지를 입력해 주세요.");
        }
        if (content.codePointCount(0, content.length()) > MAX_MESSAGE_LENGTH) {
            throw new RoomWebSocketException("메시지는 300자 이하로 입력해 주세요.");
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
