package kr.or.oti.mafiagame.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomList {
    private long roomId;
    private long hostUserId;
    private String title;
    private String hostName;
    private int currentPlayers;
    private int maxPlayers;
    private String status;
    private boolean locked;
}
