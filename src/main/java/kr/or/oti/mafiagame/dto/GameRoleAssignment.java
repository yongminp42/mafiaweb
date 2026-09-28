package kr.or.oti.mafiagame.dto;

import java.util.List;

public record GameRoleAssignment(
        long roomId,
        String role,
        String roleLabel,
        boolean confirmed,
        boolean mafiaChatUnlocked,
        List<String> mafiaTeammates) {

    public GameRoleAssignment {
        mafiaTeammates = mafiaTeammates == null ? List.of() : List.copyOf(mafiaTeammates);
    }

    public GameRoleAssignment(
            long roomId,
            String role,
            String roleLabel,
            boolean confirmed,
            boolean mafiaChatUnlocked) {
        this(roomId, role, roleLabel, confirmed, mafiaChatUnlocked, List.of());
    }

    public GameRoleAssignment(
            long roomId,
            String role,
            String roleLabel,
            boolean confirmed) {
        this(roomId, role, roleLabel, confirmed, false, List.of());
    }
}
