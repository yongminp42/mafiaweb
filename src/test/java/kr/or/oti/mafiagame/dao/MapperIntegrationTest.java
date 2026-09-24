package kr.or.oti.mafiagame.dao;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;

import kr.or.oti.mafiagame.domain.Room;
import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.domain.UserStats;
import kr.or.oti.mafiagame.dto.GameFaction;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.service.GameResultStatsService;

@MybatisTest
@Import(GameResultStatsService.class)
class MapperIntegrationTest {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RoomMapper roomMapper;
    @Autowired
    private GameResultStatsService gameResultStatsService;

    @Test
    void userMapperPersistsAndQueriesUserAndStats() {
        User user = newUser("user@example.com", "player");

        assertThat(userMapper.insert(user)).isEqualTo(1);
        assertThat(user.getUserId()).isPositive();
        assertThat(userMapper.insertStats(user.getUserId())).isEqualTo(1);

        assertThat(userMapper.existsByEmail("user@example.com")).isTrue();
        assertThat(userMapper.findByEmail("user@example.com"))
                .hasValueSatisfying(found -> assertThat(found.getUserName()).isEqualTo("player"));
        UserStats stats = userMapper.findStatsByUserId(user.getUserId());
        assertThat(stats.getTotalGames()).isZero();
        assertThat(stats.getWins()).isZero();
        assertThat(stats.getLosses()).isZero();
        assertThat(stats.getRating()).isEqualTo(UserStats.DEFAULT_RATING);
    }

    @Test
    void completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed() {
        User winner = insertUser("winner@example.com", "winner");
        User loser = insertUser("loser@example.com", "loser");
        String gameId = java.util.UUID.randomUUID().toString();
        var outcomes = java.util.List.of(
                new GameResultStatsService.PlayerOutcome(winner.getUserId(), true),
                new GameResultStatsService.PlayerOutcome(loser.getUserId(), false));

        gameResultStatsService.recordCompletedGame(gameId, 77L, GameFaction.CITIZEN, outcomes);
        gameResultStatsService.recordCompletedGame(gameId, 77L, GameFaction.CITIZEN, outcomes);

        assertThat(userMapper.gameCompletionExists(gameId)).isTrue();
        assertThat(userMapper.findStatsByUserId(winner.getUserId()).getTotalGames()).isEqualTo(1);
        assertThat(userMapper.findStatsByUserId(winner.getUserId()).getWins()).isEqualTo(1);
        assertThat(userMapper.findStatsByUserId(winner.getUserId()).getLosses()).isZero();
        assertThat(userMapper.findStatsByUserId(loser.getUserId()).getTotalGames()).isEqualTo(1);
        assertThat(userMapper.findStatsByUserId(loser.getUserId()).getWins()).isZero();
        assertThat(userMapper.findStatsByUserId(loser.getUserId()).getLosses()).isEqualTo(1);
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

        assertThat(roomMapper.updateStatus(room.getRoomId(), "PLAYING")).isEqualTo(1);
        assertThat(roomMapper.resetStatusToWaiting(room.getRoomId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId()).getStatus()).isEqualTo("WAITING");

        assertThat(roomMapper.deleteMembersByRoomId(room.getRoomId())).isEqualTo(2);
        assertThat(roomMapper.deleteById(room.getRoomId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId())).isNull();
    }

    @Test
    void interruptedGameRecoveryResetsOnlyRoomsThatArePlaying() {
        User host = insertUser("recovery-host@example.com", "recovery-host");
        Room playingRoom = newRoom(host.getUserId(), "interrupted", "PLAYING");
        Room waitingRoom = newRoom(host.getUserId(), "waiting", "WAITING");
        roomMapper.insert(playingRoom);
        roomMapper.insert(waitingRoom);
        roomMapper.insertMember(playingRoom.getRoomId(), host.getUserId());
        roomMapper.insertMember(waitingRoom.getRoomId(), host.getUserId());

        assertThat(roomMapper.resetInterruptedGamesToWaiting()).isEqualTo(1);

        assertThat(roomMapper.findById(playingRoom.getRoomId()).getStatus()).isEqualTo("WAITING");
        assertThat(roomMapper.findById(waitingRoom.getRoomId()).getStatus()).isEqualTo("WAITING");
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

    private static Room newRoom(long hostUserId, String title, String status) {
        return Room.builder()
                .hostUserId(hostUserId)
                .title(title)
                .maxPlayers(4)
                .status(status)
                .build();
    }
}
