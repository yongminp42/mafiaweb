package kr.or.oti.mafiagame.dto;

public enum GameRole {
    MAFIA("마피아"),
    SPY("스파이"),
    DOCTOR("의사"),
    POLICE("경찰"),
    SOLDIER("군인"),
    MEDIUM("영매사"),
    CITIZEN("시민");

    private final String label;

    GameRole(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public boolean isMafiaTeam() {
        return this == MAFIA || this == SPY;
    }
}
