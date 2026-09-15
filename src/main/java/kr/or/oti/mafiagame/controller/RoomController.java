package kr.or.oti.mafiagame.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import kr.or.oti.mafiagame.domain.RoomList;
import kr.or.oti.mafiagame.security.CustomUserDetails;
import kr.or.oti.mafiagame.service.RoomService;
import kr.or.oti.mafiagame.service.RoomService.RoomCreationException;

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

    @GetMapping("/rooms/new")
    public String roomCreateForm(Model model) {
        model.addAttribute("maxPlayers", 8);
        model.addAttribute("hasPassword", false);
        return "rooms/create";
    }

    @PostMapping("/rooms")
    public String createRoom(
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "maxPlayers", required = false) Integer maxPlayers,
            @RequestParam(name = "password", required = false) String password,
            @AuthenticationPrincipal CustomUserDetails user,
            Model model) {
        try {
            long roomId = roomService.createRoom(user.getUserId(), title, maxPlayers, password);
            return "redirect:/rooms/" + roomId;
        } catch (RoomCreationException exception) {
            model.addAttribute("roomError", exception.getMessage());
            model.addAttribute("title", title);
            model.addAttribute("maxPlayers", maxPlayers == null ? 8 : maxPlayers);
            model.addAttribute("hasPassword", password != null && !password.trim().isEmpty());
            return "rooms/create";
        }
    }

    @GetMapping("/rooms/{roomId}")
    public String roomDetail(
            @PathVariable("roomId") long roomId,
            @AuthenticationPrincipal CustomUserDetails user,
            Model model) {
        model.addAttribute("roomId", roomId);
        model.addAttribute("nickname", user == null ? "" : user.getNickname());
        model.addAttribute("userId", user == null ? "" : user.getUserId());
        RoomList room = roomService.getRoom(roomId);
        if (room == null) {
            model.addAttribute("room", new RoomView(
                    "Moonlight Mafia", "Beginner friendly · quick game", 6, 8, "WAITING", false));
            model.addAttribute("members", List.of("Yujin", "Minsu", "Soyeon", "Dohyun", "Haneul", "Jihu"));
        } else {
            model.addAttribute("room", new RoomView(
                    room.getTitle(),
                    room.getHostName() + "님이 만든 대기방 · 인원이 모이면 시작해요",
                    room.getCurrentPlayers(),
                    room.getMaxPlayers(),
                    room.getStatus(),
                    room.isLocked()));
            model.addAttribute("members", roomService.getMemberNames(roomId));
        }
        return "rooms/detail";
    }

    public record RoomView(String title, String description, int players, int capacity,
                           String status, boolean locked) {
    }
}
