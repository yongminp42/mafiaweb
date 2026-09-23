package kr.or.oti.mafiagame.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UserStats {
    public static final int DEFAULT_RATING = 1000;
    private static final int RATING_PER_LEVEL = 1000;

    private int totalGames;
    private int wins;
    private int losses;
    private int rating = DEFAULT_RATING;

    public static int levelForRating(int rating) {
        return Math.max(1, rating / RATING_PER_LEVEL);
    }
}
