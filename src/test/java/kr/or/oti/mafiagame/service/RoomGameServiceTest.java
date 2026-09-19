package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.security.Principal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.dto.GameActionRequest;
import kr.or.oti.mafiagame.dto.GameInvestigationResult;
import kr.or.oti.mafiagame.dto.GameResult;
import kr.or.oti.mafiagame.dto.GameRole;
import kr.or.oti.mafiagame.dto.GameRoleAssignment;
import kr.or.oti.mafiagame.dto.RoomGameState;
import kr.or.oti.mafiagame.dto.RoomParticipant;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class RoomGameServiceTest {
    private static final long ROOM_ID = 1L;

    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private RoomPresenceService roomPresenceService;

    private RoomGameService gameService;

    @BeforeEach
    void setUp() {
        gameService = new RoomGameService(messagingTemplate, roomPresenceService);
    }

    @AfterEach
    void tearDown() {
        gameService.shutdownPhaseExecutor();
    }

    @Test
    void assignsRolesAndSendsEachRoleOnlyToItsPrincipal() {
        Map<Long, String> principalNames = Map.of(
                1L, "alice@example.com",
                2L, "bob@example.com",
                3L, "carol@example.com",
                4L, "dave@example.com");

        gameService.startGame(ROOM_ID, List.of(
                new RoomParticipant(1L, "alice", true, true),
                new RoomParticipant(2L, "bob", false, true),
                new RoomParticipant(3L, "carol", false, true),
                new RoomParticipant(4L, "dave", false, true)), principalNames);

        ArgumentCaptor<String> principalCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<GameRoleAssignment> roleCaptor =
                ArgumentCaptor.forClass(GameRoleAssignment.class);
        verify(messagingTemplate, times(4)).convertAndSendToUser(
                principalCaptor.capture(), eq("/queue/game-role"), roleCaptor.capture());

        assertThat(principalCaptor.getAllValues())
                .containsExactlyInAnyOrderElementsOf(principalNames.values());
        assertThat(roleCaptor.getAllValues())
                .extracting(GameRoleAssignment::role)
                .containsExactlyInAnyOrder("MAFIA", "DOCTOR", "POLICE", "CITIZEN");
        assertThat(roleCaptor.getAllValues())
                .allSatisfy(assignment -> assertThat(assignment.roomId()).isEqualTo(ROOM_ID));
    }

    @Test
    void resendsOnlyTheCurrentPlayersRoleWhenStateIsSynchronized() {
        Map<Long, String> principalNames = Map.of(
                1L, "alice@example.com",
                2L, "bob@example.com",
                3L, "carol@example.com",
                4L, "dave@example.com");
        gameService.startGame(ROOM_ID, List.of(
                new RoomParticipant(1L, "alice", true, true),
                new RoomParticipant(2L, "bob", false, true),
                new RoomParticipant(3L, "carol", false, true),
                new RoomParticipant(4L, "dave", false, true)), principalNames);
        clearInvocations(messagingTemplate);

        gameService.broadcastCurrentState(ROOM_ID, principal(2L, "bob"));

        verify(messagingTemplate).convertAndSendToUser(
                eq("bob@example.com"),
                eq("/queue/game-role"),
                any(GameRoleAssignment.class));
    }

    @Test
    void sendsEachPlayerTheirPrivateResultWithRoleAndAliveState() throws Exception {
        Map<Long, String> principalNames = Map.of(
                1L, "alice@example.com",
                2L, "bob@example.com",
                3L, "carol@example.com");
        gameService.startGame(ROOM_ID, participants(), principalNames);
        advanceCurrentPhase();
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advanceCurrentPhase();
        setRole(1L, GameRole.CITIZEN);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.CITIZEN);
        clearInvocations(messagingTemplate);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true));
        advanceCurrentPhase();

        ArgumentCaptor<GameResult> resultCaptor = ArgumentCaptor.forClass(GameResult.class);
        verify(messagingTemplate, times(3)).convertAndSendToUser(
                anyString(), eq("/queue/game-result"), resultCaptor.capture());
        assertThat(resultCaptor.getAllValues())
                .extracting(GameResult::role)
                .containsExactlyInAnyOrder("CITIZEN", "MAFIA", "CITIZEN");
        assertThat(resultCaptor.getAllValues())
                .filteredOn(result -> result.role().equals("MAFIA"))
                .singleElement()
                .satisfies(result -> {
                    assertThat(result.alive()).isFalse();
                    assertThat(result.winningFaction()).isEqualTo("CITIZEN");
                    assertThat(result.winningFactionLabel()).isEqualTo("시민 진영");
                });
        verify(roomPresenceService).resetAfterGame(ROOM_ID);
    }

    @Test
    void acceptsOnlyTheFirstNominationVoteFromEachUser() throws Exception {
        startNominationVote();

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(3L, null)))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(lastBroadcast(3).submittedVotes()).isEqualTo(1);
    }

    @Test
    void acceptsOnlyTheFirstExecutionVoteFromEachUser() throws Exception {
        startExecutionVote();

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true));

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(null, false)))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(lastBroadcast(5).submittedVotes()).isEqualTo(1);
    }

    @Test
    void rejectsExecutionVoteFromTheNominatedPlayer() throws Exception {
        startExecutionVote();

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(2L, "bob"), new GameActionRequest(null, true)))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("지목된 참가자는 처형 투표에 참여할 수 없습니다.");

        assertThat(latestPublicState().submittedVotes()).isEqualTo(0);
    }

    @Test
    void rejectsSelfNominationAndUnknownPlayers() throws Exception {
        startNominationVote();

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(1L, null)))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(999L, null)))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(999L, "outsider"), new GameActionRequest(2L, null)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void rejectsActionsOutsideVotingPhase() {
        gameService.startGame(ROOM_ID, participants());

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(2L, null)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted() throws Exception {
        startExecutionVote();
        setRole(1L, GameRole.CITIZEN);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.CITIZEN);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("FINISHED");
        assertThat(result.gameOver()).isTrue();
        assertThat(result.winningFaction()).isEqualTo("CITIZEN");
        assertThat(result.message()).isEqualTo("시민 진영 승리!");
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(null, true)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction() throws Exception {
        startExecutionVote();
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.MAFIA);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("FINISHED");
        assertThat(result.gameOver()).isTrue();
        assertThat(result.winningFaction()).isEqualTo("MAFIA");
        assertThat(result.message()).isEqualTo("마피아 진영 승리!");
    }

    @Test
    void keepsTheGameGoingWhenMafiaAndCitizenFactionAreEven() throws Exception {
        startExecutionVote(nightParticipants());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.MAFIA);
        setRole(4L, GameRole.CITIZEN);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, false));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("NIGHT");
        assertThat(result.gameOver()).isFalse();
        assertThat(result.winningFaction()).isNull();
    }

    @Test
    void checksForVictoryAgainAfterNightProcessing() throws Exception {
        startExecutionVote();
        setRole(1L, GameRole.CITIZEN);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.MAFIA);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, false));
        advanceCurrentPhase();
        setAlive(3L, false);
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("FINISHED");
        assertThat(result.gameOver()).isTrue();
        assertThat(result.winningFaction()).isEqualTo("CITIZEN");
    }

    @Test
    void appliesMafiaKillAndDoctorProtectionDuringNight() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        clearInvocations(messagingTemplate);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(3L, "carol"),
                new GameActionRequest(2L, null, "DOCTOR_PROTECT"));
        gameService.submitAction(ROOM_ID, principal(4L, "dave"),
                new GameActionRequest(1L, null, "POLICE_INVESTIGATE"));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(result.message()).contains("의사의 보호");
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 2L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isTrue());

        ArgumentCaptor<GameInvestigationResult> investigationCaptor =
                ArgumentCaptor.forClass(GameInvestigationResult.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq("dave@example.com"),
                eq("/queue/night-result"),
                investigationCaptor.capture());
        assertThat(investigationCaptor.getValue().targetUserId()).isEqualTo(1L);
        assertThat(investigationCaptor.getValue().faction()).isEqualTo("MAFIA");
        assertThat(investigationCaptor.getValue().factionLabel()).isEqualTo("마피아");
    }

    @Test
    void endsSixPlayerGameAfterBothMafiaAreExecutedByMajorityVotes() throws Exception {
        assertThatAllMafiaCanBeExecutedByMajority(6);
    }

    @Test
    void endsEightPlayerGameAfterBothMafiaAreExecutedByMajorityVotes() throws Exception {
        assertThatAllMafiaCanBeExecutedByMajority(8);
    }

    @Test
    void sendsCitizenInvestigationResultOnlyToTheInvestigatingPolice() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        clearInvocations(messagingTemplate);

        gameService.submitAction(ROOM_ID, principal(4L, "dave"),
                new GameActionRequest(2L, null, "POLICE_INVESTIGATE"));

        ArgumentCaptor<GameInvestigationResult> investigationCaptor =
                ArgumentCaptor.forClass(GameInvestigationResult.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq("dave@example.com"),
                eq("/queue/night-result"),
                investigationCaptor.capture());
        assertThat(investigationCaptor.getValue().targetUserId()).isEqualTo(2L);
        assertThat(investigationCaptor.getValue().faction()).isEqualTo("CITIZEN");
        assertThat(investigationCaptor.getValue().factionLabel()).isEqualTo("시민");
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                anyString(), eq("/queue/night-result"), any(GameInvestigationResult.class));
    }

    @Test
    void keepsMafiaTargetAliveAndReportsNoNightDeathWhenDoctorProtectsThatTarget() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(3L, "carol"),
                new GameActionRequest(2L, null, "DOCTOR_PROTECT"));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(result.message()).contains("의사의 보호");
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 2L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isTrue());
    }

    @Test
    void appliesMafiaKillWhenNoDoctorProtectionIsSubmitted() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null, "MAFIA_KILL"));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 2L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isFalse());
    }

    @Test
    void validatesNightActionRoleTargetAndDuplicateSubmission() throws Exception {
        startNightVote(nightParticipants(), Map.of());
        setRole(1L, GameRole.CITIZEN);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(1L, "alice"),
                new GameActionRequest(2L, null, "MAFIA_KILL")))
                .isInstanceOf(RoomWebSocketException.class);

        gameService.submitAction(ROOM_ID, principal(2L, "bob"),
                new GameActionRequest(1L, null, "MAFIA_KILL"));
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(2L, "bob"),
                new GameActionRequest(3L, null, "MAFIA_KILL")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(4L, "dave"),
                new GameActionRequest(1L, null, "DOCTOR_PROTECT")))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.CITIZEN);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(3L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(2L, "bob"),
                new GameActionRequest(4L, null, "MAFIA_KILL"));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 3L || player.userId() == 4L)
                .extracting(player -> player.alive())
                .containsExactlyInAnyOrder(true, false);
    }

    private void startNominationVote() throws Exception {
        startNominationVote(participants());
    }

    private void startNominationVote(List<RoomParticipant> gameParticipants) throws Exception {
        gameService.startGame(ROOM_ID, gameParticipants);
        advanceCurrentPhase();
    }

    private void startExecutionVote() throws Exception {
        startExecutionVote(participants());
    }

    private void startExecutionVote(List<RoomParticipant> gameParticipants) throws Exception {
        startNominationVote(gameParticipants);
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advanceCurrentPhase();
    }

    private void startNightVote(
            List<RoomParticipant> gameParticipants,
            Map<Long, String> principalNames) throws Exception {
        gameService.startGame(ROOM_ID, gameParticipants, principalNames);
        advanceCurrentPhase();
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advanceCurrentPhase();
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, false));
        advanceCurrentPhase();
    }

        private void assertThatAllMafiaCanBeExecutedByMajority(int playerCount) throws Exception {
                List<RoomParticipant> gameParticipants = participantsForCount(playerCount);
                gameService.startGame(ROOM_ID, gameParticipants, principalNamesForCount(playerCount));
                setRole(1L, GameRole.MAFIA);
                setRole(2L, GameRole.MAFIA);
                for (long userId = 3L; userId <= playerCount; userId++) {
                        setRole(userId, userId == 3L ? GameRole.DOCTOR
                                        : userId == 4L ? GameRole.POLICE : GameRole.CITIZEN);
                }

                advanceCurrentPhase();
                submitNominationAndMajorityExecution(1L, 2L, playerCount);
                advanceCurrentPhase();
                advanceCurrentPhase();
                assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
                assertThat(latestPublicState().gameOver()).isFalse();

                advanceCurrentPhase();
                submitNominationAndMajorityExecution(3L, 1L, playerCount);

                RoomGameState result = latestPublicState();
                assertThat(result.phase()).isEqualTo("FINISHED");
                assertThat(result.gameOver()).isTrue();
                assertThat(result.winningFaction()).isEqualTo("CITIZEN");
        }

        private void submitNominationAndMajorityExecution(
                        long nominatorId, long nomineeId, int playerCount) throws Exception {
                gameService.submitAction(ROOM_ID, principal(nominatorId, "user" + nominatorId),
                                new GameActionRequest(nomineeId, null));
                advanceCurrentPhase();

                for (long userId = 1L; userId <= playerCount; userId++) {
                        if (userId != nomineeId) {
                                gameService.submitAction(ROOM_ID, principal(userId, "user" + userId),
                                                new GameActionRequest(null, true));
                        }
                }
                advanceCurrentPhase();
        }

        private static List<RoomParticipant> participantsForCount(int playerCount) {
                List<RoomParticipant> participants = new java.util.ArrayList<>();
                for (int index = 1; index <= playerCount; index++) {
                        participants.add(new RoomParticipant(index, "user" + index, index == 1, true));
                }
                return participants;
        }

        private static Map<Long, String> principalNamesForCount(int playerCount) {
                Map<Long, String> principalNames = new java.util.HashMap<>();
                for (int index = 1; index <= playerCount; index++) {
                        principalNames.put((long) index, "user" + index + "@example.com");
                }
                return principalNames;
        }

    private void advanceCurrentPhase() throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field phaseEndsAt = game.getClass().getDeclaredField("phaseEndsAt");
        phaseEndsAt.setAccessible(true);
        phaseEndsAt.setLong(game, 0L);

        Method advancePhase = RoomGameService.class.getDeclaredMethod("advancePhase", long.class);
        advancePhase.setAccessible(true);
        advancePhase.invoke(gameService, ROOM_ID);
    }

    @SuppressWarnings("unchecked")
    private Map<Long, ?> gamesByRoom() throws Exception {
        Field gamesByRoom = RoomGameService.class.getDeclaredField("gamesByRoom");
        gamesByRoom.setAccessible(true);
        return (Map<Long, ?>) gamesByRoom.get(gameService);
    }

    private RoomGameState lastBroadcast(int invocationCount) {
        ArgumentCaptor<RoomGameState> captor = ArgumentCaptor.forClass(RoomGameState.class);
        verify(messagingTemplate, times(invocationCount))
                .convertAndSend(anyString(), captor.capture());
        return captor.getAllValues().get(captor.getAllValues().size() - 1);
    }

    private RoomGameState latestPublicState() {
        ArgumentCaptor<RoomGameState> captor = ArgumentCaptor.forClass(RoomGameState.class);
        verify(messagingTemplate, atLeastOnce())
                .convertAndSend(anyString(), captor.capture());
        List<RoomGameState> states = captor.getAllValues();
        return states.get(states.size() - 1);
    }

    private void setRole(long userId, GameRole role) throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field playersField = game.getClass().getDeclaredField("players");
        playersField.setAccessible(true);
        Map<?, ?> players = (Map<?, ?>) playersField.get(game);
        Object player = players.get(userId);
        Field roleField = player.getClass().getDeclaredField("role");
        roleField.setAccessible(true);
        roleField.set(player, role);
    }

    private void setAlive(long userId, boolean alive) throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field playersField = game.getClass().getDeclaredField("players");
        playersField.setAccessible(true);
        Map<?, ?> players = (Map<?, ?>) playersField.get(game);
        Object player = players.get(userId);
        Field aliveField = player.getClass().getDeclaredField("alive");
        aliveField.setAccessible(true);
        aliveField.setBoolean(player, alive);
    }

    private static List<RoomParticipant> participants() {
        return List.of(
                new RoomParticipant(1L, "alice", true, true),
                new RoomParticipant(2L, "bob", false, true),
                new RoomParticipant(3L, "carol", false, true));
    }

    private static List<RoomParticipant> nightParticipants() {
        return List.of(
                new RoomParticipant(1L, "alice", true, true),
                new RoomParticipant(2L, "bob", false, true),
                new RoomParticipant(3L, "carol", false, true),
                new RoomParticipant(4L, "dave", false, true));
    }

    private static Map<Long, String> principalNamesForFourPlayers() {
        return Map.of(
                1L, "alice@example.com",
                2L, "bob@example.com",
                3L, "carol@example.com",
                4L, "dave@example.com");
    }

    private static Principal principal(long userId, String nickname) {
        User user = User.builder()
                .userId(userId)
                .userName(nickname)
                .email(nickname + "@example.com")
                .password("encoded")
                .user_level(1)
                .build();
        CustomUserDetails details = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(
                details, details.getPassword(), details.getAuthorities());
    }
}
