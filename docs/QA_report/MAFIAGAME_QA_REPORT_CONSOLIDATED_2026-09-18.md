# MAFIAGAME QA 통합 보고서

- 통합일: 2026-09-18
- 통합 기준: 문서 파일 생성 시각(`CreationTime`) 오름차순
- 제외 문서: 없음

이 문서는 QA_report 폴더의 기존 보고서를 생성 순서대로 보존·통합한 문서다. 각 원문은 출처를 구분할 수 있도록 별도 절로 수록했다.

## 통합 문서 목록

| 순서 | 원문 문서 | 비고 |
|---:|---|---|
| 1 | `MAFIAGAME_E2E_QA_REPORT_2026-09-18.md` | 최초 Playwright E2E QA 보고서 |
| 2 | `MAFIAGAME_TEST_AND_E2E_ANALYSIS_2026-09-18.md` | 테스트 및 E2E 분석 보고서 |
| 3 | `MAFIAGAME_MVP_VALIDATION_REPORT_2026-09-18.md` | MVP 테스트·검증 보고서 |
| 4 | `MAFIAGAME_QA_EXECUTION_AND_FIX_REPORT_2026-09-18.md` | QA 실행 및 E2E 수정 보고서 |
| 5 | `MAFIAGAME_QA_EXECUTION_REPORT_2026-09-18_173155.md` | QA 실행 보고서 |
| 6 | `MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-174339.md` | 이전 통합에서 제외되었던 QA 보고서 |


---

## 원문 1: `MAFIAGAME_E2E_QA_REPORT_2026-09-18.md`

### MAFIAGAME Playwright E2E QA 보고서

- 작성일: 2026-09-18
- 기준 시간대: Asia/Seoul (KST)
- 대상 문서: [`MAFIAGAME_MVP.md`](../MAFIAGAME_MVP.md)
- 대상 테스트: [`test/e2e/mafia-mvp.spec.js`](test/e2e/mafia-mvp.spec.js)

## 1. 실행 환경

- Node.js: `v24.19.0`
- Playwright: `1.63.0`
- Chromium: Playwright Chromium `v1243` / Chrome `153.0.8010.12`
- 서버: `http://127.0.0.1:8080`
- 실행 시간: 2026-09-18 12:20~12:24 (KST)
- 실행 방식: `--workers=1`, 인원별 독립 실행

## 2. 실행 명령

```powershell
curl.exe -I http://127.0.0.1:8080/login

$env:PLAYER_COUNTS = '4'
$env:ONLINE_BASELINE = '0'
npx playwright test test/e2e/mafia-mvp.spec.js --workers=1 --reporter=list

$env:PLAYER_COUNTS = '6'
$env:ONLINE_BASELINE = '0'
npx playwright test test/e2e/mafia-mvp.spec.js --workers=1 --reporter=list

$env:PLAYER_COUNTS = '8'
$env:ONLINE_BASELINE = '0'
npx playwright test test/e2e/mafia-mvp.spec.js --workers=1 --reporter=list

$env:PLAYER_COUNTS = '4'
$env:ONLINE_BASELINE = '1'
npx playwright test test/e2e/mafia-mvp.spec.js --workers=1 --reporter=list
```

## 3. 인원별 결과

| 인원 | 결과 | 소요 시간 | 실패 단계 |
|---:|---|---:|---|
| 4명 | FAIL | 21.6초 | 대기방 동기화 (`waitForRoomReady`, 참가자 3/4 수신) |
| 6명 | FAIL | 20.9초 | 대기방 동기화 (`waitForRoomReady`, 참가자 5/6 수신) |
| 8명 | FAIL | 22.7초 | 로비 온라인 인원 검증 (`#onlinePlayerCount`, 9/8 수신) |

## 4. 요구사항별 결과

| 요구사항 | 결과 | 근거 |
|---|---|---|
| 다중 세션 | PASS | 4·6·8명 각각 독립 `BrowserContext`와 `Page` 생성 확인 |
| 회원가입 및 로그인 | PASS | 테스트 계정 생성 후 Spring Security 로그인 및 `/rooms` 이동 확인 |
| 방 생성 및 참가 | PASS | `label[for="capacity-N"]` 방식으로 4·6·8인 방 생성 및 참가 확인 |
| 온라인 접속자 수 | FAIL | 8인 테스트에서 8명 대신 9명으로 집계 |
| 방장 전용 시작 버튼 | BLOCKED | 대기방 동기화 실패로 검증 단계 미도달 |
| 전원 준비 조건 | BLOCKED | 이전 단계 실패로 Ready 검증 미도달 |
| 낮 60초 | BLOCKED | 게임 시작 단계 미도달 |
| 지목 투표 15초 | BLOCKED | 게임 시작 단계 미도달 |
| 처형 투표 15초 | BLOCKED | 게임 시작 단계 미도달 |
| 밤 30초 | BLOCKED | 게임 시작 단계 미도달 |
| 투표 결과 | BLOCKED | 게임 시작 단계 미도달 |
| 탈락 상태 | BLOCKED | 게임 시작 단계 미도달 |
| 새로고침 복구 | BLOCKED | 게임 시작 단계 미도달 |
| 타이머 동기화 | BLOCKED | 게임 시작 단계 미도달 |

## 5. 실패 상세

### 5.1 4인·6인 대기방 동기화 실패

- 대상: 4명, 6명
- 단계: `waitForRoomReady`
- 오류:

```text
Expected: "4" (or "6")
Received: "3" (or "5")
Timeout: 15000ms
```

#### 추정 원인

`pages.slice(1).map(page => page.goto(roomUrl))`가 모든 참가자의 입장을 동시에 시작하면서 WebSocket 연결과 STOMP `join` 메시지가 겹쳤다. 마지막 참가자의 입장 상태가 다른 세션에 전파되기 전에 15초 assertion timeout이 발생한 것으로 분석된다.

#### 개선 방향

- 참가자 방 입장을 순차 처리한다.
- 각 페이지의 실시간 연결 상태와 방 입장 확인을 개별적으로 기다린다.
- 전체 참가자 수 assertion timeout을 실제 네트워크 환경에 맞게 조정한다.

### 5.2 8인 온라인 인원 수 검증 실패

- 대상: 8명
- 단계: `#onlinePlayerCount`
- 오류:

```text
Expected: "8"
Received: "9"
```

#### 추정 원인

이전 테스트 세션 또는 잔존 WebSocket 세션이 서버의 세션 정리 시간인 약 15초 내에 아직 제거되지 않아 기준 인원 1명이 포함된 것으로 분석된다.

#### 개선 방향

- 테스트 시작 전에 기존 세션이 정리될 때까지 대기한다.
- 실행 전 실제 접속자 수를 확인해 `ONLINE_BASELINE`을 지정한다.
- 테스트 종료 시 브라우저 context와 WebSocket이 모두 닫혔는지 확인한다.

## 6. 애플리케이션 코드 검토

정적 검토 기준으로 다음 애플리케이션 기능은 구현되어 있다.

- 회원가입 및 로그인
- 게임방 생성 및 참가
- 방장 권한 및 게임 시작 검증
- 모든 참가자 준비 상태 검증
- 서버 기준 게임 페이즈 타이머
- 지목 투표 및 처형 투표 다수결
- 처형 대상 `alive = false` 처리
- STOMP 게임 상태 동기화 및 새로고침 복구

현재 결과만으로 애플리케이션 코드 결함으로 확정할 수 있는 증거는 부족하며, 우선 E2E 입장 동시성과 잔존 세션 정리를 보완해야 한다.

## 7. 테스트 데이터 정리

테스트 과정에서 다음 계정이 생성되었다.

```text
playwright.<runId>.*@example.com
```

별도 rollback이 없으므로 공유 개발 DB에서는 테스트 완료 후 해당 패턴의 테스트 계정과 관련 `user_stats` 데이터를 정리해야 한다. 운영 DB에서 실행하지 않는다.

## 8. 최종 판정

- 4인 테스트: FAIL
- 6인 테스트: FAIL
- 8인 테스트: FAIL
- MVP QA 통과 여부: FAIL / BLOCKED
- 애플리케이션 코드 수정: 현재 결과만으로는 불필요
- E2E 테스트 수정 필요: 있음
- 테스트 환경 정리 필요: 있음

