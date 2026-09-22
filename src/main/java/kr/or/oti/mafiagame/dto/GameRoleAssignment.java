package kr.or.oti.mafiagame.dto;

public record GameRoleAssignment(
        long roomId,
        String role,
        String roleLabel,
        boolean confirmed,
        boolean mafiaChatUnlocked) {

    public GameRoleAssignment(
            long roomId,
            String role,
            String roleLabel,
            boolean confirmed) {
        this(roomId, role, roleLabel, confirmed, false);
    }
}
