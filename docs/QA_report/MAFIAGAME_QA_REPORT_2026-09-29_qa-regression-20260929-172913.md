# MAFIAGAME Regression QA 결과 보고서

- 실행 날짜: 2026-09-29
- 실행 요청: QA 스크립트 프로필 2번
- 실행 ID: `qa-regression-20260929-172913`
- 최종 Playwright 실행 ID: `r2609291735`
- 프로젝트 버전: `0.5.2-alpha`
- 선택 프로필: Regression
- 최종 판정: **PASS (실행 ID 보정 후 전체 범위 통과)**
- QA 서버: `http://127.0.0.1:8084`
- 소스 수정 허용: false

## 1. 프로필 범위와 환경

| 항목 | 값 |
|---|---|
| 핵심 게임 인원 | 4, 6, 8명 |
| 재플레이 | 4명 |
| UI 정원 | 5명 |
| 채팅 스크롤 | 30개 메시지 |
| 서버 페이즈 | `short` |
| 방 레이아웃 | `centered` |
| 요청 worker / 실제 worker | 1 / 1 |
| UI 증거 정책 | 스크린샷 활성화, 동영상 비활성화 |
| 진행 데스크톱 녹화 | Regression 정책상 NOT REQUIRED |

MariaDB는 `localhost:23306/mafiaweb`에 TCP 인증 연결하여 `SELECT 1`을 확인했습니다. 로컬 loopback 연결에만 `--protocol=tcp --skip-ssl`을 사용했고, DB 서비스나 ACL은 변경하지 않았습니다.

## 2. 실행 보정 기록

첫 핵심 실행은 `E2E_RUN_ID=qa-regression-20260929-172913`을 사용했습니다. 이 값이 테스트 닉네임에 포함되어 30자 제한을 넘었고, 4·6·8명 핵심 흐름이 모두 회원가입 폼에 남아 실패했습니다. 애플리케이션의 회원가입 응답은 정상적으로 검증 오류를 반환했으며, 해당 실행에서 생성된 부분 계정 3개를 즉시 삭제했습니다.

서버 재기동 중 한 번은 `TEMP/TMP`가 상대 경로로 전달되어 Gradle의 `java.io.tmpdir` 경로를 만들지 못했습니다. 실행별 절대 경로로 수정해 QA 서버를 재기동했습니다. 최종 실행은 닉네임 제한에 맞는 `E2E_RUN_ID=r2609291735`로 수행했습니다.

## 3. 실행 명령과 결과

### DB 사전 점검

```text
mariadb.exe --protocol=tcp --skip-ssl -h localhost -P 23306 -u <DB_USERNAME> mafiaweb --batch --skip-column-names -e "SELECT 1;"
```

결과: `PASS` (`1`)

### Java

```text
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

결과: `PASS`

```text
BUILD SUCCESSFUL in 1m 1s
5 actionable tasks: 5 executed
```

### JavaScript

```text
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js
```

결과: `PASS` — 45/45

### 핵심 Playwright

```text
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

최종 실행 결과:

- 4인 핵심 게임 흐름: PASS
- 6인 핵심 게임 흐름: PASS
- 8인 핵심 게임 흐름: PASS
- Regression 프로필의 4인 재플레이 범위: 4인 시나리오에 포함되어 PASS
- 총 3개 테스트: 3 passed, 약 3.1분

### UI Playwright

```text
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

결과: `PASS` — 2/2

- 30개 채팅 스크롤 및 메시지 영역 고정: PASS
- 5인 방 레이아웃, 중앙 정렬, 준비/시작 버튼 스크롤·표시 상태: PASS

## 4. 서버와 계정 정리

- Spring Boot PID: `11788`
- Gradle launcher PID: `31672`
- `/login`: HTTP 200
- 최종 서버 정리: PASS
- PID와 launcher 트리 종료 확인: PASS
- QA 포트 8084 listener 해제 확인: PASS
- 최종 실행 계정: 24개 발견, 24개 삭제, 잔여 0개
- 초기 잘못된 실행 ID 계정: 3개 발견, 3개 삭제, 잔여 0개
- MariaDB listener `23306`: 기존 PID `7040` 유지

`taskkill.exe`가 `Access denied`를 반환했지만, 검증된 Java PID와 launcher PID가 bounded wait 내에 종료되었고 8084 포트가 해제되어 최종 정리는 PASS로 판정했습니다.

## 5. 증거 경로

- 사전 점검: `output/test_output/2026-09-29/qa-regression-20260929-172913/db-preflight.log`
- Java 로그: `output/test_output/2026-09-29/qa-regression-20260929-172913/java-tests.log`
- JavaScript 로그: `output/test_output/2026-09-29/qa-regression-20260929-172913/javascript-tests.log`
- 핵심 Playwright 로그: `output/test_output/2026-09-29/qa-regression-20260929-172913/playwright-core-retry.log`
- UI Playwright 로그: `output/test_output/2026-09-29/qa-regression-20260929-172913/playwright-ui.log`
- 핵심 스크린샷: `output/test_output/2026-09-29/mafia-mvp-test-regression-r2609291735/`
- 채팅 스크롤 증거: `output/test_output/2026-09-29/chat-scroll-test-r2609291735/`
- 방 레이아웃 증거: `output/test_output/2026-09-29/room-layout-test-5-r2609291735/`
- 초기 실행 실패 trace: `output/test_output/2026-09-29/playwright-qa-regression-20260929-172913/core/`
