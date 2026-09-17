package kr.or.oti.mafiagame.dto;

/**
 * 사용자 최근 게임 이력 화면 모델이다.
 */
public record GameRecord(
        String roomTitle,
        String role,
        String result,
        String status,
        String playedAt) {
}
