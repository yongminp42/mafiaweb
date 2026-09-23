# MAFIAGAME QA 보고서 — Smoke

## 1. 실행 환경

- 실행일: 2026-09-23
- 실행 ID: `qa-20260923-152338-smoke`
- 브랜치: `develop`
- 선택 프로필: Smoke (1번)
- 워커: 요청 1, 실제 1
- 테스트 범위: Java/JavaScript, 4인 핵심 게임 E2E, 5인 정원 방 레이아웃·프로필 UI
- 페이즈 설정: `short`
- Playwright 재시도: 0회
- 판정: **PASS** (Smoke 프로필에 포함된 모든 실행 항목 통과)
- Full QA: **NOT RUN** (요청 프로필 범위 밖)

## 2. DB 및 의존성 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능
- QA 전용 계정 네임스페이스(`qa-20260923-152338-smoke`): 기존 계정 0개
- 8080 포트: 실행 전 사용 중인 서버 없음
- Node.js `v24.19.0`, npm `11.17.0`, Java 테스트 런타임 `21.0.12`
- `node_modules/jsdom`, `node_modules/@playwright/test`: 존재

## 3. 확인한 주요 파일

- `AGENTS.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `build.gradle`, `package.json`, `playwright.config.js`
- `src/main/**`, 관련 `src/test/**`, `test/js/**`, `test/e2e/**`
- 특히 `test/e2e/room-layout.spec.js`의 첫 방문 패치노트 모달 처리

## 4. 실행 명령

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list
```

서버는 현재 작업 트리에서 `SERVER_PORT=8080`, `E2E_PROFILE=smoke`, `MAFIAGAME_PHASE_PROFILE=short`로 새로 기동했습니다. 완료 후 현재 실행 ID 계정만 정리했습니다.

## 5. Java 테스트 결과

Gradle 명령 종료 코드 0, `BUILD SUCCESSFUL`.

| 테스트 클래스 | 테스트 수 | 실패/오류/건너뜀 |
|---|---:|---:|
| `WebSocketAuthorizationInterceptorTest` | 7 | 0 / 0 / 0 |
| `ControllerDelegationTest` | 4 | 0 / 0 / 0 |
| `RoomControllerTest` | 5 | 0 / 0 / 0 |
| `MapperIntegrationTest` | 2 | 0 / 0 / 0 |
| `MafiagameApplicationTest` | 1 | 0 / 0 / 0 |
| `ChatServiceTest` | 3 | 0 / 0 / 0 |
| `RoomGameServiceTest` | 54 | 0 / 0 / 0 |
| `RoomPresenceServiceTest` | 25 | 0 / 0 / 0 |
| `RoomServiceTest` | 10 | 0 / 0 / 0 |
| `SignupServiceTest` | 4 | 0 / 0 / 0 |
| `UserAccountServiceTest` | 6 | 0 / 0 / 0 |
| **합계** | **121** | **0 / 0 / 0** |

## 6. JavaScript 테스트 결과

독립 실행 결과: **41 통과, 0 실패, 0 건너뜀**. 프로필 구성, 패치노트 모달 표시·숨김, STOMP/채팅, 방 목록 동기화 및 모든 프로필 공통 서버 생명주기 문서 회귀 검사가 통과했습니다.

## 7. 서버 기동 및 종료

- Spring Boot 시작 완료: `PASS`
- `/login`: HTTP 200
- QA 앱/포트 리스너 PID: `26396`
- QA 앱 PID와 런처 프로세스 트리 정리: `PASS`
- 종료 후 8080 포트: 사용 가능

## 8. Playwright 실행 범위와 결과

- 프로필: `smoke`
- 핵심 플레이어 수: `4`; 다시하기·복원 시나리오: Smoke 범위에 없음
- UI 정원: `5`
- 페이즈: `short`
- 트레이스: 실패 시 보존 설정; 실패가 없어 생성된 실패 트레이스 없음
- 정기 스크린샷/동영상: Smoke 정책에 따라 수집하지 않음
- 별도 `--list` 탐색: Smoke 정책에 따라 실행하지 않음
- 핵심 E2E: **1/1 통과** — `MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증` (37.4초)
- UI E2E: **1/1 통과** — `waiting and started room layout (5 players)` (9.9초)

## 9. 플레이어 수·확장 시나리오별 판정

| 시나리오 | 결과 | 범위 설명 |
|---|---|---|
| 4인 핵심 게임 흐름 | PASS | 실제 브라우저에서 한 사이클 검증 |
| 5인 핵심 게임 흐름 | NOT RUN | Smoke 프로필의 핵심 게임 범위가 아님 |
| 5인 정원 방 레이아웃·프로필 UI | PASS | 5개 브라우저 참가 및 UI 검증 |
| 6·7·8인 핵심 흐름 | NOT RUN | Smoke 프로필 범위 밖 |
| 6→5 인원 변경 복원 | NOT RUN | Full 전용 확장 시나리오 |
| 재접속 유예·마감시간 경합 | NOT RUN | Full 전용 확장 시나리오 |
| 채팅 스크롤 부하 | NOT RUN | Smoke 프로필 범위 밖 |

## 10. MVP 검증 요약

| 항목 | 결과 및 근거 |
|---|---|
| 역할 배정·확인 | PASS — Java 서비스 테스트 및 4인 브라우저 게임 흐름 통과. 실제 프로덕션 페이즈 시간 측정은 Smoke 범위가 아님 |
| 최종 변론·투표·게임 종료 | PASS — Java 테스트와 4인 핵심 브라우저 시나리오 통과 |
| 사용자 프로필 통계·레벨 | PASS — 신규 사용자의 `Lv. 1`, 프로필 게임/승/패 합계 0 확인 |
| 방 레이아웃 | PASS — 300px 게임 패널, 데스크톱 열 정렬, 모바일 세로 배치 확인 |
| 호스트 전용 방 설정 | PASS — 호스트 버튼 순서와 비호스트 미노출 검증 통과 |
| 첫 방문 패치노트 모달 | PASS — 표시를 확인하고 닫은 뒤 사용자 메뉴 이동 성공 |
| 역할별 진영·조사 결과 및 채널 표시 | PASS — 관련 JavaScript 테스트 통과 |
| 15/60/20/20/20/35초 프로덕션 페이즈 시간 | NOT RUN — Full 전용 검증 |

## 11. 실패 및 차단 항목

이번 실행에서 실패하거나 차단된 항목은 없습니다. Full 전용 및 Smoke 범위 밖 시나리오는 위 표와 같이 `NOT RUN`입니다.

## 12. 재현 절차

1. MariaDB 연결과 8080 포트 비사용 상태를 확인합니다.
2. 위 Java 및 JavaScript 명령을 실행합니다.
3. 새 서버를 Smoke/short 설정으로 기동합니다.
4. 4인 핵심 E2E 후 5인 방 레이아웃 UI E2E를 각각 워커 1개, 재시도 0회로 실행합니다.
5. 실행 ID `qa-20260923-152338-smoke`에 한정된 테스트 계정만 정리하고 서버 종료 후 포트를 확인합니다.

## 13. 원인 분석

직전 QA 실패는 앱의 모달 동작 오류가 아니라 방 레이아웃 E2E 흐름의 누락이었습니다. 첫 방문에 표시된 패치노트 모달이 뒤쪽 UI 조작을 막는데 테스트가 이를 닫지 않고 사용자 메뉴를 클릭했습니다. 테스트에 모달 표시 확인·닫기·숨김 확인을 추가한 뒤 이번 실행에서 해당 시나리오가 통과했습니다.

## 14. 앱 결함과 테스트 결함 구분

- 앱 결함: 이번 실행에서 발견되지 않음
- 테스트 결함: 첫 방문 모달을 닫지 않던 E2E 절차 누락을 수정했고, 이번 Smoke UI 시나리오로 확인

## 15. 변경 파일

- `test/e2e/room-layout.spec.js:27` — 첫 방문 패치노트 모달 닫기 및 숨김 확인 함수
- `test/e2e/room-layout.spec.js:78` — 사용자 메뉴 클릭 전에 해당 함수 호출

## 16. 권고사항

현 수정 사항에 추가 조치는 필요하지 않습니다. 프로덕션 페이즈 시간 및 Full 전용 확장 경계는 별도의 명시적 Full QA 요청이 있을 때 검증합니다.

## 17. 산출물

- Java 콘솔 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/java-tests.log`
- JavaScript 콘솔 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/javascript-tests.log`
- 핵심 E2E 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/playwright-core.log`
- UI E2E 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/playwright-ui.log`
- 서버 표준 출력/오류: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/bootRun.qa-20260923-152338-smoke.stdout.log`, `bootRun.qa-20260923-152338-smoke.stderr.log`
- 계정 정리 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/account-cleanup.log`
- Playwright 결과 디렉터리: `output/test_output/2026-09-23/playwright-qa-20260923-152338-smoke/{core,ui}/`
- 시나리오 산출물: `output/test_output/2026-09-23/mafia-mvp-test-smoke-qa-20260923-152338-smoke/`, `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-152338-smoke/`
- Java JUnit XML: `build/test-results/test/`; HTML 보고서: `build/reports/tests/test/index.html`
- 스크린샷/동영상: Smoke 수집 정책에 따라 생성하지 않음

## 18. 기존 데이터 보존

사전 실행 ID 네임스페이스는 비어 있음을 확인했습니다. 삭제는 이번 실행 ID의 Playwright 계정 및 그 종속 데이터에만 한정했으며, 기존 사용자·방·데이터는 삭제하지 않았습니다.

## 19. 테스트 계정 정리

- 현재 실행에서 발견한 계정: 9개
- 삭제: 9개
- 잔여 계정: 0개
- 계정 정리: **PASS**

## 20. 최종 판정

**PASS** — Smoke 프로필에서 요청된 Java, JavaScript, 4인 핵심 E2E, 5인 방 레이아웃·프로필 UI가 모두 통과했고, QA 계정과 서버 정리도 확인했습니다. Full QA는 실행하지 않았습니다.
