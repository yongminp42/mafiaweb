package kr.or.oti.mafiagame.dto;

public enum GameRole {
    MAFIA("마피아"),
    DOCTOR("의사"),
    POLICE("경찰"),
    CITIZEN("시민");

    private final String label;

    GameRole(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
