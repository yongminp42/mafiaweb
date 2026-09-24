# MAFIAGAME QA 보고서 — 2026-09-24

- 포함 보고서 수: 6
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-162600.md`
2. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-192907.md`
3. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md`
4. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-205533.md`
5. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-212401.md`
6. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-215047.md`

---

## 문서 1: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-162600.md`

# MAFIAGAME Full QA 보고서

- 실행 일시: 2026-09-24 16:26 KST
- `E2E_RUN_ID`: `qa-20260924-162600`
- 선택 프로필: `full` (사용자가 요청한 프로필 3)
- 프로필 설정: `PLAYER_COUNTS=4,5,6,7,8`, `E2E_CAPACITY=8`, `MAFIAGAME_PHASE_PROFILE=production`
- 작업 경로: `C:\workspace\mafiaweb`
- 최종 판정: **BLOCKED**

## 1. 실행 환경

Windows PowerShell에서 현재 작업 경로를 대상으로 QA를 준비했다. Full 프로필의 요청 worker 수는 1이다. MariaDB 연결 사전 점검이 실패해 테스트 worker는 실행되지 않았으며, 유효 worker 수는 해당 없음이다. QA에서 사용할 애플리케이션 URL 설정은 `http://127.0.0.1:8080`이었다.

## 2. MariaDB 사전 점검 및 의존성

애플리케이션 설정의 JDBC 주소는 `jdbc:mariadb://localhost:23306/mafiaweb`이다. runbook의 DB 사전 점검을 Java·JavaScript·Playwright 명령보다 먼저 실행했다.

실행 명령:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 23306 -InformationLevel Quiet -WarningAction SilentlyContinue
```

실제 출력:

```text
MariaDB 127.0.0.1:23306 reachable=False
MariaDB is not reachable at 127.0.0.1:23306. Stop this QA run; all requested test cases are NOT RUN.
```

사전 점검 결과는 **BLOCKED**다. runbook에 따라 여기서 QA 실행을 중단했다. Node.js, `npm.cmd`, `node_modules/jsdom`, `node_modules/@playwright/test`는 DB 게이트 이후 확인하도록 되어 있어 이번 실행에서는 확인하지 않았다. 데이터베이스를 설치하거나 시작하지 않았다.

## 3. 확인한 파일과 디렉터리

- `AGENTS.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `docs/MAFIAGAME_MVP.md`의 5장 최소 게임 규칙
- `package.json`, `build.gradle`
- `src/main/**`, `src/test/**`, `test/js/**`, `test/e2e/**`의 파일 목록
- `src/main/resources/application.properties`의 datasource URL
- `git status --short`로 기존 작업 변경 여부 확인

기존 작업 트리에 소스·테스트·QA 문서 등의 변경이 있었고 이를 보존했다. 이번 QA 실행에서 소스나 테스트 코드는 수정하지 않았다.

## 4. 실행 명령

실행한 것은 위 DB TCP 사전 점검뿐이다. DB 게이트 실패 후 아래 명령은 실행하지 않았다.

```powershell
$env:GRADLE_USER_HOME="$projectPath\.gradle-test"; .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js test/js/duckdns.test.js
npm.cmd exec -- playwright test test/e2e/mafia-mvp.spec.js test/e2e/chat-scroll.spec.js test/e2e/room-layout.spec.js --list --workers=1
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

서버도 시작하지 않았다. `bootRun` stdout/stderr 로그, JUnit XML, Gradle HTML 보고서, Playwright discovery 결과는 이번 실행에서 생성되지 않았다.

## 5. Java 테스트 결과

**BLOCKED / NOT RUN** — DB 사전 점검 실패로 Gradle 명령을 실행하지 않았다. Java 테스트 결과 수와 PASS/FAIL/ERROR 수는 산출되지 않았다.

이번 실행의 JUnit XML 경로: 생성되지 않음 (`build/test-results/test/`). Gradle HTML 보고서 경로: 이번 실행에서 생성되지 않음 (`build/reports/tests/test/index.html`).

다음을 포함한 필수 테스트는 모두 실행되지 않았다: `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying`, `RoomPresenceServiceTest.resetsInterruptedPlayingRoomsWhenApplicationBecomesReady`, `RoomGameServiceTest.endsOneMafiaOneDoctorGameAtParityBeforeTheNightCanRepeat`, `RoomGameRulesTest`의 Spy parity 테스트, 익명 로비 제한 테스트, 게임 시작 순서·rollback 테스트, 역할표·첫 밤·설정 저장·재접속 유예·완료 통계 테스트.

## 6. JavaScript 테스트 결과

**BLOCKED / NOT RUN** — 직접 Node 테스트를 실행하지 않았다. 총 테스트 수, 통과·실패 수 및 DuckDNS 테스트의 정적/런타임 결과는 산출되지 않았다. Windows에서 POSIX Bash가 필요한 DuckDNS updater 검사가 실행되는지도 판정하지 않았다.

대상 예정 파일은 `stomp-client.test.js`, `room-list.test.js`, `chat.test.js`, `e2e-profile.test.js`, `duckdns.test.js`다. QA 명령은 `package.json`의 다섯 파일 테스트 범위와 동일하게 구성되어 있다.

## 7. 서버 시작 및 상태 점검

**BLOCKED / NOT RUN** — DB 게이트에서 중단했으므로 QA 애플리케이션을 시작하거나 `/login`의 HTTP 200을 확인하지 않았다. 포트 8080의 점유 상태도 조회하지 않았다. 기존 서버나 프로세스는 종료·변경하지 않았다.

이번 실행용 로그 경로는 생성되지 않았다:

- `output/test_output/2026-09-24/qa-run-qa-20260924-162600/bootRun.qa-20260924-162600.stdout.log`
- `output/test_output/2026-09-24/qa-run-qa-20260924-162600/bootRun.qa-20260924-162600.stderr.log`

QA 서버 PID와 Gradle launcher PID가 만들어지지 않아 서버 정리 절차는 수행 대상이 없었다.

## 8. Playwright 탐색·worker·E2E 결과

**BLOCKED / NOT RUN** — Full discovery와 core/UI E2E를 모두 실행하지 않았다. 프로필 설정은 Full 기본값 그대로다.

- 요청 worker 수: 1
- 실제 worker 수: 해당 없음 (Playwright 프로세스 미실행)
- 플레이어 수: 4, 5, 6, 7, 8명
- 재경기: 각 인원 시나리오에서 수행 예정
- 회복력: 6→5명 방 이탈, 마감·재접속·만료 night action 시나리오 수행 예정
- UI: 채팅 210건 scroll, 8명 room-layout/profile/settings 시나리오 수행 예정
- 페이즈: production 설정. 실제 시간은 측정하지 않음
- Full 증거 설정: trace, 스크린샷, 동영상 저장 예정이나 이번에는 생성되지 않음

실행하지 않은 combined discovery의 필수 7개 core 시나리오: `MVP 4인 핵심 게임 흐름`, `MVP 5인 핵심 게임 흐름`, `MVP 6인 핵심 게임 흐름`, `MVP 7인 핵심 게임 흐름`, `MVP 8인 핵심 게임 흐름`, `closing a waiting-room tab changes six players to the five-player role threshold`, `browser deadline, reconnect grace, and expired night action`.

실행하지 않은 UI discovery inventory의 필수 2개 시나리오: `role slot is visible before game and chat scrolls without growing the page`, `waiting and started room layout (8 players)`.

Discovery 산출 경로 `output/test_output/2026-09-24/playwright-qa-20260924-162600/discovery/`는 생성되지 않았다. core/UI 결과 경로 `.../core/`, `.../ui/`도 생성되지 않았다.

## 9. 프로필별 시나리오 결과

| 시나리오 | 결과 | 근거 |
| --- | --- | --- |
| 4명 핵심 흐름 및 재경기 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 5명 역할 구성 및 재경기 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 6명 Spy·Soldier 흐름 및 재경기 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 7명 두 Mafia·Soldier·Medium 흐름 및 재경기 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 8명 최대 인원 흐름 및 재경기 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 6→5명 대기방 이탈 회복 | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 30초 재접속 유예·마감·만료 action | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 채팅 210건 scroll UI | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |
| 8명 room layout/profile/settings UI | BLOCKED | DB 사전 점검 실패, Playwright 미실행 |

## 10. MVP 검증표

아래 모든 항목은 실행 증거가 없어 `BLOCKED`다. 각 행의 공통 원인은 MariaDB `127.0.0.1:23306` 연결 실패 후 runbook에 따라 테스트를 시작하지 않은 것이다. 문서·소스 계약만으로 실행 결과를 추정하지 않았다. MVP 문서의 5.3 낮 건너뛰기 투표는 runbook에 따라 범위에서 제외했다.

| # | 검증 항목 | 결과 |
| ---: | --- | --- |
| 1 | Mafia·의사·경찰·시민 역할 배정 | BLOCKED |
| 2 | 역할 정보의 개인 노출 | BLOCKED |
| 3 | 60초 낮 타이머 | BLOCKED |
| 4 | 20초 지목 투표 타이머 | BLOCKED |
| 5 | 20초 최종 변론 타이머 | BLOCKED |
| 6 | 20초 처형 투표 타이머 | BLOCKED |
| 7 | 35초 밤 타이머 | BLOCKED |
| 8 | 중복 지목 방지 | BLOCKED |
| 9 | 자기 자신 지목 방지 | BLOCKED |
| 10 | 사망자 투표 방지 | BLOCKED |
| 11 | 처형 후보자 투표 방지 | BLOCKED |
| 12 | Mafia kill | BLOCKED |
| 13 | 의사 보호 | BLOCKED |
| 14 | 경찰 조사 결과 개인 전달 | BLOCKED |
| 15 | 역할별 밤 행동 검증 | BLOCKED |
| 16 | 시민 밤 행동 방지 | BLOCKED |
| 17 | 시민 승리 조건 | BLOCKED |
| 18 | Mafia 승리 조건 | BLOCKED |
| 19 | 투표·밤 행동 직후 서버 승패 판정 | BLOCKED |
| 20 | 승리 직후 결과 표시 | BLOCKED |
| 21 | 승리 진영 표시 | BLOCKED |
| 22 | 결과 화면 개인 역할 표시 | BLOCKED |
| 23 | 생존/사망 표시와 사망 카드 스타일 | BLOCKED |
| 24 | 게임 종료 뒤 `WAITING` 복귀 | BLOCKED |
| 25 | Ready 상태 초기화 | BLOCKED |
| 26 | 같은 방 재경기 | BLOCKED |
| 27 | 새로고침·재접속 상태 복원 | BLOCKED |
| 28 | 공개·Mafia 채팅 분리 | BLOCKED |
| 29 | 밤 채팅·사망자 채널 권한 분리 | BLOCKED |
| 30 | Mafia·Spy·의사·경찰·Medium의 무행동 처리 | BLOCKED |
| 31 | 의사 자기 보호와 연속 보호 규칙 | BLOCKED |
| 32 | 사망 시 역할·조사 정보 비공개 | BLOCKED |
| 33 | 게임 완료 후 전체 역할 공개 | BLOCKED |
| 34 | 서버 시각 마감 처리·중복 요청 멱등성 | BLOCKED |
| 35 | 실제 게임방 `게임 목록으로` 버튼과 `/rooms` 이동 | BLOCKED |
| 36 | 일반/NIGHT 배경의 뒤로가기 버튼 대비 유지 | BLOCKED |
| 37 | PUBLIC·MAFIA·DEAD 채팅 클래스와 시각 구분 | BLOCKED |
| 38 | 페이즈 전환 SYSTEM 메시지와 안내 | BLOCKED |
| 39 | NIGHT 회색 배경 전환 및 정상 배경 복원 | BLOCKED |
| 40 | 서버 렌더링 게임방 스크린샷 및 정상→밤→정상 동영상 | BLOCKED |
| 41 | 사전 점검부터 정리까지 진행 증거 스크린샷·동영상 | BLOCKED |
| 42 | 방장 전용 설정 UI·정원·비밀번호 설정 | BLOCKED |
| 43 | 참가자보다 낮은 정원 차단·설정 동기화 | BLOCKED |
| 44 | FINISHED 공개 채널 고정과 사망자 공개 메시지 전달 | BLOCKED |
| 45 | 조사 결과 진영 표기 및 Spy/Medium 직업 별도 표기 | BLOCKED |
| 46 | 기동 복구 시 PLAYING만 WAITING으로 초기화 | BLOCKED |
| 47 | Spy 접선 상태를 반영한 parity Mafia 승리 | BLOCKED |
| 48 | 익명 로비 요청 허용·세션 제한·전체 coalescing | BLOCKED |
| 49 | 게임 시작 위임·DB 순서·실패 복구·부분 상태 제거 | BLOCKED |
| 50 | 4~8명 정확한 역할표와 5·7명 변경 구성 | BLOCKED |
| 51 | 역할 확인 또는 15초 만료 후 첫 NIGHT, 35초 후 낮 | BLOCKED |
| 52 | 방 설정 저장 뒤 모달·성공 문구 유지 | BLOCKED |
| 53 | Spy 접선에 따른 parity 계산과 Mafia 채널 허용 | BLOCKED |
| 54 | 30초 재접속 유예·만료 시 action 제거 및 승패 재평가 | BLOCKED |
| 55 | DuckDNS timer 및 updater 계약·실행 검증 | BLOCKED |
| 56 | 완료 게임 통계의 1회 기록·재경기 증가·미완료 미기록 | BLOCKED |

46~56번의 Java·JavaScript·Playwright 근거는 하나도 실행되지 않았다. 특히 DB mapper 통합 검사와 서비스·컨트롤러 단위 검사는 분리해서 보고해야 하지만, 이번에는 양쪽 모두 결과가 없다.

## 11. 실패 및 차단 항목

- 실패(`FAIL`): 없음. 테스트를 실행하지 않아 테스트 실패로 판정할 결과가 없다.
- 차단(`BLOCKED`): 전체 Full QA. 선행 조건인 MariaDB 포트 연결에 실패했다.
- 미실행(`NOT RUN`): Java, JavaScript, Playwright discovery/core/UI, 서버 기동·health check, 페이즈 시간 측정, 시각 증거 수집 및 DB 계정 정리.
- 진행 스크린샷 및 동영상: 생성되지 않음. 해당 증거 요구 항목은 `BLOCKED`다.

## 12. 재현 절차

현재 환경에서 아래 연결 점검이 `False`를 반환했다.

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 23306 -InformationLevel Quiet -WarningAction SilentlyContinue
```

