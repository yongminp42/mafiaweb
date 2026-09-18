package kr.or.oti.mafiagame.config;

import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import kr.or.oti.mafiagame.service.RoomPresenceService;

/**
 * STOMP 토픽과 애플리케이션 목적지에 대한 최소 권한 검사를 담당한다.
 */
@Component
public class WebSocketAuthorizationInterceptor implements ChannelInterceptor {
    private static final Pattern ROOM_TOPIC_PATTERN = Pattern.compile("^/topic/rooms/(\\d+)/(chat|presence|game)$");
    private static final Pattern ROOM_SEND_PATTERN = Pattern.compile("^/app/rooms/(\\d+)/(join|ready|start|chat|presence/sync|game(?:/sync)?)$");
    private static final String LOBBY_TOPIC = "/topic/rooms/presence";
    private static final String LOBBY_SEND = "/app/rooms/presence";

    private final RoomPresenceService roomPresenceService;

    public WebSocketAuthorizationInterceptor(@Lazy RoomPresenceService roomPresenceService) {
        this.roomPresenceService = roomPresenceService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        String destination = accessor.getDestination();
        if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            authorizeSubscription(message, accessor, destination);
        } else if (accessor.getCommand() == StompCommand.SEND) {
            authorizeSend(message, accessor, destination);
        }
        return message;
    }

    private void authorizeSubscription(
            Message<?> message,
            StompHeaderAccessor accessor,
            String destination) {
        if (LOBBY_TOPIC.equals(destination)) {
            return;
        }
        if (destination != null && destination.startsWith("/user/")) {
            requirePrincipal(message, accessor);
            return;
        }

        Matcher matcher = destination == null ? null : ROOM_TOPIC_PATTERN.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw denied(message, "허용되지 않은 WebSocket 구독 주소입니다.");
        }

        requirePrincipal(message, accessor);
        long roomId = Long.parseLong(matcher.group(1));
        if (!roomPresenceService.isParticipant(roomId, accessor.getSessionId())) {
            throw denied(message, "먼저 게임방에 입장해 주세요.");
        }
    }

    private void authorizeSend(
            Message<?> message,
            StompHeaderAccessor accessor,
            String destination) {
        if (LOBBY_SEND.equals(destination)) {
            return;
        }

        Matcher matcher = destination == null ? null : ROOM_SEND_PATTERN.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw denied(message, "허용되지 않은 WebSocket 요청 주소입니다.");
        }

        requirePrincipal(message, accessor);
        long roomId = Long.parseLong(matcher.group(1));
        String action = matcher.group(2);
        if (!"join".equals(action)
                && !roomPresenceService.isParticipant(roomId, accessor.getSessionId())) {
            throw denied(message, "먼저 게임방에 입장해 주세요.");
        }
    }

    private void requirePrincipal(Message<?> message, StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            throw denied(message, "로그인 후 이용해 주세요.");
        }
    }

    private MessageDeliveryException denied(Message<?> message, String reason) {
        return new MessageDeliveryException(message, reason);
    }
}
