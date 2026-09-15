package kr.or.oti.mafiagame.security;

import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import kr.or.oti.mafiagame.domain.User;

public class CustomUserDetails extends org.springframework.security.core.userdetails.User {
    private static final long serialVersionUID = 1L;
    private final long userId;
    private final String nickname;

    public CustomUserDetails(User user) {
        super(user.getEmail(), user.getPassword(), List.of(new SimpleGrantedAuthority("ROLE_USER")));
        this.userId = user.getUserId();
        this.nickname = user.getUserName();
    }

    public long getUserId() { return userId; }

    public String getNickname() { return nickname; }
}
