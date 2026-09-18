package kr.or.oti.mafiagame.dto;

import java.util.List;

public record RoomGameState(
        long roomId,
        String phase,
        long phaseEndsAt,
        int remainingSeconds,
        List<GamePlayer> players,
        Long nominatedUserId,
        int submittedVotes,
        int eligibleVoters,
        String message,
        boolean gameOver,
        String winningFaction) {
}
