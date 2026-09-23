package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import kr.or.oti.mafiagame.dao.RoomMapper;
import kr.or.oti.mafiagame.domain.Room;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.service.RoomService.RoomCreationException;
import kr.or.oti.mafiagame.service.RoomService.RoomSettingsException;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {
    @Mock
    private RoomMapper roomMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    private RoomService roomService;

    @BeforeEach
    void setUp() {
        roomService = new RoomService(roomMapper, passwordEncoder);
    }

    @Test
    void createsRoomWithNormalizedValuesAndEncodedPassword() {
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(roomMapper.insert(any(Room.class))).thenAnswer(invocation -> {
            invocation.<Room>getArgument(0).setRoomId(7L);
            return 1;
        });
        when(roomMapper.insertMember(7L, 10L)).thenReturn(1);

        long roomId = roomService.createRoom(10L, "  test room  ", 6, " secret ");

        assertThat(roomId).isEqualTo(7L);
        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomMapper).insert(roomCaptor.capture());
        assertThat(roomCaptor.getValue().getTitle()).isEqualTo("test room");
        assertThat(roomCaptor.getValue().getRoomPassword()).isEqualTo("encoded-secret");
        assertThat(roomCaptor.getValue().getStatus()).isEqualTo("WAITING");
        verify(roomMapper).insertMember(7L, 10L);
    }

    @Test
    void createsUnlockedRoomWithoutEncodingEmptyPassword() {
        when(roomMapper.insert(any(Room.class))).thenAnswer(invocation -> {
            invocation.<Room>getArgument(0).setRoomId(8L);
            return 1;
        });
        when(roomMapper.insertMember(8L, 10L)).thenReturn(1);

        roomService.createRoom(10L, "room", 4, "  ");

        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomMapper).insert(roomCaptor.capture());
        assertThat(roomCaptor.getValue().getRoomPassword()).isNull();
    }

    @Test
    void validatesRoomInputAndMapperResults() {
        assertThatThrownBy(() -> roomService.createRoom(1L, "x", 4, null))
                .isInstanceOf(RoomCreationException.class);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 3, null))
                .isInstanceOf(RoomCreationException.class);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 4, "123"))
                .isInstanceOf(RoomCreationException.class);

        when(roomMapper.insert(any(Room.class))).thenReturn(0);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 4, null))
                .isInstanceOf(RoomCreationException.class);
    }

    @Test
    void transferHostRequiresExactlyOneUpdatedRoom() {
        when(roomMapper.updateHostUserId(1L, 2L)).thenReturn(0);

        assertThatThrownBy(() -> roomService.transferHost(1L, 2L))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void updatesWaitingRoomSettingsAndKeepsExistingPasswordWhenBlank() {
        RoomSummary room = room(7L, 10L, "WAITING", true);
        when(roomMapper.findById(7L)).thenReturn(room);
        when(roomMapper.findPasswordHash(7L)).thenReturn("encoded-old");
        when(roomMapper.updateSettings(7L, 7, "encoded-old")).thenReturn(1);

        roomService.updateRoomSettings(7L, 10L, 7, true, "  ", 4);

        verify(roomMapper).findPasswordHash(7L);
        verify(roomMapper).updateSettings(7L, 7, "encoded-old");
    }

    @Test
    void updatesPasswordAndRejectsInvalidRoomSettings() {
        RoomSummary room = room(8L, 10L, "WAITING", false);
        when(roomMapper.findById(8L)).thenReturn(room);
        when(passwordEncoder.encode("new-secret")).thenReturn("encoded-new");
        when(roomMapper.updateSettings(8L, 6, "encoded-new")).thenReturn(1);

        roomService.updateRoomSettings(8L, 10L, 6, true, " new-secret ", 4);

        verify(passwordEncoder).encode("new-secret");
        verify(roomMapper).updateSettings(8L, 6, "encoded-new");

        assertThatThrownBy(() -> roomService.updateRoomSettings(8L, 11L, 6, true, "secret", 4))
                .isInstanceOf(RoomSettingsException.class);
        assertThatThrownBy(() -> roomService.updateRoomSettings(8L, 10L, 4, false, null, 5))
                .isInstanceOf(RoomSettingsException.class);
        assertThatThrownBy(() -> roomService.updateRoomSettings(8L, 10L, 3, false, null, 4))
                .isInstanceOf(RoomSettingsException.class);
        assertThatThrownBy(() -> roomService.updateRoomSettings(8L, 10L, 4, true, "123", 4))
                .isInstanceOf(RoomSettingsException.class);
    }

    @Test
    void rejectsACapacityBelowTheCurrentParticipantCountBeforeUpdating() {
        RoomSummary room = room(9L, 10L, "WAITING", false);
        when(roomMapper.findById(9L)).thenReturn(room);

        assertThatThrownBy(() -> roomService.updateRoomSettings(9L, 10L, 4, false, null, 5))
                .isInstanceOf(RoomSettingsException.class)
                .hasMessage("현재 참가자 수보다 적은 인원으로 설정할 수 없어요.");
    }

    @Test
    void removesAnExistingPasswordWhenPasswordProtectionIsDisabled() {
        RoomSummary room = room(10L, 10L, "WAITING", true);
        when(roomMapper.findById(10L)).thenReturn(room);
        when(roomMapper.updateSettings(10L, 6, null)).thenReturn(1);

        roomService.updateRoomSettings(10L, 10L, 6, false, null, 2);

        verify(roomMapper).updateSettings(10L, 6, null);
    }

    @Test
    void resetsPlayingRoomToWaiting() {
        when(roomMapper.resetStatusToWaiting(1L)).thenReturn(1);

        assertThat(roomService.resetGameToWaiting(1L)).isTrue();

        verify(roomMapper).resetStatusToWaiting(1L);
    }

    @Test
    void verifiesNormalizedRoomPasswordAgainstStoredHash() {
        when(roomMapper.findPasswordHash(1L)).thenReturn("encoded");
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);

        assertThat(roomService.verifyRoomPassword(1L, " secret ")).isTrue();
        assertThat(roomService.verifyRoomPassword(1L, "   ")).isFalse();
        verify(passwordEncoder).matches("secret", "encoded");
    }

    private static RoomSummary room(long roomId, long hostUserId, String status, boolean locked) {
        RoomSummary room = new RoomSummary();
        room.setRoomId(roomId);
        room.setHostUserId(hostUserId);
        room.setStatus(status);
        room.setLocked(locked);
        room.setMaxPlayers(8);
        return room;
    }
}
