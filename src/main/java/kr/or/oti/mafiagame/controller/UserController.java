package kr.or.oti.mafiagame.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class UserController {

    @GetMapping("/users/{userId}")
    public String userDetail(@PathVariable("userId") long userId, Model model) {
        model.addAttribute("user", new UserProfile(
                userId,
                "유진",
                "마을을 지키는 밤의 추리꾼",
                48,
                31,
                17,
                12,
                "2026년 9월 가입"
        ));
        model.addAttribute("recentGames", List.of(
                new GameRecord("달빛 아래의 마피아", "시민", "승리", "생존", "12분 전"),
                new GameRecord("새벽 2시 시민들", "마피아", "승리", "생존", "어제"),
                new GameRecord("명탐정들의 밤", "경찰", "패배", "사망", "2일 전"),
                new GameRecord("오늘의 마지막 게임", "의사", "승리", "생존", "3일 전")
        ));
        return "users/detail";
    }

    public record UserProfile(long id, String nickname, String bio, int totalGames,
                              int wins, int mafiaGames, int mafiaWins, String joinedAt) {
        public int winRate() {
            return totalGames == 0 ? 0 : Math.round((float) wins / totalGames * 100);
        }

        public int mafiaWinRate() {
            return mafiaGames == 0 ? 0 : Math.round((float) mafiaWins / mafiaGames * 100);
        }
    }

    public record GameRecord(String roomTitle, String role, String result, String status, String playedAt) {
    }
}