MariaDB가 프로젝트 설정 포트 `23306`에서 연결 가능한 환경을 준비한 뒤, 사용자가 지정한 Full 프로필로 QA를 다시 실행하면 된다. 이번 실행에서는 서비스를 시작하거나 설치하지 않았다.

## 13. 원인 분석

중단 원인은 테스트 코드나 애플리케이션 동작이 아니라 환경 사전 조건이다. `127.0.0.1:23306` TCP 연결이 되지 않아 QA runbook의 명시적인 stop gate가 발생했다. 애플리케이션에 접속하거나 테스트 데이터를 변경하기 전에 중단했으므로 애플리케이션 결함 원인은 판단할 수 없다.

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

**BLOCKED / 판정 불가.** 애플리케이션 테스트와 테스트 코드가 실행되지 않아 어느 쪽의 결함도 확인되지 않았다. 관측된 문제는 DB 연결 사전 조건뿐이다.

## 15. 수정이 필요한 파일과 줄 번호

이번 결과만으로 수정 대상으로 특정할 애플리케이션·테스트 파일은 없다. 실패 테스트가 없어 소스 줄 번호도 특정하지 않았다. 환경에서 MariaDB를 사용할 수 있게 한 뒤 전체 프로필을 재실행해야 한다.

## 16. 권고사항

프로젝트 datasource 설정과 동일한 `127.0.0.1:23306`의 MariaDB 연결 가능 여부를 환경 담당자가 확인한 후 Full QA를 다시 실행한다. 재실행에서는 Java/JavaScript 테스트, Full discovery, 4~8명 게임 흐름, resilience, UI, 실제 production 페이즈 시간과 증거를 확인한다. 코드 변경은 권고하지 않는다.

## 17. 생성된 테스트 산출물

- QA 보고서: `C:\workspace\mafiaweb\docs\QA_report\MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-162600.md`
- 실행 ID 기준 `output/test_output/2026-09-24/` 자료: 생성되지 않음
- JUnit XML·Gradle HTML: 생성되지 않음
- Playwright discovery·trace·스크린샷·동영상: 생성되지 않음
- QA 서버 stdout/stderr: 생성되지 않음
- 진행 화면 스크린샷·동영상: 생성되지 않음

산출물이 없는 것은 DB 게이트에서 서버·테스트 실행 전에 중단했기 때문이다. 누락된 Full 시각 증거 항목은 PASS로 처리하지 않았다.

## 18. 기존 데이터 보존

애플리케이션·Playwright 테스트가 실행되지 않았고 DB 트랜잭션도 수행되지 않았다. 따라서 QA가 기존 DB 사용자·방·게임 데이터를 변경하거나 삭제하지 않았다. 기존 서버 프로세스도 건드리지 않았다.

## 19. 테스트 계정 정리 및 남은 계정 수

Playwright 미실행으로 이번 `E2E_RUN_ID`에서 생성한 테스트 계정은 없다. 계정 조회·삭제 SQL은 실행하지 않았고 DB 연결이 불가능해 잔여 계정 수를 조회하지 못했다. 계정 정리 검증은 **BLOCKED / NOT RUN**으로 기록한다.

## 20. 최종 판정

**BLOCKED** — Full 프로필을 선택하고 사전 점검을 시작했으나 MariaDB `127.0.0.1:23306`에 연결할 수 없어 runbook의 중단 조건을 적용했다. Java·JavaScript·Playwright·서버 검증은 모두 미실행이며, 제품 품질에 대한 PASS 또는 FAIL 결론은 내리지 않는다.

---

---

## 문서 2: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-192907.md`

# MAFIAGAME QA 실행 보고서 — Smoke 프로필

## 실행 개요

- 실행 날짜: 2026-09-24
- 실행 식별자: qa-20260924-192907
- 선택 프로필: 1번 Smoke
- 범위: 4인 핵심 게임 흐름, 정원 5인 방 화면, 짧은 페이즈 시간
- Playwright 작업자 설정: 1
- 전체 판정: **실패**

Java 테스트에서 136건 중 46건이 실패했습니다. JavaScript 테스트는 42건 통과, 1건 건너뜀으로 종료했습니다. Playwright 핵심 흐름 및 방 화면 검증은 실행 환경이 Node 자식 프로세스 생성을 거부해 테스트 케이스를 시작하지 못했습니다. 따라서 E2E 결과는 실패 단언이 아니라 실행 차단으로 분류했습니다.

## 결과 요약

| 영역 | 결과 | 세부 결과 |
| --- | --- | --- |
| 사전 점검 | 통과 | MariaDB 연결, Node 의존성, 초기 8080 포트 상태 확인 |
| Gradle Java 테스트 | 실패 | 136건 실행, 90건 통과, 46건 실패 |
| JavaScript 테스트 | 부분 통과 | 43건 중 42건 통과, 1건 환경 조건으로 건너뜀 |
| 서버 기동 및 상태 확인 | 통과 | QA 서버가 시작되고 /login에서 HTTP 200 응답 |
| Playwright 핵심 흐름 | 차단 | 작업자 프로세스 생성 중 Error: spawn EPERM; 테스트 케이스 미실행 |
| Playwright 방 화면 | 차단 | 작업자 프로세스 생성 중 Error: spawn EPERM; 테스트 케이스 미실행 |
| 계정 및 서버 정리 | 통과 | 실행 범위 계정 정리 확인, QA 서버 프로세스 종료, 8080 포트 해제 |

## 사전 점검

- MariaDB 127.0.0.1:23306 연결 가능 상태를 확인했습니다.
- node_modules/jsdom과 node_modules/@playwright/test가 존재했습니다.
- 실행 전 8080 포트는 사용 중이 아니었습니다.
- mariadb 및 mysql 명령행 도구는 설치되어 있지 않았습니다. QA 계정 정리 도구는 Gradle 캐시에 있는 MariaDB JDBC 드라이버를 사용했습니다.
- 실행 식별자에 해당하는 playwright.qa-20260924-192907.%@example.com 계정은 실행 전 0개였습니다.

## Java 테스트

실행 명령:

    .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest

결과는 136 tests completed, 46 failed입니다. 테스트 리포트는 build/reports/tests/test/index.html, XML 결과는 build/test-results/test/에 생성되었습니다.

### 실패 원인 분석

1. MafiagameApplicationTest.contextLoads() 1건은 H2 초기화 중 GAME_COMPLETION 테이블이 이미 존재한다는 오류로 애플리케이션 컨텍스트를 만들지 못했습니다. 현재 테스트 설정에서 Flyway 마이그레이션과 spring.sql.init.mode=always의 schema.sql 초기화가 같은 테이블을 생성하려는 흐름이 원인으로 확인됐습니다.
2. MapperIntegrationTest 4건은 테스트용 H2 데이터베이스와 MariaDB 전용 마이그레이션 구문의 호환성 문제로 실패했습니다. 최초 실패인 completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed()에서 V1__create_game_completion.sql의 ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 구문을 H2가 파싱하지 못했습니다. 나머지 세 테스트는 최초 컨텍스트 로딩 실패 후 반복 로딩 임계값에 걸려 실행이 생략됐습니다.
3. RoomGameServiceTest는 58건 중 41건이 실패했습니다. 다수의 흐름 테스트 도우미가 게임 시작 후 페이즈를 한 번만 넘기는 기존 진행을 전제로 하지만, 현재 진행은 역할 배정 뒤 첫 밤을 거쳐 낮 토론으로 이어집니다. 이 차이 때문에 도우미가 밤 행동·후보 지명·처형 투표를 해당 단계가 아닌 시점에 제출하고 RoomWebSocketException을 받았습니다. skipsExecutionWhenNoNominationVotesAreSubmitted, rejectsConcurrentRequestsAfterTheServerDeadline, countsOnlyOneOfTwoConcurrentVotesFromTheSamePlayer, broadcastsSystemGuidanceWhenAGamePhaseStarts 등에서 단계 기대값 불일치가 확인됐습니다.

실패한 Java 테스트는 수정하거나 재실행하지 않았습니다. QA 실행 중 소스 변경은 없었습니다.

## JavaScript 테스트

실행 명령:

    node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js test/js/duckdns.test.js

총 43건 중 42건 통과, 실패 0건, 건너뜀 1건이며 실행 시간은 약 5.7초였습니다. DuckDNS updater hides its token and preserves last success on a rejected update 검증은 Windows 환경에 필요한 POSIX 셸이 없어 건너뛰었습니다. 같은 영역의 정적 DuckDNS 계약 검증은 통과했습니다.

## 서버 및 Playwright 검증

QA 서버는 정상 기동했고 Started MafiagameApplication 로그와 /login HTTP 200 응답을 확인했습니다. 프로필 설정은 핵심 게임 흐름 4인, 방 화면 정원 5인, 짧은 페이즈 시간, 작업자 1개였습니다.

핵심 흐름 명령:

    npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list

방 화면 명령:

    npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list

두 실행 모두 Playwright가 작업자용 Node 프로세스를 생성하는 단계에서 Error: spawn EPERM으로 종료됐습니다. 오류 지점은 WorkerHost.startRunner의 child_process.fork입니다. 추가로 확인한 최소 Node 자식 프로세스 진단도 C:\Program Files\nodejs\node.exe 실행 시 동일하게 EPERM을 반환했습니다. 따라서 두 명령 모두 테스트 케이스와 검증 단언은 시작하지 못했습니다. 프로필의 작업자 수를 1로 설정해도 Playwright는 별도 작업자 프로세스를 만들기 때문에 진행할 수 없었습니다.

Smoke 범위에서 제외되는 재접속 복구, 복원력, 채팅 스크롤 검증은 실행하지 않았습니다. UI 레이아웃 검증은 프로필에 포함되어 실행을 시도했으나 위 환경 차단으로 완료하지 못했습니다.

## 정리 및 데이터 보호

- 실행 식별자 전용 계정 정리 결과: found=0, deleted_accounts=0, deleted_memberships=0, deleted_rooms=0, deleted_game_completions=0, deleted_stats=0, remaining_accounts=0.
- 기존 데이터가 실행 식별자 정리 범위에 포함되지 않는 것을 확인했습니다.
- QA Spring Boot 프로세스 PID 23924와 이번 실행의 Gradle 런처 트리를 종료했습니다.
- 종료 뒤 8080 포트가 해제된 것을 확인했습니다.

## 산출물

실행 로그와 임시 QA 도구는 아래 실행별 폴더에 보관했습니다.

    output/test_output/2026-09-24/qa-run-qa-20260924-192907/

주요 파일은 gradle-test.log, javascript-tests.log, server-and-e2e-lifecycle.log, playwright-core.log, playwright-ui.log, e2e-run-result.txt, bootRun.qa-20260924-192907.stdout.log, bootRun.qa-20260924-192907.stderr.log입니다. Playwright 산출물 경로는 output/test_output/2026-09-24/playwright-qa-20260924-192907/입니다.

## 후속 조치 권고

