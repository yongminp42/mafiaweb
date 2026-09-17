package kr.or.oti.mafiagame.dto;

/**
 * 게임방 목록과 상세 화면에 공통으로 전달하는 응답 모델이다.
 */
public record RoomView(
        long roomId,
        String title,
        String description,
        String hostName,
        int players,
        int capacity,
        String status,
        boolean locked) {

    public static RoomView from(RoomSummary room) {
        return new RoomView(
                room.getRoomId(),
                room.getTitle(),
                room.getHostName() + "님이 만든 대기방 · 인원이 모이면 시작해요",
                room.getHostName(),
                room.getCurrentPlayers(),
                room.getMaxPlayers(),
                room.getStatus(),
                room.isLocked());
    }

    public RoomView withPlayerCount(int playerCount) {
        return new RoomView(
                roomId,
                title,
                description,
                hostName,
                playerCount,
                capacity,
                status,
                locked);
    }

    public int currentPlayers() {
        return players;
    }

    public int maxPlayers() {
        return capacity;
    }
}
