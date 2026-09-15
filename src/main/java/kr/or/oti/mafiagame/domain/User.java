package kr.or.oti.mafiagame.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "password")
public class User {
    private long    userId;

    private String  userName;

    private String  email;

    private String  password;

    private int     user_level;

    private String  bio;
    
}
