package kr.or.oti.mafiagame.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserStats {
    public static final int DEFAULT_RATING = 1000;
    public static final int EXPERIENCE_PER_LEVEL = 1000;

    private int totalGames;
    private int wins;
    private int losses;
    // Persisted in the legacy `rating` column; this value is now the XP total.
    private int rating = DEFAULT_RATING;

    public int getExperience() {
        return rating;
    }

    public void setExperience(int experience) {
        this.rating = experience;
    }

    public static int levelForRating(int rating) {
        return levelForExperience(rating);
    }

    public static int levelForExperience(int experience) {
        return Math.max(1, experience / EXPERIENCE_PER_LEVEL);
    }

    public static int nextLevelExperience(int experience) {
        return (levelForExperience(experience) + 1) * EXPERIENCE_PER_LEVEL;
    }

    public static int experienceProgressInLevel(int experience) {
        return Math.max(0, experience - levelForExperience(experience) * EXPERIENCE_PER_LEVEL);
    }
}
