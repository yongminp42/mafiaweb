package kr.or.oti.mafiagame.controller;

import java.util.List;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import kr.or.oti.mafiagame.service.RoomService;

@Controller
public class RoomController {
    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping({"/", "/rooms"})
    public String roomList(Model model) {
        model.addAttribute("rooms", roomService.getRooms());
        return "rooms/list";
    }

    @GetMapping("/rooms/{roomId}")
    public String roomDetail(@PathVariable("roomId") int roomId, Model model) {
        model.addAttribute("roomId", roomId);
        model.addAttribute("room", new RoomView("Moonlight Mafia", "Beginner friendly · quick game", 6, 8, "WAITING", false));
        model.addAttribute("members", List.of("Yujin", "Minsu", "Soyeon", "Dohyun", "Haneul", "Jihu"));
        return "rooms/detail";
    }

    public record RoomView(String title, String description, int players, int capacity,
                           String status, boolean locked) {
    }
}
