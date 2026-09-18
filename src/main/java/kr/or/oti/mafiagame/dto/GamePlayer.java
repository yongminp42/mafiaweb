package kr.or.oti.mafiagame.dto;

public record GamePlayer(
        long userId,
        String nickname,
        boolean alive) {
}
