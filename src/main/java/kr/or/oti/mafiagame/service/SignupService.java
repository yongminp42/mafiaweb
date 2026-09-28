package kr.or.oti.mafiagame.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.oti.mafiagame.dao.UserMapper;
import kr.or.oti.mafiagame.domain.User;

@Service
public class SignupService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public SignupService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void signup(String nickname, String email, String password, String passwordConfirm) {
        String normalizedNickname = nickname == null ? "" : nickname.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);

        if (normalizedNickname.length() < 2 || normalizedNickname.length() > 30) {
            throw new SignupException("닉네임은 2자 이상 30자 이하로 입력해 주세요.");
        }
        if (normalizedEmail.length() > 255 || !EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new SignupException("올바른 이메일 주소를 입력해 주세요.");
        }
        if (password == null || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new SignupException("비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.");
        }
        if (!password.equals(passwordConfirm)) {
            throw new SignupException("비밀번호가 서로 다릅니다.");
        }
        if (userMapper.existsByEmail(normalizedEmail)) {
            throw new SignupException("이미 사용 중인 이메일입니다.");
        }

        try {
            User user = User.builder()
                    .userName(normalizedNickname)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(password))
                    .user_level(1)
                    .build();
            if (userMapper.insert(user) != 1) {
                throw new SignupException("회원 정보를 저장하지 못했습니다.");
            }
            if (userMapper.insertStats(user.getUserId()) != 1) {
                throw new SignupException("회원 통계를 초기화하지 못했습니다.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new SignupException("이미 사용 중인 이메일입니다.");
        }
    }

    public static class SignupException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        public SignupException(String message) {
            super(message);
        }
    }
}
