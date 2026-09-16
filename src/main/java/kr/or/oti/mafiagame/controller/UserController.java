package kr.or.oti.mafiagame.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import kr.or.oti.mafiagame.dto.UserProfile;
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
}
