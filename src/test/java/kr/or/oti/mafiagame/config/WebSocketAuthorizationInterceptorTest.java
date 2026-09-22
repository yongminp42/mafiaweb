package kr.or.oti.mafiagame.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.security.Principal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import kr.or.oti.mafiagame.service.RoomPresenceService;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthorizationInterceptorTest {
    @Mock
    private RoomPresenceService roomPresenceService;

    private final @NonNull MessageChannel channel = (message, timeout) -> true;

    private WebSocketAuthorizationInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthorizationInterceptor(roomPresenceService);
    }

    @Test
    void allowsPublicLobbySubscriptionWithoutLogin() {
        var message = message(StompCommand.SUBSCRIBE, "/topic/rooms/presence", null);

        assertThat(interceptor.preSend(message, channel)).isSameAs(message);
    }

    @Test
    void deniesRoomTopicSubscriptionUntilSessionJoined() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/rooms/7/chat", principal), channel))
                .hasMessage("먼저 게임방에 입장해 주세요.");
    }

    @Test
    void allowsJoinedParticipantToSubscribeAndSendRoomMessages() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(true);

        var subscribe = message(StompCommand.SUBSCRIBE, "/topic/rooms/7/presence", principal);
        var send = message(StompCommand.SEND, "/app/rooms/7/chat", principal);

        assertThat(interceptor.preSend(subscribe, channel)).isSameAs(subscribe);
        assertThat(interceptor.preSend(send, channel)).isSameAs(send);
    }

    @Test
    void routesJoinedParticipantsMafiaChatToServiceForRoleValidation() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(true);
        var send = message(StompCommand.SEND, "/app/rooms/7/mafia-chat", principal);

        assertThat(interceptor.preSend(send, channel)).isSameAs(send);
    }

    @Test
    void rejectsMafiaChatFromNonParticipantBeforeService() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/rooms/7/mafia-chat", principal), channel))
                .hasMessage("먼저 게임방에 입장해 주세요.");
    }

    @Test
    void allowsJoinButRequiresLoginForRoomOperations() {
        Principal principal = () -> "player";
        var join = message(StompCommand.SEND, "/app/rooms/7/join", principal);

        assertThat(interceptor.preSend(join, channel)).isSameAs(join);
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/rooms/7/join", null), channel))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    @Test
    void onlyAuthenticatedSessionsCanSubscribeToUserQueue() {
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/errors", null), channel))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    private static @NonNull Message<byte[]> message(
            @NonNull StompCommand command,
            @Nullable String destination,
            @Nullable Principal principal) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setDestination(destination);
        accessor.setSessionId("session");
        accessor.setUser(principal);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        if (message == null) {
            throw new IllegalStateException("Test message must not be null.");
        }
        return message;
    }
}
