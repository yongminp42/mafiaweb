package kr.or.oti.mafiagame.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Room {
    private long roomId;
    private long hostUserId;
    private String title;
    private String roomPassword;
    private int maxPlayers;
    private String status;

    @Builder
    public Room(long roomId, long hostUserId, String title, String roomPassword,
                int maxPlayers, String status) {
        this.roomId = roomId;
        this.hostUserId = hostUserId;
        this.title = title;
        this.roomPassword = roomPassword;
        this.maxPlayers = maxPlayers;
        this.status = status;
    }
}
