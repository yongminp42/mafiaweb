package kr.or.oti.mafiagame.dto;

import java.util.List;

public record RoomPresenceState(
        long roomId,
        List<RoomParticipant> participants,
        String status,
        int capacity,
        boolean locked) {

    public RoomPresenceState(long roomId, List<RoomParticipant> participants) {
        this(roomId, participants, "WAITING", 0, false);
    }

    public RoomPresenceState(long roomId, List<RoomParticipant> participants, String status) {
        this(roomId, participants, status, 0, false);
    }
}