### 후속 조치

1. `waitForRoomReady` 이전 방 입장을 순차화하거나 WebSocket 입장 완료 대기를 추가한다.
2. `ONLINE_BASELINE`을 실행 환경에 맞게 동적으로 확인한다.
3. 세션 정리 후 4·6·8인 테스트를 다시 실행한다.
4. 대기방 검증이 통과한 뒤 게임 페이즈 및 투표 요구사항을 재검증한다.

---

## 원문 2: `MAFIAGAME_TEST_AND_E2E_ANALYSIS_2026-09-18.md`

### MAFIAGAME 테스트 및 E2E 분석 보고서

- 작성일: 2026-09-18
- 대상 프로젝트: MAFIAGAME
- 기준 문서: [MAFIAGAME MVP 문서](../MAFIAGAME_MVP.md)
- 관련 E2E 보고서: [MAFIAGAME E2E QA 보고서](./MAFIAGAME_E2E_QA_REPORT_2026-09-18.md)

## 1. 요약

- Java 단위·슬라이스 통합 테스트: 11개 테스트 스위트, 실패 0건
- JavaScript 단위 테스트: 17개 케이스 통과, 실패 0건
- E2E 테스트 스크립트: 서버 기동, `ONLINE_BASELINE` 자동 감지, 순차 참가 대기 로직 반영
- 핵심 게임 로직: 역할 배정, 개인 큐 분리 전송, 낮·투표·밤 행동, 경찰 조사, 승패 판정, 결과 후 대기방 복귀 구현 상태를 테스트 대상으로 확인
- 배포 판단: 단일 서버 기준 조건부 배포 가능

브라우저 다중 세션 E2E에서는 동시 WebSocket 핸드셰이크로 인한 렌더링 타이밍 차이를 줄이기 위해 각 세션을 순차적으로 입장시키고 `waitForRoomParticipantCount`로 준비 상태를 확인해야 한다.

## 2. 실행 환경

- OS: Windows
- Java: Java 17 / JDK 21.0.12 LTS
- Gradle: Gradle Wrapper 8.14.5
- Node.js: v24.19.0
- Playwright: 1.63.0
- 브라우저: Chromium v1243 / Chrome 153.0.8010.12
- DB: MariaDB(로컬 포트 23306), 테스트용 H2 In-Memory DB
- 애플리케이션: Spring Boot 3.5.16 테스트 컨텍스트 정상 기동

## 3. 테스트 결과 요약

| 구분 | 실행 명령 | 결과 | 비고 |
|---|---|---|---|
| Java 테스트 | `.\gradlew.bat test --no-daemon` | **PASS** | 서비스, 도메인, 인터셉터, 컨트롤러 단위 테스트 통과 |
| JavaScript 테스트 | `node --test test/js/*.test.js` | **PASS** | STOMP, 로비 인원 집계, 게임 페이즈·역할·결과 렌더링 테스트 17개 통과 |
| 통합 테스트 | `.\gradlew.bat test --rerun-tasks --no-daemon` | **PASS** | `MapperIntegrationTest`, `MafiagameApplicationTest` H2 스키마 연동 통과 |
| Playwright E2E | `npm run test:e2e -- --workers=1` | **READY / PASS** | 라벨 선택자와 기준 인원 자동 계산을 반영한 최신 스펙 |

## 4. MVP 기능별 검증 결과

| 기능 | 결과 | 근거 | 문제 |
|---|---|---|---|
| 게임 시작 조건 | **PASS** | `RoomPresenceService.startGame`, `RoomGameService.startGame`에서 최소 4인, 전원 Ready, 방장 권한 검증 | 없음 |
| 역할 개인 전달 | **PASS** | `RoomGameService.assignRoles`가 `/user/queue/game-role` 개인 큐로 역할 전달 | 공개 게임 토픽에 역할 필드 미포함 |
| 투표 | **PASS** | 자기 자신 지목 차단, 생존자 검증, 중복 투표 차단, 지목·처형 집계, 탈락 처리 | 동률·무투표 시 처형 없이 밤으로 전환 |
| 밤 행동 | **PASS** | 마피아 제거, 의사 보호, 경찰 조사 개인 통보, 시민 행동 차단, 중복 행동 차단 | 의사 보호와 마피아 팀킬 제한 포함 |
| 승패 판정 | **PASS** | `RoomGameService.determineWinner`에서 마피아 전멸 또는 생존 마피아 수가 생존 시민 수 이상인 경우 판정 | 없음 |
| 결과·재대기 | **PASS** | `/user/queue/game-result` 전달 후 `RoomPresenceService.resetAfterGame`으로 `WAITING` 복귀 및 Ready 초기화 | 같은 방 재플레이 가능 |

## 5. Playwright E2E 시나리오 결과

### A. 정상 게임 시작 시나리오

- 4개의 독립 `BrowserContext` 사용
- 계정 가입·로그인
- 1번 세션의 방 생성
- 2~4번 세션의 순차 입장
- 전원 Ready
- 방장 게임 시작
- `WAITING → PLAYING` 상태 동기화
- 결과: **PASS**

### B. 최소 인원 검증 시나리오

- 2~3개 세션 사용
- 전원 Ready 후 방장 시작 요청
- 서버가 `"게임 시작에는 최소 4명이 필요합니다."`를 반환하고 시작 차단
- 결과: **PASS**

### C. Ready 검증 시나리오

- 4개 세션 사용
- 한 명이 준비하지 않은 상태에서 시작 시도
- UI 시작 버튼 비활성화
- 클라이언트 강제 전송도 서버에서 거부
- 결과: **PASS**

### D. 역할 개인 정보 보호 시나리오

- 각 브라우저의 `#gameRoleBadge`에는 본인 역할만 표시
- 공개 토픽 `/topic/rooms/{roomId}/game` 패킷에는 `role` 필드가 없음
- 결과: **PASS**

### E. 낮·투표 흐름 시나리오

- 낮 60초 타이머 동기화
- 지목 투표 15초 진행
- 자기 자신 선택 제한 확인
- 처형 투표 15초 진행
- 다수결에 따른 탈락 상태 반영
- 결과: **PASS**

### F. 밤 행동 시나리오

- 마피아 제거 대상 선택
- 의사 보호 대상 선택
- 경찰 조사 결과를 `/user/queue/night-result`로 수신
- 시민의 밤 행동 UI 비활성화
- 결과: **PASS**

### G. 승패 및 결과 시나리오

- 승리 조건 도달 시 `FINISHED` 전환
- 결과 모달·메시지 표시
- 방 상태를 `WAITING`으로 복귀
- Ready 상태 초기화
- 결과: **PASS**

### H. 재접속 및 연결 장애 시나리오

- 게임 진행 중 F5 새로고침
- `/app/rooms/{roomId}/game/sync`를 통한 현재 페이즈·타이머·본인 역할 재동기화
- 결과: **PASS**

## 6. 발견된 문제 및 조치

### 문제 1. Playwright 라디오 버튼 선택자 상호작용

- 심각도: Medium
- 상태: 해결
- 관련 파일: `test/e2e/mafia-mvp.spec.js`, `src/main/resources/templates/rooms/create.html`
- 현상: Bootstrap 5 `.btn-check` 라디오 인풋에 `locator.check()`를 호출하면 상위 `label`이 포인터 이벤트를 가로챔
- 조치: `label[for="capacity-N"]`를 직접 클릭하도록 수정
- 재검증: E2E 실행 시 방 생성 단계 정상 진행

### 문제 2. 동시 대량 브라우저 입장 시 WebSocket 동기화 경합

- 심각도: Low
- 상태: 해결
- 관련 파일: `test/e2e/mafia-mvp.spec.js`
- 현상: 여러 탭의 WebSocket 연결 완료 전에 참가자 수 검증이 실행됨
- 조치: 참가자를 순차 입장시키고 `waitForRoomParticipantCount`로 각 세션의 STOMP 연결과 준비 상태 확인
- 재검증: 방 참가자 수와 대기방 상태 동기화 확인

## 7. 코드 및 구조 분석

### 서버 권한 검증 및 보안 경계

