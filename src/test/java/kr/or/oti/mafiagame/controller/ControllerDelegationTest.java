package kr.or.oti.mafiagame.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.ChatMessageRequest;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.service.ChatService;
import kr.or.oti.mafiagame.service.RoomGameService;
import kr.or.oti.mafiagame.service.RoomPresenceService;

@ExtendWith(MockitoExtension.class)
class ControllerDelegationTest {
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private ChatService chatService;
    @Mock
    private RoomPresenceService roomPresenceService;
    @Mock
    private RoomGameService roomGameService;

    @Test
    void chatControllerPublishesServiceResultToRoomTopic() {
        ChatController controller = new ChatController(messagingTemplate, chatService);
        ChatMessageRequest request = new ChatMessageRequest("hello");
        Principal principal = () -> "player";
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create();
        headers.setSessionId("session");
        ChatMessage message = new ChatMessage(4L, "CHAT", "player", "hello", null);
        when(chatService.createMessage(4L, request, principal, "session")).thenReturn(message);

        controller.sendMessage(4L, request, headers, principal);

        verify(messagingTemplate).convertAndSend("/topic/rooms/4/chat", message);
    }

    @Test
    void presenceControllerDelegatesSessionAwareOperations() {
        RoomPresenceController controller = new RoomPresenceController(roomPresenceService, roomGameService);
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create();
        headers.setSessionId("session");
        Principal principal = () -> "player";
        RoomReadyRequest request = new RoomReadyRequest(true);
        RoomPresenceState joinedState = new RoomPresenceState(2L, List.of());
        when(roomPresenceService.join(2L, "session", principal, false)).thenReturn(joinedState);

        assertThat(controller.join(2L, headers, principal)).isEqualTo(joinedState);
        controller.updateReady(2L, request, headers);
        controller.sendRoomCounts();

        verify(roomPresenceService).join(2L, "session", principal, false);
        verify(roomPresenceService).updateReady(2L, "session", request);
        verify(roomPresenceService).broadcastRoomCounts();
    }

    @Test
    void presenceControllerStartsTheGameAfterPresenceTransition() {
        RoomPresenceController controller = new RoomPresenceController(roomPresenceService, roomGameService);
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create();
        headers.setSessionId("session");
        RoomPresenceState state = new RoomPresenceState(2L, List.of());
        when(roomPresenceService.startGame(2L, "session")).thenReturn(state);
        when(roomPresenceService.currentPrincipalNames(2L)).thenReturn(Map.of(10L, "host"));

        controller.startGame(2L, headers);

        verify(roomGameService).startGame(2L, state.participants(), Map.of(10L, "host"));
    }

    @Test
    void websocketExceptionsAreConvertedToErrorPayloads() {
        ChatController chatController = new ChatController(messagingTemplate, chatService);
        RoomPresenceController presenceController = new RoomPresenceController(roomPresenceService, roomGameService);
        var exception = new kr.or.oti.mafiagame.exception.RoomWebSocketException("failed");

        assertThat(chatController.handleRoomWebSocketException(exception).message()).isEqualTo("failed");
        assertThat(presenceController.handlePresenceException(exception).message()).isEqualTo("failed");
    }
}
