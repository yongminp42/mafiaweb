package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.security.Principal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {
    @Mock
    private RoomPresenceService roomPresenceService;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(roomPresenceService);
    }

    @Test
    void createsTrimmedMessageForJoinedParticipant() {
        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(3L, "session")).thenReturn(true);

        ChatMessage message = chatService.createMessage(
                3L, new ChatMessageRequest("  hello  "), principal, "session");

        assertThat(message.roomId()).isEqualTo(3L);
        assertThat(message.type()).isEqualTo("CHAT");
        assertThat(message.sender()).isEqualTo("nickname");
        assertThat(message.content()).isEqualTo("hello");
        assertThat(message.sentAt()).isNotNull();
    }

    @Test
    void rejectsAnonymousOrNonParticipant() {
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("hello"), null, "session"))
                .isInstanceOf(RoomWebSocketException.class);

        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(1L, "session")).thenReturn(false);
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("hello"), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void rejectsBlankAndMoreThanThreeHundredUnicodeCodePoints() {
        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(1L, "session")).thenReturn(true);

        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("   "), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("😀".repeat(301)), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
    }
}
