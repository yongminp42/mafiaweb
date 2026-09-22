package kr.or.oti.mafiagame.dto;

public record GameInvestigationResult(
        long roomId,
        long targetUserId,
        String targetNickname,
        String faction,
        String factionLabel,
        String role,
        String roleLabel,
        java.util.List<GamePlayer> mafiaPlayers) {

    public GameInvestigationResult(
            long roomId,
            long targetUserId,
            String targetNickname,
            String faction,
            String factionLabel) {
        this(roomId, targetUserId, targetNickname, faction, factionLabel, null, null, null);
    }

    public GameInvestigationResult(
            long roomId,
            long targetUserId,
            String targetNickname,
            String faction,
            String factionLabel,
            String role,
            String roleLabel) {
        this(roomId, targetUserId, targetNickname, faction, factionLabel, role, roleLabel, null);
    }
}