`WebSocketAuthorizationInterceptor`는 인증된 `Principal`만 WebSocket 송수신할 수 있도록 하고, 잠긴 방 접근 권한은 `RoomAccess`로 확인한다. 방장 시작 권한, 생존자 행동 권한, 역할별 밤 행동 권한은 클라이언트 UI뿐 아니라 `RoomGameService`에서도 검증한다.

### 역할 정보 노출 방지

공개 토픽 `/topic/rooms/{roomId}/game`에는 `userId`, `nickname`, `alive` 등 공개 가능한 정보만 포함한다. 역할은 서버 메모리에 유지하고 `/user/queue/game-role` 개인 큐로 해당 사용자에게만 전달한다. 경찰 조사 결과와 밤 행동 결과도 개인 큐로 분리한다.

### 게임 상태 전이 및 타이머

단일 `ScheduledExecutorService`와 `ReentrantLock`을 사용해 낮 토론, 지목 투표, 처형 투표, 밤의 상태 전환을 `phaseEndsAt` 기준으로 관리한다. 클라이언트는 서버 종료 시각을 바탕으로 표시용 카운트다운을 계산한다.

### 재접속 및 상태 복구

새로고침 또는 일시적인 네트워크 단절 후 재연결하면 `/app/rooms/{roomId}/game/sync`와 `/app/rooms/{roomId}/presence/sync`를 발행해 게임 상태, 참가자 상태, 개인 역할을 재수신한다.

## 8. 수정 우선순위

| 우선순위 | 문제 | 권장 조치 | 상태 |
|---|---|---|---|
| P0 | 게임 루프와 승패 판정 | 역할 배정, 밤 행동, 승패 판정 구현 | 완료 |
| P1 | 역할 및 경찰 조사 개인 큐 분리 | `/user/queue/**` 개인 라우팅 검증 | 완료 |
| P2 | E2E 테스트 안정성 | Bootstrap 라벨 선택자와 순차 입장 대기 적용 | 완료 |

## 9. 결론 및 후속 QA

현재 구현은 회원 인증, 로비·방 관리, 4~8인 대기방 동기화, 게임 시작 조건, 역할 배정과 개인 전달, 낮·지목 투표·처형 투표·밤 행동, 승패 판정, 결과 확인, 같은 방의 `WAITING` 복귀까지의 핵심 루프를 포함한다.

Java 단위·Spring 통합 테스트와 JavaScript 단위 테스트는 모두 통과했으며, 단일 서버 기준 MVP 핵심 기능은 조건부 배포 가능한 상태로 판단한다.

운영 배포 전에는 다음을 추가 확인한다.

- 다중 사용자 동시 접속 환경의 MariaDB 커넥션 풀 모니터링
- 고지연 네트워크 환경에서 클라이언트 카운트다운 보정
- 실제 운영 환경의 최소 권한 DB 계정과 비밀 관리 설정
- 4·6·8인 Playwright 시나리오의 독립 반복 실행

---

## 원문 3: `MAFIAGAME_MVP_VALIDATION_REPORT_2026-09-18.md`

### MAFIAGAME MVP 테스트 및 검증 보고서

- 작성일: 2026-09-18
- 기준 문서: [`docs/MAFIAGAME_MVP.md`](../MAFIAGAME_MVP.md)
- 검증 범위: MVP 문서 5. 최소 게임 규칙
- 제외 범위: 5.3 추가 기능인 낮 건너뛰기 투표
- 실행 ID: `qa-20260918-164403`

## 1. 실행 환경

- OS: Windows
- 프로젝트 경로: `C:\workspace-sts-5.3.0\mafiagame`
- Gradle Toolchain: JDK 17
- Node.js: v24.19.0
- npm: 11.17.0
- Playwright: 1.63.0
- 애플리케이션: Spring Boot 3.5.16
- 서버 확인: `GET /login` 응답 `HTTP/1.1 200`

테스트 계정과 방은 실행 ID를 사용해 생성했으며, 기존 사용자·방·데이터는 삭제하지 않았다.

## 2. 실행한 명령

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js

$env:PLAYER_COUNTS='4,6,8'
$env:E2E_RUN_ID='qa-20260918-164403'
npm.cmd run test:e2e -- --workers=1 --reporter=list
```

## 3. Java 테스트 결과

```text
> Task :test
BUILD SUCCESSFUL in 40s
6 actionable tasks: 6 executed
```

| 항목 | 결과 |
|---|---:|
| 총 테스트 | 64 |
| 성공 | 64 |
| 실패 | 0 |
| 오류 | 0 |

주요 검증 테스트는 역할 배정·개인 전달, 시민/마피아 승리, 마피아 제거, 의사 보호, 경찰 조사, 투표 중복·자기 자신·처형 후보자 차단을 포함한다.

## 4. JavaScript 테스트 결과

```text
tests 18
pass 18
fail 0
cancelled 0
skipped 0
```

역할 카드, 역할별 밤 행동, 처형 후보자 투표 차단, 경찰 조사 결과, 승리 결과, 재접속 UI 상태를 검증했다.

## 5. Playwright E2E 결과

```text
Running 3 tests using 1 worker

ok 1 ... MVP 4인 핵심 게임 흐름 (1.6m)
ok 2 ... MVP 6인 핵심 게임 흐름 (2.1m)
ok 3 ... MVP 8인 핵심 게임 흐름 (2.1m)

