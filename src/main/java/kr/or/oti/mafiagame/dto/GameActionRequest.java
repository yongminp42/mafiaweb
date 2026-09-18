package kr.or.oti.mafiagame.dto;

public record GameActionRequest(
        Long targetUserId,
        Boolean execute,
        String action) {

    public GameActionRequest(Long targetUserId, Boolean execute) {
        this(targetUserId, execute, null);
    }
}
