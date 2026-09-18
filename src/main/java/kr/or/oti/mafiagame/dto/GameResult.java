package kr.or.oti.mafiagame.dto;

public record GameResult(
        long roomId,
        String winningFaction,
        String winningFactionLabel,
        String role,
        String roleLabel,
        boolean alive) {
}
