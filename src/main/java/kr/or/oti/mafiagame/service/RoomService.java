package kr.or.oti.mafiagame.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.oti.mafiagame.dao.RoomMapper;
import kr.or.oti.mafiagame.domain.RoomSummary;

@Service
public class RoomService {
    private final RoomMapper roomMapper;

    public RoomService(RoomMapper roomMapper) {
        this.roomMapper = roomMapper;
    }

    @Transactional(readOnly = true)
    public List<RoomSummary> getRooms() {
        return roomMapper.findAll();
    }
}
