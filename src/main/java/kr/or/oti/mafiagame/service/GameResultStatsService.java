package kr.or.oti.mafiagame.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.oti.mafiagame.dao.UserMapper;
import kr.or.oti.mafiagame.dto.GameFaction;

@Service
public class GameResultStatsService {
    private final UserMapper userMapper;

    public GameResultStatsService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Transactional
    public void recordCompletedGame(
            String gameId,
            long roomId,
            GameFaction winner,
            List<PlayerOutcome> playerOutcomes) {
        if (gameId == null || gameId.isBlank() || winner == null
                || playerOutcomes == null || playerOutcomes.isEmpty()) {
            throw new IllegalArgumentException("완료된 게임 통계에 필요한 값이 없습니다.");
        }

        Set<Long> userIds = new HashSet<>();
        for (PlayerOutcome outcome : playerOutcomes) {
            if (outcome == null || outcome.userId() <= 0 || !userIds.add(outcome.userId())) {
                throw new IllegalArgumentException("게임 참가자 통계가 올바르지 않습니다.");
            }
        }

        try {
            userMapper.insertGameCompletion(gameId, roomId, winner.name());
        } catch (DuplicateKeyException duplicate) {
            if (userMapper.gameCompletionExists(gameId)) {
                return;
            }
            throw duplicate;
        }

        for (PlayerOutcome outcome : playerOutcomes) {
            int updatedRows = incrementStats(outcome);
            if (updatedRows <= 0) {
                throw new IllegalStateException("참가자 게임 통계를 갱신하지 못했습니다.");
            }
        }
    }

    private int incrementStats(PlayerOutcome outcome) {
        int updatedRows = userMapper.incrementGameStats(
                outcome.userId(), outcome.won() ? 1 : 0, outcome.won() ? 0 : 1);
        if (updatedRows > 0) {
            return updatedRows;
        }

        try {
            userMapper.insertStats(outcome.userId());
        } catch (DuplicateKeyException concurrentInsert) {
            // Another completion created the missing stats row; update that row below.
        }
        return userMapper.incrementGameStats(
                outcome.userId(), outcome.won() ? 1 : 0, outcome.won() ? 0 : 1);
    }

    public record PlayerOutcome(long userId, boolean won) {
    }
}
