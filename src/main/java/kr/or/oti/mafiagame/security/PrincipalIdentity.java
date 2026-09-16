package kr.or.oti.mafiagame.security;

import java.security.Principal;

import org.springframework.security.core.Authentication;

/**
 * WebSocket 요청에서 애플리케이션 사용자 식별 정보를 추출한다.
 */
public record PrincipalIdentity(long userId, String nickname) {

    public static PrincipalIdentity from(Principal principal) {
        if (principal instanceof Authentication authentication
                && authentication.getPrincipal() instanceof CustomUserDetails user) {
            return new PrincipalIdentity(user.getUserId(), user.getNickname());
        }
        return new PrincipalIdentity(-1L, principal.getName());
    }
}
