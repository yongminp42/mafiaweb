# MAFIAGAME QA Report — Smoke

## 1. 실행 환경

- 실행 ID: `qa-20260923-123138-smoke`
- 프로필: Smoke (`PLAYER_COUNTS=4`, UI 정원 5, 단축 페이즈, worker 1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **FAIL** — Java·JavaScript 및 방 레이아웃 검증은 통과했으나 4인 핵심 E2E가 Smoke 페이즈 설정과 맞지 않는 시간 단정문에서 실패함.
- Full QA는 실행하지 않음.

## 2. 사전 점검

- 실행 전 8080 포트: 사용 중인 listener 없음.
- MariaDB `127.0.0.1:23306`: 연결 가능.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- DB 클라이언트는 환경의 TLS 설정을 건너뛰는 `--skip-ssl` 옵션으로 연결됨. 계정·암호는 이 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. `jsTest`는 별도 실행을 위해 제외함. |
| JavaScript | PASS | 39 tests, 39 passed, 0 failed. |
| 서버 시작·상태 확인 | PASS | 이 실행의 앱 시작 로그 확인, `/login` HTTP 200. QA 서버 PID 9296 종료 후 8080 listener 없음 확인. |
| 4인 핵심 브라우저 흐름 | FAIL | 27.6초 후 [mafia-mvp.spec.js:1181](../../test/e2e/mafia-mvp.spec.js#L1181)에서 실패. 기대 잔여시간은 20초 이상이나 Smoke 서버 페이즈는 3초이고 실제 표시는 3초였음. |
| 방 레이아웃 브라우저 테스트 | PASS | 5인 레이아웃 테스트 1개 통과(8.8초). |
| 테스트 계정 정리 | PASS | 이번 실행 ID 계정 9개를 조회·삭제했고 잔여 계정 0개 확인. 기존 계정은 선택·삭제하지 않음. |
| QA 서버 정리 | PASS | 이번 실행 시작 로그와 포트 소유 PID를 대조해 QA 서버만 종료. 종료 뒤 8080 포트가 비었음을 확인. |

실행 명령:

- `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest --console=plain`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js`
- `.\gradlew.bat bootRun --no-daemon` (숨김 프로세스, `SERVER_PORT=8080`, Smoke/short 설정)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`
- `npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list`
- 이번 실행 ID에 한정한 MariaDB 계정 정리 및 잔여 계정 조회.

## 4. 실패 분석

Smoke 프로필은 `MAFIAGAME_PHASE_PROFILE=short`를 사용하며, 비종료 페이즈의 대기 시간을 짧게 설정한다. 하지만 4인 핵심 E2E의 재접속 검사는 짧은 프로필 여부와 관계없이 남은 시간이 `>= 20`초가 될 때까지 기다린다. 브라우저는 3초를 읽었고 5초 안에 조건을 만족할 수 없어 실패했다.

따라서 이 실패는 서버 시작이나 8080 포트 충돌이 아니라 **E2E 테스트의 고정 시간 기대와 Smoke 프로필 설정 불일치**다. 이 지점에서 테스트가 중단되어 새로고침 후 상태 복구, 밤 행동 결과, 다음 낮 진행, 게임 종료·결과, 동일 방 재플레이는 이 브라우저 실행에서 검증되지 않았다. Smoke 프로필은 재플레이를 포함하지 않는다.

서버 시작 명령을 감싼 PowerShell 상태 확인에 구문 오류가 한 차례 있었으나, 새 서버의 시작 로그와 PID, HTTP 200을 확인한 뒤 검증을 이어갔다. 실행 중 서버는 해당 PID 기준으로 종료했으며 포트 해제를 확인했다.

## 5. MVP 검증 상태

| 요구사항 | 상태 | 실행 근거 및 범위 |
|---|---|---|
| 1–2. 역할 배정과 비공개 역할 표시 | PASS | Java 역할 배정 테스트 및 E2E 역할 확인 화면/공개 상태 검사가 통과함. |
| 3–7. 낮·지목·변론·처형·밤의 운영 시간 | NOT RUN | Smoke는 단축 페이즈를 사용함. 재접속 시간 단정 실패도 3초 단축 페이즈에서 발생함. |
| 8–11. 중복·자기 지목·사망자·후보자 투표 제한 | PASS | `RoomGameServiceTest`의 해당 서버 검증 테스트 통과. |
| 12–16. 밤 공격·보호·조사와 역할/대상/중복 행동 검증 | PASS | Java 서비스 테스트 통과. E2E는 행동 제출까지 갔으나 첫 밤 결과 해소는 확인하지 못함. |
| 17–22. 승리 판정, 결과 전달, 승리 진영·개인 역할 표시 | PASS | Java 서비스 및 JavaScript 결과 표시 테스트 통과. 결과 화면 자체의 브라우저 검증은 실패 시점상 진행하지 못함. |
| 23. 생존/사망 표시 | PASS | E2E 실패 지점 전에 사망 참가자 카드와 `사망` 표식을 확인함. |
| 24–27. WAITING·Ready 초기화·재플레이·새로고침 복구 | NOT RUN | 완료/재접속 흐름까지 E2E가 도달하지 못함. 재플레이는 Smoke 범위에서 제외됨. |
| 28–29. 공개/마피아 채널 분리와 사망자 채널 권한 | PASS | E2E가 실패 지점 전까지 각 채널 가시성 및 권한 거부를 확인했고 Java/JS 테스트도 통과함. |
| 30. 마피아·Spy·의사·경찰·Medium의 무행동 처리 | NOT RUN | 네 명 Smoke 브라우저 흐름으로 Spy/Medium의 무행동 경계까지 검증하지 않음. |
| 31. 의사의 연속 밤 자기 보호 | PASS | Java 서비스 단위 테스트 통과. |
| 32. 사망 시 역할/조사 정보 비공개 | PASS | 게임 진행 중 공개 상태의 역할 비노출 검사와 관련 Java/JS 테스트 통과. |
| 33. 종료 후 전체 역할 공개 | NOT RUN | E2E가 게임 종료 화면까지 도달하지 못함. |
| 34. 서버 마감 시각 및 중복 요청 처리 | PASS | Java 서비스의 마감·동시 요청 테스트 통과. |
| 35–36. 방 복귀 링크와 일반/밤 배경 대비 | PASS | 실제 방 페이지에서 `/rooms` 링크 및 일반/밤 배경과 링크 스타일을 확인하는 UI E2E 통과. |
| 37. 채널별 말풍선의 클래스와 시각적 차이 | NOT RUN | JS 테스트에서 채널 클래스는 확인했으나 Smoke 정책상 시각 증거를 캡처하지 않음. |
| 38. 모든 단계의 안내 메시지와 중복 방지 | NOT RUN | E2E 실패 전 역할 확인부터 밤까지 일부 단계는 확인했지만 `FINISHED`까지 전체 흐름을 검증하지 못함. |
| 39. 서버 페이즈에 연동된 밤 배경 전환/복원 | NOT RUN | UI 테스트는 CSS 상태를 직접 전환해 확인했지만, 실제 게임의 밤→낮/종료 연동 E2E는 끝나지 않음. |
| 40–41. 전체 게임 및 QA 진행 스크린샷/비디오 | NOT RUN | Smoke 프로필은 정기 스크린샷·비디오 캡처를 생략함. 해당 증거는 Full 전용 정책임. |
| 42–43. 호스트 설정, 용량 제한, 잠금 동기화 | PASS | 5인 방 레이아웃 E2E와 JavaScript 테스트 통과. |
| 44. 종료 후 공개 채널 초기화와 사망자 공개 메시지 전달 | PASS | Java/JavaScript 테스트 통과. 종료 이후 브라우저 E2E는 확인하지 못함. |
| 45. 진영 조사 결과와 Spy/Medium 개별 직업 결과 | PASS | Java 조사 전달 및 JavaScript 결과 표시 테스트 통과. Spy/Medium은 4인 Smoke E2E 범위에 포함되지 않음. |

## 6. 산출물

- 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-123138-smoke/`
- JavaScript/Gradle 콘솔 로그: `javascript.log`, `gradle-java.log`
- Gradle 결과: `build/test-results/test/`, `build/reports/tests/test/index.html`
- 서버 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- DB 정리 확인: `database-cleanup.log`
- 실패 E2E 증거: `output/test_output/2026-09-23/playwright-qa-20260923-123138-smoke/core/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md` 및 `trace.zip`
- Smoke 프로필은 정상 브라우저 스크린샷·비디오를 캡처하지 않음.
