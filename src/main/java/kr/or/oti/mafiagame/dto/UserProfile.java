package kr.or.oti.mafiagame.dto;

import kr.or.oti.mafiagame.domain.UserStats;

/**
 * 사용자 프로필 화면에 전달하는 모델이다.
 */
public record UserProfile(
        long id,
        String nickname,
        String bio,
        int totalGames,
        int wins,
        int losses,
        int experience,
        String joinedAt) {

    public int winRate() {
        return totalGames == 0 ? 0 : Math.round((float) wins / totalGames * 100);
    }

    public int getLevel() {
        return UserStats.levelForExperience(experience);
    }

    public int getExperience() {
        return experience;
    }

    public int getExperiencePerLevel() {
        return UserStats.EXPERIENCE_PER_LEVEL;
    }

    public int getLevelProgress() {
        return UserStats.experienceProgressInLevel(experience);
    }

    public int getLevelProgressPercent() {
        return Math.min(100, getLevelProgress() * 100 / getExperiencePerLevel());
    }

    public int getExperienceToNextLevel() {
        return Math.max(0, UserStats.nextLevelExperience(experience) - experience);
    }
}
