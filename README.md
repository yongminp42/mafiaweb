# MAFIAGAME

Spring Boot와 Thymeleaf로 만드는 웹 기반 마피아 게임 프로젝트입니다. 현재는 게임 로비, 로그인·회원가입, 대기방의 화면 흐름을 구현한 초기 UI 프로토타입 단계입니다.

## 구현 체크리스트

현재 방, 참가자, 접속자 수는 일부 예시 데이터이며, 게임방 채팅은 인증된 사용자끼리 WebSocket/STOMP로 실시간 전송됩니다.

- [x] Java 17, Spring Boot 3.5.16, Gradle Wrapper 프로젝트 구성
- [x] MariaDB·MyBatis 연결 설정의 뼈대 구성
- [x] 애플리케이션 컨텍스트 로드 테스트
- [x] 게임 로비(`/`, `/rooms`) 화면
- [x] 예시 게임방 목록의 Thymeleaf 렌더링
- [x] 방 제목 검색 및 `대기 중`/`게임 중` 필터 UI
- [x] 입장·관전 링크 및 새 게임 만들기 안내 UI
- [x] 게임방(`/rooms/{roomId}`) 대기 화면
- [x] 참가자·빈 자리·기본 규칙·대기방 채팅 UI
- [x] 게임방 인증 사용자 간 실시간 채팅
- [x] 준비 완료 버튼 상태 전환과 초대·채팅 안내 UI
- [x] 로그인(`/login`) 및 회원가입(`/signup`) 화면
- [x] Spring Security 폼 로그인 설정과 로그인 실패/로그아웃 안내
- [x] 회원가입 입력 형식 및 비밀번호 일치 여부의 브라우저 검증
- [ ] 회원가입·계정 저장 및 실제 사용자 인증
- [ ] MariaDB 스키마, MyBatis 매퍼 및 데이터 조회
- [ ] 방 생성·입장·퇴장·비밀번호 검증
- [x] 실시간 채팅
- [ ] 준비 상태 동기화
- [ ] WebSocket/STOMP 기반 실시간 게임 진행
- [ ] 직업 배정, 낮/밤 진행, 투표, 승패 판정

## MVP 상세 개발 체크리스트

### 범위와 운영 정책

- [ ] MVP 참여 인원을 4~8명으로 확정한다.
- [ ] 방 최대 인원, 비회원 플레이, 재접속 허용 시간을 결정한다.
- [ ] 동률 투표, 방장 위임, 게임 중 이탈 처리 규칙을 정의한다.
- [ ] MVP에서 제외할 기능(친구, 랭킹, 음성 채팅, 신고, 매칭, 아이템)을 문서화한다.
- [ ] 단일 서버 운영과 인메모리 게임 상태의 제약을 명시한다.

### 프로젝트 기반

- [x] Java 17 및 Gradle Wrapper 환경에서 빌드·테스트를 확인한다.
- [x] WebSocket 의존성 버전을 Spring Boot BOM과 호환되게 정리한다.
- [ ] 개발·테스트·운영 프로필을 분리한다.
- [x] DB 계정 정보를 환경 변수로 받을 수 있게 한다.
- [ ] 공통 응답, 예외 코드, 로그 형식을 정의한다.
- [ ] `.gitignore`에 IDE 설정, Gradle 캐시, 환경 변수 파일을 반영한다.

### 회원과 전적 데이터

- [ ] `users` 테이블과 회원 엔티티를 만든다.
- [ ] 이메일 UNIQUE 제약, 닉네임 정책, 회원 상태를 정의한다.
- [ ] 비밀번호를 BCrypt로 암호화하고 생성·수정 시각을 기록한다.
- [ ] `user_stats`, `game_history`, `game_player_log` 테이블을 만든다.
- [ ] 게임 종료 기록과 전적 갱신을 하나의 트랜잭션으로 처리한다.

### 게임 상태 모델

- [ ] `RoomState`, `PlayerSession`, `GamePhase`, `Role`, `PlayerStatus`, `NightAction`을 정의한다.
- [ ] `ConcurrentHashMap`으로 방 상태를 관리한다.
- [ ] 참가자, 투표, 밤 행동 데이터의 소유 관계를 명확히 한다.
- [ ] 방 단위 Lock 또는 동기화 전략을 적용한다.
- [ ] 게임 종료와 빈 방 삭제 시 메모리를 정리한다.

