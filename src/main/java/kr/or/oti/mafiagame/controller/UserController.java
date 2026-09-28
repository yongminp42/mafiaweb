package kr.or.oti.mafiagame.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import kr.or.oti.mafiagame.dto.UserProfile;
import kr.or.oti.mafiagame.security.CustomUserDetails;
import kr.or.oti.mafiagame.service.UserService;

@Controller
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users/{userId}")
    public String userDetail(@PathVariable("userId") long userId, Model model) {
        UserProfile profile = userService.getProfile(userId);
        if (profile == null) {
            return "redirect:/rooms";
        }

        model.addAttribute("user", profile);
        return "users/detail";
    }

    @GetMapping(value = "/users/me/level", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public Map<String, Integer> currentPlayerLevel(@AuthenticationPrincipal CustomUserDetails principal) {
        return Map.of("level", userService.getLevel(principal.getUserId()));
    }
}
