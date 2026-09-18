package kr.or.oti.mafiagame.dto;

public record GameInvestigationResult(
        long roomId,
        long targetUserId,
        String targetNickname,
        String faction,
        String factionLabel) {
}
