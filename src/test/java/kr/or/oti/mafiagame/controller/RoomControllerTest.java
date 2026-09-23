package kr.or.oti.mafiagame.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.mock.web.MockHttpSession;

import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomView;
import kr.or.oti.mafiagame.security.CustomUserDetails;
import kr.or.oti.mafiagame.service.RoomPresenceService;
import kr.or.oti.mafiagame.service.RoomService;

@ExtendWith(MockitoExtension.class)
class RoomControllerTest {
    @Mock
    private RoomService roomService;
    @Mock
    private RoomPresenceService roomPresenceService;

    private RoomController controller;

    @BeforeEach
    void setUp() {
        controller = new RoomController(roomService, roomPresenceService);
    }

    @Test
    void roomListOverlaysDatabaseCountWithLivePresenceCount() {
        RoomView room = room(1L, 5);
        when(roomService.getRooms()).thenReturn(List.of(room));
        when(roomPresenceService.currentCounts()).thenReturn(Map.of(1L, 2));
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller.roomList(model);

        assertThat(view).isEqualTo("rooms/list");
        @SuppressWarnings("unchecked")
        List<RoomView> rooms = (List<RoomView>) model.get("rooms");
        assertThat(rooms).singleElement().extracting(RoomView::players).isEqualTo(2);
        assertThat(model.get("onlinePlayerCount")).isEqualTo(2);
    }

    @Test
    void roomDetailUsesLiveParticipantsInsteadOfDatabaseMembers() {
        when(roomService.getRoomView(1L)).thenReturn(room(1L, 5));
        when(roomPresenceService.currentState(1L)).thenReturn(new RoomPresenceState(
                1L,
                List.of(
                        new RoomParticipant(10L, "one", true, false),
                        new RoomParticipant(11L, "two", false, true))));
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller.roomDetail(1L, null, new MockHttpSession(), model);

        assertThat(view).isEqualTo("rooms/detail");
        assertThat(model.get("members")).isEqualTo(List.of("one", "two"));
        assertThat(((RoomView) model.get("room")).players()).isEqualTo(2);
        verify(roomService, never()).getMemberNames(1L);
    }

    @Test
    void roomDetailDoesNotRenderStaleDatabaseMembersAndRedirectsMissingRoom() {
        when(roomService.getRoomView(1L)).thenReturn(room(1L, 1));
        when(roomPresenceService.currentState(1L)).thenReturn(null);
        ExtendedModelMap model = new ExtendedModelMap();

        assertThat(controller.roomDetail(1L, null, new MockHttpSession(), model)).isEqualTo("rooms/detail");
        assertThat(model.get("members")).isEqualTo(List.of());
        assertThat(((RoomView) model.get("room")).players()).isZero();
        verify(roomService, never()).getMemberNames(1L);

        when(roomService.getRoomView(404L)).thenReturn(null);
        assertThat(controller.roomDetail(404L, null, new MockHttpSession(), new ExtendedModelMap()))
                .isEqualTo("redirect:/rooms");
    }

    @Test
    void lockedRoomRequiresPasswordAndGrantsSessionAccess() {
        RoomView lockedRoom = new RoomView(2L, "locked", "description", "host", 1, 8, "WAITING", true);
        when(roomService.getRoomView(2L)).thenReturn(lockedRoom);
        MockHttpSession session = new MockHttpSession();

        assertThat(controller.roomDetail(2L, null, session, new ExtendedModelMap()))
                .isEqualTo("rooms/access");

        when(roomService.verifyRoomPassword(2L, "secret")).thenReturn(true);
        assertThat(controller.accessRoom(2L, "secret", session, new ExtendedModelMap()))
                .isEqualTo("redirect:/rooms/2");

        when(roomPresenceService.currentState(2L)).thenReturn(null);
        assertThat(controller.roomDetail(2L, null, session, new ExtendedModelMap()))
                .isEqualTo("rooms/detail");
    }

    @Test
    void roomHostCanReopenLockedRoomWithoutSessionPasswordGrant() {
        RoomView lockedRoom = new RoomView(2L, 40L, "locked", "description", "host", 1, 8, "WAITING", true);
        when(roomService.getRoomView(2L)).thenReturn(lockedRoom);
        when(roomPresenceService.currentState(2L)).thenReturn(null);
        CustomUserDetails host = new CustomUserDetails(User.builder()
                .userId(40L)
                .userName("host")
                .email("host@example.com")
                .password("encoded")
                .user_level(1)
                .build());

        ExtendedModelMap model = new ExtendedModelMap();
        assertThat(controller.roomDetail(2L, host, new MockHttpSession(), model))
                .isEqualTo("rooms/detail");
        assertThat(model.get("isHost")).isEqualTo(true);
    }

    private static RoomView room(long roomId, int players) {
        return new RoomView(roomId, "room", "description", "host", players, 8, "WAITING", false);
    }
}
