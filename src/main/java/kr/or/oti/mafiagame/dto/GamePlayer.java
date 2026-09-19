package kr.or.oti.mafiagame.dto;

public record GamePlayer(
        long userId,
        String nickname,
        boolean alive,
        GameRole role) {

    public GamePlayer(long userId, String nickname, boolean alive) {
        this(userId, nickname, alive, null);
    }
}