### 인증과 회원가입

- [ ] 회원가입 DTO와 서버 측 검증 규칙을 만든다.
- [ ] 이메일·닉네임 중복 검사 API를 구현한다.
- [ ] 회원가입 서비스와 저장 로직을 구현한다.
- [ ] `UserDetailsService`를 구현해 실제 로그인을 연결한다.
- [x] 로그인 성공 뒤 로비로 이동하도록 설정한다.
- [x] 로그인 실패 화면 안내를 표시한다.
- [ ] 로그아웃 기능을 연결하고, 로그인 사용자의 닉네임을 로비에 표시한다.
- [ ] 인증이 필요한 방 생성·입장 경로를 보호한다.

### 로비와 방 관리

- [ ] DB 기반 방 목록 조회 API를 구현한다.
- [x] 방 상태 필터와 제목 검색 UI를 제공한다.
- [ ] 현재 인원과 최대 인원을 실시간 또는 주기적으로 갱신한다.
- [x] 비밀번호 방 아이콘을 표시하는 UI를 제공한다.
- [ ] 종료·삭제된 방 접근 시 안내 화면을 제공한다.
- [ ] 방 생성 화면에서 제목, 정원, 비밀번호, 공개 여부를 입력받는다.
- [ ] 방 생성자를 방장으로 지정하고 초대 코드 또는 URL을 발급한다.
- [ ] 비밀번호 검증, 정원 초과 차단, 중복 입장 방지를 서버에서 처리한다.
- [ ] 게임 중인 방의 참가와 관전을 구분한다.

### 대기실

- [ ] 입장·퇴장 이벤트를 방 전체에 전송한다.
- [ ] 참가자의 준비 상태를 실시간으로 변경한다.
- [ ] 방장 시작 권한, 강퇴, 방장 위임 규칙을 구현한다.
- [ ] 최소 인원과 전원 준비 여부를 서버에서 검증한다.
- [ ] 게임 시작 뒤 신규 참가를 차단한다.

### WebSocket/STOMP

- [x] WebSocket 엔드포인트(`/ws`)와 STOMP broker를 설정한다.
- [x] SockJS 대신 브라우저 기본 WebSocket을 사용하도록 결정한다.
- [x] 인증 사용자를 WebSocket 세션과 연결한다.
- [ ] 구독 시 방 참가 여부와 역할별 권한을 검증한다.
- [x] 공개 채팅을 구현한다.
- [x] `CHAT`, `ERROR` 메시지 타입을 정의한다.
- [ ] 연결 종료와 비정상 종료를 처리하고 재접속 시 방 상태를 복원한다.

### 게임 진행과 타이머

- [ ] 상태 전이를 하나의 서비스에서만 수행하도록 설계한다.
- [ ] `WAITING → ROLE_ASSIGNMENT → DAY_DISCUSSION → NOMINATION_VOTE` 전이를 구현한다.
- [ ] `FINAL_DEFENSE → EXECUTION_VOTE → NIGHT → RESULT` 전이와 반복을 구현한다.
- [ ] 잘못된 페이즈의 행동을 서버에서 거부한다.
- [ ] 페이즈별 제한 시간과 서버 기준 종료 시각을 설정한다.
- [ ] 남은 시간을 브로드캐스트하고 타이머 종료 시 한 번만 페이즈를 전환한다.
- [ ] 방 삭제와 게임 종료 시 예약 작업을 취소한다.

### 직업, 채팅, 투표

- [ ] 인원별 마피아 수와 의사·경찰·시민 배정 규칙을 구현한다.
- [ ] 직업을 안전한 난수로 섞고 개인 메시지로만 전달한다.
- [ ] 마피아 상호 확인, 처치 대상 선택, 의사 보호, 경찰 조사를 구현한다.
- [ ] 밤 행동 결과를 원자적으로 계산하고 사망 후 승리 조건을 검사한다.
- [ ] 생존·역할·페이즈에 따라 채팅 권한을 서버에서 검증한다.
- [ ] 메시지 길이, 빈 메시지, XSS, 도배 방지 규칙을 적용한다.
- [ ] 생존자만 투표하도록 하고 페이즈별 1인 1표를 보장한다.
- [ ] 재투표와 동률 처리 규칙을 적용하고 동시 집계를 보호한다.
- [ ] 지목 투표와 찬반 투표 결과에 따라 처형을 처리한다.

