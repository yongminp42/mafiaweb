package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import kr.or.oti.mafiagame.dto.GameFaction;
import kr.or.oti.mafiagame.dto.GameRole;

class RoomGameRulesTest {
    @Test
    void uncontactedLivingSpyDoesNotTurnMafiaMinorityIntoParityVictory() {
        List<RulePlayer> players = List.of(
                new RulePlayer(1L, GameRole.MAFIA, true, false),
                new RulePlayer(2L, GameRole.SPY, true, false),
                new RulePlayer(3L, GameRole.POLICE, true, false),
                new RulePlayer(4L, GameRole.DOCTOR, true, false));

        assertThat(RoomGameRules.determineWinner(players)).isNull();
    }

    @Test
    void contactedLivingSpyCountsTowardMafiaParityVictory() {
        List<RulePlayer> players = List.of(
                new RulePlayer(1L, GameRole.MAFIA, true, false),
                new RulePlayer(2L, GameRole.SPY, true, true),
                new RulePlayer(3L, GameRole.POLICE, true, false),
                new RulePlayer(4L, GameRole.DOCTOR, true, false));

        assertThat(RoomGameRules.determineWinner(players)).isEqualTo(GameFaction.MAFIA);
    }

    private static final class RulePlayer implements RoomGameRules.GameRulePlayer {
        private final long userId;
        private GameRole role;
        private boolean alive;
        private final boolean mafiaChatUnlocked;

        private RulePlayer(long userId, GameRole role, boolean alive, boolean mafiaChatUnlocked) {
            this.userId = userId;
            this.role = role;
            this.alive = alive;
            this.mafiaChatUnlocked = mafiaChatUnlocked;
        }

        @Override
        public long userId() {
            return userId;
        }

        @Override
        public GameRole role() {
            return role;
        }

        @Override
        public boolean alive() {
            return alive;
        }

        @Override
        public void setRole(GameRole role) {
            this.role = role;
        }

        @Override
        public void setAlive(boolean alive) {
            this.alive = alive;
        }

        @Override
        public boolean mafiaChatUnlocked() {
            return mafiaChatUnlocked;
        }
    }
}
