# 로그인 기능

- 이메일과 비밀번호로 `POST /login`에 로그인합니다.
- 성공 시 `/rooms`, 실패 시 `/login?error`로 이동합니다.
- 로비에는 로그인한 사용자의 이름과 로그아웃 버튼이 표시됩니다.
- `POST /logout`은 세션을 종료하고 `/login?logout`으로 이동합니다.
- 로비 목록, 로그인, 회원가입 화면과 CSS는 공개됩니다. 방 상세와 프로필은 로그인이 필요합니다.
- 로그인 및 로그아웃 폼에는 Thymeleaf가 CSRF 토큰을 포함합니다.

## DB 준비

기존 `mafiasql.sql`의 `user` 테이블을 기준으로 MyBatis 매핑을 통일했습니다.
SQL 파일 수정은 이미 만들어진 DB에 자동으로 반영되지 않습니다.
기존 DB의 이메일 중복 여부를 먼저 확인하고, 중복을 정리한 뒤 UNIQUE 제약을 적용하세요.

```sql
SELECT email, COUNT(*) FROM `user` GROUP BY email HAVING COUNT(*) > 1;
ALTER TABLE `user` ADD CONSTRAINT uk_user_email UNIQUE (email);
```

이미 이메일 UNIQUE 제약이 있다면 ALTER 문은 실행하지 않습니다.
회원가입은 `POST /signup`에서 입력값과 이메일 중복을 검사하고 BCrypt로 암호화한 계정을 `user` 테이블에 저장합니다.
이메일은 공백 제거와 소문자 변환 후 저장하며, 닉네임은 2~30자, 비밀번호는 8~72자로 제한합니다.
기존 평문 비밀번호는 지원하지 않습니다. 자동 테스트는 테스트 DB를 사용하며 실제 DB 계정을 변경하지 않습니다.

## 검증

```powershell
.\gradlew.bat --gradle-user-home .gradle-test test --tests kr.or.oti.mafiagame.LoginIntegrationTests --tests kr.or.oti.mafiagame.SignupIntegrationTests --tests kr.or.oti.mafiagame.MafiagameApplicationTests
```

H2 테스트 DB에서 회원가입 저장·검증·중복 방지, 실제 MyBatis 조회, BCrypt 비교, 로그인 실패, 접근 제한, CSRF, 로그아웃과 세션 무효화를 검증합니다.
별도 `testconn` 테스트는 로컬 MariaDB 연결에 의존하므로 위 실행 대상에서 제외합니다.
로그인 유지, 비밀번호 찾기, Google 로그인은 구현 범위에 포함하지 않았으며 로그인 화면의 미연결 버튼을 제거했습니다.
