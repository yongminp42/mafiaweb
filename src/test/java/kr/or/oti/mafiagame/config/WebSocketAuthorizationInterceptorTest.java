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
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;

import kr.or.oti.mafiagame.service.RoomPresenceService;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthorizationInterceptorTest {
    @Mock
    private RoomPresenceService roomPresenceService;

    private WebSocketAuthorizationInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthorizationInterceptor(roomPresenceService);
    }

    @Test
    void allowsPublicLobbySubscriptionWithoutLogin() {
        Message<byte[]> message = message(StompCommand.SUBSCRIBE, "/topic/rooms/presence", null);

        assertThat(interceptor.preSend(message, null)).isSameAs(message);
    }

    @Test
    void deniesRoomTopicSubscriptionUntilSessionJoined() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/rooms/7/chat", principal), null))
                .hasMessage("먼저 게임방에 입장해 주세요.");
    }

    @Test
    void allowsJoinedParticipantToSubscribeAndSendRoomMessages() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(true);

        Message<byte[]> subscribe = message(StompCommand.SUBSCRIBE, "/topic/rooms/7/presence", principal);
        Message<byte[]> send = message(StompCommand.SEND, "/app/rooms/7/chat", principal);

        assertThat(interceptor.preSend(subscribe, null)).isSameAs(subscribe);
        assertThat(interceptor.preSend(send, null)).isSameAs(send);
    }

    @Test
    void routesJoinedParticipantsMafiaChatToServiceForRoleValidation() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(true);
        Message<byte[]> send = message(StompCommand.SEND, "/app/rooms/7/mafia-chat", principal);

        assertThat(interceptor.preSend(send, null)).isSameAs(send);
    }

    @Test
    void rejectsMafiaChatFromNonParticipantBeforeService() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/rooms/7/mafia-chat", principal), null))
                .hasMessage("먼저 게임방에 입장해 주세요.");
    }

    @Test
    void allowsJoinButRequiresLoginForRoomOperations() {
        Principal principal = () -> "player";
        Message<byte[]> join = message(StompCommand.SEND, "/app/rooms/7/join", principal);

        assertThat(interceptor.preSend(join, null)).isSameAs(join);
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/rooms/7/join", null), null))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    @Test
    void onlyAuthenticatedSessionsCanSubscribeToUserQueue() {
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/errors", null), null))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    private static Message<byte[]> message(StompCommand command, String destination, Principal principal) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setDestination(destination);
        accessor.setSessionId("session");
        accessor.setUser(principal);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
