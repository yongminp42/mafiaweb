package kr.or.oti.mafiagame.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 게임방 목록/상세 조회를 위한 MyBatis 조회 결과다.
 * 영속 도메인인 {@code Room}과 화면 모델을 연결하는 읽기 전용 projection 역할을 한다.
 */
@Getter
@Setter
@NoArgsConstructor
public class RoomSummary {
    private long roomId;
    private long hostUserId;
    private String title;
    private String hostName;
    private int currentPlayers;
    private int maxPlayers;
    private String status;
    private boolean locked;
}
