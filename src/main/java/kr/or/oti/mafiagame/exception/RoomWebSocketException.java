package kr.or.oti.mafiagame.exception;

public class RoomWebSocketException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public RoomWebSocketException(String message) {
        super(message);
    }

    public RoomWebSocketException(String message, Throwable cause) {
        super(message, cause);
    }
}
