package kr.or.oti.mafiagame.dto;

import java.util.List;

/**
 * 사용자 프로필 화면에 전달하는 모델이다.
 */
public record UserProfile(
        long id,
        String nickname,
        String bio,
        int totalGames,
        int wins,
        Integer mafiaGames,
        Integer mafiaWins,
        String joinedAt,
        List<GameRecord> recentGames) {

    public UserProfile {
        recentGames = List.copyOf(recentGames);
    }

    public int winRate() {
        return totalGames == 0 ? 0 : Math.round((float) wins / totalGames * 100);
    }

    public int mafiaWinRate() {
        return mafiaGames == null || mafiaWins == null || mafiaGames == 0
                ? 0
                : Math.round((float) mafiaWins / mafiaGames * 100);
    }
}
