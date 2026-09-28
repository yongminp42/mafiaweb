package kr.or.oti.mafiagame.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import kr.or.oti.mafiagame.service.SignupService;
import kr.or.oti.mafiagame.service.SignupService.SignupException;

@Controller
public class AuthController {
    private final SignupService signupService;

    public AuthController(SignupService signupService) {
        this.signupService = signupService;
    }

    @GetMapping("/login")
    public String login() {
        return "auth/login";
    }

    @GetMapping("/signup")
    public String signup() {
        return "auth/signup";
    }

    @PostMapping("/signup")
    public String signup(
            @RequestParam(name = "nickname", required = false) String nickname,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "password", required = false) String password,
            @RequestParam(name = "passwordConfirm", required = false) String passwordConfirm,
            Model model) {
        try {
            signupService.signup(nickname, email, password, passwordConfirm);
            return "redirect:/login?signup";
        } catch (SignupException exception) {
            model.addAttribute("signupError", exception.getMessage());
            model.addAttribute("nickname", nickname);
            model.addAttribute("email", email);
            return "auth/signup";
        }
    }
}
