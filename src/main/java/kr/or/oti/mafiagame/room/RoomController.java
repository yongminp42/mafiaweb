package kr.or.oti.mafiagame.room;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@Controller
public class RoomController {

    @GetMapping({"/", "/rooms"})
    public String roomList(Model model) {
        model.addAttribute("rooms", List.of(
                new Room("달빛 아래의 마피아", "초보 환영 · 빠른 진행", 6, 8, "WAITING", false),
                new Room("새벽 2시 시민들", "추리 고수만", 8, 10, "PLAYING", false),
                new Room("비밀 아지트", "친구와 함께 플레이", 4, 6, "WAITING", true),
                new Room("오늘의 마지막 게임", "편하게 즐기는 방", 7, 12, "WAITING", false),
                new Room("명탐정들의 밤", "음성 채팅 권장", 9, 10, "PLAYING", false),
                new Room("마피아 입문반", "규칙을 처음 배워도 괜찮아요", 3, 8, "WAITING", false)
        ));
        return "rooms/list";
    }

    @GetMapping("/rooms/{roomId}")
    public String roomDetail(@PathVariable("roomId") int roomId, Model model) {
        model.addAttribute("roomId", roomId);
        model.addAttribute("room", new Room("Moonlight Mafia", "Beginner friendly · quick game", 6, 8, "WAITING", false));
        model.addAttribute("members", List.of("Yujin", "Minsu", "Soyeon", "Dohyun", "Haneul", "Jihu"));
        return "rooms/detail";
    }

    public record Room(String title, String description, int players, int capacity,
                       String status, boolean locked) {
    }
}
