package kr.or.oti.mafiagame.service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.random.RandomGenerator;

import kr.or.oti.mafiagame.dto.GameFaction;
import kr.or.oti.mafiagame.dto.GameNightAction;
import kr.or.oti.mafiagame.dto.GameRole;

/**
 * Pure game-rule calculations shared by the phase coordinator.
 *
 * <p>The rule engine depends on small package-private views instead of the WebSocket service,
 * which keeps delivery, scheduling and rule changes independently testable.
 */
final class RoomGameRules {
    static final int MIN_PLAYERS = 4;
    static final int MAX_PLAYERS = 8;
    static final int DOUBLE_MAFIA_THRESHOLD = 6;

    private RoomGameRules() {
    }

    static void assignRoles(Map<Long, ? extends GameRulePlayer> players) {
        List<Long> playerIds = new ArrayList<>(players.keySet());
        List<GameRole> roles = createRoles(playerIds.size());
        Collections.shuffle(playerIds);
        for (int index = 0; index < playerIds.size(); index++) {
            players.get(playerIds.get(index)).setRole(roles.get(index));
        }
    }

    static List<GameRole> createRoles(int playerCount) {
        List<GameRole> roles = new ArrayList<>(Math.max(0, playerCount));
        int mafiaCount = playerCount >= DOUBLE_MAFIA_THRESHOLD ? 2 : 1;
        for (int index = 0; index < mafiaCount && roles.size() < playerCount; index++) {
            roles.add(GameRole.MAFIA);
        }
        if (roles.size() < playerCount) {
            roles.add(GameRole.DOCTOR);
        }
        if (roles.size() < playerCount) {
            roles.add(GameRole.POLICE);
        }
        while (roles.size() < playerCount) {
            roles.add(GameRole.CITIZEN);
        }
        return roles;
    }

    static GameFaction determineWinner(Collection<? extends GameRulePlayer> players) {
        int mafiaAlive = 0;
        int citizenFactionAlive = 0;
        for (GameRulePlayer player : players) {
            if (!player.alive()) {
                continue;
            }
            if (player.role() == GameRole.MAFIA) {
                mafiaAlive++;
            } else {
                citizenFactionAlive++;
            }
        }

        if (mafiaAlive == 0) {
            return GameFaction.CITIZEN;
        }
        return mafiaAlive > citizenFactionAlive ? GameFaction.MAFIA : null;
    }

    static Long findNominee(
            Map<Long, ? extends GameRulePlayer> players,
            Map<Long, Long> nominationVotes) {
        Map<Long, Integer> voteCounts = new HashMap<>();
        for (Map.Entry<Long, Long> vote : nominationVotes.entrySet()) {
            GameRulePlayer voter = players.get(vote.getKey());
            GameRulePlayer target = players.get(vote.getValue());
            if (voter != null && voter.alive() && target != null && target.alive()
                    && !Objects.equals(voter.userId(), target.userId())) {
                Integer previousCount = voteCounts.get(target.userId());
                voteCounts.put(target.userId(), previousCount == null ? 1 : previousCount + 1);
            }
        }
        return findUniqueLeader(voteCounts);
    }

    static boolean hasExecutionMajority(
            Map<Long, ? extends GameRulePlayer> players,
            Map<Long, Boolean> executionVotes) {
        int yesVotes = 0;
        int noVotes = 0;
        for (Map.Entry<Long, Boolean> vote : executionVotes.entrySet()) {
            GameRulePlayer voter = players.get(vote.getKey());
            if (voter == null || !voter.alive()) {
                continue;
            }
            if (Boolean.TRUE.equals(vote.getValue())) {
                yesVotes++;
            } else {
                noVotes++;
            }
        }
        return yesVotes > noVotes;
    }

    static NightOutcome resolveNightActions(
            Map<Long, ? extends GameRulePlayer> players,
            Collection<? extends GameRuleNightAction> nightActions,
            RandomGenerator random) {
        Long mafiaTargetId = findMafiaTarget(players, nightActions, random);
        if (mafiaTargetId == null) {
            return new NightOutcome(null, false);
        }

        GameRulePlayer target = players.get(mafiaTargetId);
        if (target == null || !target.alive()) {
            return new NightOutcome(null, false);
        }

        boolean protectedTarget = nightActions.stream()
                .anyMatch(action -> action.action() == GameNightAction.DOCTOR_PROTECT
                        && action.targetUserId() == mafiaTargetId);
        if (protectedTarget) {
            return new NightOutcome(null, true);
        }

        target.setAlive(false);
        return new NightOutcome(target.userId(), false);
    }

    private static Long findMafiaTarget(
            Map<Long, ? extends GameRulePlayer> players,
            Collection<? extends GameRuleNightAction> nightActions,
            RandomGenerator random) {
        Map<Long, Integer> targetCounts = new HashMap<>();
        for (GameRuleNightAction action : nightActions) {
            if (action.action() != GameNightAction.MAFIA_KILL) {
                continue;
            }
            GameRulePlayer target = players.get(action.targetUserId());
            if (target != null && target.alive() && target.role() != GameRole.MAFIA) {
                Integer previousCount = targetCounts.get(action.targetUserId());
                targetCounts.put(
                        action.targetUserId(),
                        previousCount == null ? 1 : previousCount + 1);
            }
        }
        if (targetCounts.isEmpty()) {
            return null;
        }

        int highest = 0;
        for (Integer count : targetCounts.values()) {
            if (count != null) {
                highest = Math.max(highest, count.intValue());
            }
        }
        List<Long> leaders = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : targetCounts.entrySet()) {
            Integer count = entry.getValue();
            if (count != null && count.intValue() == highest) {
                leaders.add(entry.getKey());
            }
        }
        return leaders.get(random.nextInt(leaders.size()));
    }

    private static Long findUniqueLeader(Map<Long, Integer> voteCounts) {
        if (voteCounts.isEmpty()) {
            return null;
        }

        int highest = 0;
        for (Integer count : voteCounts.values()) {
            if (count != null) {
                highest = Math.max(highest, count.intValue());
            }
        }
        List<Long> leaders = new ArrayList<>();
        for (Map.Entry<Long, Integer> entry : voteCounts.entrySet()) {
            Integer count = entry.getValue();
            if (count != null && count.intValue() == highest) {
                leaders.add(entry.getKey());
            }
        }
        return leaders.size() == 1 ? leaders.get(0) : null;
    }

    interface GameRulePlayer {
        long userId();

        GameRole role();

        boolean alive();

        void setRole(GameRole role);

        void setAlive(boolean alive);
    }

    interface GameRuleNightAction {
        GameNightAction action();

        long targetUserId();
    }

    record NightOutcome(Long killedPlayerId, boolean protectedTarget) {
    }
}
