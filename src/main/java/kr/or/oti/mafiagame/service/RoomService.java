package kr.or.oti.mafiagame.service;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.oti.mafiagame.dao.RoomMapper;
import kr.or.oti.mafiagame.domain.Room;
import kr.or.oti.mafiagame.dto.RoomSummary;
import kr.or.oti.mafiagame.dto.RoomView;

@Service
public class RoomService {
    private final RoomMapper roomMapper;
    private final PasswordEncoder passwordEncoder;

    public RoomService(RoomMapper roomMapper, PasswordEncoder passwordEncoder) {
        this.roomMapper = roomMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<RoomView> getRooms() {
        return roomMapper.findAll().stream()
                .map(RoomView::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomSummary getRoom(long roomId) {
        return roomMapper.findById(roomId);
    }

    @Transactional(readOnly = true)
    public RoomView getRoomView(long roomId) {
        RoomSummary room = roomMapper.findById(roomId);
        return room == null ? null : RoomView.from(room);
    }

    @Transactional(readOnly = true)
    public List<String> getMemberNames(long roomId) {
        return roomMapper.findMemberNames(roomId);
    }

    @Transactional
    public void transferHost(long roomId, long hostUserId) {
        if (roomMapper.updateHostUserId(roomId, hostUserId) != 1) {
            throw new IllegalStateException("방장 정보를 변경하지 못했어요.");
        }
    }

    @Transactional
    public void deleteRoom(long roomId) {
        roomMapper.deleteMembersByRoomId(roomId);
        roomMapper.deleteById(roomId);
    }

    @Transactional
    public long createRoom(long hostUserId, String title, Integer maxPlayers, String password) {
        String normalizedTitle = title == null ? "" : title.trim();
        if (normalizedTitle.length() < 2 || normalizedTitle.length() > 100) {
            throw new RoomCreationException("방 제목은 2자 이상 100자 이하로 입력해 주세요.");
        }
        if (maxPlayers == null || maxPlayers < 4 || maxPlayers > 8) {
            throw new RoomCreationException("최대 인원은 4명에서 8명 사이로 선택해 주세요.");
        }

        String normalizedPassword = password == null ? "" : password.trim();
        if (!normalizedPassword.isEmpty()
                && (normalizedPassword.length() < 4 || normalizedPassword.length() > 20)) {
            throw new RoomCreationException("비밀번호는 4자 이상 20자 이하로 입력해 주세요.");
        }

        Room room = Room.builder()
                .hostUserId(hostUserId)
                .title(normalizedTitle)
                .roomPassword(normalizedPassword.isEmpty() ? null : passwordEncoder.encode(normalizedPassword))
                .maxPlayers(maxPlayers)
                .status("WAITING")
                .build();

        if (roomMapper.insert(room) != 1) {
            throw new RoomCreationException("방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        if (roomMapper.insertMember(room.getRoomId(), hostUserId) != 1) {
            throw new RoomCreationException("방장을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return room.getRoomId();
    }

    public static class RoomCreationException extends RuntimeException {
        public RoomCreationException(String message) {
            super(message);
        }
    }
}
