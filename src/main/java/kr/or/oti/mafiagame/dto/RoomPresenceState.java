package kr.or.oti.mafiagame.dto;

import java.util.List;

public record RoomPresenceState(
        long roomId,
        List<RoomParticipant> participants,
        String status) {

    public RoomPresenceState(long roomId, List<RoomParticipant> participants) {
        this(roomId, participants, "WAITING");
    }
}
