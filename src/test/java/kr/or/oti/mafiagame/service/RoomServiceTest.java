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
import kr.or.oti.mafiagame.service.RoomService.RoomCreationException;

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
    void verifiesNormalizedRoomPasswordAgainstStoredHash() {
        when(roomMapper.findPasswordHash(1L)).thenReturn("encoded");
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);

        assertThat(roomService.verifyRoomPassword(1L, " secret ")).isTrue();
        assertThat(roomService.verifyRoomPassword(1L, "   ")).isFalse();
        verify(passwordEncoder).matches("secret", "encoded");
    }
}
