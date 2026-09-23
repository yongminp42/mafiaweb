package kr.or.oti.mafiagame.dto;

public enum GamePhase {
    ROLE_ASSIGNMENT("역할 확인", 15),
    DAY_DISCUSSION("낮", 60),
    NOMINATION_VOTE("지목 투표", 20),
    FINAL_DEFENSE("최종 변론", 20),
    EXECUTION_VOTE("처형 투표", 20),
    NIGHT("밤", 35),
    FINISHED("게임 종료", 0);

    private static final String PHASE_PROFILE_ENV = "MAFIAGAME_PHASE_PROFILE";

    private final String label;
    private final long durationSeconds;

    GamePhase(String label, long durationSeconds) {
        this.label = label;
        this.durationSeconds = durationSeconds;
    }

    public String label() {
        return label;
    }

    public long durationSeconds() {
        if ("short".equalsIgnoreCase(System.getenv(PHASE_PROFILE_ENV))) {
            return durationSeconds == 0 ? 0 : 3;
        }
        return durationSeconds;
    }
}
