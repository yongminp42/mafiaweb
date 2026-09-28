package kr.or.oti.mafiagame.service;

import java.util.List;
import java.util.function.Function;

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

    @Transactional(readOnly = true)
    public boolean verifyRoomPassword(long roomId, String password) {
        String normalizedPassword = password == null ? "" : password.trim();
        if (normalizedPassword.isEmpty()) {
            return false;
        }

        String passwordHash = roomMapper.findPasswordHash(roomId);
        return passwordHash != null && passwordEncoder.matches(normalizedPassword, passwordHash);
    }

    @Transactional
    public void transferHost(long roomId, long hostUserId) {
        if (roomMapper.updateHostUserId(roomId, hostUserId) != 1) {
            throw new IllegalStateException("방장 정보를 변경하지 못했어요.");
        }
    }

    @Transactional
    public void updateRoomSettings(
            long roomId,
            long hostUserId,
            Integer maxPlayers,
            boolean passwordEnabled,
            String password,
            int currentPlayers) {
        RoomSummary room = roomMapper.findById(roomId);
        if (room == null) {
            throw new RoomSettingsException("존재하지 않는 게임방입니다.");
        }
        if (room.getHostUserId() != hostUserId) {
            throw new RoomSettingsException("방장만 게임방 설정을 변경할 수 있어요.");
        }
        if (!"WAITING".equals(room.getStatus())) {
            throw new RoomSettingsException("게임이 시작된 뒤에는 게임방 설정을 변경할 수 없어요.");
        }
        validateMaxPlayers(maxPlayers, RoomSettingsException::new);
        if (maxPlayers < currentPlayers) {
            throw new RoomSettingsException("현재 참가자 수보다 적은 인원으로 설정할 수 없어요.");
        }

        String roomPassword = null;
        String normalizedPassword = normalizePassword(password);
        if (passwordEnabled) {
            if (!normalizedPassword.isEmpty()) {
                validatePasswordLength(normalizedPassword, RoomSettingsException::new);
                roomPassword = passwordEncoder.encode(normalizedPassword);
            } else if (room.isLocked()) {
                roomPassword = roomMapper.findPasswordHash(roomId);
                if (roomPassword == null || roomPassword.isBlank()) {
                    throw new RoomSettingsException("비밀번호를 입력해 주세요.");
                }
            } else {
                throw new RoomSettingsException("비밀번호를 입력해 주세요.");
            }
        }

        if (roomMapper.updateSettings(roomId, maxPlayers, roomPassword) != 1) {
            throw new RoomSettingsException("게임방 설정을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
    }

    @Transactional
    public boolean startGame(long roomId) {
        return roomMapper.updateStatus(roomId, "PLAYING") == 1;
    }

    @Transactional
    public boolean resetGameToWaiting(long roomId) {
        return roomMapper.resetStatusToWaiting(roomId) == 1;
    }

    @Transactional
    public int resetInterruptedGamesToWaiting() {
        return roomMapper.resetInterruptedGamesToWaiting();
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
        validateMaxPlayers(maxPlayers, RoomCreationException::new);

        String normalizedPassword = normalizePassword(password);
        if (!normalizedPassword.isEmpty()) {
            validatePasswordLength(normalizedPassword, RoomCreationException::new);
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

    private static void validateMaxPlayers(
            Integer maxPlayers,
            Function<String, RuntimeException> exceptionFactory) {
        if (maxPlayers == null
                || maxPlayers < RoomGameRules.MIN_PLAYERS
                || maxPlayers > RoomGameRules.MAX_PLAYERS) {
            throw exceptionFactory.apply("최대 인원은 4명에서 8명 사이로 선택해 주세요.");
        }
    }

    private static String normalizePassword(String password) {
        return password == null ? "" : password.trim();
    }

    private static void validatePasswordLength(
            String normalizedPassword,
            Function<String, RuntimeException> exceptionFactory) {
        if (normalizedPassword.length() < 4 || normalizedPassword.length() > 20) {
            throw exceptionFactory.apply("비밀번호는 4자 이상 20자 이하로 입력해 주세요.");
        }
    }

    public static class RoomCreationException extends RuntimeException {
        public RoomCreationException(String message) {
            super(message);
        }
    }

    public static class RoomSettingsException extends RuntimeException {
        public RoomSettingsException(String message) {
            super(message);
        }
    }
}
