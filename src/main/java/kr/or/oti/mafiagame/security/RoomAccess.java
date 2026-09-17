package kr.or.oti.mafiagame.security;

import java.util.Map;

import jakarta.servlet.http.HttpSession;

/**
 * HTTP에서 확인한 잠금 방 접근 권한을 같은 세션의 WebSocket 연결과 공유한다.
 */
public final class RoomAccess {
    private static final String ATTRIBUTE_PREFIX = RoomAccess.class.getName() + ".room.";

    private RoomAccess() {
    }

    public static void grant(HttpSession session, long roomId) {
        session.setAttribute(attributeName(roomId), Boolean.TRUE);
    }

    public static boolean isGranted(HttpSession session, long roomId) {
        return session != null && Boolean.TRUE.equals(session.getAttribute(attributeName(roomId)));
    }

    public static boolean isGranted(Map<String, Object> sessionAttributes, long roomId) {
        return sessionAttributes != null
                && Boolean.TRUE.equals(sessionAttributes.get(attributeName(roomId)));
    }

    private static String attributeName(long roomId) {
        return ATTRIBUTE_PREFIX + roomId;
    }
}
