package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import kr.or.oti.mafiagame.dao.UserMapper;
import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.domain.UserStats;
import kr.or.oti.mafiagame.dto.UserProfile;
import kr.or.oti.mafiagame.security.CustomUserDetails;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {
    @Mock
    private UserMapper userMapper;

    @Test
    void buildsProfileFromUserAndStats() {
        User user = user(5L, " Player@Example.com ", "player");
        user.setBio(" ");
        user.setCreatedAt(LocalDateTime.of(2026, 9, 1, 12, 0));
        UserStats stats = new UserStats();
        stats.setTotalGames(10);
        stats.setWins(6);
        when(userMapper.findById(5L)).thenReturn(Optional.of(user));
        when(userMapper.findStatsByUserId(5L)).thenReturn(stats);

        UserProfile profile = new UserService(userMapper).getProfile(5L);

        assertThat(profile.nickname()).isEqualTo("player");
        assertThat(profile.bio()).isEqualTo("아직 소개가 없습니다.");
        assertThat(profile.totalGames()).isEqualTo(10);
        assertThat(profile.winRate()).isEqualTo(60);
        assertThat(profile.joinedAt()).isEqualTo("2026년 9월 가입");
    }

    @Test
    void missingUserReturnsNullWithoutStatsQuery() {
        when(userMapper.findById(404L)).thenReturn(Optional.empty());

        assertThat(new UserService(userMapper).getProfile(404L)).isNull();
        verify(userMapper, never()).findStatsByUserId(404L);
    }

    @Test
    void loginLookupNormalizesEmailAndBuildsUserDetails() {
        User user = user(5L, "player@example.com", "player");
        when(userMapper.findByEmail("player@example.com")).thenReturn(Optional.of(user));

        CustomUserDetails details = (CustomUserDetails) new CustomUserDetailsService(userMapper)
                .loadUserByUsername(" Player@Example.COM ");

        assertThat(details.getUserId()).isEqualTo(5L);
        assertThat(details.getNickname()).isEqualTo("player");
        verify(userMapper).findByEmail("player@example.com");
    }

    @Test
    void loginLookupRejectsUnknownEmail() {
        when(userMapper.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new CustomUserDetailsService(userMapper)
                .loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    private static User user(long userId, String email, String nickname) {
        return User.builder()
                .userId(userId)
                .email(email)
                .userName(nickname)
                .password("encoded")
                .user_level(1)
                .build();
    }
}
