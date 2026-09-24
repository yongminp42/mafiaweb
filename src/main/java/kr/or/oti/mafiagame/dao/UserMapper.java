package kr.or.oti.mafiagame.dao;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.oti.mafiagame.domain.User;
import kr.or.oti.mafiagame.domain.UserStats;

@Mapper
public interface UserMapper {
    int insert(User user);

    int insertStats(@Param("userId") long userId);

    int insertGameCompletion(
            @Param("gameId") String gameId,
            @Param("roomId") long roomId,
            @Param("winnerFaction") String winnerFaction);

    boolean gameCompletionExists(@Param("gameId") String gameId);

    int incrementGameStats(
            @Param("userId") long userId,
            @Param("wins") int wins,
            @Param("losses") int losses);

    Optional<User> findById(@Param("userId") Long userId);

    UserStats findStatsByUserId(@Param("userId") long userId);

    Optional<User> findByEmail(@Param("email") String email);

    boolean existsByEmail(@Param("email") String email);

    int updateNickname(
            @Param("userId") Long userId,
            @Param("nickname") String nickname
    );

    int deleteById(@Param("userId") Long userId);
}