1. H2 테스트 구성에서 마이그레이션과 schema.sql의 중복 테이블 생성을 정리하고, MariaDB 전용 마이그레이션 구문을 테스트 데이터베이스에서 처리하는 방식을 맞춥니다.
2. 게임 시작 후 첫 밤 페이즈를 포함하도록 RoomGameServiceTest의 페이즈 진행 도우미와 단계 기대값을 갱신합니다.
3. Node 자식 프로세스 실행이 허용되는 환경에서 Smoke 프로필을 다시 실행해 Playwright 핵심 흐름과 방 화면을 확인합니다.

---

---

## 문서 3: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md`

# MAFIAGAME QA 실행 보고서 — Smoke 프로필

## 1. 실행 환경

- 실행 날짜: 2026-09-24
- 실행 식별자: `qa-20260924-202938`
- 선택 프로필: 1번 Smoke
- 프로필 범위: 4인 핵심 게임 흐름, 정원 5인 방 화면, 짧은 페이즈
- 실행 환경: Microsoft Windows 10.0.26200.0, PowerShell 5.1.26100.9444, Java 22.0.1, Gradle Wrapper 8.14.5, Node.js v24.19.0, npm 11.17.0
- 설정 작업자 수: 1
- 유효 작업자 수: 0 — Playwright 작업자 사전 점검에서 차단되어 Playwright 프로세스를 시작하지 않았습니다.
- 적용 설정: `E2E_PROFILE=smoke`, `PLAYER_COUNTS=4`, `E2E_CAPACITY=5`, `MAFIAGAME_PHASE_PROFILE=short`
- 최종 판정: **BLOCKED**

## 2. MariaDB 사전 점검과 의존성

- `src/main/resources/application.properties`에서 읽은 MariaDB 주소 `localhost:23306`에 연결할 수 있었습니다.
- Node.js, `npm.cmd`, `node_modules/jsdom`, `node_modules/@playwright/test`가 모두 확인됐습니다.
- Playwright의 실제 작업자 실행에 필요한 `child_process.fork` 진단은 종료 코드 `23`과 `EPERM: spawn EPERM`을 반환했습니다.
- 이에 따라 Java 및 JavaScript 테스트는 계속 실행하고, E2E는 `BLOCKED`로 기록했습니다. E2E 서버를 시작하거나 Playwright 테스트 명령을 실행하지 않았습니다.
- 사전 점검 원문은 `output/test_output/2026-09-24/qa-run-qa-20260924-202938/qa-preflight.log`에 저장했습니다.

## 3. 확인한 프로젝트 파일과 구조

