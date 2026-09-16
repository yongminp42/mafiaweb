package kr.or.oti.mafiagame.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.oti.mafiagame.dao.UserMapper;
import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.domain.UserStats;
import kr.or.oti.mafiagame.dto.UserProfile;

@Service
public class UserService {
    private static final DateTimeFormatter JOINED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy년 M월");

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public UserProfile getProfile(long userId) {
        User user = userMapper.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        UserStats stats = userMapper.findStatsByUserId(userId);
        if (stats == null) {
            stats = new UserStats();
        }

        UserProfile profile = new UserProfile(
                user.getUserId(),
                user.getUserName(),
                normalizeBio(user.getBio()),
                stats.getTotalGames(),
                stats.getWins(),
                null,
                null,
                formatJoinedAt(user.getCreatedAt()),
                List.of());

        // 현재 스키마에는 게임 종료 이력 테이블이 없으므로 임의의 기록을 만들지 않는다.
        return profile;
    }

    private String normalizeBio(String bio) {
        return bio == null || bio.isBlank() ? "아직 소개가 없습니다." : bio;
    }

    private String formatJoinedAt(LocalDateTime createdAt) {
        return createdAt == null ? "가입일 정보 없음" : JOINED_AT_FORMAT.format(createdAt) + " 가입";
    }
}
