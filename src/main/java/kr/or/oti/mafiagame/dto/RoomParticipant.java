package kr.or.oti.mafiagame.dto;

public record RoomParticipant(
        long userId,
        String nickname,
        boolean host,
        boolean ready) {
}
