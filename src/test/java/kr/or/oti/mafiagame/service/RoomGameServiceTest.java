package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

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
import kr.or.oti.mafiagame.dto.ChatChannel;
import kr.or.oti.mafiagame.dto.ChatMessage;
import kr.or.oti.mafiagame.dto.GameActionRequest;
import kr.or.oti.mafiagame.dto.GameInvestigationResult;
import kr.or.oti.mafiagame.dto.GamePhase;
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
    void assignsExactRoleCountsAtTheSupportedPlayerBoundaries() {
        for (int playerCount : List.of(4, 5, 6, 8)) {
            clearInvocations(messagingTemplate);

            gameService.startGame(
                    ROOM_ID,
                    participantsForCount(playerCount),
                    principalNamesForCount(playerCount));

            ArgumentCaptor<GameRoleAssignment> roleCaptor =
                    ArgumentCaptor.forClass(GameRoleAssignment.class);
            verify(messagingTemplate, times(playerCount)).convertAndSendToUser(
                    anyString(), eq("/queue/game-role"), roleCaptor.capture());

            List<String> roles = roleCaptor.getAllValues().stream()
                    .map(GameRoleAssignment::role)
                    .toList();
            int expectedMafiaCount = playerCount >= 6 ? 2 : 1;
            assertThat(roles).hasSize(playerCount);
            assertThat(roles.stream().filter("MAFIA"::equals).toList())
                    .hasSize(expectedMafiaCount);
            assertThat(roles.stream().filter("DOCTOR"::equals).toList()).hasSize(1);
            assertThat(roles.stream().filter("POLICE"::equals).toList()).hasSize(1);
            assertThat(roles.stream().filter("CITIZEN"::equals).toList())
                    .hasSize(playerCount - expectedMafiaCount - 2);
        }
    }

    @Test
    void confirmsRolesPrivatelyAndStartsDayWhenEveryLivingPlayerConfirms() {
        gameService.startGame(ROOM_ID, nightParticipants(), principalNamesForFourPlayers());
        RoomGameState initial = latestPublicState();
        assertThat(initial.phase()).isEqualTo("ROLE_ASSIGNMENT");
        assertThat(initial.phaseEndsAt() - System.currentTimeMillis()).isBetween(13_000L, 15_000L);
        assertThat(initial.players()).allSatisfy(player -> assertThat(player.role()).isNull());

        assertThatThrownBy(() -> gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null)))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("역할을 확인해 주세요.");
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 1L, ChatChannel.PUBLIC))
                .isInstanceOf(RoomWebSocketException.class);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, null, "ROLE_CONFIRM"));
        assertThat(latestPublicState().submittedVotes()).isEqualTo(1);
        clearInvocations(messagingTemplate);
        gameService.broadcastCurrentState(ROOM_ID, principal(1L, "alice"));
        ArgumentCaptor<GameRoleAssignment> confirmation =
                ArgumentCaptor.forClass(GameRoleAssignment.class);
        verify(messagingTemplate).convertAndSendToUser(
                eq("alice@example.com"), eq("/queue/game-role"), confirmation.capture());
        assertThat(confirmation.getValue().confirmed()).isTrue();
        assertThatThrownBy(() -> gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, null, "ROLE_CONFIRM")))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("이미 역할을 확인했습니다.");

        for (long userId = 2L; userId <= 4L; userId++) {
            String nickname = switch ((int) userId) {
                case 2 -> "bob";
                case 3 -> "carol";
                default -> "dave";
            };
            gameService.submitAction(ROOM_ID, principal(userId, nickname),
                    new GameActionRequest(null, null, "ROLE_CONFIRM"));
        }
        assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
    }

    @Test
    void startsDayWhenTheRoleConfirmationTimerExpiresInRealTime() throws Exception {
        long startedAt = System.currentTimeMillis();
        gameService.startGame(ROOM_ID, nightParticipants(), principalNamesForFourPlayers());

        long deadline = startedAt + 30_000L;
        while ("ROLE_ASSIGNMENT".equals(currentPhase())
                && System.currentTimeMillis() < deadline) {
            Thread.sleep(100L);
        }

        assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(System.currentTimeMillis() - startedAt).isGreaterThanOrEqualTo(13_000L);
    }

    @Test
    void usesTheMvpServerDurationsForEveryTimedPhase() {
        assertThat(GamePhase.ROLE_ASSIGNMENT.durationSeconds()).isEqualTo(15L);
        assertThat(GamePhase.DAY_DISCUSSION.durationSeconds()).isEqualTo(60L);
        assertThat(GamePhase.NOMINATION_VOTE.durationSeconds()).isEqualTo(20L);
        assertThat(GamePhase.FINAL_DEFENSE.durationSeconds()).isEqualTo(20L);
        assertThat(GamePhase.EXECUTION_VOTE.durationSeconds()).isEqualTo(20L);
        assertThat(GamePhase.NIGHT.durationSeconds()).isEqualTo(35L);
    }

    @Test
    void broadcastsSystemGuidanceWhenAGamePhaseStarts() throws Exception {
        gameService.startGame(ROOM_ID, nightParticipants(), principalNamesForFourPlayers());

        ArgumentCaptor<ChatMessage> initialMessage = ArgumentCaptor.forClass(ChatMessage.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/rooms/1/chat"), initialMessage.capture());
        assertThat(initialMessage.getValue().type()).isEqualTo("SYSTEM");
        assertThat(initialMessage.getValue().content())
                .contains("역할 확인")
                .contains("역할 확인 완료");

        clearInvocations(messagingTemplate);
        advancePhaseOnce();

        ArgumentCaptor<ChatMessage> dayMessage = ArgumentCaptor.forClass(ChatMessage.class);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/rooms/1/chat"), dayMessage.capture());
        assertThat(dayMessage.getValue().type()).isEqualTo("SYSTEM");
        assertThat(dayMessage.getValue().content())
                .contains("낮 토론")
                .contains("지목 투표");
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

        assertThat(latestPublicState().submittedVotes()).isEqualTo(1);
    }

    @Test
    void acceptsOnlyTheFirstExecutionVoteFromEachUser() throws Exception {
        startExecutionVote();

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true));

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(null, false)))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(latestPublicState().submittedVotes()).isEqualTo(1);
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
    void rejectsNominationVoteFromADeadPlayer() throws Exception {
        startNominationVote(nightParticipants());
        setAlive(1L, false);

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(1L, "alice"),
                new GameActionRequest(2L, null)))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("사망한 참가자는 행동할 수 없습니다.");
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
    void skipsExecutionWhenNominationVotesAreTied() throws Exception {
        startNominationVote(nightParticipants());

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        gameService.submitAction(ROOM_ID, principal(2L, "bob"),
                new GameActionRequest(1L, null));
        gameService.submitAction(ROOM_ID, principal(3L, "carol"),
                new GameActionRequest(4L, null));
        gameService.submitAction(ROOM_ID, principal(4L, "dave"),
                new GameActionRequest(3L, null));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("NIGHT");
        assertThat(result.nominatedUserId()).isNull();
        assertThat(result.gameOver()).isFalse();
    }

    @Test
    void skipsExecutionWhenNoNominationVotesAreSubmitted() throws Exception {
        startNominationVote(nightParticipants());
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("NIGHT");
        assertThat(result.nominatedUserId()).isNull();
        assertThat(result.gameOver()).isFalse();
    }

    @Test
    void givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting() throws Exception {
        startNominationVote(nightParticipants());
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advancePhaseOnce();

        RoomGameState defense = latestPublicState();
        assertThat(defense.phase()).isEqualTo("FINAL_DEFENSE");
        assertThat(defense.nominatedUserId()).isEqualTo(2L);
        assertThat(defense.phaseEndsAt() - System.currentTimeMillis()).isBetween(18_000L, 20_000L);
        assertThatCode(() -> gameService.validateChat(ROOM_ID, 2L, ChatChannel.PUBLIC))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 1L, ChatChannel.PUBLIC))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessageContaining("최종 변론");
        assertThatThrownBy(() -> gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, true)))
                .isInstanceOf(RoomWebSocketException.class);

        advancePhaseOnce();
        assertThat(latestPublicState().phase()).isEqualTo("EXECUTION_VOTE");
        assertThatThrownBy(() -> gameService.submitAction(ROOM_ID, principal(2L, "bob"),
                new GameActionRequest(null, true)))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessageContaining("지목된 참가자");
    }

    @Test
    void skipsExecutionWhenTheDefendantLeavesDuringFinalDefense() throws Exception {
        startNominationVote(nightParticipants());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advancePhaseOnce();
        assertThat(latestPublicState().phase()).isEqualTo("FINAL_DEFENSE");

        gameService.handlePlayerDeparture(ROOM_ID, 2L);

        assertThat(latestPublicState().phase()).isEqualTo("NIGHT");
        assertThat(isAlive(2L)).isFalse();
    }

    @Test
    void rejectsActionsOutsideVotingPhase() {
        gameService.startGame(ROOM_ID, participants());

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID, principal(1L, "alice"), new GameActionRequest(2L, null)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void rejectsActionAtTheServerDeadlineAndStillAdvancesThePhase() throws Exception {
        startExecutionVote(nightParticipants());
        expireCurrentPhase();

        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(2L, "bob"),
                new GameActionRequest(null, true)))
                .isInstanceOf(RoomWebSocketException.class);

        advanceCurrentPhase();

        assertThat(latestPublicState().phase()).isEqualTo("NIGHT");
    }

    @Test
    void countsOnlyOneOfTwoConcurrentVotesFromTheSamePlayer() throws Exception {
        startNominationVote(nightParticipants());
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> first = executor.submit(() -> submitVoteAfter(start, 2L));
            Future<Boolean> second = executor.submit(() -> submitVoteAfter(start, 3L));
            start.countDown();

            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(true, false);
            assertThat(latestPublicState().submittedVotes()).isEqualTo(1);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rejectsConcurrentRequestsAfterTheServerDeadline() throws Exception {
        startNominationVote(nightParticipants());
        expireCurrentPhase();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> first = executor.submit(() -> submitVoteAfter(start, 2L));
            Future<Boolean> second = executor.submit(() -> submitVoteAfter(start, 3L));
            start.countDown();

            assertThat(List.of(first.get(), second.get())).containsExactly(false, false);
            advanceCurrentPhase();
            assertThat(latestPublicState().phase()).isEqualTo("NIGHT");
            assertThat(latestPublicState().nominatedUserId()).isNull();
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void enforcesNightChatPermissionsByRoleAndAliveState() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);

        assertThatCode(() -> gameService.validateChat(ROOM_ID, 1L, ChatChannel.MAFIA))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 1L, ChatChannel.PUBLIC))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 2L, ChatChannel.PUBLIC))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 4L, ChatChannel.MAFIA))
                .isInstanceOf(RoomWebSocketException.class);

        setAlive(2L, false);
        assertThatCode(() -> gameService.validateChat(ROOM_ID, 2L, ChatChannel.PUBLIC))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> gameService.validateChat(ROOM_ID, 2L, ChatChannel.MAFIA))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void routesDeadChatOnlyToDeadPlayers() throws Exception {
        gameService.startGame(
                ROOM_ID,
                nightParticipants(),
                principalNamesForFourPlayers());
        setAlive(2L, false);
        clearInvocations(messagingTemplate);

        ChatMessage message = new ChatMessage(
                ROOM_ID,
                "CHAT",
                "bob",
                "dead-only",
                ChatChannel.PUBLIC,
                Instant.now());
        gameService.broadcastPublicChat(message, 2L);

        verify(messagingTemplate).convertAndSendToUser(
                eq("bob@example.com"),
                eq("/queue/dead-chat"),
                eq(message));
        verify(messagingTemplate, never()).convertAndSend(anyString(), eq(message));
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
    void continuesWhenMafiaAndCitizenFactionAreEven() throws Exception {
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
        assertThat(result.players()).allSatisfy(player -> assertThat(player.role()).isNull());
    }

    @Test
    void excludesADisconnectedPlayerFromAliveCountsAndVictoryEvaluation() throws Exception {
        gameService.startGame(
                ROOM_ID,
                participantsForCount(4),
                principalNamesForCount(4));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.DOCTOR);
        setRole(3L, GameRole.POLICE);
        setRole(4L, GameRole.CITIZEN);

        gameService.handlePlayerDeparture(ROOM_ID, 4L);

        RoomGameState result = latestPublicState();
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 4L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isFalse());
        assertThat(result.eligibleVoters()).isEqualTo(3);
        assertThat(result.gameOver()).isFalse();
    }

    @Test
    void declaresCitizenVictoryImmediatelyWhenTheLastMafiaDisconnects() throws Exception {
        gameService.startGame(
                ROOM_ID,
                participantsForCount(4),
                principalNamesForCount(4));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.DOCTOR);
        setRole(3L, GameRole.POLICE);
        setRole(4L, GameRole.CITIZEN);

        gameService.handlePlayerDeparture(ROOM_ID, 1L);

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("FINISHED");
        assertThat(result.gameOver()).isTrue();
        assertThat(result.winningFaction()).isEqualTo("CITIZEN");
        verify(roomPresenceService).resetAfterGame(ROOM_ID);
    }

    @Test
    void departedPlayerCanRejoinAsDeadWithoutReviving() throws Exception {
        gameService.startGame(ROOM_ID, participantsForCount(4), principalNamesForCount(4));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.DOCTOR);
        setRole(3L, GameRole.POLICE);
        setRole(4L, GameRole.CITIZEN);

        gameService.handlePlayerDeparture(ROOM_ID, 4L);

        assertThat(gameService.isDepartedPlayer(ROOM_ID, 4L)).isTrue();
        assertThat(gameService.isDepartedPlayer(ROOM_ID, 99L)).isFalse();
        assertThat(isAlive(4L)).isFalse();

        gameService.broadcastCurrentState(ROOM_ID, principal(4L, "user4"));
        assertThat(latestPublicState().players())
                .filteredOn(player -> player.userId() == 4L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isFalse());
    }

    @Test
    void removesAQueuedNightActionWhenAPlayerLeavesAfterReconnectGrace() throws Exception {
        startNightVote(participantsForCount(6), principalNamesForCount(6));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        setRole(5L, GameRole.CITIZEN);
        setRole(6L, GameRole.CITIZEN);
        gameService.submitAction(ROOM_ID, principal(1L, "user1"),
                new GameActionRequest(5L, null, "MAFIA_KILL"));

        assertThat(pendingNightActionActorIds()).containsKey(1L);
        gameService.handlePlayerDeparture(ROOM_ID, 1L);
        assertThat(pendingNightActionActorIds()).doesNotContainKey(1L);

        advanceCurrentPhase();

        assertThat(isAlive(5L)).isTrue();
        assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
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
        advanceCurrentPhase();

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
    void appliesMafiaKillWhenDoctorAndPoliceSubmitNoAction() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        clearInvocations(messagingTemplate);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null, "MAFIA_KILL"));
        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(result.players())
                .filteredOn(player -> player.userId() == 2L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isFalse());
        verify(messagingTemplate, never()).convertAndSendToUser(
                anyString(), eq("/queue/night-result"), any(GameInvestigationResult.class));
    }

    @Test
    void leavesEveryoneAliveWhenMafiaDoctorAndPoliceSubmitNoAction() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        clearInvocations(messagingTemplate);

        advanceCurrentPhase();

        RoomGameState result = latestPublicState();
        assertThat(result.phase()).isEqualTo("DAY_DISCUSSION");
        assertThat(result.players()).allSatisfy(player -> assertThat(player.alive()).isTrue());
        verify(messagingTemplate, never()).convertAndSendToUser(
                anyString(), eq("/queue/night-result"), any(GameInvestigationResult.class));
    }

    @Test
    void allowsDoctorToProtectThemselfOnConsecutiveNights() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);

        submitMafiaKillAndDoctorSelfProtection();
        advanceCurrentPhase();
        assertThat(isAlive(3L)).isTrue();

        // 다음 밤으로 이동할 때도 의사의 자기 보호 선택을 별도로 초기화하지 않는다.
        advanceCurrentPhase();
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(2L, null));
        advanceCurrentPhase();
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(null, false));
        advanceCurrentPhase();

        submitMafiaKillAndDoctorSelfProtection();
        advanceCurrentPhase();

        assertThat(isAlive(3L)).isTrue();
        assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
    }

    @Test
    void doesNotSendInvestigationResultWhenPoliceDiesDuringTheSameNight() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.CITIZEN);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        clearInvocations(messagingTemplate);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(4L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(4L, "dave"),
                new GameActionRequest(1L, null, "POLICE_INVESTIGATE"));
        advanceCurrentPhase();

        assertThat(isAlive(4L)).isFalse();
        verify(messagingTemplate, never()).convertAndSendToUser(
                eq("dave@example.com"),
                eq("/queue/night-result"),
                any(GameInvestigationResult.class));
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
    void rejectsDeadAndDepartedNightActionTargets() throws Exception {
        startNightVote(participantsForCount(6), principalNamesForCount(6));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        setRole(5L, GameRole.CITIZEN);
        setRole(6L, GameRole.CITIZEN);

        setAlive(5L, false);
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(1L, "user1"),
                new GameActionRequest(5L, null, "MAFIA_KILL")))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("밤 행동 대상이 유효하지 않습니다.");

        gameService.handlePlayerDeparture(ROOM_ID, 6L);
        assertThatThrownBy(() -> gameService.submitAction(
                ROOM_ID,
                principal(2L, "user2"),
                new GameActionRequest(6L, null, "MAFIA_KILL")))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("밤 행동 대상이 유효하지 않습니다.");
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

    @Test
    void countsOnlyTheSubmittedMafiaActionWhenTheOtherMafiaDoesNothing() throws Exception {
        startNightVote(participantsForCount(6), principalNamesForCount(6));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        setRole(5L, GameRole.CITIZEN);
        setRole(6L, GameRole.CITIZEN);

        gameService.submitAction(ROOM_ID, principal(1L, "user1"),
                new GameActionRequest(5L, null, "MAFIA_KILL"));
        advanceCurrentPhase();

        assertThat(isAlive(5L)).isFalse();
        assertThat(isAlive(6L)).isTrue();
    }

    @Test
    void resolvesConcurrentNightActionsFromBothMafiaWithoutDroppingAnAction() throws Exception {
        startNightVote(participantsForCount(6), principalNamesForCount(6));
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.POLICE);
        setRole(5L, GameRole.CITIZEN);
        setRole(6L, GameRole.CITIZEN);

        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> first = executor.submit(
                    () -> submitNightActionAfter(start, 1L, 5L));
            Future<Boolean> second = executor.submit(
                    () -> submitNightActionAfter(start, 2L, 6L));
            start.countDown();

            assertThat(List.of(first.get(), second.get())).containsExactly(true, true);
            advanceCurrentPhase();

            assertThat(List.of(isAlive(5L), isAlive(6L)))
                    .containsExactlyInAnyOrder(true, false);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void resolvesTheSharedTargetWhenBothMafiaSelectTheSamePlayer() throws Exception {
        startNightVote(nightParticipants(), principalNamesForFourPlayers());
        setRole(1L, GameRole.MAFIA);
        setRole(2L, GameRole.MAFIA);
        setRole(3L, GameRole.DOCTOR);
        setRole(4L, GameRole.CITIZEN);

        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(4L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(2L, "bob"),
                new GameActionRequest(4L, null, "MAFIA_KILL"));
        advanceCurrentPhase();

        assertThat(latestPublicState().players())
                .filteredOn(player -> player.userId() == 4L)
                .singleElement()
                .satisfies(player -> assertThat(player.alive()).isFalse());
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

    private void submitMafiaKillAndDoctorSelfProtection() {
        gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                new GameActionRequest(3L, null, "MAFIA_KILL"));
        gameService.submitAction(ROOM_ID, principal(3L, "carol"),
                new GameActionRequest(3L, null, "DOCTOR_PROTECT"));
    }

    private boolean submitVoteAfter(CountDownLatch start, long targetId) throws InterruptedException {
        start.await();
        try {
            gameService.submitAction(ROOM_ID, principal(1L, "alice"),
                    new GameActionRequest(targetId, null));
            return true;
        } catch (RoomWebSocketException exception) {
            return false;
        }
    }

    private boolean submitNightActionAfter(
            CountDownLatch start,
            long actorId,
            long targetId) throws InterruptedException {
        start.await();
        try {
            gameService.submitAction(ROOM_ID, principal(actorId, "user" + actorId),
                    new GameActionRequest(targetId, null, "MAFIA_KILL"));
            return true;
        } catch (RoomWebSocketException exception) {
            return false;
        }
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
                assertThat(latestPublicState().phase()).isEqualTo("DAY_DISCUSSION");
                assertThat(latestPublicState().gameOver()).isFalse();
                assertThat(isAlive(1L)).isTrue();
                assertThat(isAlive(2L)).isFalse();

                advanceCurrentPhase();
                submitNominationAndMajorityExecution(3L, 1L, playerCount);

                RoomGameState result = latestPublicState();
                assertThat(result.phase()).isEqualTo("FINISHED");
                assertThat(result.gameOver()).isTrue();
                assertThat(result.winningFaction()).isEqualTo("CITIZEN");
                assertThat(isAlive(1L)).isFalse();
                assertThat(isAlive(2L)).isFalse();
        }

        private void submitNominationAndMajorityExecution(
                        long nominatorId, long nomineeId, int playerCount) throws Exception {
                gameService.submitAction(ROOM_ID, principal(nominatorId, "user" + nominatorId),
                                new GameActionRequest(nomineeId, null));
                advanceCurrentPhase();

                for (long userId = 1L; userId <= playerCount; userId++) {
                        if (userId != nomineeId && isAlive(userId)) {
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

    private void expireCurrentPhase() throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field phaseEndsAt = game.getClass().getDeclaredField("phaseEndsAt");
        phaseEndsAt.setAccessible(true);
        phaseEndsAt.setLong(game, 0L);
    }

    private void advanceCurrentPhase() throws Exception {
        if ("ROLE_ASSIGNMENT".equals(currentPhase())) {
            advancePhaseOnce();
        }
        advancePhaseOnce();
        if ("FINAL_DEFENSE".equals(currentPhase())) {
            advancePhaseOnce();
        }
    }

    private String currentPhase() throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field phase = game.getClass().getDeclaredField("phase");
        phase.setAccessible(true);
        return phase.get(game).toString();
    }

    private void advancePhaseOnce() throws Exception {
        expireCurrentPhase();

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

    @SuppressWarnings("unchecked")
    private Map<Long, ?> pendingNightActionActorIds() throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field nightActions = game.getClass().getDeclaredField("nightActions");
        nightActions.setAccessible(true);
        return (Map<Long, ?>) nightActions.get(game);
    }

    private RoomGameState latestPublicState() {
        ArgumentCaptor<Object> captor = ArgumentCaptor.forClass(Object.class);
        verify(messagingTemplate, atLeastOnce())
                .convertAndSend(anyString(), captor.capture());
        RoomGameState latest = null;
        for (Object message : captor.getAllValues()) {
            if (message instanceof RoomGameState state) {
                latest = state;
            }
        }
        assertThat(latest).isNotNull();
        return latest;
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

    private boolean isAlive(long userId) throws Exception {
        Object game = gamesByRoom().get(ROOM_ID);
        Field playersField = game.getClass().getDeclaredField("players");
        playersField.setAccessible(true);
        Map<?, ?> players = (Map<?, ?>) playersField.get(game);
        Object player = players.get(userId);
        Field aliveField = player.getClass().getDeclaredField("alive");
        aliveField.setAccessible(true);
        return aliveField.getBoolean(player);
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
