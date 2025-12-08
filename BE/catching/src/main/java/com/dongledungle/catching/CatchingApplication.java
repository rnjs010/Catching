package com.dongledungle.catching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Catching 애플리케이션 메인 클래스
 * Spring Boot 애플리케이션 시작점
 */
@SpringBootApplication
public class CatchingApplication {

	/**
	 * 애플리케이션 시작 메서드
	 *
	 * @param args 커맨드 라인 인자
	 */
	public static void main(String[] args) {
		SpringApplication.run(CatchingApplication.class, args);
	}
}