package kr.or.oti.mafiagame.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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
                stats.getLosses(),
                stats.getExperience(),
                formatJoinedAt(user.getCreatedAt()));

        return profile;
    }

    @Transactional(readOnly = true)
    public int getLevel(long userId) {
        UserStats stats = userMapper.findStatsByUserId(userId);
        int experience = stats == null ? UserStats.DEFAULT_RATING : stats.getExperience();
        return UserStats.levelForExperience(experience);
    }

    private String normalizeBio(String bio) {
        return bio == null || bio.isBlank() ? "아직 소개가 없습니다." : bio;
    }

    private String formatJoinedAt(LocalDateTime createdAt) {
        return createdAt == null ? "가입일 정보 없음" : JOINED_AT_FORMAT.format(createdAt) + " 가입";
    }
}
