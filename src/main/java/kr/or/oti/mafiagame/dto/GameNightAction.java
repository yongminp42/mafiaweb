package kr.or.oti.mafiagame.dto;

import java.util.Arrays;

public enum GameNightAction {
    MAFIA_KILL(GameRole.MAFIA),
    DOCTOR_PROTECT(GameRole.DOCTOR),
    POLICE_INVESTIGATE(GameRole.POLICE);

    private final GameRole requiredRole;

    GameNightAction(GameRole requiredRole) {
        this.requiredRole = requiredRole;
    }

    public GameRole requiredRole() {
        return requiredRole;
    }

    public static GameNightAction from(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("밤 행동을 선택해 주세요.");
        }
        return Arrays.stream(values())
                .filter(action -> action.name().equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("알 수 없는 밤 행동입니다."));
    }
}