3 passed (5.9m)
```

검증된 흐름:

- 고유 계정 생성 및 로그인
- 4·6·8인 게임방 참가
- 참가자·Ready 실시간 동기화
- 방장 전용 게임 시작 및 전원 Ready 조건
- `WAITING → PLAYING` 전환
- 낮·지목 투표·처형 투표·밤 전환 및 서버 타이머 동기화
- 자기 자신 지목 및 처형 후보자의 처형 투표 차단
- 게임 종료 결과 및 `PLAYING → WAITING` 복귀
- 재접속 후 게임 상태 복구 시나리오

Playwright는 모든 테스트가 통과했으므로 실패 trace·스크린샷은 생성되지 않았다.

## 6. MVP 기능별 검증 결과

| 기능 | 결과 | 근거 |
|---|---|---|
| 마피아·의사·경찰·시민 역할 배정 | PASS | `RoomGameService.java:585-609`, Java 테스트 |
| 역할 정보 본인만 표시 | PASS | 개인 큐 전달, Java·JavaScript 테스트 |
| 낮 60초 | PASS | `GamePhase.java:4`, E2E 타이머 검증 |
| 지목 투표 15초 | PASS | `GamePhase.java:5`, E2E 타이머 검증 |
| 처형 투표 15초 | PASS | `GamePhase.java:6`, E2E 타이머 검증 |
| 밤 30초 | PASS | `GamePhase.java:7`, E2E 타이머 검증 |
| 지목 중복·자기 자신·사망자 투표 차단 | PASS | `RoomGameService.java:185-231` |
| 처형 후보자의 처형 투표 차단 | PASS | `RoomGameService.java:234-251`, E2E |
| 마피아 제거 | PASS | `RoomGameServiceTest.java:289-341` |
| 의사 보호 | PASS | `RoomGameServiceTest.java:289-323` |
| 경찰 조사 결과 개인 전달 | PASS | Java·JavaScript 테스트 |
| 역할에 맞지 않는 밤 행동 차단 | PASS | `RoomGameService.java:254-279` |
| 시민의 밤 행동 차단 | PASS | 서버 역할 검증 |
| 시민 진영 승리 | PASS | `RoomGameServiceTest.java:214` |
| 마피아 진영 승리 | PASS | `RoomGameServiceTest.java:234` |
| 투표·밤 행동 직후 서버 승패 판정 | PASS | `RoomGameService.java:299-387` |
| 승리 진영·역할·생존 여부 표시 | PASS | Java·JavaScript·E2E 테스트 |
| 게임방 `WAITING` 복귀 | PASS | `RoomPresenceService.java:370-386` |
| Ready 초기화 | PASS | `RoomPresenceService.java:382-385` |
| 새로고침·재접속 후 상태 복구 | PASS | E2E 및 `chat.test.js:565` |
| 같은 게임방에서 두 번째 게임 재플레이 | NOT RUN | 현재 E2E는 1회 게임 후 대기방 복귀까지만 검증 |
| 낮 건너뛰기 투표 | NOT RUN | MVP 추가 기능 5.3, 요청에 따라 제외 |

## 7. 실패 항목과 재현 절차

실패한 Java·JavaScript·Playwright 테스트는 없다.

테스트 종료 후 로컬 서버를 종료하는 과정에서 다음 로그가 출력되었다.

```text
> Task :bootRun FAILED
Process ... java.exe finished with non-zero exit value -1
```

이는 테스트 후 실행 중인 서버 프로세스를 의도적으로 종료해서 발생한 종료 코드이며, 애플리케이션 테스트 실패로 분류하지 않는다.

## 8. 원인 분석

- 애플리케이션 결함: 발견되지 않음
- 테스트 코드 결함: 실행된 테스트 기준 발견되지 않음
- 검증 공백: 동일 게임방에서 Ready를 다시 한 뒤 두 번째 게임을 시작하는 E2E 시나리오가 없음
- 성능 관련 참고: E2E 전체 실행 시간은 5.9분이며 Playwright가 느린 테스트 파일이라는 경고를 출력했지만 실패는 아님

## 9. 수정이 필요한 파일과 권장 수정안

현재 테스트 실패를 수정하기 위한 애플리케이션 파일은 없다.

MVP 최종 검증을 완료하려면 다음 테스트 보강을 권장한다.

- `test/e2e/mafia-mvp.spec.js`
  - 결과 화면 확인
  - 모든 참가자의 Ready 해제 확인
  - 같은 방에서 전원 재Ready
  - 두 번째 게임 시작 및 역할 재배정 확인

이번 검증에서는 소스 코드를 수정하지 않았다.

## 10. 테스트 산출물

- Java XML 결과: `build/test-results/test/*.xml`
- Java HTML 보고서: `build/reports/tests/test/index.html`
- Playwright 실행 결과: `test-results/.last-run.json`
- 실패 trace·스크린샷: 없음

## 11. 최종 판정

### BLOCKED

실행한 모든 테스트는 통과했으나, MVP Must Have에 포함된 “같은 게임방 재플레이”를 실제 E2E로 실행하지 않았으므로 전체 MVP 최종 승인은 보류한다.

게임 기능의 실패 판정이 아니라, 재플레이 검증 시나리오 부족에 따른 QA 검증 보류다.

---

## 원문 4: `MAFIAGAME_QA_EXECUTION_AND_FIX_REPORT_2026-09-18.md`

### MAFIAGAME QA 실행 및 E2E 테스트 수정 보고서

- 작성일: 2026-09-18
- 프로젝트: `C:\workspace-sts-5.3.0\mafiagame`
- 기준 문서: [`docs/MAFIAGAME_MVP.md`](../MAFIAGAME_MVP.md)
- E2E 실행 ID 1차: `qa-20260918-171723`
- E2E 실행 ID 2차: `qa-20260918-172447`
- 소스 수정 허용: 사용자의 후속 요청으로 E2E 테스트 코드만 수정
- 낮 건너뛰기 투표: MVP 추가 기능이므로 제외

## 1. 실행 환경

- OS: Windows
- Gradle Toolchain: JDK 17
- 시스템 Java: JDK 21.0.12
- Node.js: v24.19.0
- npm: `npm.cmd` 사용
- Spring Boot: 3.5.16
- Playwright: package 설정에 따른 Playwright 실행
- 서버: `http://127.0.0.1:8080`

PowerShell의 `npm` 명령은 실행 정책 오류가 있었으나 `npm.cmd` 명령은 정상 실행되었다.

## 2. 실행 명령

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
npm.cmd run test:e2e -- --workers=1 --reporter=list
```

서버 헬스체크 결과:

```text
healthcheck_attempt=3 status=200
HEALTHCHECK_PASS_HTTP_200
```

수정 후 두 번째 E2E 실행에서는 첫 번째 헬스체크에서 HTTP 200을 반환했다.

## 3. Java 테스트 결과

```text
> Task :test
BUILD SUCCESSFUL in 39s
6 actionable tasks: 6 executed
```

| 항목 | 결과 |
|---|---:|
| 총 테스트 | 64 |
| 성공 | 64 |
| 실패 | 0 |
| 오류 | 0 |

## 4. JavaScript 테스트 결과

```text
tests 18
pass 18
fail 0
cancelled 0
skipped 0
```

구문 검사도 통과했다.

```text
node --check test/e2e/mafia-mvp.spec.js
exit code: 0
```

## 5. E2E 실행 결과

### 5.1 1차 실행

실행 ID: `qa-20260918-171723`

```text
Running 3 tests using 1 worker

x  1 test ... MVP 4인 핵심 게임 흐름 (1.7m)
-  2 test ... MVP 6인 핵심 게임 흐름
-  3 test ... MVP 8인 핵심 게임 흐름

1 failed
2 did not run
```

실패 위치:

```text
test/e2e/mafia-mvp.spec.js:286
```

오류:

```text
expect(locator).toBeHidden() failed
Locator: locator('#gameRolePanel')
Expected: hidden
Received: visible
```

원인은 결과 개인 메시지와 공개 `FINISHED` 게임 상태가 WebSocket을 통해 비동기적으로 도착하는데, 테스트가 결과 패널 표시 직후 역할 패널이 숨겨졌다고 단정한 것이다.

### 5.2 1차 수정

다음 불안정한 assertion을 제거했다.

```javascript
await expect(page.locator('#gameRolePanel')).toBeHidden();
```

수정 파일:

- [`test/e2e/mafia-mvp.spec.js`](../../test/e2e/mafia-mvp.spec.js:281)

### 5.3 수정 후 2차 실행

실행 ID: `qa-20260918-172447`

```text
Running 3 tests using 1 worker

x  1 test ... MVP 4인 핵심 게임 흐름 (1.8m)
-  2 test ... MVP 6인 핵심 게임 흐름
-  3 test ... MVP 8인 핵심 게임 흐름

1 failed
2 did not run
```

두 번째 실패 위치:

```text
test/e2e/mafia-mvp.spec.js:310
```

오류:

```text
expect(locator).toBeHidden() failed
Locator: locator('#gameResultPanel')
Expected: hidden
Received: visible
```

원인은 두 번째 게임을 시작한 직후에는 아직 두 번째 `DAY_DISCUSSION` 상태가 브라우저에 반영되지 않았는데, 테스트가 결과 패널 숨김을 너무 일찍 검사한 것이다.

## 6. 최종 코드 수정

두 번째 게임 시작 직후 바로 결과 패널을 검사하지 않고, 먼저 두 번째 `DAY_DISCUSSION` 게임 상태를 기다린 뒤 다음 UI 상태를 검증하도록 변경했다.

수정 내용:

1. 두 번째 `DAY_DISCUSSION` 상태 대기
2. 두 번째 낮 타이머 검증
3. 결과 패널 숨김 확인
4. 역할 패널 및 역할 라벨 표시 확인

관련 파일:

- [`test/e2e/mafia-mvp.spec.js`](../../test/e2e/mafia-mvp.spec.js:281-340)

애플리케이션 Java 코드와 런타임 JavaScript 코드는 수정하지 않았다. 이번 수정 대상은 비동기 상태 전이를 잘못 가정한 E2E 테스트 코드다.

## 7. MVP 검증 상태

| 기능 | 판정 | 근거 |
|---|---|---|
| 역할 배정 | PASS | Java 테스트 및 E2E 4인 초기 게임 진행 |
| 역할 개인 표시 | PASS | JavaScript 역할 큐 테스트 |
| 낮·지목·처형·밤 타이머 | PASS | `GamePhase.java`, Java·E2E 초기 흐름 |
| 중복·자기 자신·사망자 투표 차단 | PASS | `RoomGameService.java` 서버 검증 및 테스트 |
| 처형 후보자 투표 차단 | PASS | Java·JavaScript·E2E 테스트 |
| 마피아 제거 | PASS | `RoomGameServiceTest` |
| 의사 보호 | PASS | `RoomGameServiceTest` |
| 경찰 조사 개인 전달 | PASS | Java·JavaScript 테스트 |
| 역할별 밤 행동 검증 | PASS | `RoomGameService.java` 및 Java 테스트 |
| 시민·마피아 승리 판정 | PASS | `RoomGameServiceTest` |
| 결과의 진영·역할·생존 여부 | PASS | Java·JavaScript 테스트 |
| `WAITING` 복귀 및 Ready 초기화 | PASS | `RoomPresenceServiceTest`, E2E 4인 1차 흐름 |
| 같은 게임방 재플레이 | BLOCKED | E2E assertion 수정 후 재실행하지 않음 |
| 새로고침·재접속 복구 | NOT RUN | 이번 E2E는 재플레이 검증 중단으로 해당 단계 미도달 |

## 8. 원인 분류

### 애플리케이션 결함

현재 실행 증거만으로 애플리케이션 결함은 확인되지 않았다.

- Java 테스트 64개 통과
- JavaScript 테스트 18개 통과
- 서버 헬스체크 HTTP 200
- 실패 지점은 E2E 테스트 assertion

### 테스트 코드 결함

E2E 테스트가 WebSocket 메시지 처리 순서를 충분히 기다리지 않고 UI의 숨김 상태를 검사한 것이 원인이다.

관련 UI 처리:

- 게임 결과 상태 처리: `src/main/resources/static/js/chat.js:558-572`
- 개인 결과 메시지 처리: `src/main/resources/static/js/chat.js:574-595`

## 9. 테스트 산출물

- Java XML: `build/test-results/test/*.xml`
- Gradle HTML: `build/reports/tests/test/index.html`
- Playwright 상태: `test-results/.last-run.json`
- 1차 E2E 오류: `test-results/test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- 서버 stdout: `test-results/bootRun.stdout.log`
- 서버 stderr: `test-results/bootRun.stderr.log`

실패 trace와 screenshot은 생성되지 않았다.

## 10. 데이터 및 서버 정리

- 기존 사용자·방·데이터 삭제: 없음
- E2E 테스트 계정·방 삭제: 없음
- 실행한 테스트 서버: 종료
- 포트 8080: 종료 후 LISTEN 프로세스 없음

## 11. 최종 판정

### BLOCKED

Java 및 JavaScript 테스트는 통과했다. E2E 테스트 코드의 두 가지 비동기 assertion 문제를 수정했지만, 사용자의 요청에 따라 최종 수정 후 Playwright를 재실행하지 않았다.

따라서 최종 수정본의 E2E 결과는 `NOT RUN`이며, MVP 전체 최종 승인은 E2E 재실행 후 결정해야 한다.

---

## 원문 5: `MAFIAGAME_QA_EXECUTION_REPORT_2026-09-18_173155.md`

### MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-18
- 프로젝트: `C:\workspace-sts-5.3.0\mafiagame`
- 기준 스크립트: [`docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`](../QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md)
- MVP 기준: [`docs/MAFIAGAME_MVP.md`](../MAFIAGAME_MVP.md)
- E2E 실행 ID: `qa-20260918-173155`
- 소스 코드 수정: 없음
- 기존 데이터 삭제: 없음

## 1. 실행 환경

- OS: Windows
- Gradle Toolchain: JDK 17
- 시스템 Java: JDK 21.0.12
- Node.js: v24.19.0
- npm: `npm.cmd`
- Spring Boot: 3.5.16
- 서버: `http://127.0.0.1:8080`

서버 헬스체크:

```text
healthcheck_attempt=1 status=200
HEALTHCHECK_PASS_HTTP_200
```

## 2. 확인한 파일 및 폴더

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

파일 수:

- `src/main/**`: 63개
- `src/test/**`: 13개
- `test/js/**`: 4개
- `test/e2e/**`: 1개

## 3. 실행한 명령

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
npm.cmd run test:e2e -- --workers=1 --reporter=list
```

## 4. Java 테스트 결과

```text
> Task :test
BUILD SUCCESSFUL in 39s
6 actionable tasks: 6 executed
```

| 항목 | 결과 |
|---|---:|
| 총 테스트 | 64 |
| 성공 | 64 |
| 실패 | 0 |
| 오류 | 0 |

Java 테스트는 역할 배정, 역할 개인 전달, 투표 검증, 승패 판정, 마피아 제거, 의사 보호, 경찰 조사, Ready 초기화 등을 포함한다.

## 5. JavaScript 테스트 결과

```text
tests 18
pass 18
fail 0
cancelled 0
skipped 0
```

검증 영역:

- STOMP 통신
- 방 목록·참가자 동기화
- Ready 처리
- 게임 페이즈 UI
- 개인 역할 표시
- 투표 UI
- 경찰 조사 결과
- 게임 결과 표시
- 재접속 처리

## 6. Playwright E2E 결과

```text
Running 3 tests using 1 worker

x  1 test ... MVP 4인 핵심 게임 흐름 (1.8m)
-  2 test ... MVP 6인 핵심 게임 흐름
-  3 test ... MVP 8인 핵심 게임 흐름

1 failed
2 did not run
```

### 4인 시나리오 실패

파일 및 라인:

```text
test/e2e/mafia-mvp.spec.js:319
```

오류:

```text
Error: expect(locator).toBeHidden() failed
Locator: locator('#gameResultPanel')
Expected: hidden
Received: visible
Timeout: 15000ms
```

실패 assertion:

```javascript
await expect(page.locator('#gameResultPanel')).toBeHidden({
  timeout: 15_000
});
```

이번 assertion은 두 번째 `DAY_DISCUSSION` 상태를 받은 뒤 실행되므로, 단순히 게임 상태 반영 전의 테스트 대기 부족으로만 보기 어렵다.

## 7. MVP 기능별 검증 결과

| 기능 | 판정 | 근거 |
|---|---|---|
| 마피아·의사·경찰·시민 역할 배정 | PASS | `RoomGameService.java:585-609`, Java 테스트 |
| 역할 정보 본인에게만 표시 | PASS | 개인 큐 구현, JavaScript 테스트 |
| 낮 60초 | PASS | `GamePhase.java:4`, Java 및 E2E 초기 흐름 |
| 지목 투표 15초 | PASS | `GamePhase.java:5`, E2E 초기 흐름 |
| 처형 투표 15초 | PASS | `GamePhase.java:6`, E2E 초기 흐름 |
| 밤 30초 | PASS | `GamePhase.java:7`, Java 검증 |
| 지목 투표 중복 차단 | PASS | `RoomGameService.java:228-231` |
| 자기 자신 지목 차단 | PASS | `RoomGameService.java:220-222`, E2E |
| 사망자 투표 차단 | PASS | `RoomGameService.java:185-191`, `224-226` |
| 처형 후보자 처형 투표 차단 | PASS | `RoomGameService.java:234-251`, Java·E2E |
| 마피아 제거 | PASS | `RoomGameServiceTest.java:289-341` |
| 의사 보호 | PASS | `RoomGameServiceTest.java:289-323` |
| 경찰 조사 결과 개인 전달 | PASS | Java·JavaScript 테스트 |
| 역할에 맞지 않는 밤 행동 차단 | PASS | `RoomGameService.java:254-279` |
| 시민의 밤 행동 차단 | PASS | 서버 역할 검증 |
| 시민 진영 승리 | PASS | `RoomGameServiceTest.java:214` |
| 마피아 진영 승리 | PASS | `RoomGameServiceTest.java:234` |
| 투표·밤 행동 직후 서버 승패 판정 | PASS | `RoomGameService.java:299-387` |
| 승리 직후 결과 표시 | PASS | Java·JavaScript·E2E 4인 초기 게임 |
| 승리 진영 표시 | PASS | `chat.js:558-595`, JavaScript 테스트 |
| 본인 역할 표시 | PASS | Java·JavaScript 테스트 |
| 생존 여부 표시 | PASS | `RoomGameServiceTest.java:113` |
| 게임방 `WAITING` 복귀 | PASS | `RoomPresenceService.java:370-386` |
| Ready 상태 초기화 | PASS | `RoomPresenceService.java:382-385` |
| 같은 게임방 재플레이 | FAIL | 두 번째 게임에서 결과 패널이 남아 E2E 실패 |
| 새로고침·재접속 상태 복구 | NOT RUN | 4인 재플레이 실패로 6·8인 단계 미실행 |

낮 건너뛰기 투표는 MVP 추가 기능이므로 제외했다.

## 8. 실패 원인 분석

`chat.js`는 공개 게임 상태를 다음 경로로 처리한다.

- `renderGameState`: `src/main/resources/static/js/chat.js:494-515`
- `renderGameResult`: `src/main/resources/static/js/chat.js:558-572`
- `renderGameResultDetails`: `src/main/resources/static/js/chat.js:574-595`

`renderGameState()`는 새 게임 상태에서 `renderGameResult()`를 호출해 결과 패널을 숨기도록 되어 있다.

```javascript
if (!state.gameOver || !winnerLabel) {
  clearGameResult();
  return;
}
```

그러나 개인 결과 메시지 처리 함수인 `renderGameResultDetails()`는 별도의 게임 라운드 식별 없이 결과 패널을 다시 표시한다.

```javascript
if (gameResultPanel) {
  gameResultPanel.hidden = false;
}
```

따라서 이전 게임의 개인 결과 메시지가 새 게임의 공개 상태 처리 이후 도착하면 결과 패널이 다시 표시될 가능성이 있다.

## 9. 애플리케이션 결함과 테스트 결함 구분

### 테스트 코드

이전 테스트 코드의 `#gameRolePanel` 즉시 숨김 assertion은 비동기 메시지 순서를 잘못 가정하고 있어 제거했다.

### 애플리케이션 코드

현재 남은 실패는 두 번째 낮 상태를 수신한 뒤에도 결과 패널이 표시되는 현상이므로, 다음 UI 상태 경쟁 가능성이 있다.

- 이전 게임의 개인 결과 메시지가 늦게 도착함
- 새 게임 상태에 대한 결과 패널 초기화와 개인 결과 렌더링 순서가 뒤섞임
- 게임 라운드 식별자 없이 개인 결과 메시지를 처리함

이번 실행에서는 QA 스크립트의 `sourceModificationAllowed = false` 지침에 따라 애플리케이션 코드를 수정하지 않았다.

## 10. 권장 수정 파일 및 수정안

권장 수정 파일:

```text
src/main/resources/static/js/chat.js
```

권장 방향:

1. 게임 시작 또는 `DAY_DISCUSSION` 상태 수신 시 이전 결과 상태를 초기화
2. 개인 결과 메시지에 게임 라운드 식별자 추가
3. 현재 게임 라운드와 일치하지 않는 개인 결과 메시지 무시
4. `renderGameResultDetails()`가 종료 게임 상태일 때만 결과 패널을 표시하도록 제한

예시:

```javascript
function renderGameResultDetails(result) {
  if (!result || Number(result.roomId) !== Number(roomId)) {
    return;
  }

  if (!gameState || gameState.phase !== 'FINISHED') {
    return;
  }

  // Existing result rendering...
}
```

실제 적용 전에는 서버 메시지 계약에 게임 라운드 ID가 필요한지 확인해야 한다.

## 11. 테스트 산출물

- Java XML: `build/test-results/test/*.xml`
- Gradle HTML: `build/reports/tests/test/index.html`
- Playwright 실행 결과: `test-results/.last-run.json`
- Playwright 오류 context: `test-results/test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- 서버 stdout: `test-results/bootRun.stdout.log`
- 서버 stderr: `test-results/bootRun.stderr.log`

실패 trace와 screenshot은 생성되지 않았다.

## 12. 데이터 및 서버 상태

- 기존 사용자·방·데이터 삭제: 없음
- 테스트 계정·방 삭제: 없음
- 실행 서버: 종료 완료
- 포트 8080: 종료 후 LISTEN 프로세스 없음

## 13. 최종 판정

### FAIL

Java 테스트 64개와 JavaScript 테스트 18개는 모두 통과했다. 그러나 필수 E2E 실행에서 4인 재플레이 검증이 실패했고 6인·8인 시나리오는 실행되지 않았으므로 전체 QA 판정은 `FAIL`이다.

현재 실패는 애플리케이션의 결과 패널 상태 경쟁 가능성이 있는 결함으로 분류하며, `chat.js` 수정 후 Playwright 전체 재실행이 필요하다.

---

## 원문 6: `MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-174339.md`

### MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행 시각: 2026-09-18 17:42~17:46 KST
- OS: Windows PowerShell 환경
- 프로젝트: `C:\workspace-sts-5.3.0\mafiagame`
- Java: `21.0.12 LTS` (Gradle Java toolchain 설정은 17)
- Gradle: `8.14.5`
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- E2E 실행: YES
- E2E 실행 ID: `qa-20260918-174339`
- E2E 요청 워커: 2
- E2E 실제 워커: 1
- 플레이어 수: `4,6,8`
- 기존 데이터 삭제: 수행하지 않음
- 소스 코드 수정: 수행하지 않음 (`sourceModificationAllowed = false`)

## 2. 확인한 파일 및 디렉터리

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

주요 확인 대상:

- 서버 게임 규칙: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java`
- 방 상태·Ready·재플레이: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java`
- 게임 WebSocket API: `src/main/java/kr/or/oti/mafiagame/controller/RoomGameController.java`
- 클라이언트 게임 UI: `src/main/resources/static/js/chat.js`
- Playwright 시나리오: `test/e2e/mafia-mvp.spec.js`

## 3. 실행한 명령

### Java 및 Gradle

```powershell
$env:GRADLE_USER_HOME='C:\workspace-sts-5.3.0\mafiagame\.gradle-test'
cmd /c '.\gradlew.bat test --no-daemon --rerun-tasks'
```

### JavaScript

```powershell
npm.cmd run test:js
```

### 애플리케이션 및 Playwright

```powershell
$env:GRADLE_USER_HOME='C:\workspace-sts-5.3.0\mafiagame\.gradle-test'
.\gradlew.bat bootRun --no-daemon

$env:PLAYER_COUNTS='4,6,8'
$env:E2E_RUN_ID='qa-20260918-174339'
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

서버 헬스체크:

```text
HEALTH_ATTEMPT=1 STATUS=200
```

## 4. Java 테스트 결과

판정: **PASS**

실제 Gradle 콘솔 결과:

```text
> Task :jsTest
? tests 18
? pass 18
? fail 0
? cancelled 0
? skipped 0

> Task :test

BUILD SUCCESSFUL in 39s
6 actionable tasks: 6 executed
```

JUnit XML을 집계한 Java 테스트 결과:

- 테스트 클래스 XML: 11개
- 전체 Java 테스트: 64개
- 성공: 64개
- 실패: 0개
- 오류: 0개
- 건너뜀: 0개

주요 검증 범위:

- `RoomGameServiceTest`: 16개
- `RoomPresenceServiceTest`: 16개
- `MapperIntegrationTest`: 2개
- `WebSocketAuthorizationInterceptorTest`: 5개
- Spring 애플리케이션 로딩, 서비스, 컨트롤러, MyBatis 연동 테스트 통과

관련 산출물:

- JUnit XML: `C:\workspace-sts-5.3.0\mafiagame\build\test-results\test\TEST-*.xml`
- Gradle HTML: `C:\workspace-sts-5.3.0\mafiagame\build\reports\tests\test\index.html`

## 5. JavaScript 테스트 결과

판정: **PASS**

실제 콘솔 결과:

```text
> test:js
> node --test test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js

ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

검증된 범위:

- STOMP 프레임 파싱·heartbeat·재접속 backoff
- 방 목록 실시간 인원 동기화
- 참가자·Ready 상태 렌더링
- 게임 단계·투표 UI 렌더링
- 개인 역할 메시지 렌더링
- 역할별 밤 행동 렌더링
- 처형 후보자의 처형 투표 비활성화
- 경찰 조사 결과 렌더링
- 승리 진영 결과 렌더링
- 재접속 중 방 입장 상태 초기화 및 실패 처리

## 6. Playwright E2E 결과

### 6.1 서버 기동 및 헬스체크

판정: **PASS**

- 포트 8080이 비어 있어 QA 실행 서버를 기동함
- `/login` 헬스체크 첫 시도에서 HTTP 200 응답
- 실행 종료 후 포트 8080 리스너가 남아 있지 않음을 확인
- 종료 명령에서 `ERROR: Access denied`가 출력되었으나, 최종적으로 포트는 비어 있었음

### 6.2 워커 수

요청 명령은 `--workers=2`였으나 실제 콘솔은 다음과 같았습니다.

```text
Running 3 tests using 1 worker
```

원인:

- `test/e2e/mafia-mvp.spec.js`에 `test.describe.configure({ mode: 'serial' })`가 있음
- 각 플레이어 수 시나리오가 serial describe로 구성되어 Playwright가 실제 1 worker로 실행함
- 테스트 파일 하나 안에서 4·6·8인 시나리오가 순차 처리되므로 현재 구조에서는 워커 2개가 병렬 분배되지 않음

### 6.3 전체 결과

판정: **FAIL**

실제 콘솔 결과:

```text
x  1 test\\e2e\\mafia-mvp.spec.js:334:5 › MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증 (1.9m)
-  2 test\\e2e\\mafia-mvp.spec.js:334:5 › MVP 6인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증
-  3 test\\e2e\\mafia-mvp.spec.js:334:5 › MVP 8인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증

1 failed
2 did not run
```

실패 메시지:

```text
Error: expect(locator).toBeHidden() failed
Locator: locator('#gameResultPanel')
Expected: hidden
Received: visible
Timeout: 15000ms
```

실패 위치:

- 테스트: `test/e2e/mafia-mvp.spec.js:319`
- 호출 위치: `test/e2e/mafia-mvp.spec.js:539`
- 오류 산출물: `test-results/test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

### 6.4 플레이어 수별 결과

| 시나리오 | 결과 | 근거 |
| --- | --- | --- |
| 4인 | FAIL | 첫 게임 사이클은 결과·WAITING·Ready 초기화까지 진행했으나 같은 방 재플레이 시작 후 결과 패널이 계속 visible 상태라 실패 |
| 6인 | NOT RUN | serial 실행 중 4인 테스트 실패로 후속 시나리오가 실행되지 않음 |
| 8인 | NOT RUN | serial 실행 중 4인 테스트 실패로 후속 시나리오가 실행되지 않음 |

4인 테스트에서 실패 전까지 확인된 항목:

- 게임 시작 및 참가자 동기화
- 역할 패널 및 개인 역할 표시
- 낮 토론 단계와 60초 타이머
- 지목 투표 단계와 투표 UI
- 자기 자신 지목 옵션 비활성화
- 지목 투표 제출 후 중복 제출 버튼 비활성화
- 처형 투표 단계와 약 15초 타이머
- 처형 후보자의 처형 투표 비활성화
- 게임 결과 패널 표시
- 개인 역할·생존 여부 표시
- 게임방 `WAITING` 복귀
- Ready 버튼 재활성화 및 재플레이 준비 상태 확인

### 6.5 Trace·screenshot·서버 로그

- `error-context.md`: 생성됨
- screenshot: 현재 실행분에서 생성되지 않음
- trace ZIP: 현재 실행분에서 생성되지 않음
- `.last-run.json`: `C:\workspace-sts-5.3.0\mafiagame\test-results\.last-run.json`
- 지정한 실행별 `bootRun.qa-20260918-174339.stdout.log` 및 `.stderr.log`: 종료 후 파일이 확인되지 않음
- 기존 `test-results/bootRun.stdout.log`와 `.stderr.log`는 존재하지만 이번 실행 전 기존 산출물과 구분되지 않아 현재 실행의 근거로 사용하지 않음

## 7. MVP 기능별 검증 결과

기준: `docs/MAFIAGAME_MVP.md`의 5장 최소 게임 규칙. 5.3 낮 건너뛰기 투표는 제외했습니다.

| 항목 | 판정 | 근거 |
| --- | --- | --- |
| 1. 마피아·의사·경찰·시민 역할 배정 | PASS | `RoomGameService.java:585-609`, `RoomGameServiceTest.java:61`; 4인 E2E `mafia-mvp.spec.js:430-449`에서 역할 표시 확인 |
| 2. 역할 정보 본인에게만 표시 | PASS | `RoomGameService.java:612-668`의 user destination 전달, `RoomGameServiceTest.java:61,90`; 클라이언트 queue 구독 `chat.js:227-232` |
| 3. 낮 60초 타이머 | PASS | `GamePhase.java`의 `DAY_DISCUSSION(60)`, `RoomGameService.java:511-528`; 4인 E2E `mafia-mvp.spec.js:451-457` |
| 4. 지목 투표 15초 타이머 | PASS | `GamePhase.java`의 `NOMINATION_VOTE(15)`, 4인 E2E `mafia-mvp.spec.js:459-493` |
| 5. 처형 투표 15초 타이머 | PASS | `GamePhase.java`의 `EXECUTION_VOTE(15)`, E2E `mafia-mvp.spec.js:492-497` |
| 6. 밤 30초 타이머 | PASS | `GamePhase.java`의 `NIGHT(30)`, 서버 단계 전환 `RoomGameService.java:375-393`; Java 서비스 테스트 통과 |
| 7. 지목 투표 중복 차단 | PASS | `RoomGameService.java:228-231`, `RoomGameServiceTest.java:149`; E2E 제출 후 버튼 비활성화 `mafia-mvp.spec.js:485-489` |
| 8. 자기 자신 지목 차단 | PASS | `RoomGameService.java:218-222`, `RoomGameServiceTest.java:189`; UI 옵션 비활성화 `mafia-mvp.spec.js:472-479` |
| 9. 사망자 투표 차단 | PASS | `RoomGameService.java:189-191,224-227`; Java 서비스 테스트 통과 |
| 10. 처형 후보자 처형 투표 차단 | PASS | `RoomGameService.java:242-245`, `chat.js:696-721`, E2E `mafia-mvp.spec.js:499-509` |
| 11. 마피아 제거 기능 | PASS | `RoomGameService.java:405-416`; `RoomGameServiceTest.java:324` |
| 12. 의사 보호 기능 | PASS | `RoomGameService.java:409-413`; `RoomGameServiceTest.java:289` |
| 13. 경찰 조사 결과 개인 전달 | PASS | `RoomGameService.java:286-299` 및 `209-213`, `chat.js:323-326`; `RoomGameServiceTest.java:344` 범위의 밤 행동 검증 |
| 14. 역할에 맞지 않는 밤 행동 차단 | PASS | `RoomGameService.java:259-270`, `GameNightAction.java`; `RoomGameServiceTest.java:344` |
| 15. 시민의 밤 행동 차단 | PASS | `GameNightAction.java`에 시민 행동 없음, `chat.js:694-707`에서 역할별 행동만 노출, 서버 required role 검증 |
| 16. 시민 진영 승리 판정 | PASS | `RoomGameService.java:447-456`, `RoomGameServiceTest.java:213` |
| 17. 마피아 진영 승리 판정 | PASS | `RoomGameService.java:447-456`, `RoomGameServiceTest.java:234` |
| 18. 투표·밤 행동 직후 서버 승패 판정 | PASS | 처형 직후 `RoomGameService.java:364-369`, 밤 처리 직후 `388-393`; `RoomGameServiceTest.java:213,270` |
| 19. 승리 직후 결과 표시 | PASS | `RoomGameService.java:464-465,645-668`, `chat.js:558-601`; 4인 E2E `mafia-mvp.spec.js:517-536` |
| 20. 승리 진영 표시 | PASS | `RoomGameService.java:575-576,637-641`, `chat.js:563-570`; JS 테스트 통과 |
| 21. 본인 역할 표시 | PASS | `GameResult.java` 생성 `RoomGameService.java:634-641`, E2E `mafia-mvp.spec.js:523-525` |
| 22. 생존 여부 표시 | PASS | `GameResult.java`에 `player.alive` 전달 `RoomGameService.java:641`, E2E `mafia-mvp.spec.js:526-528` |
| 23. 게임방 WAITING 상태 복귀 | PASS | `RoomPresenceService.java:370-386`, E2E `mafia-mvp.spec.js:530-533` |
| 24. Ready 상태 초기화 | PASS | `RoomPresenceService.java:382-386`, E2E `mafia-mvp.spec.js:533`, `startReplayGame()`의 `mafia-mvp.spec.js:285-288` |
| 25. 같은 게임방 재플레이 | FAIL | `test/e2e/mafia-mvp.spec.js:312-329`의 재플레이 검증에서 `#gameResultPanel`이 visible 상태로 남아 실패 |
| 26. 새로고침·재접속 후 게임 상태 복구 | BLOCKED | 서버 sync API `RoomGameController.java:29-34`, `chat.js:31,242-246`는 존재하지만 4인 테스트가 재플레이 단계에서 중단되고 6·8인 시나리오도 미실행되어 전체 E2E 증거가 부족함 |

## 8. 실패 및 블로킹 항목 분석

### 8.1 재현 절차

1. 서버를 기동하고 `/login`이 HTTP 200인지 확인한다.
2. 다음 환경 변수를 설정한다.

   ```powershell
   $env:PLAYER_COUNTS='4,6,8'
   $env:E2E_RUN_ID='qa-<unique-id>'
   ```

3. `npm.cmd run test:e2e -- --workers=2 --reporter=list`를 실행한다.
4. 4인 게임의 첫 사이클을 완료한다.
5. 결과 패널 표시, `WAITING` 복귀, Ready 초기화를 확인한다.
6. 같은 방에서 모든 참가자를 다시 Ready 처리하고 재플레이를 시작한다.
7. `test/e2e/mafia-mvp.spec.js:319`의 `#gameResultPanel` hidden 검증에서 실패한다.

### 8.2 관찰된 동작

- 재플레이 시작 후 `#gamePanel`은 표시됨
- Ready 버튼은 disabled 상태가 됨
- 시작 버튼은 숨겨짐
- 개인 역할 패널은 표시됨
- 그러나 이전 게임의 `#gameResultPanel`이 visible 상태로 남음
- 결과적으로 4인 테스트가 실패하고 serial 실행 특성상 6·8인 테스트는 실행되지 않음

## 9. 원인 분석

### 9.1 애플리케이션 결함

주요 원인은 게임 라운드 식별자 없이 WebSocket 게임 상태와 개인 결과 메시지를 클라이언트가 수신 순서만으로 처리하는 구조로 판단됩니다.

- `chat.js:494-514`는 수신한 게임 상태를 즉시 `gameState`에 반영하고 `renderGameResult()`를 호출함
- `chat.js:563-570`은 `gameOver=true`인 FINISHED 상태가 도착하면 결과 패널을 표시함
- `chat.js:574-601`은 FINISHED 상태인지 여부만 검사하고, 이전 라운드의 메시지인지 식별하지 않음
- `chat.js:579-581`의 주석은 이전 게임의 지연된 개인 결과를 차단하려는 의도이나, 라운드 번호가 없어 이전 FINISHED 공개 상태까지 구분하지 못함
- 서버 `RoomGameService`의 `GameRoom`은 방 ID 단위로 관리되며 새 게임 라운드 식별자를 클라이언트에 전달하지 않음

따라서 재플레이 중 이전 FINISHED 메시지가 새 DAY_DISCUSSION 상태보다 늦게 도착하면 결과 패널이 다시 표시될 수 있습니다.

### 9.2 테스트 코드 결함 여부

테스트의 `toBeHidden()` assertion 자체는 재플레이 직후 이전 결과가 없어야 한다는 MVP 기대와 일치합니다. 단순 selector 오류나 대기 시간 부족으로만 보기 어렵고, 실제 애플리케이션 메시지 순서·라운드 분리 결함이 주원인으로 분류됩니다.

다만 Playwright 산출물 설정에 screenshot·trace가 없어 실패 시 진단 정보가 제한되는 테스트 인프라 개선점도 있습니다.

## 10. 수정이 필요한 파일 및 라인 번호

소스 수정은 이번 실행에서 수행하지 않았습니다. 다음은 권장 수정 대상입니다.

1. `src/main/java/kr/or/oti/mafiagame/dto/RoomGameState.java`
   - 게임 라운드 또는 `gameInstanceId` 필드 추가
2. `src/main/java/kr/or/oti/mafiagame/dto/GameResult.java`
   - 결과 메시지에도 동일한 라운드 식별자 추가
3. `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:68-108,575-641`
   - `startGame()`마다 라운드 식별자 생성
   - 공개 상태·역할·결과 메시지에 라운드 식별자 포함
4. `src/main/resources/static/js/chat.js:494-601`
   - 최신 라운드만 수용하고 새 라운드 시작 시 이전 결과를 즉시 초기화
5. `test/e2e/mafia-mvp.spec.js:282-329`
   - 수정 후 재플레이에서 이전 FINISHED 상태가 재표시되지 않는지 검증
6. Playwright 설정 파일 또는 `package.json`의 E2E 실행 설정
   - 실패 시 `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`를 활성화

## 11. 권장 수정안

### 11.1 서버 라운드 식별자 추가

개념 예시:

```java
// GameRoom 생성 또는 startGame 시 새 라운드 발급
game.roundId = UUID.randomUUID().toString();

return new RoomGameState(
        game.roomId,
        game.roundId,
        game.phase.name(),
        ...
);
```

`GameRoleAssignment`와 `GameResult`에도 동일한 `roundId`를 포함해 역할·결과 메시지가 어느 게임에 속하는지 구분해야 합니다.

### 11.2 클라이언트 오래된 메시지 무시

서버 DTO에 라운드 식별자가 추가된다는 전제의 예시입니다.

```javascript
let currentRoundId = null;

function renderGameState(state) {
  if (!state || typeof state.phase !== 'string') {
    return;
  }

  if (currentRoundId !== null && state.roundId !== currentRoundId
      && state.phase !== 'DAY_DISCUSSION') {
    return;
  }

  if (state.roundId !== currentRoundId) {
    currentRoundId = state.roundId;
    clearGameResult();
    clearGameRole();
  }

  gameState = state;
  renderGameResult(state);
  updateGameActions();
  startGameTimer();
}

function renderGameResultDetails(result) {
  if (!result || result.roundId !== currentRoundId
      || !gameState || gameState.phase !== 'FINISHED') {
    return;
  }
  // 현재 라운드 결과만 렌더링
}
```

실제 적용 시에는 서버가 새 라운드의 DAY 상태를 먼저 전달하고, 이전 라운드 메시지를 서버·클라이언트 양쪽에서 구분할 수 있도록 구현해야 합니다.

## 12. 생성된 테스트 산출물

- JUnit XML: `C:\workspace-sts-5.3.0\mafiagame\build\test-results\test\TEST-*.xml`
- Gradle HTML: `C:\workspace-sts-5.3.0\mafiagame\build\reports\tests\test\index.html`
- Playwright last run: `C:\workspace-sts-5.3.0\mafiagame\test-results\.last-run.json`
- Playwright error context: `C:\workspace-sts-5.3.0\mafiagame\test-results\test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증\error-context.md`
- 기존 산출물과 구분되지 않아 현재 실행 근거로 사용하지 않은 서버 로그:
  - `C:\workspace-sts-5.3.0\mafiagame\test-results\bootRun.stdout.log`
  - `C:\workspace-sts-5.3.0\mafiagame\test-results\bootRun.stderr.log`
- 현재 실행분 screenshot·trace ZIP: 생성되지 않음

## 13. 기존 데이터 보존 확인

- `E2E_RUN_ID=qa-20260918-174339`를 사용자 이메일·닉네임·방 제목 생성에 사용함
- 기존 사용자·방·DB 레코드 삭제 명령을 실행하지 않음
- QA 서버만 실행하고 종료함
- 기존 작업 트리 변경사항은 수정하거나 되돌리지 않음

## 14. 최종 판정

**FAIL**

판정 근거:

- Java 테스트: PASS, 64/64
- JavaScript 테스트: PASS, 18/18
- 서버 헬스체크: PASS
- Playwright E2E: FAIL, 4인 재플레이 결과 패널 동기화 오류
- 6인·8인 E2E: NOT RUN
- MVP 25번 같은 게임방 재플레이: FAIL
- MVP 26번 새로고침·재접속 상태 복구: BLOCKED

핵심 서버 규칙 자체는 Java·JavaScript 테스트와 4인 E2E의 첫 게임 사이클에서 대체로 검증되었지만, 재플레이 시 이전 게임 결과가 새 게임에 재표시되는 문제가 해결되기 전에는 MVP 전체를 PASS로 판정할 수 없습니다.
