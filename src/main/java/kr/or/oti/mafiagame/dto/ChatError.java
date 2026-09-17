package kr.or.oti.mafiagame.dto;

public record ChatError(String type, String message) {
    private static final String ERROR_TYPE = "ERROR";

    public static ChatError of(String message) {
        return new ChatError(ERROR_TYPE, message);
    }
}
