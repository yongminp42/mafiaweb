package kr.or.oti.mafiagame.dao;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;

import kr.or.oti.mafiagame.domain.Room;
import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.dto.RoomSummary;

@MybatisTest
class MapperIntegrationTest {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RoomMapper roomMapper;

    @Test
    void userMapperPersistsAndQueriesUserAndStats() {
        User user = newUser("user@example.com", "player");

        assertThat(userMapper.insert(user)).isEqualTo(1);
        assertThat(user.getUserId()).isPositive();
        assertThat(userMapper.insertStats(user.getUserId())).isEqualTo(1);

        assertThat(userMapper.existsByEmail("user@example.com")).isTrue();
        assertThat(userMapper.findByEmail("user@example.com"))
                .hasValueSatisfying(found -> assertThat(found.getUserName()).isEqualTo("player"));
        assertThat(userMapper.findStatsByUserId(user.getUserId()).getTotalGames()).isZero();
    }

    @Test
    void roomMapperPersistsListsTransfersAndDeletesRoom() {
        User host = insertUser("host@example.com", "host");
        User guest = insertUser("guest@example.com", "guest");
        Room room = Room.builder()
                .hostUserId(host.getUserId())
                .title("test room")
                .roomPassword("encoded-room-password")
                .maxPlayers(6)
                .status("WAITING")
                .build();

        assertThat(roomMapper.insert(room)).isEqualTo(1);
        assertThat(roomMapper.insertMember(room.getRoomId(), host.getUserId())).isEqualTo(1);
        assertThat(roomMapper.insertMember(room.getRoomId(), guest.getUserId())).isEqualTo(1);

        RoomSummary summary = roomMapper.findById(room.getRoomId());
        assertThat(summary.getTitle()).isEqualTo("test room");
        assertThat(summary.getCurrentPlayers()).isEqualTo(2);
        assertThat(roomMapper.findMemberNames(room.getRoomId())).containsExactly("host", "guest");
        assertThat(roomMapper.findAll()).extracting(RoomSummary::getRoomId).contains(room.getRoomId());

        assertThat(roomMapper.updateHostUserId(room.getRoomId(), guest.getUserId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId()).getHostUserId()).isEqualTo(guest.getUserId());
        assertThat(roomMapper.findPasswordHash(room.getRoomId())).isEqualTo("encoded-room-password");

        assertThat(roomMapper.deleteMembersByRoomId(room.getRoomId())).isEqualTo(2);
        assertThat(roomMapper.deleteById(room.getRoomId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId())).isNull();
    }

    private User insertUser(String email, String nickname) {
        User user = newUser(email, nickname);
        userMapper.insert(user);
        return user;
    }

    private static User newUser(String email, String nickname) {
        return User.builder()
                .email(email)
                .password("encoded")
                .userName(nickname)
                .user_level(1)
                .build();
    }
}
