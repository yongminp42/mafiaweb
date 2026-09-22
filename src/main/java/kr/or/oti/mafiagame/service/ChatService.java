package kr.or.oti.mafiagame.service;

import java.security.Principal;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import kr.or.oti.mafiagame.dto.ChatChannel;
import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.PrincipalIdentity;

@Service
public class ChatService {
    private static final int MAX_MESSAGE_LENGTH = 300;
    private static final String CHAT_TYPE = "CHAT";

    private final RoomPresenceService roomPresenceService;
    private final RoomGameService roomGameService;

    public ChatService(RoomPresenceService roomPresenceService) {
        this(roomPresenceService, null);
    }

    @Autowired
    public ChatService(RoomPresenceService roomPresenceService, RoomGameService roomGameService) {
        this.roomPresenceService = roomPresenceService;
        this.roomGameService = roomGameService;
    }

    public @NonNull ChatMessage createMessage(
            long roomId,
            ChatMessageRequest request,
            Principal principal,
            String sessionId) {
        return createMessage(roomId, request, principal, sessionId, ChatChannel.PUBLIC);
    }

    public @NonNull ChatMessage createMessage(
            long roomId,
            ChatMessageRequest request,
            Principal principal,
            String sessionId,
            ChatChannel channel) {
        if (principal == null) {
            throw new RoomWebSocketException("로그인 후 채팅을 이용할 수 있습니다.");
        }

        PrincipalIdentity identity = PrincipalIdentity.from(principal);

        if (!roomPresenceService.isParticipant(roomId, sessionId)) {
            throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
        }

        String content = normalizeContent(request);
        ChatChannel requestedChannel = channel == null ? ChatChannel.PUBLIC : channel;
        if (roomGameService == null
                && (requestedChannel == ChatChannel.MAFIA || requestedChannel == ChatChannel.DEAD)) {
            throw new RoomWebSocketException("해당 채팅 채널을 사용할 수 없습니다.");
        }
        if (roomGameService != null) {
            roomGameService.validateChat(
                    roomId,
                    identity.userId(),
                    requestedChannel);
        }
        return new ChatMessage(
                roomId,
                CHAT_TYPE,
                identity.nickname(),
                content,
                requestedChannel,
                Instant.now());
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

}