- 지침 및 요구사항: `AGENTS.md`, `docs/MAFIAGAME_MVP.md`, `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 테스트·빌드 설정: `package.json`, `build.gradle`, `src/test/resources/application.properties`, `src/test/resources/schema.sql`
- 애플리케이션 소스 및 리소스: `src/main/java/**`, `src/main/resources/**`
- 테스트: `src/test/java/**`, `test/js/**`, `test/e2e/**`
- 확인된 구성 규모: `src/main` 68개 파일, `src/test` 14개 파일, `test/js` 6개 파일, `test/e2e` 5개 파일
- 표준 JavaScript 실행 집합은 `test/js/stomp-client.test.js`, `test/js/room-list.test.js`, `test/js/chat.test.js`, `test/js/e2e-profile.test.js`입니다. DuckDNS 검사는 Smoke 범위에서 제외됩니다.

## 4. 실행한 명령

1. DB 연결 점검: `Test-NetConnection -ComputerName localhost -Port 23306 -InformationLevel Quiet`
2. Node 자식 작업자 진단: `child_process.fork`로 종료하는 임시 Node 스크립트를 실행했습니다. 결과는 `EPERM: spawn EPERM`이었습니다.
3. Java: `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
4. JavaScript: `npm.cmd run test:js`
5. Smoke 프로필에서 예정된 Playwright 핵심 흐름 `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`와 방 화면 `npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list`는 작업자 사전 점검이 차단되어 실행하지 않았습니다. Smoke 프로필에서는 별도 Playwright `--list` 탐색도 실행하지 않습니다.

## 5. Java 테스트 결과

- 결과: **PASS** — 136건 실행, 136건 통과, 실패 0건, 오류 0건, 건너뜀 0건
- 명령: `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
- Gradle 로그: `output/test_output/2026-09-24/qa-run-qa-20260924-202938/gradle-test.log`
- JUnit XML: `build/test-results/test/` (12개 테스트 스위트 파일)
- Gradle HTML 결과: `build/reports/tests/test/index.html`
- 데이터베이스 매퍼 검사는 테스트 설정의 H2 데이터베이스를 사용했습니다. QA 사전 점검의 MariaDB 연결 확인은 애플리케이션 테스트 데이터 변경을 의미하지 않습니다.
- 보고서 관련 실행 테스트에는 `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, `RoomGameServiceTest.confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms`, `RoomGameServiceTest.startsTheFirstNightWhenTheRoleConfirmationTimerExpiresInRealTime`, `RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase`, `RoomGameServiceTest.rejectsConcurrentRequestsAfterTheServerDeadline`, `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying`, `MapperIntegrationTest.completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed`, `RoomPresenceServiceTest.throttlesRepeatedLobbyCountRequestsFromOneSession`, `RoomPresenceServiceTest.coalescesLobbyCountRequestsAcrossSessionsAtTheGlobalLimit`, `RoomPresenceServiceTest.usesTheCurrentFivePlayersWhenTheSixthLeavesBeforeStart`, `RoomPresenceServiceTest.restoresWaitingStatusWhenCreatingTheGameInstanceFails`, `RoomGameServiceTest.removesPartiallyStartedGameWhenPublishingTheInitialStateFails`가 포함되며 모두 통과했습니다.

## 6. JavaScript 테스트 결과

- 결과: **PASS** — 41건 실행, 41건 통과, 실패 0건, 건너뜀 0건
- 명령: `npm.cmd run test:js`
- 로그: `output/test_output/2026-09-24/qa-run-qa-20260924-202938/javascript-tests.log`
- 프로필 계약 테스트에서 Smoke의 4인 범위, 재플레이 제외, 5인 방 화면 범위, 공통 E2E 사전 점검, DuckDNS 테스트 분리를 확인했습니다.
- 이 프로필은 DuckDNS 전용 테스트를 실행하지 않습니다. 프로필 4의 `npm.cmd run qa:duckdns` 결과로 간주하지 않았습니다.

## 7. 서버 시작과 상태 확인

- 서버 시작: **NOT RUN** — `child_process.fork` 사전 점검이 실패해 QA 서버를 기동하지 않았습니다.
- 서버 상태 확인: **NOT RUN** — 이번 실행에서 시작한 서버가 없습니다.
- QA Java PID 및 Gradle 런처 PID: 생성하지 않았습니다.
- 실행 후 8080 포트: 수신 대기 프로세스가 없음을 확인했습니다.
- `bootRun` 표준 출력·오류 로그는 서버를 시작하지 않아 생성되지 않았습니다.

## 8. Playwright 범위와 실행 결과

- 프로필: `smoke`
- 요청 범위: 4인 핵심 흐름 1개, 정원 5인 방 화면 1개
- 재플레이·복원력 테스트: Smoke 범위에서 제외
- 채팅 스크롤: Smoke 범위에서 제외
- 페이즈 설정: 짧은 페이즈
- 추적 정책: 실패 시 보존
- 정기 스크린샷·비디오 정책: Smoke에서는 저장하지 않음
- 핵심 시나리오 `MVP 4인 핵심 게임 흐름`: **NOT RUN** — Playwright E2E 전체 상태는 `BLOCKED`
- UI 시나리오 `waiting and started room layout (5 players)`: **NOT RUN** — Playwright E2E 전체 상태는 `BLOCKED`
- 테스트 탐색 출력, Playwright 추적, 브라우저 스크린샷·비디오: 생성되지 않았습니다.
- E2E 산출물 예정 위치 `output/test_output/2026-09-24/playwright-qa-20260924-202938/`는 생성되지 않았습니다.

## 9. 인원별·프로필 시나리오 결과

| 시나리오 | 결과 | 설명 |
|---|---|---|
| 4인 핵심 게임 흐름 | BLOCKED | Smoke 포함 항목이나 Playwright 작업자를 만들지 못해 실행하지 못했습니다. |
| 4인 같은 방 재플레이 | NOT RUN | Smoke 프로필 범위에서 제외됩니다. |
| 5인 핵심 흐름 및 5인 방 UI | NOT RUN | Smoke에서는 5인을 UI 정원 확인에만 사용하며, 방 UI 실행 자체는 E2E 사전 점검 차단으로 수행하지 못했습니다. |
| 6인·7인·8인 핵심 흐름 | NOT RUN | Smoke 프로필 범위가 아닙니다. |
| 6→5명 시작 전 이탈·재접속/마감 복원력 | NOT RUN | Smoke 프로필의 브라우저 복원력 범위가 아닙니다. 관련 Java 서비스 테스트는 통과했습니다. |
| 30개 메시지 채팅 스크롤 | NOT RUN | Smoke 프로필 범위가 아닙니다. |
| 방 화면·프로필 통계/레벨 브라우저 검증 | BLOCKED | Smoke UI 항목이나 E2E 사전 점검이 차단됐습니다. |

## 10. MVP 검증 결과

각 항목은 이번 실행에서 확인한 근거에 따라 분류했습니다. `BLOCKED`는 기능 실패가 아니라 해당 검증에 필요한 브라우저 실행이 시작되지 않았다는 뜻입니다.

| 번호 | 결과 | 검증 항목 및 근거 |
|---:|---|---|
| 1 | PASS | 역할 구성 경계 테스트에서 4–8인 역할 배정을 확인했습니다. `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries` |
| 2 | PASS | 서버의 개인 역할 큐와 브라우저 클라이언트 단위 테스트를 확인했습니다. 실제 4인 브라우저 흐름은 BLOCKED입니다. |
| 3 | PASS | 낮 페이즈 60초 설정을 `RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase`에서 확인했습니다. 실제 서버 계측은 Smoke 범위에서 수행하지 않았습니다. |
| 4 | PASS | 지목 투표 20초 설정을 같은 서버 페이즈 시간 테스트에서 확인했습니다. |
| 5 | PASS | 최종 변론 20초 설정을 같은 서버 페이즈 시간 테스트에서 확인했습니다. |
| 6 | PASS | 처형 투표 20초 설정을 같은 서버 페이즈 시간 테스트에서 확인했습니다. |
| 7 | PASS | 밤 35초 설정을 같은 서버 페이즈 시간 테스트에서 확인했습니다. 실제 35초 대기는 Smoke의 시간 판정 범위가 아닙니다. |
| 8 | PASS | `RoomGameServiceTest.acceptsOnlyTheFirstNominationVoteFromEachUser` |
| 9 | PASS | `RoomGameServiceTest.rejectsSelfNominationAndUnknownPlayers` |
| 10 | PASS | `RoomGameServiceTest.rejectsNominationVoteFromADeadPlayer` |
| 11 | PASS | `RoomGameServiceTest.rejectsExecutionVoteFromTheNominatedPlayer` |
| 12 | PASS | 실제 마피아 공격 제출과 밤 결과 처리를 Java 서비스 테스트에서 확인했습니다. |
| 13 | PASS | `RoomGameServiceTest.keepsMafiaTargetAliveAndReportsNoNightDeathWhenDoctorProtectsThatTarget` 및 연속 자기 보호 테스트 |
| 14 | PASS | `RoomGameServiceTest.sendsCitizenInvestigationResultOnlyToTheInvestigatingPolice` |
| 15 | PASS | 역할·대상·중복 밤 행동 검증 서비스 테스트를 통과했습니다. |
| 16 | PASS | 시민과 권한 없는 역할의 밤 행동 거부 테스트를 통과했습니다. |
| 17 | PASS | 마지막 마피아 제거 후 시민 승리 판정을 Java 서비스 테스트에서 확인했습니다. |
| 18 | PASS | 마피아 승리 및 동수 시점 종료 테스트를 통과했습니다. |
| 19 | PASS | 투표·밤 처리 직후 서버에서 승패를 판정하는 서비스 테스트를 통과했습니다. |
| 20 | BLOCKED | 서버의 개인 결과 전송 테스트는 통과했지만, 브라우저에서 승리 직후 결과 표시를 검증하는 E2E는 시작하지 못했습니다. |
| 21 | PASS | 승리 진영 상태와 클라이언트의 승리 진영 표시 JavaScript 테스트를 통과했습니다. |
| 22 | BLOCKED | 역할이 포함된 개인 결과 payload 테스트는 통과했지만, 종료 결과 화면의 실제 브라우저 표시 E2E는 실행하지 못했습니다. |
| 23 | BLOCKED | 생존/사망 상태 서비스·DOM 테스트는 통과했지만, 사망 카드의 회색·빨간색 처리와 `사망` 문구를 실제 화면에서 확인하지 못했습니다. |
| 24 | PASS | 완료된 방의 `WAITING` 복귀 서비스 테스트를 통과했습니다. |
| 25 | PASS | 게임 종료 후 Ready 상태 초기화 서비스 테스트를 통과했습니다. |
| 26 | NOT RUN | Smoke 프로필은 같은 방 재플레이를 실행하지 않습니다. |
| 27 | PASS | 연결 재참가 서비스 테스트와 JavaScript 재연결 단위 테스트를 통과했습니다. 전체 브라우저 복원 흐름은 실행하지 않았습니다. |
| 28 | PASS | 공개/마피아 채널 권한 서비스 테스트와 채팅 클라이언트 테스트를 통과했습니다. |
| 29 | PASS | 밤·사망자 채널의 생존/역할별 접근 제한 테스트를 통과했습니다. |
| 30 | PASS | 마피아·스파이·의사·경찰·영매의 미행동 처리 및 권한 테스트를 통과했습니다. |
| 31 | PASS | 의사의 연속 자기 보호 서비스 테스트를 통과했습니다. |
| 32 | PASS | 사망·조사 시 비공개 역할/조사 결과 보호 서비스 테스트를 통과했습니다. |
| 33 | BLOCKED | 종료 시 역할 데이터 서비스 테스트는 통과했지만 실제 게임 종료 화면의 전체 역할 공개를 E2E로 확인하지 못했습니다. |
| 34 | PASS | 서버 마감 시각 이후 요청 거부 및 동시 요청 처리 테스트를 통과했습니다. |
| 35 | BLOCKED | 실제 게임방의 `게임 목록으로` 버튼 표시와 `/rooms` 이동 브라우저 검증을 실행하지 못했습니다. |
| 36 | BLOCKED | 일반/밤 배경에서 버튼 대비가 유지되는지 실제 화면을 렌더링해 검증하지 못했습니다. |
| 37 | BLOCKED | 채널 말풍선 클래스 단위 검증은 통과했으나 실제 색상·테두리 시각 구분을 브라우저에서 확인하지 못했습니다. |
| 38 | PASS | 서버 페이즈 시스템 메시지 발행 서비스 테스트와 클라이언트 시스템 메시지 테스트를 통과했습니다. 실제 브라우저 전 구간 확인은 BLOCKED입니다. |
| 39 | BLOCKED | `NIGHT` 배경색 및 양방향 `background-color` 전환을 렌더링해 검증하지 못했습니다. |
| 40 | BLOCKED | 실제 게임방의 일반·밤·복귀 화면 캡처와 전환 영상 검증은 E2E 차단으로 수행하지 못했습니다. |
| 41 | NOT RUN | Smoke 증거 정책상 정기 브라우저 영상·진행 녹화는 요구되지 않습니다. 이번 실행에서 진행 캡처도 생성하지 않았습니다. |
| 42 | BLOCKED | 방 설정 호스트 UI와 비밀번호 설정·변경·삭제의 모달 피드백 브라우저 검증을 실행하지 못했습니다. 컨트롤러 단위 검증은 통과했습니다. |
| 43 | BLOCKED | 용량 제한 UI 단위 테스트 및 서버 동기화 서비스 테스트는 통과했지만, 여러 브라우저 화면의 실시간 동기화를 확인하지 못했습니다. |
| 44 | PASS | 종료 후 공개 채널 복귀 및 사망 사용자의 공개 메시지 전달에 대한 Java/JavaScript 테스트를 통과했습니다. |
| 45 | PASS | 경찰 진영 결과와 스파이/영매의 정확한 역할 결과 payload 및 클라이언트 표시 테스트를 통과했습니다. |
| 46 | PASS | H2 매퍼 통합 테스트와 서비스 테스트에서 `PLAYING`만 `WAITING`으로 복구하는 동작을 확인했습니다. |
| 47 | PASS | 마피아 진영 동수 승리, 미접촉 스파이 제외, 마피아 전멸 시민 승리 우선 규칙 테스트를 통과했습니다. |
| 48 | PASS | 익명 presence 허용, 세션별 요청 제한, 전역 방송 병합 서비스 테스트를 통과했습니다. |
| 49 | PASS | 세션 ID 전달, DB 상태 선전환, 실패 복구, 초기 방송 실패 시 부분 게임 제거 테스트를 통과했습니다. |
| 50 | PASS | 4–8인 역할표 및 5·7인 구성의 Java 경계 테스트를 통과했습니다. |
| 51 | PASS | 전원 역할 확인/역할 확인 타이머 후 첫 `NIGHT`, 이후 `DAY_DISCUSSION` 전환과 페이즈 시간 설정 테스트를 통과했습니다. |
| 52 | BLOCKED | 컨트롤러 성공 메시지 테스트는 통과했으나 모달 재개방과 하단 피드백을 실제 브라우저에서 검증하지 못했습니다. |
| 53 | PASS | 미접촉/접촉 스파이의 마피아 동수 판정 및 마피아 채널 접근 테스트를 통과했습니다. |
| 54 | PASS | 30초 재접속 유예와 만료 후 대기 행동 제거 서비스 테스트를 통과했습니다. Smoke에서 브라우저 복원력 시나리오는 실행하지 않았습니다. |
| 55 | NOT RUN | DuckDNS 검사는 프로필 4 전용이며 Smoke 범위에 포함되지 않습니다. |
| 56 | NOT RUN | 완료 통계의 중복 ID 방지 및 미완료 게임 미기록 Java 검증은 통과했습니다. 새 게임 ID를 사용하는 같은 방 재플레이 누적은 Smoke 범위에서 실행하지 않았습니다. |

## 11. 실패 및 차단 항목

- Java 실패: 없음
- JavaScript 실패: 없음
- Playwright 핵심 흐름: `BLOCKED` — 테스트 케이스 시작 전 `child_process.fork`가 `EPERM`으로 거부됐습니다.
- Playwright UI: `BLOCKED` — 동일한 작업자 생성 제한으로 테스트 케이스를 시작하지 못했습니다.
- 서버 시작·상태 확인·브라우저 계정 정리: `NOT RUN` — E2E 사전 점검에서 차단되어 서버를 시작하지 않았습니다.
- Smoke 범위 밖인 재플레이, 6→5 브라우저 복원력, 채팅 스크롤 및 5–8인 핵심 브라우저 흐름: `NOT RUN`

## 12. 재현 절차

1. 현재 실행 환경에서 Node.js `child_process.fork`를 호출하면 `EPERM: spawn EPERM`이 반환되는지 확인합니다.
2. QA 스크립트의 0번 사전 점검을 실행하면 Playwright E2E가 `BLOCKED`로 분류되고 QA 서버 시작이 생략되어야 합니다.
3. 같은 환경에서도 `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest` 및 `npm.cmd run test:js`는 별도로 완료됩니다.
4. 이 실행에서는 Playwright `--list`, 핵심 테스트, UI 테스트를 재시도하지 않았습니다.

## 13. 원인 분석

Node.js가 Playwright 작업자 프로세스를 생성할 때 운영체제 실행 환경에서 `EPERM`을 받았습니다. 작업자 수를 1로 설정해도 Playwright는 별도 Node 작업자 생성을 요구하므로 `--workers=1` 설정으로 우회할 수 없습니다. 사전 점검이 이 제한을 테스트 전 확인해 서버 시작을 막았습니다. Java와 JavaScript 테스트에는 실패가 없으며, 이번 E2E 차단은 애플리케이션 결함으로 판정하지 않았습니다.

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

- 애플리케이션 결함으로 확인된 항목: 없음
- 테스트 코드 결함으로 확인된 항목: 없음
- 실행 환경 차단: Node `child_process.fork`의 `EPERM`
- PASS 근거: Java 136건과 표준 JavaScript 41건이 모두 통과했습니다.
- 브라우저 미검증: Smoke에 포함된 4인 핵심 흐름과 5인 방 화면은 실행 환경 차단으로 판정 보류입니다.

## 15. 관련 파일과 코드 위치

- QA 사전 점검 및 `fork` 차단 처리: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md:326–371`, 공통 E2E 분기 `:476–482`
- QA 프로필 범위 계약 테스트: `test/js/e2e-profile.test.js:5–160`
- 서버 역할·투표·페이즈 테스트: `src/test/java/kr/or/oti/mafiagame/service/RoomGameServiceTest.java:107–1320`
- 재시작 복구·재접속·6→5명 시작·presence 테스트: `src/test/java/kr/or/oti/mafiagame/service/RoomPresenceServiceTest.java:125–596`
- H2 매퍼 통합 결과: `src/test/java/kr/or/oti/mafiagame/dao/MapperIntegrationTest.java:46–112`
- 브라우저 테스트 대상 파일(이번 실행에서는 미실행): `test/e2e/mafia-mvp.spec.js`, `test/e2e/room-layout.spec.js`

## 16. 권고사항

Node 자식 프로세스 생성이 허용되는 환경에서 Smoke 프로필을 다시 실행해 `MVP 4인 핵심 게임 흐름`과 5인 방 화면을 확인해야 합니다. 이번 실행에서 이미 통과한 Java/JavaScript 스위트는 재실행할 필요가 없으며, Playwright가 시작 가능한 환경인지 사전 점검부터 확인하면 됩니다.

## 17. 생성된 테스트 산출물

- 실행별 디렉터리: `output/test_output/2026-09-24/qa-run-qa-20260924-202938/`
- 사전 점검 로그: `qa-preflight.log`
- 환경 및 유효 프로필 요약: `environment.txt`
- Gradle 로그: `gradle-test.log`
- JavaScript 로그: `javascript-tests.log`
- JUnit XML: `build/test-results/test/`
- Gradle HTML 보고서: `build/reports/tests/test/index.html`
- Playwright 탐색 로그, 추적, 스크린샷, 비디오: **생성되지 않음**
- `bootRun` stdout/stderr: **생성되지 않음**
- Smoke 프로필에서 요구하지 않는 진행 녹화: **생성되지 않음**

## 18. 기존 데이터 보존

MariaDB는 연결 가능 여부만 확인했습니다. Java 통합 테스트는 H2 테스트 데이터베이스를 사용했고, 애플리케이션 서버와 Playwright는 시작하지 않았습니다. 따라서 이번 QA 실행에서 MariaDB의 기존 사용자·방·게임 기록을 변경하지 않았습니다.

## 19. 테스트 계정 정리

- 이번 실행에서 브라우저 테스트 계정 생성: 0개
- 계정 정리 작업: `NOT RUN` — E2E 서버와 브라우저 테스트를 시작하지 않아 이번 실행에서 생성한 계정이 없습니다.
- 실행 식별자 계정의 DB 잔여 개수 조회: `NOT RUN` — 생성된 계정이 없어 계정 정리 절차를 호출하지 않았습니다.

## 20. 최종 판정

**BLOCKED** — Java 136건과 표준 JavaScript 41건은 모두 통과했지만, Smoke 프로필에서 요구하는 4인 Playwright 핵심 흐름과 5인 방 화면이 Node 작업자 생성 제한 `EPERM` 때문에 실행되지 않았습니다. QA 서버는 시작하지 않았으며, 브라우저 검증 항목을 PASS로 처리하지 않았습니다.

---

---

## 문서 4: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-205533.md`

# MAFIAGAME QA 실행 보고서 — Smoke 프로필

## 1. 실행 환경

| 항목 | 값 |
|---|---|
| 실행 ID | qa-20260924-205533 |
| 프로필 | Smoke |
| 브라우저 핵심 인원 | 4명 |
| 방 화면 UI 인원 | 5명 |
| 페이즈 프로필 | short |
| 요청/실효 Playwright worker | 1 / 1 |
| 운영체제 | Windows 10.0.26200.0 |
| 셸 | Windows PowerShell 5.1.26100.9444 |
| Java | 22.0.1 |
| Gradle Wrapper | 8.14.5 |
| Node.js / npm | 24.19.0 / 11.17.0 |

이번 최종 Smoke 실행의 모든 검증은 Node가 자식 프로세스를 만들 수 있는 허용된 실행 경계에서 수행했습니다. 이 실행 모드는 저장소 소스나 Playwright 설정을 바꾸지 않습니다.

## 2. MariaDB 사전 점검과 의존성

- 127.0.0.1:23306 MariaDB 연결 확인: PASS
- node, npm.cmd, node_modules/jsdom, node_modules/@playwright/test: 모두 확인됨.
- Node child_process.fork 사전 점검: 종료 코드 0, PASS
- 앞선 기본 제한 실행에서 관찰한 EPERM: spawn EPERM은 이전 보고서 MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md에 기록했습니다. 같은 진단을 허용된 실행 경계에서 다시 수행하자 통과했고, 실제 Playwright worker도 시작됐습니다.
- MariaDB는 연결 가능 여부만 사전 확인했습니다. Java 테스트는 H2 테스트 DB를 사용했습니다. DB 설치나 서비스 기동은 하지 않았습니다.

## 3. 확인한 프로젝트 파일과 구조

QA 범위에 직접 필요한 파일을 확인했습니다.

- docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md
- package.json, playwright.config.js
- test/e2e/e2e-profile.js, test/e2e/mafia-mvp.spec.js, test/e2e/room-layout.spec.js
- test/js/e2e-profile.test.js 및 Smoke에서 실행하는 나머지 JavaScript 테스트 파일
- src/main/resources/templates/rooms/detail.html
- src/main/resources/static/js/chat.js
- src/test/**의 JUnit XML 요약만 확인했습니다. 테스트 소스는 이번 작업에서 수정하지 않았습니다.

## 4. 실행한 명령

사전 점검 후 다음 명령을 순서대로 실행했습니다.

    .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
    node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js
    npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
    npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list

마지막 JavaScript 확인에서는 QA runbook의 EPERM 안내를 검증하기 위해 같은 네 파일을 다시 실행했습니다. 모든 명령의 실제 결과와 실행 환경 로그는 아래 17번에 연결했습니다.

## 5. Java 테스트 결과

PASS — JUnit XML 12개 suite, 총 136건입니다.

| 총 테스트 | 통과 | 실패 | 오류 | 건너뜀 |
|---:|---:|---:|---:|---:|
| 136 | 136 | 0 | 0 | 0 |

Gradle 콘솔은 BUILD SUCCESSFUL in 35s로 종료됐습니다. 전체 Java suite가 실행돼 역할 수 경계, 역할 확인과 시간 초과, 최종 변론 권한, 재접속 유예, 완료 통계, Mapper 통합, 재시작 복구, 동수 승리 판정, 익명 lobby throttling, 게임 시작 순서와 롤백 테스트를 포함합니다.

- 실행 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/gradle-test.log
- JUnit XML: build/test-results/test/
- Gradle HTML 보고서: build/reports/tests/test/index.html

## 6. JavaScript 테스트 결과

PASS — 표준 네 파일에서 41건 통과, 실패 0건, 건너뜀 0건입니다. 마지막 재실행에서도 tests 41, pass 41, fail 0, 종료 코드 0을 확인했습니다.

- 최종 runbook 변경 검증 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/javascript-tests-post-runbook-update.log
- 프로필 일치 검사에는 DuckDNS 분리, 프로필별 E2E 범위, EPERM 재검증 안내가 포함됩니다.

## 7. 서버 시작과 상태 확인

- 새 QA 서버 시작: PASS
- Spring Boot 시작 로그에서 확인한 애플리케이션 PID: 32384
- http://127.0.0.1:8080/login: HTTP 200, PASS
- 서버 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/bootRun.qa-20260924-205533.stdout.log
- 표준 오류 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/bootRun.qa-20260924-205533.stderr.log

## 8. Playwright 범위와 실행 결과

Smoke의 범위는 핵심 4인 흐름 한 건과 5인 방 화면 UI 한 건입니다. 별도 --list 탐색은 Smoke에서 중복 실행을 피하도록 정한 절차에 따라 수행하지 않았고, 설정된 프로필에서 유래한 시나리오를 각각 한 worker로 실행했습니다.

| 구분 | 실제 시나리오 | 결과 |
|---|---|---|
| 핵심 E2E | MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증 | PASS, 1/1 |
| UI E2E | waiting and started room layout (5 players) | PASS, 1/1 |

- core 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/playwright-core.log
- UI 로그: output/test_output/2026-09-24/qa-run-qa-20260924-205533/playwright-ui.log
- Playwright 출력 폴더: output/test_output/2026-09-24/playwright-qa-20260924-205533/core/, .../ui/
- Smoke 정책은 실패 시 trace 보존, 정기 스크린샷·동영상 미수집입니다. 최종 실행은 통과해 trace가 만들어지지 않았고, 스크린샷·동영상도 이 프로필 정책에 따라 만들지 않았습니다. 별도 Full 전용 탐색 시나리오도 실행하지 않았습니다.
- npm이 NO_COLOR와 FORCE_COLOR 설정에 관한 경고를 출력했지만 테스트는 정상 완료됐습니다.

## 9. 인원별·프로필 시나리오 결과

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4인 핵심 흐름 | PASS | 역할 확인부터 한 사이클까지 실제 브라우저 4개로 검증 |
| 5인 방 레이아웃·프로필 UI | PASS | 대기/게임 시작 화면, 300px 게임 패널, 열 정렬, 모바일 쌓임, 설정 모달, 사용자 통계·기본 레벨 확인 |
| 5인 핵심 게임 흐름 | NOT RUN | Smoke에서는 5명을 UI 정원으로만 사용 |
| 6·7·8인 핵심 흐름 및 재경기 | NOT RUN | Smoke 범위 밖 |
| 6→5명 이탈 복원력, deadline/reconnect, 채팅 스크롤 | NOT RUN | Smoke 범위 밖. 해당 서버 서비스·클라이언트 단위 검사는 실행한 Java/JavaScript suite에 포함됨 |
| production 페이즈 실제 소요 시간 | NOT RUN | Smoke는 short 프로필이므로 실측하지 않음 |

## 10. MVP 검증 결과

| 검증 항목 | 결과 | 실행 증거와 한계 |
|---|---|---|
| 역할 비공개 전달·확인 및 첫 페이즈 전환 | PASS | Java 역할 확인/경계 테스트, JavaScript 표시 테스트, 4인 핵심 브라우저 흐름 통과 |
| FINAL_DEFENSE 접근 권한과 투표 규칙 | PASS | Java 서비스·권한 테스트 및 선택 프로필의 핵심 브라우저 시나리오 통과 |
| 페이즈 시간 값 | PASS | Java 설정/서비스 테스트에서 MVP 기본 시간 값 확인 |
| 실제 15/60/20/20/20/35초 페이즈 시간 측정 | NOT RUN | 실제 측정은 Full의 production 프로필 범위 |
| 5인 방 레이아웃·통계·기본 레벨 | PASS | 초기 통계 0, Lv. 1, 300px 게임 패널, desktop 열 정렬, mobile 배치 확인 |
| 방 설정 저장·비밀번호 설정/변경/해제 | PASS | 성공 메시지와 저장 뒤 모달 유지, 새로고침 뒤 호스트 설정 접근, 잠금 표시 동기화 확인 |
| 방 잠금 표시 해제·모달 후속 상호작용 | PASS | 호스트와 다른 참가자 모두 잠금 표시가 숨겨지고, 확인 뒤 모달을 닫아 준비/시작 버튼을 조작 |
| 게임 목록 링크·일반/밤/복원 배경 | PASS | 실제 게임방에서 링크 목적지와 고정 스타일, night-phase 전환 및 복원 확인 |
| 채팅 채널·시스템 메시지 DOM 동작 | PASS | JavaScript 단위 검증 통과. Smoke UI에서 채널별 색상 전체를 시각 판정하지는 않음 |
| 46 재시작 복구 | PASS | MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying, RoomPresenceServiceTest.resetsInterruptedPlayingRoomsWhenApplicationBecomesReady |
| 47 마피아 동수 승리·스파이 진영 판정 | PASS | RoomGameRulesTest, RoomGameServiceTest 관련 경계 테스트 |
| 48 익명 lobby 접근·요청 제한/병합 | PASS | WebSocketAuthorizationInterceptorTest, RoomPresenceServiceTest |
| 49 게임 시작 순서·실패 롤백 | PASS | ControllerDelegationTest, RoomPresenceServiceTest, RoomGameServiceTest |
| 50 4–8인 역할 경계 | PASS | RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries |
| 51 비공개 역할 확인·첫 밤 시작 | PASS | RoomGameServiceTest.confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms, 타이머 테스트 |
| 52 설정 저장 성공 피드백 | PASS | RoomControllerTest.savingRoomSettingsFlashesTheSuccessMessageForTheModal 및 5인 UI E2E |
| 53 접촉 여부별 스파이 동수 처리 | PASS | RoomGameRulesTest, RoomGameServiceTest 관련 테스트 |
| 54 재접속 유예·만료 행동 제거 | PASS | 서비스 테스트 통과. 브라우저 복원력 시나리오는 Smoke 범위 밖 |
| 55 DuckDNS 검사 | NOT RUN | 프로필 4 전용 |
| 56 완료 통계·중복 기록 방지 | PASS | Java 서비스/Mapper 통합 테스트 통과. 동일 방 재경기 누적 브라우저 검증은 Smoke 범위 밖 |

실제 production 페이즈 시간을 측정하지 않았고 Smoke에 없는 재경기·6인 복원력·210개 메시지 검증은 수행하지 않았습니다. 이 범위 구분은 실행 차단이 아니라 선택한 프로필의 범위입니다.

## 11. 실패 및 차단 항목

최종 실행에서 실패하거나 차단된 항목은 없습니다. profile 범위 밖 검사는 위 표처럼 NOT RUN입니다. Java와 Playwright 시작 로그의 JVM 공유/색상 관련 경고는 종료 상태에 영향을 주지 않았습니다.

## 12. 재현 절차

1. 127.0.0.1:23306, Node/npm, jsdom, Playwright 의존성을 확인합니다.
2. 같은 Node child_process.fork probe가 허용된 실행 경계에서 종료 코드 0을 반환하는지 확인합니다. 기본 제한 경계가 EPERM을 반환하면 아래 13번의 조치를 적용합니다.
3. Java와 표준 JavaScript 명령을 실행합니다.
4. E2E_PROFILE=smoke, PLAYER_COUNTS=4, E2E_CAPACITY=5, MAFIAGAME_PHASE_PROFILE=short, E2E_RUN_ID=qa-20260924-205533으로 서버와 두 E2E 명령을 실행합니다.
5. 실행 뒤 해당 ID의 계정 namespace만 정리하고 QA 서버 PID와 포트 해제를 확인합니다.

## 13. 원인 분석

최초 EPERM은 Playwright worker 생성 전에 Node의 child_process.fork가 현재 기본 실행 권한에서 거부된 환경 문제였습니다. 같은 진단을 자식 프로세스 생성이 허용되는 실행 경계에서 반복하자 종료 코드 0을 반환했고, 최종 QA에서 Playwright worker 한 개가 실제로 동작했습니다. 따라서 playwright.config.js나 worker 수를 변경해 해결할 애플리케이션 문제가 아닙니다. --workers=1도 worker 생성을 없애지 않으므로 우회 수단이 아닙니다.

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

최종 실행에서 확인된 애플리케이션 결함은 없습니다. UI 실패 분석 중 발견한 두 가지 테스트 기대 오류를 보완했습니다.

1. #roomLockIndicator는 템플릿에 항상 존재하고 hidden/d-none으로 감춰집니다. E2E가 DOM 제거(toHaveCount(0))를 기대하던 부분을 실제 화면 상태(toBeHidden()) 확인으로 바꿨습니다.
2. 방 설정은 저장 성공 뒤에도 모달을 열린 상태로 유지하는 것이 요구 동작입니다. 저장 피드백을 검증한 다음 준비 버튼을 누르기 전에 테스트가 모달을 닫도록 추가했습니다.

두 변경은 E2E 테스트의 기대와 동작 순서를 맞춘 것입니다. 제품 JavaScript와 화면 템플릿은 변경하지 않았습니다.

## 15. 관련 파일과 코드 위치

- docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md:377 — EPERM 시 자식 프로세스 생성이 허용된 실행 경계에서 재검증하는 절차
- test/js/e2e-profile.test.js:49 — QA runbook의 EPERM 재검증 안내를 확인하는 단위 테스트
- test/e2e/room-layout.spec.js:161 — 잠금 표시 비가시성 assertion
- test/e2e/room-layout.spec.js:163 — 설정 모달을 닫고 숨김 상태 확인
- src/main/resources/templates/rooms/detail.html:35 — 잠금 표시 노드와 초기 숨김 클래스
- src/main/resources/static/js/chat.js:1128 — presence 메시지에 따른 표시/숨김 갱신

## 16. 권고사항

향후 기본 실행 환경에서 EPERM이 나오면 Playwright 설정이나 --workers 수를 변경하지 말고, QA runbook의 동일한 probe를 자식 프로세스 생성이 허용된 실행 경계에서 다시 확인합니다. 그곳에서도 실패하거나 권한이 허용되지 않으면 E2E를 BLOCKED로 유지하고 서버를 시작하지 않습니다.

## 17. 생성된 테스트 산출물

주요 로그와 결과:

- 사전 점검: output/test_output/2026-09-24/qa-run-qa-20260924-205533/qa-preflight.log
- Java: output/test_output/2026-09-24/qa-run-qa-20260924-205533/gradle-test.log
- JavaScript: output/test_output/2026-09-24/qa-run-qa-20260924-205533/javascript-tests-post-runbook-update.log
- core/UI 실행 결과: output/test_output/2026-09-24/qa-run-qa-20260924-205533/e2e-run-result.txt
- 계정 namespace 확인·정리: account-namespace-precheck.log, account-cleanup.log
- 서버 stdout/stderr: bootRun.qa-20260924-205533.stdout.log, bootRun.qa-20260924-205533.stderr.log
- Playwright 콘솔: playwright-core.log, playwright-ui.log
- JUnit XML: build/test-results/test/; Gradle HTML: build/reports/tests/test/index.html
- Playwright 결과 폴더: output/test_output/2026-09-24/playwright-qa-20260924-205533/core/, .../ui/

Smoke 정책에 따라 통과한 브라우저 시나리오의 routine screenshot/video는 만들지 않았고 실패 trace도 생성되지 않았습니다. --list discovery 로그도 Smoke 절차에서 생성 대상이 아닙니다.

## 18. 기존 데이터 보존

Java 테스트는 H2 테스트 DB를 사용했습니다. MariaDB는 사전 접속 확인과 이번 run ID 계정 namespace 정리에만 사용했습니다. 사전 일치 계정은 0개였으며 cleanup selector는 qa-20260924-205533 전용이었습니다. 기존 사용자·방·게임 데이터는 삭제하지 않았습니다.

## 19. 테스트 계정 정리 결과

| 항목 | 결과 |
|---|---:|
| 실행 전 일치 계정 | 0 |
| 이번 실행에서 발견·생성된 QA 계정 | 9 |
| 삭제된 계정 | 9 |
| 삭제된 방 멤버십 | 1 |
| 삭제된 QA 방 | 1 |
| 삭제된 완료 통계 | 0 |
| 삭제된 사용자 통계 | 9 |
| 남은 일치 계정 | 0 |
| QA 서버 PID 32384 및 실행 launcher 정리 | PASS |
| 정리 후 포트 8080 listener | 0 |

정리 상태는 ACCOUNT_CLEANUP_STATUS=PASS, SERVER_CLEANUP_STATUS=PASS입니다.

## 20. 최종 판정

PASS — Smoke 프로필의 Java 136건, 표준 JavaScript 41건, 4인 핵심 Playwright, 5인 방 레이아웃 Playwright가 모두 통과했습니다. child_process.fork는 자식 프로세스 생성이 허용된 실행 경계에서 확인됐으며, QA runbook에 재검증 절차를 추가했습니다. QA 계정 9개와 서버 프로세스 정리도 모두 통과했습니다. Smoke 범위 밖 검사는 NOT RUN으로 구분했습니다.

---

---

## 문서 5: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-212401.md`

# MAFIAGAME QA 실행 보고서 — Smoke 프로필

## 1. 실행 환경

| 항목 | 값 |
|---|---|
| 실행 ID | qa-20260924-212401 |
| 프로필 | Smoke |
| 브라우저 핵심 인원 | 4명 |
| 방 화면 UI 인원 | 5명 |
| 페이즈 프로필 | short |
| 요청/실효 Playwright worker | 1 / 1 |
| 운영체제 | Windows 10.0.26200.0 |
| 셸 | Windows PowerShell 5.1.26100.9444 |
| Java | 22.0.1 |
| Gradle Wrapper | 8.14.5 |
| Node.js / npm | 24.19.0 / 11.17.0 |

이번 최종 Smoke 실행의 모든 검증은 Node가 자식 프로세스를 만들 수 있는 허용된 실행 경계에서 수행했습니다. 이 실행 모드는 저장소 소스나 Playwright 설정을 바꾸지 않습니다.

## 2. MariaDB 사전 점검과 의존성

- 127.0.0.1:23306 MariaDB 연결 확인: PASS
- node, npm.cmd, node_modules/jsdom, node_modules/@playwright/test: 모두 확인됨.
- Node child_process.fork 사전 점검: 종료 코드 0, PASS
- 앞선 기본 제한 실행에서 관찰한 EPERM: spawn EPERM은 이전 보고서 MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md에 기록했습니다. 같은 진단을 허용된 실행 경계에서 다시 수행하자 통과했고, 실제 Playwright worker도 시작됐습니다.
- MariaDB는 연결 가능 여부만 사전 확인했습니다. Java 테스트는 H2 테스트 DB를 사용했습니다. DB 설치나 서비스 기동은 하지 않았습니다.

## 3. 확인한 프로젝트 파일과 구조

QA 범위에 직접 필요한 파일을 확인했습니다.

- docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md
- package.json, playwright.config.js
- test/e2e/e2e-profile.js, test/e2e/mafia-mvp.spec.js, test/e2e/room-layout.spec.js
- test/js/e2e-profile.test.js 및 Smoke에서 실행하는 나머지 JavaScript 테스트 파일
- src/main/resources/templates/rooms/detail.html
- src/main/resources/static/js/chat.js
- src/test/**의 JUnit XML 요약만 확인했습니다. 테스트 소스는 이번 작업에서 수정하지 않았습니다.

## 4. 실행한 명령

사전 점검 후 다음 명령을 순서대로 실행했습니다.

    .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
    node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js
    npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
    npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list

마지막 JavaScript 확인에서는 QA runbook의 EPERM 안내를 검증하기 위해 같은 네 파일을 다시 실행했습니다. 모든 명령의 실제 결과와 실행 환경 로그는 아래 17번에 연결했습니다.

## 5. Java 테스트 결과

PASS — JUnit XML 12개 suite, 총 136건입니다.

| 총 테스트 | 통과 | 실패 | 오류 | 건너뜀 |
|---:|---:|---:|---:|---:|
| 136 | 136 | 0 | 0 | 0 |

Gradle 콘솔은 BUILD SUCCESSFUL in 35s로 종료됐습니다. 전체 Java suite가 실행돼 역할 수 경계, 역할 확인과 시간 초과, 최종 변론 권한, 재접속 유예, 완료 통계, Mapper 통합, 재시작 복구, 동수 승리 판정, 익명 lobby throttling, 게임 시작 순서와 롤백 테스트를 포함합니다.

- 실행 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/gradle-test.log
- JUnit XML: build/test-results/test/
- Gradle HTML 보고서: build/reports/tests/test/index.html

## 6. JavaScript 테스트 결과

PASS — 표준 네 파일에서 41건 통과, 실패 0건, 건너뜀 0건입니다. 마지막 재실행에서도 tests 41, pass 41, fail 0, 종료 코드 0을 확인했습니다.

- 최종 runbook 변경 검증 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/javascript-tests-post-runbook-update.log
- 프로필 일치 검사에는 DuckDNS 분리, 프로필별 E2E 범위, EPERM 재검증 안내가 포함됩니다.

## 7. 서버 시작과 상태 확인

- 새 QA 서버 시작: PASS
- Spring Boot 시작 로그에서 확인한 애플리케이션 PID: 32324
- http://127.0.0.1:8080/login: HTTP 200, PASS
- 서버 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/bootRun.qa-20260924-212401.stdout.log
- 표준 오류 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/bootRun.qa-20260924-212401.stderr.log

## 8. Playwright 범위와 실행 결과

Smoke의 범위는 핵심 4인 흐름 한 건과 5인 방 화면 UI 한 건입니다. 별도 --list 탐색은 Smoke에서 중복 실행을 피하도록 정한 절차에 따라 수행하지 않았고, 설정된 프로필에서 유래한 시나리오를 각각 한 worker로 실행했습니다.

| 구분 | 실제 시나리오 | 결과 |
|---|---|---|
| 핵심 E2E | MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증 | PASS, 1/1 |
| UI E2E | waiting and started room layout (5 players) | PASS, 1/1 |

- core 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/playwright-core.log
- UI 로그: output/test_output/2026-09-24/qa-run-qa-20260924-212401/playwright-ui.log
- Playwright 출력 폴더: output/test_output/2026-09-24/playwright-qa-20260924-212401/core/, .../ui/
- Smoke 정책은 실패 시 trace 보존, 정기 스크린샷·동영상 미수집입니다. 최종 실행은 통과해 trace가 만들어지지 않았고, 스크린샷·동영상도 이 프로필 정책에 따라 만들지 않았습니다. 별도 Full 전용 탐색 시나리오도 실행하지 않았습니다.
- npm이 NO_COLOR와 FORCE_COLOR 설정에 관한 경고를 출력했지만 테스트는 정상 완료됐습니다.

## 9. 인원별·프로필 시나리오 결과

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4인 핵심 흐름 | PASS | 역할 확인부터 한 사이클까지 실제 브라우저 4개로 검증 |
| 5인 방 레이아웃·프로필 UI | PASS | 대기/게임 시작 화면, 300px 게임 패널, 열 정렬, 모바일 쌓임, 설정 모달, 사용자 통계·기본 레벨 확인 |
| 5인 핵심 게임 흐름 | NOT RUN | Smoke에서는 5명을 UI 정원으로만 사용 |
| 6·7·8인 핵심 흐름 및 재경기 | NOT RUN | Smoke 범위 밖 |
| 6→5명 이탈 복원력, deadline/reconnect, 채팅 스크롤 | NOT RUN | Smoke 범위 밖. 해당 서버 서비스·클라이언트 단위 검사는 실행한 Java/JavaScript suite에 포함됨 |
| production 페이즈 실제 소요 시간 | NOT RUN | Smoke는 short 프로필이므로 실측하지 않음 |

## 10. MVP 검증 결과

| 검증 항목 | 결과 | 실행 증거와 한계 |
|---|---|---|
| 역할 비공개 전달·확인 및 첫 페이즈 전환 | PASS | Java 역할 확인/경계 테스트, JavaScript 표시 테스트, 4인 핵심 브라우저 흐름 통과 |
| FINAL_DEFENSE 접근 권한과 투표 규칙 | PASS | Java 서비스·권한 테스트 및 선택 프로필의 핵심 브라우저 시나리오 통과 |
| 페이즈 시간 값 | PASS | Java 설정/서비스 테스트에서 MVP 기본 시간 값 확인 |
| 실제 15/60/20/20/20/35초 페이즈 시간 측정 | NOT RUN | 실제 측정은 Full의 production 프로필 범위 |
| 5인 방 레이아웃·통계·기본 레벨 | PASS | 초기 통계 0, Lv. 1, 300px 게임 패널, desktop 열 정렬, mobile 배치 확인 |
| 방 설정 저장·비밀번호 설정/변경/해제 | PASS | 성공 메시지와 저장 뒤 모달 유지, 새로고침 뒤 호스트 설정 접근, 잠금 표시 동기화 확인 |
| 방 잠금 표시 해제·모달 후속 상호작용 | PASS | 호스트와 다른 참가자 모두 잠금 표시가 숨겨지고, 확인 뒤 모달을 닫아 준비/시작 버튼을 조작 |
| 게임 목록 링크·일반/밤/복원 배경 | PASS | 실제 게임방에서 링크 목적지와 고정 스타일, night-phase 전환 및 복원 확인 |
| 채팅 채널·시스템 메시지 DOM 동작 | PASS | JavaScript 단위 검증 통과. Smoke UI에서 채널별 색상 전체를 시각 판정하지는 않음 |
| 46 재시작 복구 | PASS | MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying, RoomPresenceServiceTest.resetsInterruptedPlayingRoomsWhenApplicationBecomesReady |
| 47 마피아 동수 승리·스파이 진영 판정 | PASS | RoomGameRulesTest, RoomGameServiceTest 관련 경계 테스트 |
| 48 익명 lobby 접근·요청 제한/병합 | PASS | WebSocketAuthorizationInterceptorTest, RoomPresenceServiceTest |
| 49 게임 시작 순서·실패 롤백 | PASS | ControllerDelegationTest, RoomPresenceServiceTest, RoomGameServiceTest |
| 50 4–8인 역할 경계 | PASS | RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries |
| 51 비공개 역할 확인·첫 밤 시작 | PASS | RoomGameServiceTest.confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms, 타이머 테스트 |
| 52 설정 저장 성공 피드백 | PASS | RoomControllerTest.savingRoomSettingsFlashesTheSuccessMessageForTheModal 및 5인 UI E2E |
| 53 접촉 여부별 스파이 동수 처리 | PASS | RoomGameRulesTest, RoomGameServiceTest 관련 테스트 |
| 54 재접속 유예·만료 행동 제거 | PASS | 서비스 테스트 통과. 브라우저 복원력 시나리오는 Smoke 범위 밖 |
| 55 DuckDNS 검사 | NOT RUN | 프로필 4 전용 |
| 56 완료 통계·중복 기록 방지 | PASS | Java 서비스/Mapper 통합 테스트 통과. 동일 방 재경기 누적 브라우저 검증은 Smoke 범위 밖 |

실제 production 페이즈 시간을 측정하지 않았고 Smoke에 없는 재경기·6인 복원력·210개 메시지 검증은 수행하지 않았습니다. 이 범위 구분은 실행 차단이 아니라 선택한 프로필의 범위입니다.

## 11. 실패 및 차단 항목

최종 실행에서 실패하거나 차단된 항목은 없습니다. profile 범위 밖 검사는 위 표처럼 NOT RUN입니다. Java와 Playwright 시작 로그의 JVM 공유/색상 관련 경고는 종료 상태에 영향을 주지 않았습니다.

## 12. 재현 절차

1. 127.0.0.1:23306, Node/npm, jsdom, Playwright 의존성을 확인합니다.
2. 같은 Node child_process.fork probe가 허용된 실행 경계에서 종료 코드 0을 반환하는지 확인합니다. 기본 제한 경계가 EPERM을 반환하면 아래 13번의 조치를 적용합니다.
3. Java와 표준 JavaScript 명령을 실행합니다.
4. E2E_PROFILE=smoke, PLAYER_COUNTS=4, E2E_CAPACITY=5, MAFIAGAME_PHASE_PROFILE=short, E2E_RUN_ID=qa-20260924-212401으로 서버와 두 E2E 명령을 실행합니다.
5. 실행 뒤 해당 ID의 계정 namespace만 정리하고 QA 서버 PID와 포트 해제를 확인합니다.

## 13. 원인 분석

최초 EPERM은 Playwright worker 생성 전에 Node의 child_process.fork가 현재 기본 실행 권한에서 거부된 환경 문제였습니다. 같은 진단을 자식 프로세스 생성이 허용되는 실행 경계에서 반복하자 종료 코드 0을 반환했고, 최종 QA에서 Playwright worker 한 개가 실제로 동작했습니다. 따라서 playwright.config.js나 worker 수를 변경해 해결할 애플리케이션 문제가 아닙니다. --workers=1도 worker 생성을 없애지 않으므로 우회 수단이 아닙니다.

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

최종 실행에서 확인된 애플리케이션 결함은 없습니다. UI 실패 분석 중 발견한 두 가지 테스트 기대 오류를 보완했습니다.

1. #roomLockIndicator는 템플릿에 항상 존재하고 hidden/d-none으로 감춰집니다. E2E가 DOM 제거(toHaveCount(0))를 기대하던 부분을 실제 화면 상태(toBeHidden()) 확인으로 바꿨습니다.
2. 방 설정은 저장 성공 뒤에도 모달을 열린 상태로 유지하는 것이 요구 동작입니다. 저장 피드백을 검증한 다음 준비 버튼을 누르기 전에 테스트가 모달을 닫도록 추가했습니다.

두 변경은 E2E 테스트의 기대와 동작 순서를 맞춘 것입니다. 제품 JavaScript와 화면 템플릿은 변경하지 않았습니다.

## 15. 관련 파일과 코드 위치

- docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md:377 — EPERM 시 자식 프로세스 생성이 허용된 실행 경계에서 재검증하는 절차
- test/js/e2e-profile.test.js:49 — QA runbook의 EPERM 재검증 안내를 확인하는 단위 테스트
- test/e2e/room-layout.spec.js:161 — 잠금 표시 비가시성 assertion
- test/e2e/room-layout.spec.js:163 — 설정 모달을 닫고 숨김 상태 확인
- src/main/resources/templates/rooms/detail.html:35 — 잠금 표시 노드와 초기 숨김 클래스
- src/main/resources/static/js/chat.js:1128 — presence 메시지에 따른 표시/숨김 갱신

## 16. 권고사항

향후 기본 실행 환경에서 EPERM이 나오면 Playwright 설정이나 --workers 수를 변경하지 말고, QA runbook의 동일한 probe를 자식 프로세스 생성이 허용된 실행 경계에서 다시 확인합니다. 그곳에서도 실패하거나 권한이 허용되지 않으면 E2E를 BLOCKED로 유지하고 서버를 시작하지 않습니다.

## 17. 생성된 테스트 산출물

주요 로그와 결과:

- 사전 점검: output/test_output/2026-09-24/qa-run-qa-20260924-212401/qa-preflight.log
- Java: output/test_output/2026-09-24/qa-run-qa-20260924-212401/gradle-test.log
- JavaScript: output/test_output/2026-09-24/qa-run-qa-20260924-212401/javascript-tests-post-runbook-update.log
- core/UI 실행 결과: output/test_output/2026-09-24/qa-run-qa-20260924-212401/e2e-run-result.txt
- 계정 namespace 확인·정리: account-namespace-precheck.log, account-cleanup.log
- 서버 stdout/stderr: bootRun.qa-20260924-212401.stdout.log, bootRun.qa-20260924-212401.stderr.log
- Playwright 콘솔: playwright-core.log, playwright-ui.log
- JUnit XML: build/test-results/test/; Gradle HTML: build/reports/tests/test/index.html
- Playwright 결과 폴더: output/test_output/2026-09-24/playwright-qa-20260924-212401/core/, .../ui/

Smoke 정책에 따라 통과한 브라우저 시나리오의 routine screenshot/video는 만들지 않았고 실패 trace도 생성되지 않았습니다. --list discovery 로그도 Smoke 절차에서 생성 대상이 아닙니다.

## 18. 기존 데이터 보존

Java 테스트는 H2 테스트 DB를 사용했습니다. MariaDB는 사전 접속 확인과 이번 run ID 계정 namespace 정리에만 사용했습니다. 사전 일치 계정은 0개였으며 cleanup selector는 qa-20260924-212401 전용이었습니다. 기존 사용자·방·게임 데이터는 삭제하지 않았습니다.

## 19. 테스트 계정 정리 결과

| 항목 | 결과 |
|---|---:|
| 실행 전 일치 계정 | 0 |
| 이번 실행에서 발견·생성된 QA 계정 | 9 |
| 삭제된 계정 | 9 |
| 삭제된 방 멤버십 | 1 |
| 삭제된 QA 방 | 1 |
| 삭제된 완료 통계 | 0 |
| 삭제된 사용자 통계 | 9 |
| 남은 일치 계정 | 0 |
| QA 서버 PID 32324 및 실행 launcher 정리 | PASS |
| 정리 후 포트 8080 listener | 0 |

정리 상태는 ACCOUNT_CLEANUP_STATUS=PASS, SERVER_CLEANUP_STATUS=PASS입니다.

## 20. 최종 판정

PASS — Smoke 프로필의 Java 136건, 표준 JavaScript 41건, 4인 핵심 Playwright, 5인 방 레이아웃 Playwright가 모두 통과했습니다. child_process.fork는 자식 프로세스 생성이 허용된 실행 경계에서 확인됐으며, QA runbook에 재검증 절차를 추가했습니다. QA 계정 9개와 서버 프로세스 정리도 모두 통과했습니다. Smoke 범위 밖 검사는 NOT RUN으로 구분했습니다.

---

---

## 문서 6: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-215047.md`

# MAFIAGAME Full QA 보고서

실행 ID: `qa-20260924-215047`\
실행 날짜: 2026-09-24 (Asia/Seoul)\
최종 판정: **FAIL**

## 1. 실행 환경

- 저장소: `C:\workspace\mafiaweb`
- 프로필: `full`; 플레이어 수 `4,5,6,7,8`; UI 수용 인원 `8`; 페이즈 프로필 `production`
- 요청 worker / 실제 worker: `1 / 1`
- Node.js `v24.19.0`, `npm.cmd` 사용 가능
- 새 QA 서버: `http://127.0.0.1:8080`; Spring Boot PID `9116`
- 기준 버전: `build.gradle`의 `0.3.2-alpha`

## 2. MariaDB 사전 점검과 의존성

- `Test-NetConnection 127.0.0.1:23306`: `True` (`PASS`)
- Node.js, `npm.cmd`, `node_modules/jsdom`, `node_modules/@playwright/test`: 모두 확인 (`PASS`)
- Node worker 사전 검사: 기본 실행 경계에서 `EPERM: spawn EPERM` (종료 코드 `23`). QA 절차에 따라 동일 `child_process.fork` 검사를 자식 프로세스 생성이 허용된 실행 컨텍스트에서 반복했고 종료 코드 `0`으로 통과했다. 그 실행 컨텍스트에서 실제 Playwright worker도 기동했다.
- DB 서비스 설치·기동은 하지 않았다. 기존 사용자/방 데이터 삭제 옵션은 `false`였다.

## 3. 확인한 파일과 디렉터리

`AGENTS.md`, `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`, `docs/MAFIAGAME_MVP.md`, `build.gradle`, `package.json`, `src/main/resources/application.properties`, `src/test/**`, `test/js/**`, `test/e2e/**`, `playwright.config.js`를 QA 절차 및 실패 분석 범위에서 확인했다. QA 스크립트와 MVP 요구사항, DB 주소, 테스트 프로필·시나리오, 관련 Java/JavaScript 테스트를 근거로 판정했다.

## 4. 실행한 명령

- Java: `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest` (`GRADLE_USER_HOME=C:\workspace\mafiaweb\.gradle-test`)
- JavaScript: `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`
- Playwright discovery: `npm.cmd exec -- playwright test test/e2e/mafia-mvp.spec.js test/e2e/chat-scroll.spec.js test/e2e/room-layout.spec.js --list --workers=1`
- Core E2E: `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`
- UI E2E: `npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list`
- Playwright 자동 재시도: `0`; 실패 분석 전에 재시도하지 않았다.

## 5. Java 테스트 결과

**PASS — 136/136**, 실패 0, 오류 0, 건너뜀 0. Gradle 출력은 `BUILD SUCCESSFUL`, `5 actionable tasks: 5 executed`였다.

- JUnit XML: `C:\workspace\mafiaweb\build\test-results\test\`
- Gradle HTML: `C:\workspace\mafiaweb\build\reports\tests\test\index.html`
- XML 12개 suite 모두 실패·오류·건너뜀 0. `MapperIntegrationTest`도 4/4 통과했다.
- 역할 구성·비공개 확인·첫 NIGHT 조기 전환 및 만료 타이머: `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, `confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms`, `startsTheFirstNightWhenTheRoleConfirmationTimerExpiresInRealTime` 통과.
- 재시작 복구: `RoomPresenceServiceTest.resetsInterruptedPlayingRoomsWhenApplicationBecomesReady`, `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying` 통과.
- 마피아 패리티와 Spy 접촉 경계, lobby 제한·coalescing, 게임 시작 ordering/rollback, reconnect grace·pending action 정리, 통계 중복 방지 테스트 통과.
- DB mapper 검증 결과는 service/controller 단위 테스트 결과와 구분해 기록했다. `MapperIntegrationTest` 4건은 Gradle Java suite에서 실행되어 통과했다.

## 6. JavaScript 테스트 결과

**PASS — 41/41**, 실패 0, 취소 0, 건너뜀 0 (`duration_ms 1209.4566`). 표준 네 파일만 실행했으며 DuckDNS 테스트는 Full 프로필 범위 밖이라 실행하지 않았다.

검증 범위에 STOMP, lobby/참가자 동기화, room 설정과 modal, 역할·투표·채널 UI, phase guidance, system 메시지 text-only 처리, 야간 배경 복구, 재접속, E2E 프로필 제한이 포함됐다.

## 7. 서버 시작 및 상태 확인

새 프로세스로 서버를 띄우고 시작 로그의 Spring Boot PID 및 포트 소유 PID를 대조했다. `Started MafiagameApplication`, `/login` HTTP `200`, 포트 `8080` listener PID `9116`을 확인했다 (`PASS`). 표준 출력/오류 로그:

- `C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-215047\bootRun.qa-20260924-215047.stdout.log`
- `C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-215047\bootRun.qa-20260924-215047.stderr.log`

## 8. Playwright discovery 및 실행 결과

- discovery: 총 9개를 발견했다. Core 7개(4·5·6·7·8인, 6→5 사전 이탈, deadline/reconnect)와 UI 2개(chat-scroll, 8인 room-layout) 모두 확인했다.
- Core: **4 passed, 3 failed** (`CORE_E2E_EXIT_CODE=1`, Playwright 요약 `4 passed (1.1h)`).
- UI: **2 passed** (`UI_E2E_EXIT_CODE=0`, `2 passed (46.9s)`).
- Core/UI 로그: `C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-215047\playwright-core.log`, `...\playwright-ui.log`
- 결과물 위치: `C:\workspace\mafiaweb\output\test_output\2026-09-24\playwright-qa-20260924-215047\{discovery,core,ui}\`
- Full 정책에 따라 trace·스크린샷·동영상을 수집했다. core/UI discovery 출력은 `...\discovery\playwright-discovery.log`에 저장했다.

## 9. 인원수별·복원력 시나리오 결과

| 시나리오 | 결과 | 실행 증거와 설명 |
|---|---|---|
| 4인 | `PASS` | `MVP 4인 핵심 게임 흐름`; role assignment부터 종료·재경기까지 통과 (8.2m). |
| 5인 | `PASS` | 두 시민 슬롯 구성 포함 핵심 흐름·재경기 통과 (8.2m). |
| 6인 | `PASS` | Spy/Soldier 역할, 조사·능력, 핵심 흐름·재경기 통과 (13.5m). |
| 7인 | `FAIL` | `MVP 7인 핵심 게임 흐름`; 재경기 후 사용자 통계 확인 구간에서 `Test timeout of 30000ms exceeded`. 종료 화면·영상 산출물은 생성됐지만 테스트 전체는 통과하지 못했다. |
| 8인 | `FAIL` | `MVP 8인 핵심 게임 흐름`; 동일한 `Test timeout of 30000ms exceeded`. 종료 화면·영상은 생성됐으나 테스트 전체는 실패했다. |
| 6→5 사전 이탈 | `FAIL` | 역할 확인 후 NIGHT까지 진행했으나 테스트 코드 `ReferenceError: traces is not defined`로 중단되어 5인 역할 결과 assertion에 도달하지 못했다. |
| deadline / reconnect | `PASS` | `browser deadline, reconnect grace, and expired night action` 통과 (3.4m). |

## 10. MVP 검증 표

| 요구사항 | 결과 | 실제 실행 증거 |
|---|---|---|
| 4–8인 역할 수·비공개 역할 전달 | `FAIL` | Java 역할표 테스트 통과. Browser core 4·5·6인 통과. 7·8인 테스트는 후속 재경기/프로필 통계 구간 timeout으로 전체 `FAIL`. |
| `ROLE_ASSIGNMENT` 확인·중복 거부·첫 NIGHT 전환 | `FAIL` | Java 서비스의 private confirmation·timer 테스트 통과. 4·5·6인 E2E 통과. 6→5 시나리오는 NIGHT까지 간 뒤 테스트 변수 오류로 중단. |
| 첫 NIGHT 35초 후 DAY 및 실제 서버 페이즈 시간(15/60/20/20/20/35초) | `FAIL` | Full production timing을 사용했고 4·5·6인 core가 통과했다. 7·8인 전체 E2E는 실패해 모든 인원수에 대한 완료 증거는 없다. |
| `FINAL_DEFENSE` 고유 지명·20초·지명자만 채팅·이탈 처리 | `FAIL` | 통과한 4·5·6인 실제 흐름과 Java phase/access test를 확인. 7·8인 전체 흐름은 테스트 실패. |
| 방 설정·비밀번호 set/change/remove 및 성공 피드백 | `PASS` | `RoomControllerTest.savingRoomSettingsFlashesTheSuccessMessageForTheModal`, UI room-layout 8인 통과. |
| lobby 익명 접근·요청 throttle/coalescing | `PASS` | `WebSocketAuthorizationInterceptorTest`, `RoomPresenceServiceTest` 통과. |
| 재시작 복구·패리티·게임 시작 rollback/order | `PASS` | service/controller Java suite와 `MapperIntegrationTest` 통과. |
| reconnect grace·종료 후 action 정리 | `PASS` | Java service tests와 deadline/reconnect browser 시나리오 통과. |
| 210 메시지 채팅 스크롤, 실제 방 UI, normal/night/restored 증거 | `PASS` | UI 2개 모두 통과. 실제 서버 페이지 스크린샷·transition video 생성. |
| 통계 1회 반영 및 replay | `FAIL` | `MapperIntegrationTest`·`RoomGameServiceTest` 통과. 4·5·6인 E2E 통과; 7·8인 사후 통계 검사는 timeout. |

추가 필수 항목 46–56:

| 번호 | 결과 | 증거 |
|---|---|---|
| 46 재시작 시 PLAYING만 WAITING으로 복구 | `PASS` | `RoomPresenceServiceTest` 및 `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying` |
| 47 Mafia parity·Spy 접촉 경계 | `PASS` | `RoomGameRulesTest`, `RoomGameServiceTest` 패리티 테스트 |
| 48 익명 lobby 및 broadcast 제한 | `PASS` | `WebSocketAuthorizationInterceptorTest`, `RoomPresenceServiceTest` |
| 49 게임 시작 ordering/rollback | `PASS` | controller delegation, presence service rollback, game service partial-state 테스트 |
| 50 4–8인 정확한 역할표 | Java: `PASS`; browser: `FAIL` | `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`; 4·5·6인 E2E pass, 7·8인 E2E fail |
| 51 확인 또는 15초 만료로 첫 NIGHT, 첫 밤 35초 | `FAIL` | 서비스 confirmation/timer 테스트 통과, browser 4·5·6 통과; 모든 browser 인원수 완료는 아님 |
| 52 방 설정 저장 피드백 | `PASS` | controller test 및 8인 room-layout UI 통과 |
| 53 Spy parity/contact 및 Mafia 채널 | `PASS` | Java 패리티 테스트, 6인 browser 흐름 통과 |
| 54 30초 재접속 유예·만료·대기 action | `PASS` | Java presence/game service 및 Full deadline/reconnect E2E 통과 |
| 55 DuckDNS systemd/updater | `NOT RUN` | Full 프로필은 DuckDNS 테스트 제외. 프로필 4 전용. |
| 56 완료 통계와 replay 중복 방지 | `FAIL` | Mapper/service tests 통과; 브라우저 4·5·6 pass, 7·8 post-replay stats 구간 fail |

## 11. 실패·차단 항목

1. 7인/8인 core: Playwright는 두 케이스 모두 `Test timeout of 30000ms exceeded`를 보고했다. trace 흐름은 replay 후 profile stats 검사 지점(`test/e2e/mafia-mvp.spec.js:1452–1453`)까지 도달했고 final-state 스크린샷·동영상도 생성했다. 테스트 전체 결과는 실패로 유지한다.
2. 6→5: `ReferenceError: traces is not defined` at `test/e2e/mafia-mvp.spec.js:1512`. 테스트 함수에서 `traces`를 선언/초기화하지 않은 채 참조한다.
3. DuckDNS 및 live DNS: Full 범위가 아니므로 `NOT RUN`이며 실패나 성공으로 판정하지 않았다.
4. JavaScript/Gradle 경고: Node `NO_COLOR`/`FORCE_COLOR` 경고 외 테스트 실패는 없었다.

## 12. 재현 절차

1. Full 설정(`E2E_PROFILE=full`, `PLAYER_COUNTS=4,5,6,7,8`, `E2E_CAPACITY=8`, `MAFIAGAME_PHASE_PROFILE=production`, worker 1)으로 동일 QA 서버를 구성한다.
2. 위 Playwright core 명령으로 재현한다. 자동 retry는 0으로 둔다.
3. 6→5 실패는 `test/e2e/mafia-mvp.spec.js:1512`의 `waitForGameState(traces[0], ...)` 참조에서 재현된다.
4. 7·8인 실패는 core 로그의 두 timeout 및 각 `trace.zip`에서 replay 후 profile 통계를 확인하는 `1452–1453` 부근을 조사한다.

## 13. 원인 분석

- 6→5 실패의 직접 원인은 테스트 코드 결함이다. 같은 파일의 core 테스트는 `const traces = []`와 `attachGameTrace(page)`를 준비하지만, 6→5 테스트는 `contexts`와 `pages`만 준비하고 `traces`를 선언하지 않는다. NIGHT 상태 대기를 위해 trace 배열을 참조하면서 JavaScript `ReferenceError`가 발생했다.
- 7·8인에서는 게임 완료·재경기 후 통계 조회 경로까지 실행 흔적이 남았지만 Playwright test timeout이 발생했다. 현 증거만으로 앱의 통계 저장 오류와 browser/profile page의 응답 지연을 구분할 수 없다. trace·final screenshot·video를 보존했고 자동 재시도는 수행하지 않았다.

## 14. 애플리케이션 결함과 테스트 결함 분류

| 항목 | 분류 | 판단 |
|---|---|---|
| 6→5 `traces` ReferenceError | 테스트 코드 결함 | 선언되지 않은 지역 변수를 직접 참조한다. 애플리케이션 버그 증거가 아니다. |
| 7·8 통계 이후 30초 timeout | 원인 미확정 (`FAIL`) | 브라우저 E2E 실패는 확정. 현재 결과로 앱과 테스트/실행 환경 중 하나를 단정할 근거는 부족하다. |
| Java 136건 및 JS 41건 | 애플리케이션/클라이언트 자동 테스트 `PASS` | 해당 자동화 assertion 전체 통과. |
| UI 두 건 | browser UI `PASS` | 실제 Spring 서버 렌더링 페이지에서 실행됐다. |

## 15. 변경 검토가 필요한 파일과 위치

- `test/e2e/mafia-mvp.spec.js:1471–1512`: 6→5 테스트에서 trace 수집 배열을 초기화하거나, 이미 확보한 browser phase assertion으로 검증 경로를 일관되게 구성할 필요가 있다.
- `test/e2e/mafia-mvp.spec.js:1448–1454`: 7·8인 재경기 후 각 사용자 프로필 통계 확인 구간. profile 이동/응답 시간과 현재 30초 timeout의 출처를 trace로 더 세분화해야 한다.
- `test/e2e/e2e-profile.js:28–40`: Full core timeout은 20분 설정이다. 실제 실행 중 timeout 보고가 30,000ms였으므로 test timeout과 내부 browser/navigation timeout 중 어느 설정이 발화했는지 확인이 필요하다.

## 16. 권고 수정

6→5 테스트에서 각 page의 game trace를 함께 준비하는 형태가 기존 core 흐름과 일치한다.

```js
const contexts = [];
const pages = [];
const traces = [];
// 각 page 생성 직후
traces.push(attachGameTrace(page));
```

7·8인 이슈는 실패 assertion과 navigation wait의 실제 duration을 기록하고, profile statistics가 결국 기대값에 도달하는지 서버/DB 상태와 대조한 뒤 수정한다. 현재 증거만으로 timeout을 늘리거나 특정 application code를 바꾸는 조치는 권고하지 않는다.

## 17. 테스트 산출물과 로그 경로

- 전체 실행 기록: `C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-215047\`
- Discovery: `...\playwright-qa-20260924-215047\discovery\playwright-discovery.log`
- Core/UI 로그: `...\qa-run-qa-20260924-215047\playwright-core.log`, `...\playwright-ui.log`
- Core/UI traces: `C:\workspace\mafiaweb\output\test_output\2026-09-24\playwright-qa-20260924-215047\core\`, `...\ui\`
- 6→5 오류 문맥 및 trace: `...\core\mafia-mvp-closing-a-waitin-90314--five-player-role-threshold\error-context.md`, `trace.zip`
- QA 진행 대표 스크린샷: `C:\workspace\mafiaweb\output\test_output\2026-09-24\mafia-mvp-test-full-qa-20260924-215047\core-4\final-state.png`
- QA 진행 대표 영상: `...\core-4\core-flow.webm`
- 게임방 normal/night/restored 스크린샷: `C:\workspace\mafiaweb\output\test_output\2026-09-24\room-layout-test-8-qa-20260924-215047\waiting-room.png`, `night-background-and-back-link.png`, `restored-background-and-back-link.png`
- normal→night→normal UI 동영상: `...\room-layout-transition.webm`
- 210-message 채팅 증거: `C:\workspace\mafiaweb\output\test_output\2026-09-24\chat-scroll-test-qa-20260924-215047\chat-scroll.png`, `chat-scroll.webm`
- Java JUnit XML 및 HTML: `C:\workspace\mafiaweb\build\test-results\test\`, `C:\workspace\mafiaweb\build\reports\tests\test\index.html`

## 18. 기존 데이터 보존 확인

사전 namespace 검사에서 `playwright.qa-20260924-215047.*@example.com` 일치 계정은 0개였다. 실행 후 해당 실행 ID의 생성 계정·의존 room 데이터만 정리했다. 기존 사용자·방·기타 DB 데이터는 삭제하지 않았다.

## 19. 테스트 계정 및 서버 정리

- 실행 중 생성된 일치 계정: 51
- 삭제 계정: 51; 관련 멤버십 1, room 1, stats 51 삭제
- 정리 트랜잭션 후 남은 실행 ID 계정: 0 (`ACCOUNT_CLEANUP_STATUS=PASS`)
- Spring Boot PID `9116`와 Gradle launcher tree 종료: `PASS`
- 정리 후 8080 포트 listener: 0 (`SERVER_CLEANUP_STATUS=PASS`)

## 20. 최종 판정

**FAIL** — Java 136/136, JavaScript 41/41, UI E2E 2/2, core E2E 4/7 통과했다. 7·8인 core 흐름은 30초 timeout으로 실패했고, 6→5 시나리오는 미정의 `traces` 테스트 변수 참조로 실패했다. deadline/reconnect는 통과했고 실행 ID 전용 테스트 계정 51개와 QA 서버는 모두 정상 정리됐다. 실패한 브라우저 시나리오가 남아 있어 Full QA 전체를 통과로 판정할 수 없다.

---
