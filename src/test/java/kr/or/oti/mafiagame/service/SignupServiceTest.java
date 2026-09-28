package kr.or.oti.mafiagame.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;

import kr.or.oti.mafiagame.dao.UserMapper;
import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.service.SignupService.SignupException;

@ExtendWith(MockitoExtension.class)
class SignupServiceTest {
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    private SignupService signupService;

    @BeforeEach
    void setUp() {
        signupService = new SignupService(userMapper, passwordEncoder);
    }

    @Test
    void normalizesAndPersistsValidSignup() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenAnswer(invocation -> {
            invocation.<User>getArgument(0).setUserId(15L);
            return 1;
        });
        when(userMapper.insertStats(15L)).thenReturn(1);

        signupService.signup("  player  ", " USER@Example.COM ", "password123", "password123");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(userCaptor.capture());
        assertThat(userCaptor.getValue().getUserName()).isEqualTo("player");
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded");
        verify(userMapper).insertStats(15L);
    }

    @Test
    void rejectsInvalidInputsAndDuplicateEmail() {
        assertThatThrownBy(() -> signupService.signup("x", "user@example.com", "password123", "password123"))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "invalid", "password123", "password123"))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "short", "short"))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "password123", "different"))
                .isInstanceOf(SignupException.class);

        when(userMapper.existsByEmail("user@example.com")).thenReturn(true);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "password123", "password123"))
                .isInstanceOf(SignupException.class);
    }

    @Test
    void convertsDatabaseDuplicateFailureToDomainException() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> signupService.signup(
                "player", "user@example.com", "password123", "password123"))
                .isInstanceOf(SignupException.class);
    }

    @Test
    void rejectsUnexpectedInsertResult() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenReturn(0);

        assertThatThrownBy(() -> signupService.signup(
                "player", "user@example.com", "password123", "password123"))
                .isInstanceOf(SignupException.class);
    }
}
