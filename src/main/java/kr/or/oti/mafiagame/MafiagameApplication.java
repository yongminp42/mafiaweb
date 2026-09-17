package kr.or.oti.mafiagame;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("kr.or.oti.mafiagame.dao")
public class MafiagameApplication {

	public static void main(String[] args) {
		SpringApplication.run(MafiagameApplication.class, args);
	}

}