### 승패, 화면, 품질

- [ ] 마피아 수와 시민 수를 계산해 승리 조건을 판정한다.
- [ ] 게임 종료 때 역할 공개, 전적 저장, 결과 화면을 제공한다.
- [ ] 다시 하기와 로비 이동을 제공한다.
- [ ] 게임 진행, 직업 카드, 타이머, 투표, 결과 UI를 구현한다.
- [ ] 로딩·빈 상태·오류·재접속 화면을 제공한다.
- [ ] REST와 WebSocket DTO에 Bean Validation을 적용한다.
- [ ] 전역 예외 처리, 보안 로그 정책, SQL Injection/XSS/CSRF 점검을 수행한다.
- [ ] 역할 배정, 상태 전이, 승패 조건, 투표, 재접속 단위 테스트를 작성한다.
- [ ] 인증·방 관리·WebSocket 권한·다중 방 진행 통합 테스트를 작성한다.
- [ ] 여러 브라우저와 모바일에서 한 게임을 끝까지 진행하는 E2E 테스트를 수행한다.

### 배포 준비

- [ ] Flyway 등으로 운영 DB 스키마 관리 방식을 결정한다.
- [ ] 서버 타임존, HTTPS, Secure Cookie, WebSocket 프록시를 설정한다.
- [ ] 배포 환경에 비밀값을 등록하고 상태 확인 엔드포인트를 제공한다.
- [ ] 주요 이벤트·오류 로그와 부하 테스트 기준을 마련한다.
- [ ] 다중 서버 확장은 Redis Pub/Sub 및 분산 상태 저장으로 별도 계획한다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 3.5.16 |
| Web | Spring MVC, Thymeleaf |
| Security | Spring Security |
| Data access | MyBatis Spring Boot Starter 3.0.5 |
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

### Java 버전 변경 후 VS Code에서 import 오류가 발생할 때

`package org.springframework... does not exist`, `cannot find symbol`이 여러 클래스에 함께 나타나면 먼저 Gradle 빌드와 편집기의 프로젝트 인식을 구분해서 확인합니다.

```powershell
java -version
.\gradlew.bat test
```

빌드가 성공하는데 편집기에만 오류가 남으면 다음 순서로 처리합니다.

1. `build.gradle`이 있는 `mafiagame` 폴더 전체를 VS Code에서 엽니다.
2. Oracle의 `Java` 확장(`Oracle.oracle-java`)과 `Language Support for Java(TM) by Red Hat`이 동시에 활성화되어 있다면, 이 프로젝트에서는 Oracle 확장의 톱니바퀴 메뉴에서 **Disable (Workspace)**를 선택하고 Red Hat 확장을 사용합니다.
3. 프로젝트의 `.vscode/settings.json`에서 `java.configuration.runtimes`의 `JavaSE-17` 경로와 `java.import.gradle.java.home`을 설치된 JDK 17 폴더로 지정합니다. `java.configuration.updateBuildConfiguration`은 `automatic`, `java.server.launchMode`는 `Standard`로 설정합니다.
4. `Ctrl+Shift+P` → `Java: Clean Java Language Server Workspace` → `Reload and delete`를 실행합니다. Java 분석 캐시를 초기화하는 작업이며 소스 코드는 삭제하지 않습니다.
5. Gradle 프로젝트 가져오기와 의존성 분석이 끝날 때까지 기다립니다.

프로젝트를 빌드하는 JDK와 편집기 분석기를 실행하는 JDK는 별개입니다. 이 프로젝트는 Gradle 툴체인과 편집기 프로젝트 런타임 모두 Java 17을 사용하도록 설정되어 있습니다.

참고: [VS Code Java 프로젝트 관리](https://code.visualstudio.com/docs/java/java-project), [Red Hat Java 확장의 JDK 요구 사항](https://github.com/redhat-developer/vscode-java/wiki/JDK-Requirements).

STS에서는 `Gradle > Refresh Gradle Project`로 의존성을 다시 불러옵니다. `clean`이 보고서 파일 잠금 때문에 실패하면 해당 파일을 사용 중인 프로그램을 닫고 재시도하거나, 우선 `clean` 없이 `test`로 컴파일과 테스트를 확인합니다.

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
4. WebSocket 기반 준비 상태 동기화
5. 게임 상태 머신, 역할·투표·승패 로직 구현
