package kr.or.oti.mafiagame.dao;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.oti.mafiagame.domain.User;

@Mapper
public interface UserMapper {
    int insert(User user);

    Optional<User> findById(@Param("userId") Long userId);

    Optional<User> findByEmail(@Param("email") String email);

    boolean existsByEmail(@Param("email") String email);

    int updateNickname(
            @Param("userId") Long userId,
            @Param("nickname") String nickname
    );

    int deleteById(@Param("userId") Long userId);
}
