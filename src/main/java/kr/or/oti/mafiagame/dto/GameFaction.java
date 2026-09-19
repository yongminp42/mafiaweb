package kr.or.oti.mafiagame.dto;

public enum GameFaction {
    MAFIA("마피아 진영"),
    CITIZEN("시민 진영");

    private final String label;

    GameFaction(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }

    public String investigationLabel() {
        return this == MAFIA ? "마피아" : "시민";
    }
}
