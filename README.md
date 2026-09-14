# MAFIAGAME

Spring Boot와 Thymeleaf로 만드는 웹 기반 마피아 게임 프로젝트입니다. 현재는 게임 로비, 로그인·회원가입, 대기방의 화면 흐름을 구현한 초기 UI 프로토타입 단계입니다.

## 구현 체크리스트

현재 방, 참가자, 접속자 수, 채팅 메시지는 예시 데이터 또는 UI 동작입니다. 실제 서버 기능과 구분해 표시했습니다.

- [x] Java 21, Spring Boot 4.0.8, Gradle Wrapper 프로젝트 구성
- [x] MariaDB·MyBatis 연결 설정의 뼈대 구성
- [x] 애플리케이션 컨텍스트 로드 테스트
- [x] 게임 로비(`/`, `/rooms`) 화면
- [x] 예시 게임방 목록의 Thymeleaf 렌더링
- [x] 방 제목 검색 및 `대기 중`/`게임 중` 필터 UI
- [x] 입장·관전 링크 및 새 게임 만들기 안내 UI
- [x] 게임방(`/rooms/{roomId}`) 대기 화면
- [x] 참가자·빈 자리·기본 규칙·대기방 채팅 UI
- [x] 준비 완료 버튼 상태 전환과 초대·채팅 안내 UI
- [x] 로그인(`/login`) 및 회원가입(`/signup`) 화면
- [x] Spring Security 폼 로그인 설정과 로그인 실패/로그아웃 안내
- [x] 회원가입 입력 형식 및 비밀번호 일치 여부의 브라우저 검증
- [ ] 회원가입·계정 저장 및 실제 사용자 인증
- [ ] MariaDB 스키마, MyBatis 매퍼 및 데이터 조회
- [ ] 방 생성·입장·퇴장·비밀번호 검증
- [ ] 실시간 채팅과 준비 상태 동기화
- [ ] WebSocket/STOMP 기반 실시간 게임 진행
- [ ] 직업 배정, 낮/밤 진행, 투표, 승패 판정

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Language | Java 21 |
| Framework | Spring Boot 4.0.8 |
| Web | Spring MVC, Thymeleaf |
| Security | Spring Security |
| Data access | MyBatis 4.0.1 |
| Database | MariaDB |
| Build | Gradle Wrapper 8.14.5 |

## 실행 방법

### 사전 요구 사항

- JDK 21
- MariaDB (데이터 기능을 구현할 때 필요)

Windows에서 실행합니다.

```powershell
.\gradlew.bat bootRun
```

macOS 또는 Linux에서는 다음 명령을 사용합니다.

```bash
./gradlew bootRun
```

실행 후 [http://localhost:8080](http://localhost:8080)에서 로비를 확인할 수 있습니다.

테스트는 다음과 같이 실행합니다.

```powershell
.\gradlew.bat test
```

## 환경 변수

`src/main/resources/application.properties`에는 다음 MariaDB 연결 기본값이 설정되어 있습니다.

| 항목 | 기본값 |
| --- | --- |
| URL | `jdbc:mariadb://localhost:23306` |
| 사용자 | `root` (`DB_USERNAME`으로 변경 가능) |
| 비밀번호 | 빈 값 (`DB_PASSWORD`로 설정 가능) |

예시:

```powershell
$env:DB_USERNAME = "mafiagame"
$env:DB_PASSWORD = "your-password"
.\gradlew.bat bootRun
```

## 주요 경로

| 경로 | 설명 |
| --- | --- |
| `/` 또는 `/rooms` | 게임 로비 |
| `/rooms/{roomId}` | 게임방 대기 화면 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |

## 프로젝트 구조

```text
src/main/java/kr/or/oti/mafiagame/
├── auth/       # 인증 화면 컨트롤러
├── config/     # Spring Security 설정
├── room/       # 로비·게임방 컨트롤러와 예시 모델
└── MafiagameApplication.java

src/main/resources/
├── static/css/ # 인증·로비 화면 스타일
└── templates/  # Thymeleaf 화면 템플릿
```

## 다음 구현 우선순위

1. 회원가입 및 로그인 사용자 저장
2. 방·사용자 도메인과 MariaDB/MyBatis 연동
3. 방 생성·입장·대기 상태 관리
4. WebSocket 기반 채팅과 준비 상태 동기화
5. 게임 상태 머신, 역할·투표·승패 로직 구현
