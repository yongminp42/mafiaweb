package kr.or.oti.mafiagame.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import jakarta.servlet.http.HttpSession;

import kr.or.oti.mafiagame.dto.RoomPresenceState;
import kr.or.oti.mafiagame.dto.RoomView;
import kr.or.oti.mafiagame.security.CustomUserDetails;
import kr.or.oti.mafiagame.security.RoomAccess;
import kr.or.oti.mafiagame.service.RoomPresenceService;
import kr.or.oti.mafiagame.service.RoomService;
import kr.or.oti.mafiagame.service.RoomService.RoomCreationException;
import kr.or.oti.mafiagame.service.RoomService.RoomSettingsException;

@Controller
public class RoomController {
    private final RoomService roomService;
    private final RoomPresenceService roomPresenceService;

    public RoomController(RoomService roomService, RoomPresenceService roomPresenceService) {
        this.roomService = roomService;
        this.roomPresenceService = roomPresenceService;
    }

    @GetMapping({"/", "/rooms"})
    public String roomList(Model model) {
        Map<Long, Integer> liveCounts = roomPresenceService.currentCounts();
        List<RoomView> rooms = roomService.getRooms().stream()
                .map(room -> room.withPlayerCount(liveCounts.getOrDefault(room.roomId(), 0)))
                .toList();
        model.addAttribute("rooms", rooms);
        int roomPlayerCount = 0;
        for (Integer count : liveCounts.values()) {
            if (count != null) {
                roomPlayerCount += count.intValue();
            }
        }
        int onlinePlayerCount = Math.max(
                roomPresenceService.currentOnlinePlayerCount(),
                roomPlayerCount);
        model.addAttribute("onlinePlayerCount", onlinePlayerCount);
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
            HttpSession session,
            Model model) {
        try {
            long roomId = roomService.createRoom(user.getUserId(), title, maxPlayers, password);
            if (password != null && !password.trim().isEmpty()) {
                RoomAccess.grant(session, roomId);
            }
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
            HttpSession session,
            Model model) {
        model.addAttribute("roomId", roomId);
        model.addAttribute("nickname", user == null ? "" : user.getNickname());
        model.addAttribute("userId", user == null ? "" : user.getUserId());
        RoomView room = roomService.getRoomView(roomId);
        if (room == null) {
            return "redirect:/rooms";
        }
        boolean isHost = user != null && room.hostUserId() == user.getUserId();
        if (room.locked() && !isHost && !RoomAccess.isGranted(session, roomId)) {
            model.addAttribute("room", room);
            return "rooms/access";
        }

        RoomPresenceState livePresence = roomPresenceService.currentState(roomId);
        model.addAttribute("livePresence", livePresence);
        List<String> members;
        if (livePresence != null) {
            room = room.withPlayerCount(livePresence.participants().size());
            members = livePresence.participants().stream()
                    .map(participant -> participant.nickname())
                    .toList();
        } else {
            // room_members는 WebSocket 세션 종료 후 stale 상태가 될 수 있으므로
            // 현재 접속자가 확인되기 전에는 실제 참가자로 표시하지 않는다.
            room = room.withPlayerCount(0);
            members = List.of();
        }

        model.addAttribute("room", room);
        model.addAttribute("members", members);
        model.addAttribute("isHost", isHost);
        return "rooms/detail";
    }

    @PostMapping("/rooms/{roomId}/settings")
    public String updateRoomSettings(
            @PathVariable("roomId") long roomId,
            @RequestParam(name = "maxPlayers", required = false) Integer maxPlayers,
            @RequestParam(name = "passwordEnabled", defaultValue = "false") boolean passwordEnabled,
            @RequestParam(name = "password", required = false) String password,
            @AuthenticationPrincipal CustomUserDetails user,
            RedirectAttributes redirectAttributes) {
        try {
            if (user == null) {
                throw new RoomSettingsException("로그인 후 게임방 설정을 변경할 수 있어요.");
            }
            roomPresenceService.updateRoomSettings(
                    roomId,
                    user.getUserId(),
                    maxPlayers,
                    passwordEnabled,
                    password);
            redirectAttributes.addFlashAttribute("roomSettingsSuccess", "방 설정이 저장되었습니다.");
        } catch (RoomSettingsException exception) {
            redirectAttributes.addFlashAttribute("roomSettingsError", exception.getMessage());
        }
        return "redirect:/rooms/" + roomId;
    }

    @PostMapping("/rooms/{roomId}/access")
    public String accessRoom(
            @PathVariable("roomId") long roomId,
            @RequestParam(name = "password", required = false) String password,
            HttpSession session,
            Model model) {
        RoomView room = roomService.getRoomView(roomId);
        if (room == null) {
            return "redirect:/rooms";
        }
        if (!room.locked() || roomService.verifyRoomPassword(roomId, password)) {
            RoomAccess.grant(session, roomId);
            return "redirect:/rooms/" + roomId;
        }

        model.addAttribute("roomId", roomId);
        model.addAttribute("room", room);
        model.addAttribute("accessError", "방 비밀번호가 올바르지 않습니다.");
        return "rooms/access";
    }
}
