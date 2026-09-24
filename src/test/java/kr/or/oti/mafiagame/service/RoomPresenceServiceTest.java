package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.security.Principal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.domain.UserStats;
import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomReadyRequest;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.exception.RoomWebSocketException;
import kr.or.oti.mafiagame.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class RoomPresenceServiceTest {
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private RoomService roomService;
    @Mock
    private RoomGameService roomGameService;

    private RoomPresenceService presenceService;

    @BeforeEach
    void setUp() {
        presenceService = new RoomPresenceService(
                messagingTemplate,
                roomService,
                Duration.ZERO,
                Duration.ZERO,
                Duration.ZERO,
                roomGameService);
        lenient().when(roomService.getRoom(anyLong())).thenAnswer(invocation -> switch (invocation.<Long>getArgument(0).intValue()) {
            case 1 -> room(1L, 10L);
            case 2 -> room(2L, 20L);
            case 3 -> room(3L, 30L, 2);
            case 4 -> lockedRoom(4L, 40L);
            case 5 -> room(5L, 50L, 9);
            default -> null;
        });
    }

    @Test
    void sameUserInMultipleSessionsCountsAsOneParticipantAndSharesReadyState() {
        Principal user = principal(10L, "host");

        presenceService.join(1L, "session-1", user);
        presenceService.join(1L, "session-2", user);
        presenceService.updateReady(1L, "session-2", new RoomReadyRequest(true));

        RoomPresenceState state = presenceService.currentState(1L);
        assertThat(state.participants()).hasSize(1);
        assertThat(state.participants().get(0).nickname()).isEqualTo("host");
        assertThat(state.participants().get(0).ready()).isTrue();
        assertThat(presenceService.currentCounts()).containsEntry(1L, 1);
        assertThat(presenceService.isParticipant(1L, "session-1")).isTrue();
        assertThat(presenceService.isParticipant(1L, "session-2")).isTrue();
    }

    @Test
    void closingOneTabKeepsParticipantUntilLastSessionLeaves() {
        Principal user = principal(10L, "host");
        presenceService.join(1L, "session-1", user);
        presenceService.join(1L, "session-2", user);

        presenceService.leave("session-1");

        assertThat(presenceService.currentState(1L).participants()).hasSize(1);
        assertThat(presenceService.isParticipant(1L, "session-1")).isFalse();
        assertThat(presenceService.isParticipant(1L, "session-2")).isTrue();
        verify(roomService, never()).deleteRoom(1L);

        presenceService.leave("session-2");
        assertThat(presenceService.currentState(1L)).isNull();
        verify(roomService).deleteRoom(1L);
    }

    @Test
    void notifiesTheGameWhenTheLastSessionOfAPlayerLeaves() {
        presenceService.join(1L, "session-1", principal(10L, "host"));

        presenceService.leave("session-1");

        verify(roomGameService).handlePlayerDeparture(1L, 10L);
    }

    @Test
    void cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod() throws InterruptedException {
        RoomPresenceService reconnectingService = new RoomPresenceService(
                messagingTemplate,
                roomService,
                Duration.ZERO,
                Duration.ofSeconds(30),
                Duration.ofSeconds(10),
                roomGameService);
        try {
            reconnectingService.join(1L, "old-session", principal(10L, "host"));
            reconnectingService.leave("old-session");
            reconnectingService.join(1L, "new-session", principal(10L, "host"));

            Thread.sleep(250L);

            verify(roomGameService, never()).handlePlayerDeparture(1L, 10L);
        } finally {
            reconnectingService.shutdownCleanupExecutor();
        }
    }

    @Test
    void joiningDifferentRoomRemovesEveryPreviousSession() {
        Principal user = principal(10L, "player");
        presenceService.join(1L, "old-1", user);
        presenceService.join(1L, "old-2", user);

        presenceService.join(2L, "new-1", user);

        assertThat(presenceService.currentState(1L)).isNull();
        assertThat(presenceService.currentState(2L).participants())
                .singleElement()
                .satisfies(participant -> assertThat(participant.userId()).isEqualTo(10L));
        assertThat(presenceService.isParticipant(1L, "old-1")).isFalse();
        assertThat(presenceService.isParticipant(1L, "old-2")).isFalse();
        assertThat(presenceService.isParticipant(2L, "new-1")).isTrue();
        verify(roomService).deleteRoom(1L);
    }

    @Test
    void leavingHostTransfersHostToRemainingParticipant() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));

        presenceService.leave("host-session");

        assertThat(presenceService.currentState(1L).participants())
                .singleElement()
                .satisfies(participant -> {
                    assertThat(participant.userId()).isEqualTo(11L);
                    assertThat(participant.host()).isTrue();
                });
        verify(roomService).transferHost(1L, 11L);
    }

    @Test
    void keepsHostDuringReconnectGracePeriodForWaitingRoom() throws InterruptedException {
        RoomPresenceService reconnectingService = new RoomPresenceService(
                messagingTemplate,
                roomService,
                Duration.ZERO,
                Duration.ofMillis(100),
                Duration.ofMillis(100),
                roomGameService);
        try {
            reconnectingService.join(1L, "host-session", principal(10L, "host"));
            reconnectingService.join(1L, "guest-session", principal(11L, "guest"));

            reconnectingService.leave("host-session");

            assertThat(reconnectingService.currentState(1L).participants())
                    .singleElement()
                    .satisfies(participant -> {
                        assertThat(participant.userId()).isEqualTo(11L);
                        assertThat(participant.host()).isFalse();
                    });
            verify(roomService, never()).transferHost(1L, 11L);

            reconnectingService.join(1L, "reconnected-host-session", principal(10L, "host"));
            Thread.sleep(250L);

            assertThat(reconnectingService.currentState(1L).participants())
                    .filteredOn(participant -> participant.userId() == 10L)
                    .singleElement()
                    .satisfies(participant -> assertThat(participant.host()).isTrue());
            verify(roomService, never()).transferHost(1L, 11L);
        } finally {
            reconnectingService.shutdownCleanupExecutor();
        }
    }

    @Test
    void keepsEmptyRoomVisibleDuringCleanupGracePeriod() {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofSeconds(1));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            assertThat(delayedService.currentState(1L).participants()).isEmpty();
            assertThat(delayedService.currentCounts()).containsEntry(1L, 0);
            verify(roomService, never()).deleteRoom(1L);
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    @Test
    void deletesEmptyRoomAfterCleanupGracePeriodExpires() throws InterruptedException {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(100));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            verify(roomService, never()).deleteRoom(1L);
            await(Duration.ofSeconds(2), () -> verify(roomService).deleteRoom(1L));
            assertThat(delayedService.currentState(1L)).isNull();
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    @Test
    void rejoiningDuringCleanupGracePeriodCancelsRoomDeletion() throws InterruptedException {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(100));
        try {
            delayedService.join(1L, "first-session", principal(10L, "host"));
            delayedService.leave("first-session");
            delayedService.join(1L, "reconnected-session", principal(10L, "host"));

            Thread.sleep(300L);

            verify(roomService, never()).deleteRoom(1L);
            assertThat(delayedService.isParticipant(1L, "reconnected-session")).isTrue();
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    @Test
    void retriesEmptyRoomDeletionWhenDatabaseDeleteFails() throws InterruptedException {
        AtomicInteger deleteAttempts = new AtomicInteger();
        doAnswer(invocation -> {
            if (deleteAttempts.getAndIncrement() == 0) {
                throw new IllegalStateException("db unavailable");
            }
            return null;
        }).when(roomService).deleteRoom(1L);
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(50));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            await(Duration.ofSeconds(2), () -> verify(roomService, atLeast(2)).deleteRoom(1L));
            assertThat(delayedService.currentState(1L)).isNull();
            assertThat(deleteAttempts.get()).isGreaterThanOrEqualTo(2);
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    @Test
    void failedHostTransferLeavesPresenceStateUntouched() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));
        reset(roomService);
        doThrow(new IllegalStateException("db unavailable"))
                .when(roomService).transferHost(1L, 11L);

        assertThatThrownBy(() -> presenceService.leave("host-session"))
                .isInstanceOf(IllegalStateException.class);

        assertThat(presenceService.isParticipant(1L, "host-session")).isTrue();
        assertThat(presenceService.currentState(1L).participants()).hasSize(2);
    }

    @Test
    void guestJoiningBeforePersistedHostDoesNotTakeHostRole() {
        presenceService.join(1L, "guest-session", principal(11L, "guest"));

        assertThat(presenceService.currentState(1L).participants())
                .singleElement()
                .satisfies(participant -> assertThat(participant.host()).isFalse());
        verify(roomService, never()).transferHost(1L, 11L);

        presenceService.join(1L, "host-session", principal(10L, "host"));
        assertThat(presenceService.currentState(1L).participants())
                .filteredOn(participant -> participant.userId() == 10L)
                .singleElement()
                .satisfies(participant -> assertThat(participant.host()).isTrue());
    }

    @Test
    void fullTargetRoomRejectsNewParticipantWithoutLeavingCurrentRoom() {
        Principal movingUser = principal(10L, "moving");
        presenceService.join(1L, "old-session", movingUser);
        presenceService.join(3L, "full-1", principal(30L, "one"));
        presenceService.join(3L, "full-2", principal(31L, "two"));

        assertThatThrownBy(() -> presenceService.join(3L, "new-session", movingUser))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(presenceService.isParticipant(1L, "old-session")).isTrue();
        assertThat(presenceService.currentState(3L).participants()).hasSize(2);
        assertThat(presenceService.isParticipant(3L, "new-session")).isFalse();
        assertThat(presenceService.currentOnlinePlayerCount()).isEqualTo(3);
    }

    @Test
    void rejectedJoinDoesNotRegisterAnOnlinePlayer() {
        presenceService.join(3L, "full-1", principal(30L, "one"));
        presenceService.join(3L, "full-2", principal(31L, "two"));

        assertThatThrownBy(() -> presenceService.join(3L, "rejected", principal(32L, "three")))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(presenceService.currentOnlinePlayerCount()).isEqualTo(2);
        assertThat(presenceService.currentState(3L).participants()).hasSize(2);
    }

    @Test
    void ongoingGameAllowsRejoinButRejectsNewParticipantWithoutChangingPresence() {
        Principal host = principal(10L, "host");
        presenceService.join(1L, "host-session", host);
        RoomSummary playingRoom = room(1L, 10L);
        playingRoom.setStatus("PLAYING");
        when(roomService.getRoom(1L)).thenReturn(playingRoom);

        assertThatThrownBy(() -> presenceService.join(1L, "new-session", principal(11L, "new")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThat(presenceService.currentState(1L).status()).isEqualTo("WAITING");
        assertThat(presenceService.currentOnlinePlayerCount()).isEqualTo(1);

        RoomPresenceState rejoined = presenceService.join(1L, "reconnected-session", host);
        assertThat(rejoined.status()).isEqualTo("PLAYING");
        assertThat(rejoined.participants()).hasSize(1);
    }

    @Test
    void departedPlayerRejoinsPlayingRoomAsSpectatorButNewPlayerCannot() {
        presenceService.join(1L, "old-session", principal(10L, "host"));
        RoomSummary playingRoom = room(1L, 10L);
        playingRoom.setStatus("PLAYING");
        when(roomService.getRoom(1L)).thenReturn(playingRoom);
        presenceService.leave("old-session");
        when(roomGameService.isDepartedPlayer(1L, 10L)).thenReturn(true);

        RoomPresenceState state = presenceService.join(
                1L, "returned-session", principal(10L, "host"));

        assertThat(state.status()).isEqualTo("PLAYING");
        assertThat(state.participants()).hasSize(1);
        assertThatThrownBy(() -> presenceService.join(
                1L, "outsider-session", principal(11L, "outsider")))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void concurrentJoinsNeverExceedRoomCapacity() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        try {
            for (int index = 0; index < 10; index++) {
                long userId = 100L + index;
                String sessionId = "concurrent-" + index;
                results.add(executor.submit(() -> {
                    start.await();
                    try {
                        presenceService.join(3L, sessionId, principal(userId, "user" + userId));
                        return true;
                    } catch (RoomWebSocketException exception) {
                        return false;
                    }
                }));
            }

            start.countDown();
            long successfulJoins = 0;
            for (Future<Boolean> result : results) {
                if (result.get()) {
                    successfulJoins++;
                }
            }

            assertThat(successfulJoins).isEqualTo(2);
            assertThat(presenceService.currentState(3L).participants()).hasSize(2);
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void rejectsInvalidJoinAndReadyRequests() {
        assertThatThrownBy(() -> presenceService.join(1L, "", principal(10L, "host")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> presenceService.join(999L, "session", principal(10L, "host")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> presenceService.updateReady(1L, "unknown", new RoomReadyRequest(true)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    @Test
    void lockedRoomRequiresVerifiedHttpSessionAccess() {
        Principal host = principal(40L, "host");
        Principal user = principal(41L, "guest");

        presenceService.join(4L, "host-session", host, false);
        assertThat(presenceService.isParticipant(4L, "host-session")).isTrue();

        assertThatThrownBy(() -> presenceService.join(4L, "locked-session", user, false))
                .isInstanceOf(RoomWebSocketException.class);

        presenceService.join(4L, "locked-session", user, true);
        assertThat(presenceService.isParticipant(4L, "locked-session")).isTrue();
    }

    @Test
    void broadcastsUpdatedCapacityAndLockStateToAllRoomParticipants() {
        RoomSummary room = room(1L, 10L, 8);
        when(roomService.getRoom(1L)).thenReturn(room);
        doAnswer(invocation -> {
            room.setMaxPlayers(invocation.getArgument(2, Integer.class));
            room.setLocked(invocation.getArgument(3, Boolean.class));
            return null;
        }).when(roomService).updateRoomSettings(1L, 10L, 6, true, "secret", 2);

        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));

        RoomPresenceState updated = presenceService.updateRoomSettings(
                1L,
                10L,
                6,
                true,
                "secret");

        assertThat(updated).isNotNull();
        assertThat(updated.participants()).hasSize(2);
        assertThat(updated.capacity()).isEqualTo(6);
        assertThat(updated.locked()).isTrue();
        verify(roomService).updateRoomSettings(1L, 10L, 6, true, "secret", 2);
        verify(messagingTemplate).convertAndSend("/topic/rooms/1/presence", updated);
    }

    @Test
    void throttlesRepeatedLobbyCountRequestsFromOneSession() {
        presenceService.broadcastRoomCounts("lobby-session");
        presenceService.broadcastRoomCounts("lobby-session");

        verify(messagingTemplate, times(2)).convertAndSend(
                eq("/topic/rooms/presence"), any(Object.class));
    }

    @Test
    void coalescesLobbyCountRequestsAcrossSessionsAtTheGlobalLimit() throws Exception {
        Field lastBroadcastField = RoomPresenceService.class
                .getDeclaredField("lastLobbyCountBroadcastNanos");
        lastBroadcastField.setAccessible(true);
        lastBroadcastField.set(presenceService, System.nanoTime() + Duration.ofMillis(200).toNanos());

        presenceService.broadcastRoomCounts("lobby-session-1");
        presenceService.broadcastRoomCounts("lobby-session-2");
        presenceService.broadcastRoomCounts("lobby-session-3");

        await(Duration.ofSeconds(2), () -> verify(messagingTemplate, times(2)).convertAndSend(
                eq("/topic/rooms/presence"), any(Object.class)));
    }

    @Test
    void resetsInterruptedPlayingRoomsWhenApplicationBecomesReady() {
        when(roomService.resetInterruptedGamesToWaiting()).thenReturn(2);

        presenceService.resetInterruptedGamesAfterRestart();

        verify(roomService).resetInterruptedGamesToWaiting();
    }

    @Test
    void returnsFinishedRoomToWaitingAndClearsReadyState() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));
        presenceService.join(1L, "third-session", principal(12L, "third"));
        presenceService.join(1L, "fourth-session", principal(13L, "fourth"));
        presenceService.updateReady(1L, "host-session", new RoomReadyRequest(true));
        presenceService.updateReady(1L, "guest-session", new RoomReadyRequest(true));
        presenceService.updateReady(1L, "third-session", new RoomReadyRequest(true));
        presenceService.updateReady(1L, "fourth-session", new RoomReadyRequest(true));
        when(roomService.startGame(1L)).thenReturn(true);
        when(roomService.resetGameToWaiting(1L)).thenReturn(true);

        presenceService.startGame(1L, "host-session");
        presenceService.resetAfterGame(1L);

        RoomPresenceState state = presenceService.currentState(1L);
        assertThat(state.status()).isEqualTo("WAITING");
        assertThat(state.participants())
                .hasSize(4)
                .allSatisfy(participant -> assertThat(participant.ready()).isFalse());
        verify(roomService).resetGameToWaiting(1L);
    }

    @Test
    void rejectsStartingGameWithFewerThanFourPlayers() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));
        presenceService.join(1L, "third-session", principal(12L, "third"));
        presenceService.updateReady(1L, "host-session", new RoomReadyRequest(true));
        presenceService.updateReady(1L, "guest-session", new RoomReadyRequest(true));
        presenceService.updateReady(1L, "third-session", new RoomReadyRequest(true));

        assertThatThrownBy(() -> presenceService.startGame(1L, "host-session"))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("게임 시작에는 최소 4명의 참가자가 필요합니다.");
        verify(roomService, never()).startGame(1L);
    }

    @Test
    void rejectsStartingGameWithMoreThanEightPlayers() {
        for (int index = 0; index < 9; index++) {
            long userId = 50L + index;
            presenceService.join(5L, "session-" + index, principal(userId, "user" + userId));
            presenceService.updateReady(5L, "session-" + index, new RoomReadyRequest(true));
        }

        assertThatThrownBy(() -> presenceService.startGame(5L, "session-0"))
                .isInstanceOf(RoomWebSocketException.class)
                .hasMessage("게임 시작에는 최대 8명의 참가자만 허용됩니다.");
        verify(roomService, never()).startGame(5L);
    }

    @Test
    void usesTheCurrentFivePlayersWhenTheSixthLeavesBeforeStart() {
        for (int index = 0; index < 6; index++) {
            long userId = 10L + index;
            presenceService.join(1L, "threshold-session-" + index, principal(userId, "user" + userId));
        }
        presenceService.leave("threshold-session-5");

        for (int index = 0; index < 5; index++) {
            presenceService.updateReady(
                    1L,
                    "threshold-session-" + index,
                    new RoomReadyRequest(true));
        }
        when(roomService.startGame(1L)).thenReturn(true);

        RoomPresenceState state = presenceService.startGame(1L, "threshold-session-0");

        assertThat(state.status()).isEqualTo("PLAYING");
        assertThat(state.participants()).hasSize(5);
        assertThat(state.participants()).allSatisfy(participant ->
                assertThat(participant.ready()).isTrue());

        InOrder startOrder = inOrder(roomService, roomGameService);
        startOrder.verify(roomService).startGame(1L);
        startOrder.verify(roomGameService).startGame(
                1L,
                state.participants(),
                Map.of(
                        10L, "user10@example.com",
                        11L, "user11@example.com",
                        12L, "user12@example.com",
                        13L, "user13@example.com",
                        14L, "user14@example.com"));
    }

    @Test
    void restoresWaitingStatusWhenCreatingTheGameInstanceFails() {
        for (int index = 0; index < 4; index++) {
            long userId = 10L + index;
            String sessionId = "start-failure-session-" + index;
            presenceService.join(1L, sessionId, principal(userId, "user" + userId));
            presenceService.updateReady(1L, sessionId, new RoomReadyRequest(true));
        }
        when(roomService.startGame(1L)).thenReturn(true);
        when(roomService.resetGameToWaiting(1L)).thenReturn(true);
        doThrow(new IllegalStateException("game initialization failed"))
                .when(roomGameService)
                .startGame(anyLong(), anyList(), anyMap());

        assertThatThrownBy(() -> presenceService.startGame(1L, "start-failure-session-0"))
                .isInstanceOf(RoomWebSocketException.class)
                .hasCauseInstanceOf(IllegalStateException.class);

        assertThat(presenceService.currentState(1L).status()).isEqualTo("WAITING");
        verify(roomService).resetGameToWaiting(1L);
    }

    private static RoomSummary room(long roomId, long hostUserId) {
        return room(roomId, hostUserId, 8);
    }

    private static RoomSummary room(long roomId, long hostUserId, int maxPlayers) {
        RoomSummary room = new RoomSummary();
        room.setRoomId(roomId);
        room.setHostUserId(hostUserId);
        room.setTitle("room-" + roomId);
        room.setHostName("host");
        room.setMaxPlayers(maxPlayers);
        room.setStatus("WAITING");
        return room;
    }

    private static RoomSummary lockedRoom(long roomId, long hostUserId) {
        RoomSummary room = room(roomId, hostUserId);
        room.setLocked(true);
        return room;
    }

    private static Principal principal(long userId, String nickname) {
        User user = User.builder()
                .userId(userId)
                .userName(nickname)
                .email(nickname + "@example.com")
                .password("encoded")
                .user_level(1)
                .build();
        CustomUserDetails details = new CustomUserDetails(user, UserStats.DEFAULT_RATING);
        return new UsernamePasswordAuthenticationToken(details, details.getPassword(), details.getAuthorities());
    }

    private static void await(Duration timeout, Runnable assertion) throws InterruptedException {
        long deadline = System.nanoTime() + timeout.toNanos();
        AssertionError lastFailure = null;
        while (System.nanoTime() < deadline) {
            try {
                assertion.run();
                return;
            } catch (AssertionError failure) {
                lastFailure = failure;
                Thread.sleep(10L);
            }
        }
        if (lastFailure != null) {
            throw lastFailure;
        }
        assertion.run();
    }
}
