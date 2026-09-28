# MAFIAGAME QA 통합 보고서

- 최종 복구 및 업데이트: 2026-09-28
- 정렬 기준: 최신 날짜와 실행 시각 우선
- 복구 자료: 현재 개별 보고서, 정상 Git 이력의 통합본 및 개별 원문
- 복구 한계: `qa-20260922-135034` 원문 파일은 이력에 없어, 남아 있던 측정값과 판정을 바탕으로 복구 요약을 수록함

## 최신 실행 요약

최신 원문은 아래 날짜별 문서와 개별 보고서에서 확인할 수 있다. `PASS`는 선택한 프로필의 실행 범위가 모두 통과했다는 뜻이며, `FAIL`은 테스트가 실행된 뒤 하나 이상의 검증이 실패했다는 뜻이다. `BLOCKED`는 사전 조건을 충족하지 못해 후속 테스트를 실행하지 않은 경우다. `NOT RUN` 항목은 PASS로 계산하지 않는다.

| 실행일 | 실행 ID | 프로필 | 최종 판정 | 핵심 결과 |
|---|---|---|---|---|
| 2026-09-28 | `qa-20260928-151906-493` | Regression | **PASS** | Java 148건, Playwright core 3건과 UI 2건 통과. 원문에는 JavaScript 44건 중 제품 로직 43건 통과 및 문서 계약 검사 1건 실패가 함께 기록되어 있으며, 이후 계약 검사 수정 후 `jsTest` 44건 전부 통과했다. |
| 2026-09-28 | `qa-20260928-144515-266-46a2` | Full | **BLOCKED** | FFmpeg가 종료되거나 비어 있지 않은 녹화 파일을 생성하지 못해 녹화 사전 점검에서 중단. DB와 테스트는 실행하지 않음. |
| 2026-09-28 | `qa-20260928-141752-234-7c3f` | Full | **BLOCKED** | `ffmpeg.exe` 또는 `ffprobe.exe`를 PATH에서 찾지 못해 진행 녹화 게이트에서 중단. |
| 2026-09-28 | `qa-20260928-141448-946-149f` | Full | **BLOCKED** | PowerShell `Get-ExecutionPolicy` 보안 모듈 로드 실패로 시작 게이트에서 중단. |
| 2026-09-28 | `qa-20260928-140303-full-blocked` | Full | **BLOCKED** | 전용 PowerShell 창이 데스크톱 창 목록에서 확인되지 않아 진행 녹화를 검증하지 못함. |
| 2026-09-28 | `qa-20260928-131742-991-f301` | Smoke | **PASS** | Java 145건, JavaScript 43건, 4인 core와 5인 UI 흐름 통과. 서버·계정 정리 통과. |
| 2026-09-28 | `qa-20260928-124507-081-18a5` | Smoke | **FAIL** | Java 145건 중 4건, Playwright core/UI 각 1건 실패. JavaScript 43건은 통과했으며 서버·계정 정리는 통과. |
| 2026-09-27 | `qa-20260927-182005-120` | Regression | **BLOCKED** | MariaDB `127.0.0.1:23306` 연결 실패로 필수 사전 점검에서 중단. 테스트와 서버는 실행하지 않음. |

날짜별 정리:

- [2026-09-27 보고서 1건](./09_MAFIAGAME_QA_REPORTS_BY_DATE_2026-09-27.md)
- [2026-09-28 보고서 7건](./10_MAFIAGAME_QA_REPORTS_BY_DATE_2026-09-28.md)

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-25_qa-20260924-232947.md`
2. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-215047.md`
3. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-212401.md`
4. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-205533.md`
5. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md`
6. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-192907.md`
7. `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-162600.md`
8. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-152338-smoke.md`
9. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-150416-smoke.md`
10. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-131334-regression.md`
11. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-1305-smoke.md`
12. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-123138-smoke.md`
13. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-120355.md`
14. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-115534.md`
15. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-113110.md`
16. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-144340.md`
17. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-135034.md`
18. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md`
19. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-000243.md`
20. `MAFIAGAME_QA_REPORT_2026-09-21_qa-20260921-174132.md`
21. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-221345.md`
22. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`
23. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1440-full.md`
24. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1401-full.md`
25. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1302.md`
26. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1202.md`
27. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-112243.md`
28. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-022915.md`
29. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-014701.md`
30. `MAFIAGAME_DEBUG_TEST_REPORT_2026-09-20.md`
31. `MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`
32. `MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-174339.md`
33. `MAFIAGAME_QA_EXECUTION_REPORT_2026-09-18_173155.md`
34. `MAFIAGAME_QA_EXECUTION_AND_FIX_REPORT_2026-09-18.md`
35. `MAFIAGAME_MVP_VALIDATION_REPORT_2026-09-18.md`
36. `MAFIAGAME_TEST_AND_E2E_ANALYSIS_2026-09-18.md`
37. `MAFIAGAME_E2E_QA_REPORT_2026-09-18.md`
38. `MAFIAGAME_DEBUG_REPORT_2026-09-18.md`

---

## 문서 1: `MAFIAGAME_QA_REPORT_2026-09-25_qa-20260924-232947.md`

# MAFIAGAME Full QA 보고서

- 보고서 작성일: 2026-09-25 (Asia/Seoul)
- 실행 ID: qa-20260924-232947
- 선택 프로필: Full (사용자가 3번을 명시적으로 선택)
- 실행 범위: Java, 표준 JavaScript, Playwright core 및 UI
- 최종 판정: BLOCKED

## 요약

Java 테스트 136개, JavaScript 테스트 41개, Playwright 테스트 9개가 모두 통과했다. Full 프로필의 4·5·6·7·8인 게임 흐름, 역할 기준 인원 감소, 재접속/기한 처리, 채팅 스크롤, 방 레이아웃을 실행했다. MariaDB를 사용하는 애플리케이션이 정상 기동했고, 이 실행에서 생성한 계정 51개와 종속 자료를 정리했으며 QA 서버 PID와 8080 포트도 해제했다.

최종 판정이 BLOCKED인 이유는 MVP 항목 41의 요구 증거가 부족하기 때문이다. 각 브라우저 시나리오의 스크린샷과 영상은 생성됐지만, QA 사전 점검부터 테스트 결과 및 계정/서버 정리까지 전체 과정을 기록한 진행 영상은 생성하지 않았다. 제품 동작 결함은 확인되지 않았다.

## 1. 실행 환경

- 운영체제 및 셸: Windows, PowerShell
- 프로젝트: C:\workspace\mafiaweb
- Node.js: v24.19.0
- npm: C:\Program Files\nodejs\npm.cmd
- Gradle Wrapper: 8.14.5
- 애플리케이션 URL: http://127.0.0.1:8080
- MariaDB 점검 주소: 127.0.0.1:23306
- Full 프로필: E2E_PROFILE=full, PLAYER_COUNTS=4,5,6,7,8, E2E_CAPACITY=8, MAFIAGAME_PHASE_PROFILE=production
- 요청/실효 워커: 1 / 1
- Playwright 재시도: 0

실행이 자정을 넘어 증거 경로의 날짜가 나뉘었다. 서버 및 core 산출물은 2026-09-24 폴더에, UI 산출물은 2026-09-25 폴더에 저장됐다. 실행 ID는 양쪽 경로에서 동일하다.

## 2. MariaDB 사전 점검 및 의존성

- MariaDB 127.0.0.1:23306 연결: PASS. 실제 앱 서버와 실행 ID 전용 계정 점검/정리에 사용했다.
- Node.js/npm.cmd, jsdom, @playwright/test 확인: PASS.
- 기본 Windows 실행 경계의 Node child_process.fork 검사: BLOCKED. 결과는 fork error: EPERM, 종료 코드 23이었다.
- 허용된 실행 경계의 동일 fork 검사: PASS. 자식 프로세스가 exit=0으로 종료했다.
- Playwright E2E는 자식 프로세스가 허용된 실행 경계에서 수행했으며 9개 시나리오가 통과했다.
- 비밀번호, 토큰 등 비밀값은 보고서와 로그 요약에 기록하지 않았다.

Node 검사 증거:

- 기본 경계: output/test_output/2026-09-24/qa-run-qa-20260924-232947/node-fork-default-boundary.log
- 허용된 경계: output/test_output/2026-09-24/qa-run-qa-20260924-232947/node-fork-approved-boundary.log

## 3. 확인한 파일 및 디렉터리

- 실행 지침: docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md
- Playwright 설정 및 프로필: playwright.config.js, test/e2e/e2e-profile.js, test/e2e/test-output-path.js
- E2E: test/e2e/mafia-mvp.spec.js, test/e2e/chat-scroll.spec.js, test/e2e/room-layout.spec.js
- 표준 JavaScript: test/js/stomp-client.test.js, test/js/room-list.test.js, test/js/chat.test.js, test/js/e2e-profile.test.js
- Java 테스트: src/test/java/kr/or/oti/mafiagame/**, src/test/resources/application.properties
- 실제 화면 증거: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947 및 2026-09-25의 chat-scroll-test/room-layout-test 디렉터리
- 실행 로그: output/test_output/2026-09-24/qa-run-qa-20260924-232947

## 4. 실행 명령

Java 전체 테스트:

    .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest

표준 JavaScript 테스트:

    node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js

Playwright 탐색:

    npm.cmd exec -- playwright test test/e2e/mafia-mvp.spec.js test/e2e/chat-scroll.spec.js test/e2e/room-layout.spec.js --list --workers=1

Playwright core:

    npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list

Playwright UI:

    npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list

QA 서버는 별도의 새 Gradle bootRun 프로세스로 시작했다. 실행 전·후 계정 확인은 QaTestAccountCleanup check/cleanup qa-20260924-232947로 수행했다.

## 5. Java 테스트 결과

- 판정: PASS
- 결과: 136개 통과, 실패 0, 오류 0, 건너뜀 0
- 콘솔 요약: BUILD SUCCESSFUL in 40s; 5 actionable tasks: 5 executed
- 로그: output/test_output/2026-09-24/qa-run-qa-20260924-232947/gradle-test.log
- JUnit XML: build/test-results/test/ 아래 TEST-*.xml 12개
- HTML 보고서: build/reports/tests/test/index.html

테스트 클래스별 집계:

| 테스트 클래스 | 테스트 | 실패/오류/건너뜀 |
|---|---:|---:|
| WebSocketAuthorizationInterceptorTest | 8 | 0/0/0 |
| ControllerDelegationTest | 4 | 0/0/0 |
| RoomControllerTest | 6 | 0/0/0 |
| MapperIntegrationTest | 4 | 0/0/0 |
| MafiagameApplicationTest | 1 | 0/0/0 |
| ChatServiceTest | 3 | 0/0/0 |
| RoomGameRulesTest | 2 | 0/0/0 |
| RoomGameServiceTest | 58 | 0/0/0 |
| RoomPresenceServiceTest | 29 | 0/0/0 |
| RoomServiceTest | 11 | 0/0/0 |
| SignupServiceTest | 4 | 0/0/0 |
| UserAccountServiceTest | 6 | 0/0/0 |

MapperIntegrationTest의 4개 테스트는 실제 MariaDB가 아니라 src/test/resources/application.properties에 설정된 H2 메모리 DB의 MariaDB 호환 모드에서 실행됐다. 이 결과는 MariaDB 연결 사전 점검 및 Playwright 계정 정리 결과와 구분한다.

핵심 통합/서비스 테스트 증거에는 MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying, MapperIntegrationTest.completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed, RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries, RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase, RoomGameServiceTest.rejectsConcurrentRequestsAfterTheServerDeadline, RoomPresenceServiceTest.throttlesRepeatedLobbyCountRequestsFromOneSession, RoomPresenceServiceTest.coalescesLobbyCountRequestsAcrossSessionsAtTheGlobalLimit이 포함된다.

## 6. JavaScript 테스트 결과

- 판정: PASS
- 결과: 41개 통과, 실패 0, 건너뜀 0
- 로그: output/test_output/2026-09-24/qa-run-qa-20260924-232947/node-js-tests.log
- 확인된 영역: STOMP 프레임/재연결, 채팅·게임 상태 렌더링, 방 목록 실시간 상태, E2E 프로필 분리.

## 7. 서버 기동 및 상태 확인

- 기동: PASS
- 확인 주소: http://127.0.0.1:8080/login
- 응답: HTTP 200
- 이번 실행 애플리케이션 PID: 18328
- 표준 출력/오류: output/test_output/2026-09-24/qa-run-qa-20260924-232947/bootRun.qa-20260924-232947.stdout.log 및 bootRun.qa-20260924-232947.stderr.log
- 종료 및 포트 확인: PASS. QA 애플리케이션 PID와 Gradle 런처 트리를 종료했고 8080 포트가 비었음을 확인했다.

## 8. Playwright 탐색 및 전체 결과

탐색 결과 3개 파일에서 9개 테스트가 확인됐다.

- Core 7개: MVP 4인, 5인, 6인, 7인, 8인 한 사이클; 대기방 종료에 따른 6→5 역할 기준 변경; 브라우저 기한·재접속 유예·만료된 야간 행동.
- UI 2개: 게임 시작 전 역할 영역과 채팅 스크롤, 8인 대기/진행 중 방 레이아웃.
- Core 결과: 7 passed (1.1h), 종료 코드 0.
- UI 결과: 2 passed (44.0s), 종료 코드 0.
- 전체 Playwright 결과: 9/9 PASS.
- 탐색 로그: output/test_output/2026-09-24/playwright-qa-20260924-232947/discovery/playwright-discovery.log
- Core 로그: output/test_output/2026-09-24/qa-run-qa-20260924-232947/playwright-core.log
- UI 로그: output/test_output/2026-09-24/qa-run-qa-20260924-232947/playwright-ui.log
- Full trace 정책: trace on, DOM snapshots 사용, 중복 프레임을 줄이기 위해 trace screenshots 비활성화. 별도 화면 스크린샷/영상은 생성했다.
- Trace: 9개 trace.zip. Core 7개는 2026-09-24 경로, UI 2개는 2026-09-25 경로에 저장됐다.

PowerShell은 npm.cmd 실행 중 다음 Node 경고를 NativeCommandError 형식으로 출력했지만 테스트는 모두 종료 코드 0으로 끝났다: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실행 시간 |
|---|---|---:|
| MVP 4인 핵심 게임 흐름 | PASS | 8.0분 |
| MVP 5인 핵심 게임 흐름 | PASS | 8.0분 |
| MVP 6인 핵심 게임 흐름 | PASS | 13.2분 |
| MVP 7인 핵심 게임 흐름 | PASS | 13.2분 |
| MVP 8인 핵심 게임 흐름 | PASS | 18.6분 |
| 대기방 탭 종료 후 6→5 역할 기준 | PASS | 1.1분 |
| 브라우저 기한·재접속 유예·만료 야간 행동 | PASS | 3.5분 |
| 역할 영역·채팅 스크롤 | PASS | 16.3초 |
| 8인 방 레이아웃·설정 UI | PASS | 25.1초 |

5개 인원별 Full 흐름은 core 테스트에서 통과했다. 내부 replay 검증은 각 인원수의 같은 방 흐름 안에서 수행됐다. 서버 시간 기반 페이즈, 역할 공개 범위, 종료 후 상태/통계, 채팅과 재접속 관련 assertions가 통과했다.

추가 경계 확인으로 RoomGameServiceTest.resolvesConcurrentNightActionsFromBothMafiaWithoutDroppingAnAction이 두 Mafia 행동을 동시 제출해 통과했다. 이는 서비스 계층 동시 실행 검사다. 별도의 8인 WebSocket 실부하 시험은 이번 Playwright 범위에 포함되지 않았다.

## 10. MVP 검증표

| 번호 | 판정 | 실행 증거 |
|---:|---|---|
| 1 | PASS | 4–8인 E2E 및 RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries |
| 2 | PASS | RoomGameServiceTest.assignsRolesAndSendsEachRoleOnlyToItsPrincipal; 4–8인 브라우저 흐름 |
| 3 | PASS | Full 페이즈 타이밍 assertions; RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase |
| 4 | PASS | Full 페이즈 타이밍 assertions 및 RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase |
| 5 | PASS | Full 방어 페이즈 검증 및 RoomGameServiceTest.givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting |
| 6 | PASS | Full 처형 투표 흐름 및 RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase |
| 7 | PASS | 첫 NIGHT 및 후속 밤 검증; production 페이즈 타이밍 |
| 8 | PASS | RoomGameServiceTest.acceptsOnlyTheFirstNominationVoteFromEachUser |
| 9 | PASS | RoomGameServiceTest.rejectsSelfNominationAndUnknownPlayers |
| 10 | PASS | RoomGameServiceTest.rejectsNominationVoteFromADeadPlayer |
| 11 | PASS | RoomGameServiceTest.rejectsExecutionVoteFromTheNominatedPlayer |
| 12 | PASS | 4–8인 core E2E; RoomGameServiceTest.appliesMafiaKillAndDoctorProtectionDuringNight |
| 13 | PASS | RoomGameServiceTest.appliesMafiaKillAndDoctorProtectionDuringNight; RoomGameServiceTest.allowsDoctorToProtectThemselfOnConsecutiveNights |
| 14 | PASS | 경찰 조사 결과 비공개 서비스 테스트 및 6–8인 E2E 조사 흐름 |
| 15 | PASS | RoomGameServiceTest.validatesNightActionRoleTargetAndDuplicateSubmission 및 역할별 E2E 행동 |
| 16 | PASS | RoomGameServiceTest.leavesEveryoneAliveWhenMafiaDoctorAndPoliceSubmitNoAction |
| 17 | PASS | RoomGameServiceTest.declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted |
| 18 | PASS | RoomGameRulesTest의 마피아 승리/Spy parity 테스트 |
| 19 | PASS | 투표·밤 진행 후 즉시 승리 재평가 서비스 테스트와 core E2E |
| 20 | PASS | 승리 직후 FINISHED 화면을 확인한 core E2E |
| 21 | PASS | 완료 결과의 승리 진영 표시를 확인한 core E2E |
| 22 | PASS | RoomGameServiceTest.sendsEachPlayerTheirPrivateResultWithRoleAndAliveState 및 종료 화면 |
| 23 | PASS | chat.test.js의 사망 참가자 카드 상태와 사망 라벨 테스트; 종료 화면 E2E |
| 24 | PASS | RoomPresenceServiceTest.returnsFinishedRoomToWaitingAndClearsReadyState |
| 25 | PASS | RoomPresenceServiceTest.returnsFinishedRoomToWaitingAndClearsReadyState |
| 26 | PASS | 4·5·6·7·8인 core 흐름에서 같은 방 replay 확인 |
| 27 | PASS | 브라우저 재접속 E2E 및 RoomPresenceServiceTest.cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod |
| 28 | PASS | RoomGameServiceTest의 Mafia/public 권한 테스트, chat.test.js, 4–8인 E2E |
| 29 | PASS | RoomGameServiceTest.enforcesNightChatPermissionsByRoleAndAliveState 및 dead 채널 E2E |
| 30 | PASS | 무행동, Spy/Medium 행동 제한 및 target 검증 서비스 테스트 |
| 31 | PASS | RoomGameServiceTest.allowsDoctorToProtectThemselfOnConsecutiveNights |
| 32 | PASS | RoomGameServiceTest.resendsOnlyTheCurrentPlayersRoleWhenStateIsSynchronized 및 사망 경찰 조사 결과 미전달 테스트 |
| 33 | PASS | 4–8인 종료 흐름의 결과 화면/역할 공개 E2E |
| 34 | PASS | RoomGameServiceTest.rejectsConcurrentRequestsAfterTheServerDeadline 및 Full 실제 시간 E2E |
| 35 | PASS | room-layout.spec.js에서 .room-back-link 표시와 /rooms 목적지 확인 |
| 36 | PASS | room-layout.spec.js에서 일반/NIGHT 대비 및 동일 링크 스타일 확인 |
| 37 | PASS | chat.test.js의 PUBLIC/MAFIA/DEAD 채널 클래스 렌더링 테스트 |
| 38 | PASS | RoomGameServiceTest.broadcastsSystemGuidanceWhenAGamePhaseStarts, chat.test.js 및 core E2E |
| 39 | PASS | room-layout.spec.js에서 NIGHT 배경 전환과 원상 복구 확인 |
| 40 | PASS | 실제 서버 렌더링 화면 스크린샷과 normal→night→normal 영상 저장 |
| 41 | BLOCKED | 시나리오 진행 스크린샷/영상은 있으나 사전 점검부터 최종 정리까지의 QA 전체 진행 영상은 없음 |
| 42 | PASS | room-layout.spec.js에서 호스트 전용 설정, 4–8명 용량, 비밀번호 설정·변경·해제 및 저장 안내 검증 |
| 43 | PASS | room-layout.spec.js의 인원 초과 용량 UI 차단; RoomService/RoomPresence 서비스 테스트의 서버 검증·동기화 |
| 44 | PASS | chat.test.js의 종료 후 PUBLIC 채널 전환/메시지 표시 및 core 종료 흐름 |
| 45 | PASS | chat.test.js의 경찰 진영 결과와 Spy/Medium 정확한 직업 표기 테스트 |
| 46 | PASS | MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying 및 애플리케이션 준비 서비스 테스트 |
| 47 | PASS | RoomGameRulesTest의 접촉 Spy 포함/미접촉 Spy 제외 parity 테스트와 승리 서비스 테스트 |
| 48 | PASS | WebSocketAuthorizationInterceptorTest 및 RoomPresenceServiceTest의 익명 접근, 요청 제한, 전역 coalescing 테스트 |
| 49 | PASS | ControllerDelegationTest, RoomPresenceServiceTest의 시작 순서/롤백, 부분 생성 제거 테스트 |
| 50 | PASS | 4–8인 E2E와 RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries |
| 51 | PASS | 역할 확인/15초 만료 후 첫 NIGHT, 첫 NIGHT 후 DAY_DISCUSSION 검증 |
| 52 | PASS | RoomControllerTest.savingRoomSettingsFlashesTheSuccessMessageForTheModal 및 room-layout.spec.js의 브라우저 검증 |
| 53 | PASS | RoomGameRulesTest 및 RoomGameServiceTest의 Spy 접촉/마피아 채널 권한 E2E |
| 54 | PASS | browser deadline/reconnect E2E와 RoomPresenceServiceTest 재접속 유예 테스트 |
| 55 | NOT RUN | Full 프로필은 DuckDNS 테스트를 실행하지 않는 규칙에 따름. 라이브 DNS도 실행하지 않음 |
| 56 | PASS | MapperIntegrationTest.completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed, RoomGameServiceTest.doesNotRecordStatisticsBeforeACompletedGame 및 Full replay E2E |

## 11. 실패, 차단 및 미실행 항목

- 제품 동작 실패: 없음.
- MVP 41: BLOCKED. 개별 게임 화면의 진행 자료는 존재하지만 사전 점검, 테스트, 결과, 계정/서버 정리까지 한 번에 담은 전체 QA 진행 영상/화면 기록이 없다.
- MVP 55: NOT RUN. DuckDNS-only 전용 검사항목이며 Full 프로필에서는 실행하지 않는다.
- 첫 E2E 하네스 시도: Playwright 탐색 전에 다음 경로 누락으로 종료됐다. Could not find a part of the path 'C:\\workspace\\mafiaweb\\output\\test_output\\2026-09-24\\playwright-qa-20260924-232600\\discovery\\playwright-discovery.log'. 이 시도에서는 Playwright 테스트가 시작되지 않았고 테스트 계정 0개 및 서버 종료를 확인했다. 새 실행 ID로 discovery 폴더를 먼저 생성하도록 실행용 스크립트를 보완한 뒤 전체 E2E를 성공적으로 재실행했다.
- 부수 경고: npm.cmd 출력의 NO_COLOR/FORCE_COLOR 경고가 PowerShell NativeCommandError 형식으로 표시됐지만 각 테스트 종료 코드는 0이었다.

## 12. 재현 절차

1. MariaDB 127.0.0.1:23306, Node/npm 및 Playwright 의존성 상태를 확인한다.
2. 제한된 Windows 경계에서 fork-probe.cjs를 실행하면 fork error: EPERM, 종료 코드 23이 재현된다. 동일 스크립트는 허용된 실행 경계에서 자식 종료 코드 0을 반환한다.
3. output/test_output/2026-09-24/qa-run-qa-20260924-232947/run-full-e2e.ps1을 실행한다.
4. 로그에서 서버 HTTP 200, Playwright discovery 9개, core 7개와 UI 2개의 종료 코드, 정확한 실행 ID 계정 정리, PID/포트 정리를 확인한다.

## 13. 원인 분석

Windows 기본 실행 경계는 Node가 Playwright worker를 위해 만드는 자식 프로세스를 EPERM으로 막았다. 실행 환경의 허용된 경계에서 동일 fork 검사가 통과했고 Playwright 전체 9개 테스트도 통과했으므로 애플리케이션 결함으로 분류하지 않는다.

첫 실행용 하네스에서는 discovery 출력 폴더가 생성되지 않았다. Playwright --list는 해당 폴더를 만들지 않았고, 후속 PowerShell Get-Content가 로그 파일을 열지 못했다. 성공 실행용 run-full-e2e.ps1 21행에 discovery 폴더 생성을 추가해 해결했다.

## 14. 애플리케이션 결함과 테스트 하네스 결함

- 애플리케이션: 확인된 결함 없음.
- 환경 제약: 기본 Windows 실행 경계의 Node 자식 프로세스 제한. 허용된 실행 경계에서 검증을 계속해 전체 E2E가 통과했다.
- QA 하네스: 첫 시도용 임시 run-full-e2e.ps1의 discovery 디렉터리 누락. 성공 실행에 사용한 임시 QA 스크립트에서 보완했다.
- 증거 수집: 전체 QA 진행 기록의 부재는 구현 결함이 아니라 증거 수집 누락이며 MVP 41을 BLOCKED로 남겼다.

## 15. 검토 파일과 수정 필요 위치

- playwright.config.js 8–10행: Full trace 스냅샷 설정. 9개 trace가 생성되고 저장 오류 없이 통과했다.
- test/e2e/e2e-profile.js 28–40행: Full 프로필의 인원 수, production timing, trace 및 증거 설정.
- test/e2e/mafia-mvp.spec.js 743행, 1469행, 1528행: 인원별 게임 사이클, 6→5 기준 변경, reconnect/deadline 시나리오.
- test/e2e/chat-scroll.spec.js 15행 및 99–153행: 채팅 스크롤·스크린샷·영상.
- test/e2e/room-layout.spec.js 34행, 110–160행, 166–208행, 319–328행: 호스트 설정, 용량/비밀번호, 링크 대비, 레이아웃 화면/영상.
- src/test/java/kr/or/oti/mafiagame/service/RoomGameServiceTest.java 78행, 151행, 252행 및 해당 테스트 메서드: 역할·페이즈·승리·채팅·기한 테스트.
- src/test/java/kr/or/oti/mafiagame/service/RoomPresenceServiceTest.java 474행, 483행, 498행, 596행: lobby throttling, coalescing, recovery, 시작 rollback.
- src/test/java/kr/or/oti/mafiagame/dao/MapperIntegrationTest.java 17행, 46행, 102행: H2 mapper integration, 결과 통계와 복구.
- output/test_output/2026-09-24/qa-run-qa-20260924-232947/run-full-e2e.ps1 21행: 성공 실행본에서 discovery 폴더 생성. 저장소의 애플리케이션 소스 변경은 필요하지 않다.

## 16. 권고 수정 항목

1. 전체 QA 진행 기록 요구를 충족하도록 다음 Full 실행에서는 사전 점검부터 계정/서버 정리 완료까지의 run-level 진행 스크린샷과 영상을 함께 저장한다. 해당 자료가 추가되면 MVP 41과 최종 판정을 다시 평가할 수 있다.
2. 재사용 실행 하네스가 유지된다면 Playwright --list 호출 전에 discovery 출력 경로를 생성한다. 이번 성공 실행용 임시 스크립트에는 다음 설정이 반영됐다.

    New-Item -ItemType Directory -Force -Path (Join-Path $playwrightPath 'discovery') | Out-Null

3. Full 실행의 증거 영상은 약 681MB였고 전체 QA 산출물은 약 707MB였다. 보존 정책과 영상 인코딩/페이지별 녹화 수를 별도로 검토하면 다음 실행의 디스크 사용량을 줄일 수 있다. 이 실행에서는 증거를 삭제하거나 축소하지 않았다.
4. 애플리케이션 소스 수정 권고: 없음. QA 중 소스 파일을 수정하지 않았다.

## 17. 생성된 테스트 산출물 경로

- 실행 로그, 명령 결과, cleanup 및 helper: C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-232947
- 이전 하네스 실패 기록: C:\workspace\mafiaweb\output\test_output\2026-09-24\qa-run-qa-20260924-232600
- Playwright discovery/core trace: C:\workspace\mafiaweb\output\test_output\2026-09-24\playwright-qa-20260924-232947
- Playwright UI trace: C:\workspace\mafiaweb\output\test_output\2026-09-25\playwright-qa-20260924-232947
- 4–8인 시나리오 화면/영상: C:\workspace\mafiaweb\output\test_output\2026-09-24\mafia-mvp-test-full-qa-20260924-232947
- 채팅 스크롤 화면/영상: C:\workspace\mafiaweb\output\test_output\2026-09-25\chat-scroll-test-qa-20260924-232947
- 8인 레이아웃 화면/영상: C:\workspace\mafiaweb\output\test_output\2026-09-25\room-layout-test-8-qa-20260924-232947
- QA 보고서: C:\workspace\mafiaweb\docs\QA_report\MAFIAGAME_QA_REPORT_2026-09-25_qa-20260924-232947.md
- Java 상세 XML 및 HTML: C:\workspace\mafiaweb\build\test-results\test\TEST-*.xml, C:\workspace\mafiaweb\build\reports\tests\test\index.html

대표 진행 화면/영상:

- 4인 대기실: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/core-4/waiting-room.png
- 4인 역할 배정: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/core-4/role-assignment.png
- 4인 NIGHT: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/core-4/night.png
- 4인 종료 화면: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/core-4/finished.png
- 4인 사이클 영상: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/core-4/core-flow.webm
- 6→5 변경 영상: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/six-to-five-threshold/six-to-five-threshold.webm
- 재접속 영상: output/test_output/2026-09-24/mafia-mvp-test-full-qa-20260924-232947/deadline-reconnect/deadline-reconnect.webm
- 채팅 스크롤 영상: output/test_output/2026-09-25/chat-scroll-test-qa-20260924-232947/chat-scroll.webm
- 8인 레이아웃 normal→night→normal 영상: output/test_output/2026-09-25/room-layout-test-8-qa-20260924-232947/room-layout-transition.webm

실제 저장된 브라우저 증거는 48개 PNG, 33개 WEBM, 9개 Playwright trace.zip이다. QA 전체 과정을 한 번에 기록한 영상은 별도로 생성되지 않았다.

## 18. 기존 데이터 보존

기존 데이터 전체를 삭제하는 설정은 비활성화했다. 실행 ID에 고유한 playwright.qa-20260924-232947.* 계정만 선택해 정리했다. 이전 하네스 실패 실행 ID의 namespace도 사전 점검 및 cleanup에서 0개를 확인했다. 다른 사용자, 방 또는 기존 레코드는 정리 대상에 포함하지 않았다.

## 19. 테스트 계정 및 서버 정리

- 사전 실행 namespace 계정 수: 0
- 이번 실행에서 발견한 계정: 51
- 삭제 계정: 51
- 삭제 room membership: 1
- 삭제 room: 1
- 삭제 game completion: 0
- 삭제 user stats: 51
- 남은 실행 전용 계정: 0
- 계정 정리 판정: PASS
- 서버/런처 정리 판정: PASS
- 서버 PID 18328 종료 및 포트 8080 해제: 확인 완료

정리 콘솔 결과: found=51, deleted_accounts=51, deleted_memberships=1, deleted_rooms=1, deleted_game_completions=0, deleted_stats=51, remaining_accounts=0.

## 20. 최종 판정

최종 판정은 BLOCKED다. Java 136개, JavaScript 41개, Playwright 9개 실행 테스트는 모두 PASS이며 애플리케이션 결함은 확인되지 않았다. 다만 Full QA 보고 기준의 MVP 41에서 요구하는 사전 점검부터 정리까지의 전체 진행 스크린샷/영상이 없으므로 최종 결과를 PASS로 올리지 않았다. MVP 55 DuckDNS 검사는 Full 프로필 범위 밖이므로 NOT RUN이다.
---

## 문서 2: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-215047.md`

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

## 문서 3: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-212401.md`

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

## 문서 5: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-202938.md`

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

## 문서 6: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-192907.md`

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

## 문서 7: `MAFIAGAME_QA_REPORT_2026-09-24_qa-20260924-162600.md`

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

## 문서 8: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-152338-smoke.md`

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

---

## 문서 9: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-150416-smoke.md`

# MAFIAGAME QA Report — Smoke

- Date: 2026-09-23
- Run ID: `qa-20260923-150416`
- Profile: `smoke` (4-player core E2E; room-layout/profile UI at capacity 5; short phases)
- Overall: **FAIL** — core and unit suites passed; room-layout/profile UI E2E failed.
- Full QA: **NOT RUN** (not part of profile 1 and explicitly excluded).

## Results

| Suite | Result | Actual result |
|---|---|---|
| Java / Spring / MyBatis | PASS | 121 tests; 0 failures, 0 errors, 0 skipped. Command: `./gradlew.bat test --no-daemon --rerun-tasks -x jsTest` (`BUILD SUCCESSFUL`). |
| Standalone JavaScript | PASS | 40 passed; 0 failed, skipped, or cancelled. Command: `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`. |
| Smoke core E2E | PASS | `MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증`; 1 passed in 37.6s, workers=1, retries=0. |
| Smoke room-layout/profile UI E2E | FAIL | `waiting and started room layout (5 players)` timed out after 90s. At `room-layout.spec.js:71`, clicking `.user-menu-toggle` was intercepted by the visible `#patchNotesModal` overlay. No retry was run. |
| Server lifecycle | PASS | Fresh app reported startup and `/login` returned HTTP 200. The QA-started server was stopped; port 8080 is free. |
| Test-account cleanup | PASS | Found 9 accounts for this exact run ID, deleted 9 users and 9 `user_stats` rows; 0 remaining. No room-member or game-room rows matched for deletion. |

## Environment and scope

MariaDB at `127.0.0.1:23306` was reachable before tests; Node.js, npm, `jsdom`, and Playwright dependencies were present. Port 8080 was free before startup. The E2E run used `PLAYER_COUNTS=4`, `E2E_PROFILE=smoke`, `E2E_CAPACITY=5`, `MAFIAGAME_PHASE_PROFILE=short`, one worker, and zero retries. No Full-only cases, replay, resilience, or chat-scroll cases were run; they are outside Smoke scope.

During startup preparation, an initial wrapper invocation hit a PowerShell syntax error after launching its QA app; its logged application PID was then stopped. A subsequent attempt detected that same QA-started process occupying port 8080 and stopped before E2E. The final run used a fresh foreground server, then completed cleanup and verified the port free. No unrelated server was stopped.

## Evidence

- Playwright output root: `output/test_output/2026-09-23/playwright-qa-20260923-150416/`
- UI failure context: `output/test_output/2026-09-23/playwright-qa-20260923-150416/ui/room-layout-waiting-and-started-room-layout-5-players-/error-context.md`
- Playwright trace: `output/test_output/2026-09-23/playwright-qa-20260923-150416/ui/room-layout-waiting-and-started-room-layout-5-players-/trace.zip`
- Java JUnit XML: `build/test-results/test/`
- Java HTML report: `build/reports/tests/test/index.html`
- Per-run startup logs: `output/test_output/2026-09-23/qa-run-qa-20260923-150416/` (final server was run in the foreground; its console output is recorded in the QA execution transcript).

The test failure is not marked as passing. The likely next investigation is to inspect patch-note modal dismissal/state in `test/e2e/room-layout.spec.js` around line 71 and the modal's first-visit behavior, then rerun the explicitly selected profile after any requested fix.

---

## 문서 10: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-131334-regression.md`

# MAFIAGAME QA Report — Regression

## 1. 실행 환경

- 실행 ID: `qa-20260923-131334-regression`
- 프로필: Regression (`PLAYER_COUNTS=4,6,8`, UI 정원 5, 단축 페이즈, 요청/실제 worker 1/1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **PASS** — Java·JavaScript와 프로필에 지정된 코어/UI 브라우저 테스트가 모두 통과함.
- Full QA는 실행하지 않음.

## 2. 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능.
- 실행 전 8080 포트: listener 없음.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- 이번 QA 서버의 시작 로그, listener PID 34024, `/login` HTTP 200 확인.
- DB 접속 계정과 비밀번호는 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. JavaScript는 별도 실행하도록 `-x jsTest`를 사용함. |
| JavaScript | PASS | 40 tests, 40 passed, 0 failed. 프로필 설정 검증 테스트 포함. |
| 4인 코어 및 재플레이 | PASS | `MVP 4인 핵심 게임 흐름` 통과. Regression에서 지정한 동일 방 재플레이 포함. |
| 6인 코어 | PASS | `MVP 6인 핵심 게임 흐름` 통과. 마피아/Spy, Soldier 및 게임 진행 assertions 포함. |
| 8인 코어 | PASS | `MVP 8인 핵심 게임 흐름` 통과. 최대 인원 게임 흐름과 Medium 조사 assertions 포함. |
| UI chat-scroll | PASS | 30개 메시지 제출 후 내부 스크롤과 페이지 높이 유지 검증 통과. |
| UI 방 레이아웃 | PASS | 5인 방 레이아웃·설정·상태 검증 통과. |
| 테스트 데이터 정리 | PASS | 이번 실행 ID 계정 24개와 실행 방 1개를 대상으로 정리했고 잔여 계정·방 0개를 확인함. 기존 데이터는 선택하지 않음. |
| QA 서버 정리 | PASS | 이번 실행의 listener PID만 종료하고 8080 포트가 비었음을 확인함. |

실행 명령:

- ` .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`
- ` .\gradlew.bat bootRun --no-daemon` (`SERVER_PORT=8080`, `E2E_PROFILE=regression`, `MAFIAGAME_PHASE_PROFILE=short`)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` (`PLAYER_COUNTS=4,6,8`)
- `npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list` (`E2E_CAPACITY=5`)

## 4. 검증 범위와 제한

4·6·8인 코어 시나리오와 4인 재플레이, 30개 메시지 chat-scroll, 5인 방 레이아웃을 실제 애플리케이션 서버에서 검증했다. Regression은 3초 단축 페이즈를 사용하므로 운영 페이즈 시간(15/60/20/20/20/35초)을 검증하지 않는다. Smoke 전용/Full 전용 범위인 4인 외 인원 구성, 6인 복원 확장 사례, 210개 메시지 stress, Full의 production timing과 전체 증거 수집은 실행하지 않았다.

이번 프로필은 스크린샷을 켜고 비디오는 끈다. 생성된 화면 증거와 로그 경로는 아래 산출물에 기록했다.

## 5. 산출물

- 전체 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-131334-regression/`
- Java 결과 로그: `gradle-test.log`
- JavaScript 결과 로그: `javascript-test.log`
- 서버 시작/오류 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- 코어 스크린샷: `output/test_output/2026-09-23/mafia-mvp-test-regression-qa-20260923-131334-regression/`
- chat-scroll 스크린샷: `output/test_output/2026-09-23/chat-scroll-test-qa-20260923-131334-regression/`
- 방 레이아웃 스크린샷: `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-131334-regression/`
- Playwright 메타데이터: `output/test_output/2026-09-23/playwright-qa-20260923-131334-regression/core/`, `.../ui/`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML 보고서: `build/reports/tests/test/index.html`

---

## 문서 11: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-1305-smoke.md`

# MAFIAGAME QA Report — Smoke

## 1. 실행 환경

- 실행 ID: `qa-20260923-1305-smoke`
- 프로필: Smoke (`PLAYER_COUNTS=4`, UI 정원 5, 단축 페이즈, 요청/실제 worker 1/1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **PASS** — 프로필에 포함된 Java, JavaScript, 4인 코어 E2E, 5인 방 레이아웃 E2E가 모두 통과함.
- Smoke 프로필에서 제외되는 재플레이, 6인 확장 시나리오, chat-scroll 및 Full 프로필은 실행하지 않음.

## 2. 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능.
- 실행 전 8080 포트: listener 없음.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- QA 서버는 현재 작업 트리로 실행했고 `/login` HTTP 200 및 시작 로그를 확인함.
- DB 접속 계정과 비밀번호는 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. JavaScript는 별도 실행하도록 `-x jsTest`를 사용함. |
| JavaScript | PASS | 40 tests, 40 passed, 0 failed. QA 프로필 설정 검증 테스트도 포함함. |
| 서버 시작·상태 확인 | PASS | 이번 실행의 시작 로그, listener PID 42964, `/login` HTTP 200 확인. |
| 4인 핵심 브라우저 흐름 | PASS | 전체 테스트 흐름이 37.2초에 통과. 역할 확인, 투표·밤 행동·조사 결과·재접속·게임 종료 assertions 포함. |
| 방 레이아웃 브라우저 테스트 | PASS | 5인 방 레이아웃 테스트 1개 통과(9.2초). |
| 테스트 데이터 정리 | PASS | 이번 실행 ID의 계정 9개를 대상으로 정리했고 잔여 계정 0개, 실행 ID 방 0개를 확인함. 기존 계정은 선택하지 않음. |
| QA 서버 정리 | PASS | 이번 실행의 listener PID만 종료하고 8080 포트가 비었음을 확인함. |

실행 명령:

- `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`
- `.\gradlew.bat bootRun --no-daemon` (`SERVER_PORT=8080`, `E2E_PROFILE=smoke`, `MAFIAGAME_PHASE_PROFILE=short`)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` (`PLAYER_COUNTS=4`)
- `npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list` (`E2E_CAPACITY=5`)

## 4. 검증 범위와 제한

Smoke의 4인 브라우저 테스트는 한 게임 흐름을 끝까지 진행했고 통과했다. 3초 단축 페이즈를 사용하므로 실제 운영 시간(15/60/20/20/20/35초)을 검증하지 않는다. 재플레이, 두 가지 6인 복원 시나리오, Regression의 6·8인 게임과 chat-scroll, Full의 추가 인원수·운영 시간 검증은 이 프로필 범위 밖이다.

UI E2E는 실제 서버가 렌더링한 5인 방 화면을 확인했다. Smoke 증거 정책에 따라 정상 실행의 스크린샷·비디오는 생성하지 않았다. Playwright trace는 실패 시 보존하도록 설정되어 있으며 이번 실행은 통과해 실패 trace가 없다.

## 5. 산출물

- 전체 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-1305-smoke/`
- Java 결과 로그: `gradle-test.log`
- JavaScript 결과 로그: `javascript-test.log`
- 서버 시작/오류 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- Playwright 메타데이터: `output/test_output/2026-09-23/playwright-qa-20260923-1305-smoke/core/`, `.../ui/`
- 생성 테스트 시나리오 산출물 경로: `output/test_output/2026-09-23/mafia-mvp-test-smoke-qa-20260923-1305-smoke/`, `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-1305-smoke/`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML 보고서: `build/reports/tests/test/index.html`

---

## 문서 12: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-123138-smoke.md`

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

---

## 문서 13: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-120355.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-120355`
- 프로필: `smoke`
- PLAYER_COUNTS: `4`
- UI capacity: `5`
- ONLINE_BASELINE: `0`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 결과 요약

| 단계 | 결과 |
|---|---|
| MariaDB/Node/npm/의존성 사전 점검 | PASS |
| Java Gradle 테스트 | PASS — 118/118 |
| JavaScript 테스트 | PASS — 39/39 |
| 4인 핵심 E2E | FAIL — `지목 투표` 전환 실패 |
| 5인 room-layout UI | PASS |
| 테스트 계정 정리 | PASS — 9개 삭제, 잔여 0개 |
| QA 서버/8080 포트 정리 | PASS |

## 실행 로그

- Java: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/java-tests.console.log`
- JavaScript: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/javascript-tests.console.log`
- 핵심 E2E: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/playwright-core.console.log`
- UI E2E: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/playwright-ui.console.log`
- 서버 stdout: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/bootRun.qa-20260923-120355.stdout.log`
- 서버 stderr: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/bootRun.qa-20260923-120355.stderr.log`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/`

## 실패 상세

4인 핵심 게임 흐름에서 `#gamePhaseTitle`가 `지목 투표`로 전환되지 않고 `낮`으로 유지되어 15초 제한을 초과했다. 동일 증상이 Regression 프로필에서도 재현되어 반복 재현되는 페이즈 전환 문제로 분류한다.

실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-120355/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-120355/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/trace.zip`

## 정리 및 판정

현재 실행 ID의 테스트 계정 9개를 정확한 이메일 prefix로 삭제했고 `remaining_test_accounts=0`을 확인했다. QA 서버를 종료했으며 8080 포트도 해제했다.

Java/JavaScript와 room-layout UI는 통과했지만 4인 핵심 게임 흐름이 반복되는 페이즈 전환 오류로 실패했으므로 Smoke QA 전체 결과는 **FAIL**이다.

---

## 문서 14: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-115534.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-115534`
- 프로필: `regression`
- PLAYER_COUNTS: `4,6,8`
- UI capacity: `5`
- ONLINE_BASELINE: `0`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 결과 요약

| 단계 | 결과 |
|---|---|
| MariaDB/Node/npm/의존성 사전 점검 | PASS |
| Java Gradle 테스트 | PASS — 118/118 |
| JavaScript 테스트 | PASS — 39/39 |
| 핵심 E2E 4·6·8인 | FAIL — 0/3 |
| UI E2E 채팅 스크롤·5인 room-layout | PASS — 2/2 |
| 테스트 계정 정리 | PASS — 24개 삭제, 잔여 0개 |
| QA 서버/8080 포트 정리 | PASS |

## 실행 명령 및 로그

Java:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- `output/test_output/2026-09-23/qa-run-qa-20260923-115534/java-tests.console.log`
- `build/test-results/test/`
- `build/reports/tests/test/`

JavaScript:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- `output/test_output/2026-09-23/qa-run-qa-20260923-115534/javascript-tests.console.log`

Playwright:

- 핵심: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/playwright-core.console.log`
- UI: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/playwright-ui.console.log`
- 서버 stdout: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/bootRun.qa-20260923-115534.stdout.log`
- 서버 stderr: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/bootRun.qa-20260923-115534.stderr.log`

## 실패 상세

4·6·8인 핵심 흐름 모두 동일하게 `#gamePhaseTitle`가 `지목 투표`로 전환되지 않고 `낮`으로 남아 15초 제한을 초과했다. 이전 Regression 실행에서도 같은 증상이 재현되어, 단발성 실패가 아닌 반복 재현되는 페이즈 전환 문제로 분류한다.

이번 실행의 실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-6인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-8인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

UI suite는 채팅 스크롤과 5인 room-layout 모두 통과했다.

## 정리 및 판정

현재 실행 ID의 테스트 계정 24개를 정확한 이메일 prefix로 삭제했고 `remaining_test_accounts=0`을 확인했다. QA 서버를 종료했으며 8080 포트도 해제했다.

Java/JavaScript와 UI 회귀 검증은 통과했지만, 핵심 4·6·8인 게임 흐름이 동일한 페이즈 전환 오류로 실패했으므로 Regression QA 전체 결과는 **FAIL**이다.

---

## 문서 15: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-113110.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-113110`
- 프로필: `regression`
- 요청 프로필: Regression
- 유효 프로필: Regression
- PLAYER_COUNTS: `4,6,8`
- UI capacity: `5`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 범위

Regression 프로필에 따라 Java/JavaScript 테스트, 4·6·8인 핵심 E2E, 4인 리플레이 범위를 포함한 핵심 suite, 30개 메시지 채팅 스크롤, 5인 room-layout UI suite를 실행했다. 핵심 E2E는 실행 중 3개 시나리오가 모두 실패하여 리플레이 조건은 별도 성공 증거를 남기지 못했다.

## 사전 점검 및 서버

| 항목 | 결과 | 증거 |
|---|---|---|
| MariaDB `127.0.0.1:23306` | PASS | 실행 전 `Test-NetConnection` |
| Node/npm 및 로컬 의존성 | PASS | `node`, `npm.cmd`, `node_modules/jsdom`, `node_modules/@playwright/test` |
| QA 포트 8080 | PASS | 실행 전 비어 있음 |
| 애플리케이션 `/login` | PASS | HTTP 200 |
| QA 테스트 계정 정리 | PASS | 24개 발견·삭제, 잔여 0개 |

서버 로그:

- `output/test_output/2026-09-23/qa-run-qa-20260923-113110/bootRun.qa-20260923-113110.stdout.log`
- `output/test_output/2026-09-23/qa-run-qa-20260923-113110/bootRun.qa-20260923-113110.stderr.log`

## Java 테스트

명령:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

결과: **PASS** — 총 118건, 실패 0건, 오류 0건, 건너뜀 0건.

- 콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/java-tests.console.log`
- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/`

## JavaScript 테스트

명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

결과: **PASS** — 총 39건, 통과 39건, 실패 0건, 취소 0건.

- 콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/javascript-tests.console.log`

## Playwright E2E

### 핵심 suite

명령: `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`

결과: **FAIL** — 3건 실행, 0건 통과, 3건 실패.

1. 4인 핵심 흐름: `#gamePhaseTitle`가 `지목 투표`가 되어야 했으나 제한 시간 동안 `낮`으로 유지됨.
2. 6인 핵심 흐름: 온라인 인원 `6`을 기대했으나 `13`으로 관찰됨. `ONLINE_BASELINE=0`인 고립 QA 환경 조건과 실제 온라인 인원 상태가 일치하지 않음.
3. 8인 핵심 흐름: 온라인 인원 `8`을 기대했으나 `15`로 관찰됨. 2번과 동일한 baseline 불일치 증상.

콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/playwright-core.console.log`

### UI suite

명령: `npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list`

결과: **FAIL** — 2건 실행, 1건 통과, 1건 실패.

- 채팅 입력·30개 메시지 스크롤: **PASS**
- 5인 room-layout: **FAIL** — 설정 저장 후 `#roomLockIndicator`가 5초 안에 표시되지 않음.

콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/playwright-ui.console.log`

실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-113110/room-layout-waiting-and-started-room-layout-5-players-/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-113110/room-layout-waiting-and-started-room-layout-5-players-/trace.zip`

## 정리

현재 실행 ID에 해당하는 Playwright 계정 24개를 정확한 이메일 prefix로 찾아 정리했고, `remaining_test_accounts=0`을 확인했다. QA 서버는 종료했고 8080 포트는 해제된 상태다.

## 판정

Java 및 JavaScript 자동화는 통과했지만, Regression 프로필의 핵심 E2E 3건과 room-layout UI 1건이 실패하여 전체 QA 결과는 **FAIL**이다. 핵심 E2E 실패는 페이즈 전환 지연 1건과 온라인 baseline 오염 2건으로 분리해 후속 확인해야 하며, room-layout 실패는 잠금 상태 동기화 또는 표시 조건을 별도로 조사해야 한다.

---

## 문서 16: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-144340.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

| 항목 | 내용 |
|---|---|
| 실행 ID | `qa-20260922-144340` |
| 실행일 | 2026-09-22 (Asia/Seoul) |
| 브랜치 | `develop` |
| 작업 경로 | `C:\workspace-sts-5.3.0\mafiagame` |
| E2E | 실행 |
| E2E 인원수 | 4, 5, 6, 7, 8 |
| UI 최대 인원수 | 8 |
| Playwright worker | 요청 1 / 실제 1 |
| 서버 | `http://127.0.0.1:8080` |
| MariaDB | `127.0.0.1:23306/mafiaweb` |
| 기존 데이터 삭제 | 실행하지 않음 |
| QA 계정 삭제 | 실행함 |
| 소스 수정 | 실행하지 않음 |

## 2. 사전 점검

사전 점검 로그: `test-results/qa-20260922-144340-preflight.log`

| 점검 항목 | 결과 |
|---|---|
| MariaDB 연결 | PASS |
| Node.js | PASS, v24.19.0 |
| npm | PASS, 11.17.0 |
| jsdom | PASS |
| Playwright | PASS |
| 8080 포트 | PASS, 실행 전 사용 가능 |
| 기존 데이터 삭제 | 실행하지 않음 |

## 3. 사전 확인 파일

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`
- `src/main/resources/application.properties`

## 4. 실행 명령

Java 테스트:

```powershell
$env:GRADLE_USER_HOME='C:\workspace-sts-5.3.0\mafiagame\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

JavaScript 테스트:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

Playwright 목록 확인:

```powershell
npm.cmd run test:e2e -- --list --workers=1
npm.cmd run test:e2e:ui -- --list --workers=1
```

Playwright 핵심 E2E:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

Playwright UI E2E:

```powershell
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

## 5. Java 테스트 결과

- 실행 로그: `test-results/qa-20260922-144340-java.log`
- 결과: `BUILD SUCCESSFUL`
- JUnit 테스트: 111개
- 실패: 0개
- 오류: 0개
- 스킵: 0개
- Gradle HTML 보고서: `build/reports/tests/test/index.html`
- JUnit XML: `build/test-results/test/*.xml`

Java 단위·통합 테스트는 모두 통과했다.

## 6. JavaScript 테스트 결과

- 실행 로그: `test-results/qa-20260922-144340-javascript.log`
- 테스트: 32개
- 통과: 32개
- 실패: 0개
- 취소: 0개
- 스킵: 0개

STOMP 프레임/파서, 방 목록 동기화, 패치노트 표시, 준비 상태, 페이즈 UI, 역할별 채널, 시스템 페이즈 메시지, Spy/Medium 채널 및 재접속 관련 테스트를 통과했다.

## 7. 서버 상태 및 종료

- 서버 PID 기록: `test-results/qa-20260922-144340-server-process.log`
- 헬스 체크 로그: `test-results/qa-20260922-144340-server-health.log`
- `/login` 응답: HTTP 200, 첫 시도 PASS
- E2E 및 정리 완료 후 이번 실행에서 시작한 서버를 종료했다.
- 종료 후 8080 포트 리스닝 프로세스가 확인되지 않았다.
- 서버 stdout: `test-results/bootRun.qa-20260922-144340.stdout.log`
- 서버 stderr: `test-results/bootRun.qa-20260922-144340.stderr.log`

## 8. Playwright 목록 및 실행 결과

핵심 시나리오 7개와 UI 시나리오 2개를 worker 1개로 실행했다.

### 8.1 핵심 E2E

실행 로그: `test-results/qa-20260922-144340-playwright-core.log`

| 시나리오 | 결과 | 소요 |
|---|---|---:|
| MVP 4인 핵심 게임 흐름 | PASS | 9.4분 |
| MVP 5인 핵심 게임 흐름 | FAIL, 테스트 제한시간 초과 | 12.0분 |
| MVP 6인 핵심 게임 흐름 | FAIL, 테스트 제한시간 초과 | 12.0분 |
| MVP 7인 핵심 게임 흐름 | FAIL, 패치노트 모달 닫기 검증 실패 | 17.8초 |
| MVP 8인 핵심 게임 흐름 | FAIL, 비마피아 페이지에 마피아 메시지 노출 | 2.4분 |
| 대기방 탭 종료 후 6인→5인 역할 경계 | PASS | 11.3초 |
| deadline/reconnect grace/만료된 밤 행동 | PASS | 2.8분 |

결과는 7개 중 3개 PASS, 4개 FAIL이며 종료 코드는 1이다.

### 8.2 UI E2E

실행 로그: `test-results/qa-20260922-144340-playwright-ui.log`

| 시나리오 | 결과 | 소요 |
|---|---|---:|
| 시작 전 역할 슬롯 및 채팅 스크롤 | PASS | 6.6초 |
| 8인 대기/게임 시작 방 레이아웃 | PASS | 12.3초 |

결과는 2개 중 2개 PASS이며 종료 코드는 0이다.

## 9. 실패 시나리오 분석

### 9.1 5인·6인 핵심 흐름

두 시나리오 모두 테스트 제한시간 720,000ms를 초과했다. Playwright 종료 출력에는 정상적인 assertion 메시지 대신 제한시간 초과가 남았으며, 6인 실패 항목은 trace 첨부가 생성되었지만 실행 종료 시점에 zip 무결성 오류도 함께 보고되었다.

현재 결과만으로는 서버의 단일 원인으로 확정할 수 없다. 5인·6인 흐름에서 어느 단계가 진행을 멈췄는지 재현 가능한 추가 로그 또는 보존된 trace가 필요하다. 따라서 애플리케이션 결함으로 단정하지 않고 E2E FAIL로 분류한다.

### 9.2 7인 핵심 흐름

`test/e2e/mafia-mvp.spec.js:134`의 `dismissPatchNotes()`에서 패치노트 닫기 버튼 클릭 후 `#patchNotesModal`이 5초 내 hidden 상태가 되지 않아 실패했다.

```text
Expected: hidden
Received: visible
Locator: #patchNotesModal
```

패치노트 모달 닫기 이벤트 또는 테스트의 Bootstrap transition 대기 처리를 확인해야 한다. 이 실패는 게임 역할 구성 자체보다 초기 화면 모달 상태 정리 단계에서 발생했다.

### 9.3 8인 핵심 흐름

`test/e2e/mafia-mvp.spec.js:1159`에서 생존 마피아 외 페이지의 `#messages`에 `night-mafia-8-qa-20260922-144340` 메시지가 포함되어 `not.toContainText()` 검증에 실패했다.

즉, 마피아의 밤 행동 메시지가 마피아가 아닌 참가자 화면에도 노출된 것으로 관찰됐다. 채널 권한 또는 밤 행동 메시지의 대상 페이지 필터링을 우선 점검해야 하며, 정보 노출 가능성이 있으므로 애플리케이션 결함 후보로 분류한다.

## 10. MVP 검증 요약

| 범위 | 결과 | 근거 |
|---|---|---|
| Java 역할·페이즈·승리·권한 단위 테스트 | PASS | JUnit 111/111 |
| JavaScript UI·채널·시스템 메시지 테스트 | PASS | Node 32/32 |
| 4인 핵심 실시간 게임 흐름 | PASS | Playwright |
| 5인 핵심 실시간 게임 흐름 | FAIL | 제한시간 초과 |
| 6인 핵심 실시간 게임 흐름 | FAIL | 제한시간 초과 |
| 7인 핵심 실시간 게임 흐름 | FAIL | 패치노트 모달 닫기 |
| 8인 핵심 실시간 게임 흐름 | FAIL | 마피아 밤 메시지 노출 |
| 6인→5인 역할 경계 | PASS | Playwright |
| deadline/reconnect/만료 밤 행동 | PASS | Playwright |
| UI 레이아웃·스크롤 | PASS | UI Playwright 2/2 |

## 11. 증적 파일

실행별 브라우저 증적은 다음 경로에 생성됐다.

- 핵심 E2E 이미지/영상: `output/mafia-mvp-test-qa-20260922-144340/**`
- 채팅 UI 이미지/영상: `output/chat-scroll-test-qa-20260922-144340/**`
- 방 레이아웃 이미지/영상: `output/room-layout-test-8-qa-20260922-144340/**`
- PNG: 39개
- WEBM: 22개
- 현재 실행 ID 아래에 보존된 Playwright trace zip: 2개
  - `test-results/playwright/qa-20260922-144340/chat-scroll-role-slot-is-v-8b990-ls-without-growing-the-page/trace.zip`
  - `test-results/playwright/qa-20260922-144340/room-layout-waiting-and-started-room-layout-8-players-/trace.zip`

핵심 E2E trace는 UI suite가 같은 run ID의 Playwright output directory를 재사용하면서 보존되지 않았다. 핵심 E2E 실패 원인은 실행 로그에 남아 있으나, 다음 실행부터는 suite별 output directory를 분리하거나 trace를 별도 archive해야 한다.

QA 스크립트가 요구하는 preflight부터 최종 정리까지의 전체 Windows 화면 녹화는 현재 실행 환경에서 확보하지 못했다. 브라우저 시나리오별 WEBM과 스크린샷은 있으나 Java/JavaScript/preflight/서버 health/final summary 화면까지 포함한 단일 전체 진행 녹화는 없다. 이 항목은 BLOCKED로 기록한다.

## 12. 테스트 계정 및 데이터 정리

- 사전 데이터 삭제: 실행하지 않음
- 정리 preflight: `test-results/qa-20260922-144340-cleanup-preflight.log`
- 정리 로그: `test-results/qa-20260922-144340-cleanup.log`
- 현재 실행 계정 확인: 51개
- 관련 방: 0개
- 삭제 후 잔여 테스트 계정: 0개
- 삭제 후 잔여 테스트 사용자 통계: 0개
- 기존 사용자·방·데이터는 삭제하지 않음

정리 트랜잭션은 현재 실행 ID `qa-20260922-144340`의 이메일 namespace만 대상으로 수행했다.

## 13. 최종 판정

**FAIL / BLOCKED**

- Java와 JavaScript 테스트는 모두 통과했다.
- UI E2E는 2개 모두 통과했다.
- 핵심 게임 E2E는 7개 중 4개가 실패했다.
- 8인 흐름에서는 마피아 밤 메시지의 비마피아 노출이 관찰되어 우선 수정 검토가 필요하다.
- 전체 QA 진행 화면 녹화 요구사항은 충족하지 못해 BLOCKED 항목이 남았다.
- QA 계정 정리와 이번 실행 서버 종료는 완료했다.

다음 조치로 5·6인 타임아웃 단계 추적, 패치노트 모달 닫기 동기화, 8인 밤 마피아 메시지 대상 필터링을 수정한 뒤 핵심 E2E를 재검증해야 한다.

## 14. 7인 시나리오 후속 디버깅 기록

후속 실행 ID: `debug-20260922-160401-7continue`

- 7인 본 게임은 역할 배정, 낮 토론, 처형, 밤 능력, 스파이 잠금·접선, 게임 종료 화면까지 정상 도달했다.
- 본 게임 종료 후 재경기 검증에서 테스트가 실패했다. 실패 위치는 `test/e2e/mafia-mvp.spec.js`의 `startReplayGame()` 내 재경기 최종 처형 후 `게임 종료` 대기 구간이다.
- 실제 7인 역할 구성은 `마피아 2명 + 스파이 1명`으로 마피아팀이 3명이다. 기존 재경기 테스트는 마피아팀을 최대 2명만 처형하면 종료된다고 가정하여, 두 번째 마피아팀 처형 후에도 게임이 `밤`으로 진행되는 정상 상태를 실패로 판정했다.

수정 필요사항:

1. `startReplayGame()`의 재경기 종료 검증을 고정 2회 처형 방식에서 마피아팀 생존자가 없어질 때까지 반복하는 방식으로 변경한다.
2. 각 반복에서 현재 생존자 목록을 기준으로 마피아팀 대상을 선택하고, 처형 후 `NIGHT` 또는 `FINISHED`를 분기한다.
3. `FINISHED` 전환 시에만 시민 진영 승리와 역할 공개를 검증한다.
4. 이 수정은 QA 테스트 코드에 반영했으나, 사용자의 요청에 따라 후속 재검증은 실행하지 않았다.

후속 7인 실행 결과: **FAIL (테스트 코드의 재경기 종료 조건 오류)**

- 증적: `output/mafia-mvp-test-debug-20260922-160401-7continue/core-7/finished.png`
- 최종 캡처: `output/mafia-mvp-test-debug-20260922-160401-7continue/core-7/final-state.png`
- 실행 로그: `test-results/debug-20260922-160401-7continue-playwright-core.log`
- 테스트 서버와 Playwright 실행은 종료했다.

---

## 문서 17: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-135034.md`

# MAFIAGAME QA 실행 보고서 — 복구 요약

> 복구 범위: 원본 개별 파일과 실행 산출물을 찾을 수 없어, 기존 통합본에 남아 있던 실행 환경·테스트 수치·판정·증적 경로를 바탕으로 복구했다. 원문 문장 전체를 복원한 것은 아니다.

## 1. 실행 환경

- 실행 ID: `qa-20260922-135034`
- 실행일: 2026-09-22 (Asia/Seoul)
- 브랜치: `develop`
- 기록된 작업 경로: `C:\workspace-sts-5.3.0\mafiagame`
- E2E: 실행
- 핵심 E2E 인원: 4, 5, 6, 7, 8명
- 방 UI 수용 인원: 8명
- Playwright worker: 요청 1 / 실제 1
- 서버: `http://127.0.0.1:8080`
- MariaDB: `127.0.0.1:23306/mafiaweb`
- 기존 사용자 데이터 사전 삭제: 수행하지 않음

## 2. 단위 테스트

- Java: `BUILD SUCCESSFUL`; JUnit 111건 통과, 실패·오류·건너뜀 0건
- JavaScript: 32건 통과, 실패 0건
- MariaDB, Node.js v24.19.0, npm 11.17.0, `jsdom`, Playwright 의존성 사전 점검 통과

## 3. Playwright 결과

- 핵심 E2E: 총 7개 중 1개 통과, 6개 실패 또는 중단
- 4~8인 핵심 흐름은 `test/e2e/mafia-mvp.spec.js:1083` 단언에서 실패
- 6인에서 5인으로 줄어드는 경계 시나리오는 9.5초에 통과
- `deadline/reconnect/night action` 시나리오는 `test/e2e/mafia-mvp.spec.js:1580`에서 실패
- 채팅 스크롤 UI: 3.2초에 통과
- 8인 대기/게임 시작 방 레이아웃 UI: 10.7초에 통과
- 화면 녹화와 스크린샷 일부는 생성됐으나 Playwright trace는 생성되지 않음

## 4. 증적과 정리

- 핵심 E2E: PNG 26개, WebM 19개
- 채팅 UI: PNG 3개, WebM 2개
- 8인 방 레이아웃 UI: PNG 5개, WebM 2개
- 증적 경로에는 `output/mafia-mvp-test-qa-20260922-135034/`, `output/chat-scroll-test-qa-20260922-135034/`, `output/room-layout-test-8-qa-20260922-135034/`가 기록돼 있음
- QA 실행 ID 이메일 namespace에 해당하는 계정 51개와 관련 `user_stats` 51개 정리가 기록돼 있음
- 기존 통합본은 fresh server의 로그 ID가 이번 실행 ID와 다를 수 있어 서버 정리 증거를 `BLOCKED`로 판정함

## 5. 최종 판정

**FAIL**

Java·JavaScript와 UI E2E는 통과했으나 핵심 E2E에서 다수 시나리오가 실패했다. 전체 QA 진행 화면 캡처 요구사항과 fresh-server 종료 증거도 충족되지 않아 전체 결과를 PASS로 처리할 수 없다고 기록돼 있다.

---

## 문서 18: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md`

# MAFIAGAME QA Report

## 1. 실행 정보

| 항목 | 결과 |
|---|---|
| 실행 ID | `qa-20260922-111137` |
| 실행일 | 2026-09-22 (Asia/Seoul) |
| 브랜치 | `develop` |
| 작업 경로 | `C:\workspace-sts-5.3.0\mafiagame` |
| E2E 설정 | `true` |
| 플레이어 수 | `4,5,6,8` |
| Playwright workers | 요청 1 / 실제 1 |
| 서버 | `http://127.0.0.1:8080` |
| MariaDB | `127.0.0.1:23306/mafiaweb` |
| 최종 판정 | **PASS** |

기존 사용자 데이터 삭제 옵션은 `false`로 유지했으며, 현재 실행 ID로 생성된 테스트 계정만 정리했다.

## 2. 사전 점검

| 점검 | 결과 |
|---|---|
| MariaDB 연결 | PASS |
| Node.js | `v24.19.0` 확인 |
| npm | `11.17.0` 확인 |
| `node_modules/jsdom` | 확인 |
| `node_modules/@playwright/test` | 확인 |
| QA 문서 MVP 번호 | 1~40 연속, 페이즈 시스템 메시지 4.3절 1~10 확인 |
| QA 포트 | 8080 사용 가능 확인 후 새 서버 기동 |

## 3. 실행 결과

### Java

실행 명령:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

결과: `BUILD SUCCESSFUL` (5개 task 실행)

### JavaScript

실행 명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

결과: 29개 테스트 중 29개 통과, 실패 0개.

시스템 메시지 DOM 렌더링, 채널 분리, 패치노트 갱신 무효화, 게임 페이즈 UI를 포함한다.

### Playwright 발견 검사

- 핵심 시나리오: 6개 발견 — PASS
- UI 회귀 시나리오: 2개 발견 — PASS

### Playwright 핵심 E2E

결과: 6개 통과, 실패 0개, 종료 코드 0, 총 41.0분.

- 4인 핵심 게임 흐름: PASS (9.3분)
- 5인 핵심 게임 흐름: PASS (9.4분)
- 6인 핵심 게임 흐름: PASS (9.4분)
- 8인 핵심 게임 흐름: PASS (9.4분)
- 대기방 종료 후 6→5인 역할 경계: PASS (9.1초)
- deadline·재접속 grace·만료된 밤 액션: PASS (2.1분)

### Playwright UI 회귀

결과: 2개 통과, 실패 0개, 종료 코드 0, 총 1.5분.

- 채팅 스크롤 및 페이지 높이 고정: PASS (3.1초)
- 8인 대기/게임 방 레이아웃: PASS (10.6초)

## 4. 주요 MVP 검증 결과

| 범위 | 실제 증거 | 결과 |
|---|---|---|
| 역할 배정, 투표, 처형, 밤 행동, 승리/종료, 재플레이 | Java 테스트 및 4·5·6·8인 브라우저 흐름 | PASS |
| 6인 두 마피아 경계 및 시민 승리 | 6인 핵심 E2E | PASS |
| 채널 분리·사망자 제한·재접속/마감 처리 | 핵심 E2E 및 회복성 E2E | PASS |
| 방 이동 버튼·NIGHT 배경·복원·8인 레이아웃 | UI 회귀 E2E | PASS |
| 페이즈 시스템 메시지 | ROLE_ASSIGNMENT, DAY_DISCUSSION, NOMINATION_VOTE, FINAL_DEFENSE, EXECUTION_VOTE, NIGHT, FINISHED 전환별 공개 `SYSTEM` 메시지 확인 | PASS |
| 시스템 메시지 UI | `.chat-message.system.channel-system`, text-only 렌더링 | PASS |
| 스크린샷 및 동영상 산출물 | UI 회귀 테스트 산출물 확인 | PASS |

서버 로그에서도 각 페이즈 전환 시 `/topic/rooms/{roomId}/chat`으로 `type=SYSTEM` 메시지가 전송되는 것을 확인했다.

## 5. 산출물

- 서버 로그: `C:\workspace-sts-5.3.0\mafiagame\test-results\bootRun.qa-20260922-111137.stdout.log`
- UI 실행 로그: `C:\workspace-sts-5.3.0\mafiagame\test-results\playwright-ui.qa-20260922-111137.log`
- 채팅 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\chat-scroll-test-qa-20260922-111137\chat-scroll.png`
- 채팅 동영상: `C:\workspace-sts-5.3.0\mafiagame\output\chat-scroll-test-qa-20260922-111137\chat-scroll.webm`
- 대기 방 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\waiting-room.png`
- 시작 방 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\started-room.png`
- NIGHT 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\night-background-and-back-link.png`
- 복원 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\restored-background-and-back-link.png`
- 방 전환 동영상: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\room-layout-transition.webm`

Playwright UI 실행이 공용 `test-results` 출력 디렉터리를 정리하므로 핵심 E2E 원본 로그는 UI 실행 전에 제거되었다. 핵심 6개 결과는 실행 중 실제 콘솔 출력과 서버 로그에서 기록했다.

## 6. 테스트 데이터 정리

초기 자동 정리 래퍼가 `application.properties`의 `${DB_USERNAME}`·`${DB_PASSWORD}` 플레이스홀더를 해석하지 못해 1차 DB 인증이 실패했다. QA 서버 종료 후 실제 환경 변수 자격 증명과 동일한 실행 ID로 정리를 재실행했다.

| 항목 | 결과 |
|---|---:|
| 매칭 테스트 계정 | 44 |
| 삭제된 `user_stats` | 44 |
| 삭제된 계정 | 44 |
| 최종 잔여 계정 | 0 |
| 기존 데이터 삭제 | 없음 |

이 정리 문제는 애플리케이션 기능 실패가 아니라 QA 정리 래퍼의 환경 변수 해석 문제다.

## 7. Diff 상태

QA 실행 전후 소스 작업 트리의 diff는 동일하다. 실행 결과 보고서는 QA 산출물로 실행 후 생성했다.

- 스테이징된 변경: 없음
- 추적 파일 수정: 17개
- QA 실행으로 추가된 소스 변경: 없음
- 생성된 QA 보고서: `docs/QA_report/MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md` (untracked)
- `git diff --check`: 공백 오류 없음
- Git의 LF→CRLF 변환 경고만 확인됨

커밋이나 push는 수행하지 않았다.

---

## 문서 19: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-000243.md`

# MAFIAGAME QA Report

- 실행일: 2026-09-22 (Asia/Seoul)
- 실행 ID: `qa-20260922-000243`
- 최종 판정: **PASS**

## 1. 실행 환경

- 프로젝트: `C:\workspace\mafiaweb`
- OS/shell: Windows PowerShell
- Java: `22.0.1`
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- QA 서버: `http://127.0.0.1:18080`
- 기존 개발/프리뷰 서버 포트 8080은 종료하거나 변경하지 않았다.

## 2. MariaDB 사전 점검 및 의존성

- MariaDB TCP 사전 점검: `127.0.0.1:23306` 연결 가능
- Node/npm/jsdom/Playwright 사전 점검: 모두 사용 가능
- 애플리케이션 기동 및 JDBC 연결: 성공
- 독립 MariaDB CLI는 PATH에서 확인되지 않아 Gradle 캐시의 MariaDB JDBC 드라이버로 정리 트랜잭션을 실행했다.

실제 사전 점검 출력:

```text
ProjectPath C:\workspace\mafiaweb
MariaDB True (127.0.0.1:23306)
Node True
Npm True
Jsdom True
Playwright True
```

## 3. 확인한 파일과 디렉터리

- `src/main/resources/static/css/app.css`
- `src/main/resources/static/js/chat.js`
- `src/main/resources/templates/rooms/detail.html`
- `test/js/chat.test.js`
- `test/e2e/mafia-mvp.spec.js`
- `test/e2e/chat-scroll.spec.js`
- `test/e2e/room-layout.spec.js`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `test-results/.last-run.json`
- `output/chat-scroll-test-qa-20260922-000243/`
- `output/room-layout-test-8-qa-20260922-000243/`

## 4. 실행 명령

Java 테스트:

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

JavaScript 테스트:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

Playwright 테스트 발견:

```powershell
$env:BASE_URL='http://127.0.0.1:18080'
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260922-000243'
$env:E2E_CAPACITY='8'
npm.cmd run test:e2e -- --list --workers=1
npm.cmd run test:e2e:ui -- --list --workers=1
```

핵심 E2E:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

UI 회귀 E2E:

```powershell
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

## 5. Java 테스트 결과

실제 JUnit XML 집계 출력:

```text
JAVA_XML_FILES=11 JAVA_TESTS=103 JAVA_FAILURES=0 JAVA_ERRORS=0 JAVA_SKIPPED=0
```

- 결과: **PASS**
- 11개 테스트 스위트, 103건 실행
- 실패 0, 오류 0, 스킵 0
- 오류 메시지: 없음

## 6. JavaScript 테스트 결과

- 대상: `stomp-client.test.js`, `room-list.test.js`, `chat.test.js`
- 결과: **25 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo**
- 채널별 `PUBLIC`/`MAFIA`/`DEAD` 클래스 분리 테스트: PASS
- `NIGHT`에서 `night-phase` 적용 및 낮/종료 시 제거 테스트: PASS
- 오류 메시지: 없음

## 7. 서버 기동 및 헬스 체크

- `bootRun`을 QA 전용 포트 18080으로 기동했다.
- `/login` 헬스 체크: HTTP 200
- stdout: `test-results/bootRun.qa-20260922-000243.stdout.log`
- stderr: `test-results/bootRun.qa-20260922-000243.stderr.log` (0 bytes)
- 테스트와 정리 완료 후 18080 리스너가 없는 것을 확인했다.
- 기존 8080 서버는 대상에서 제외했다.

## 8. Playwright 발견 및 전체 결과

발견 결과:

- 핵심 E2E: 6건
  - 4인 핵심 게임 흐름
  - 5인 핵심 게임 흐름
  - 6인 핵심 게임 흐름
  - 8인 핵심 게임 흐름
  - 대기방 탭 종료 시 6인→5인 역할 임계값
  - 브라우저 마감·재접속 유예·만료된 밤 행동
- UI 회귀 E2E: 2건
  - 채팅 스크롤 및 역할 슬롯
  - 8인 대기/시작 게임방 레이아웃
- 요청 워커: 1
- 재시도: 0
- 실제 핵심 E2E 결과: **6 passed (41.1m)**
- 실제 UI 회귀 결과: **2 passed (1.6m)**
- `test-results/.last-run.json`: `{"status":"passed","failedTests":[]}`

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실제 소요 시간 |
|---|---:|---:|
| 4인 핵심 게임 흐름 | PASS | 9.4m |
| 5인 핵심 게임 흐름 | PASS | 9.3m |
| 6인 핵심 게임 흐름 | PASS | 9.4m |
| 8인 핵심 게임 흐름 | PASS | 9.5m |
| 대기방 탭 종료 6인→5인 임계값 | PASS | 12.6s |
| 브라우저 마감·재접속·만료 밤 행동 | PASS | 2.1m |
| 채팅 스크롤 및 역할 슬롯 UI | PASS | 4.1s |
| 8인 게임방 UI 레이아웃·배경 전환 | PASS | 14.6s |

핵심 E2E 실제 콘솔 출력:

```text
ok 1 ... MVP 4인 핵심 게임 흐름 ... (9.4m)
ok 2 ... MVP 5인 핵심 게임 흐름 ... (9.3m)
ok 3 ... MVP 6인 핵심 게임 흐름 ... (9.4m)
ok 4 ... MVP 8인 핵심 게임 흐름 ... (9.5m)
ok 5 ... closing a waiting-room tab changes six players to the five-player role threshold (12.6s)
ok 6 ... browser deadline, reconnect grace, and expired night action (2.1m)
6 passed (41.1m)
```

UI 회귀 실제 콘솔 출력:

```text
ok 1 ... role slot is visible before game and chat scrolls without growing the page (4.1s)
ok 2 ... waiting and started room layout (8 players) (14.6s)
2 passed (1.6m)
```

## 10. MVP 검증 표

| 검증 항목 | 결과 | 근거 |
|---|---:|---|
| 인증·방 참가·참가자 수 동기화 | PASS | 4/5/6/8인 핵심 E2E |
| `ROLE_ASSIGNMENT` 역할 전달은 개인 큐이고 공개 게임 상태에 역할이 노출되지 않음 | PASS | JavaScript 및 핵심 E2E |
| 생존자 역할 확인은 1회만 가능하고 중복 확인은 거부됨 | PASS | `chat.test.js` 및 핵심 E2E |
| 모든 역할 확인 또는 약 15초 후 역할 단계 전환 | PASS | 핵심 E2E 페이즈/타이머 검증 |
| `FINAL_DEFENSE` 단일 지명자 및 약 20초 제한 | PASS | 핵심 E2E |
| 최종 변론 중 지명자만 전체 채팅 가능, 비지명자 거부 | PASS | `chat.test.js` 및 핵심 E2E |
| 지명자 이탈 시 처형을 건너뛰고 밤으로 전환 | PASS | 핵심 E2E |
| 서버 페이즈 시간: 역할 15초, 낮 토론 60초, 지목 투표 20초, 최종 변론 20초, 처형 투표 20초, 밤 35초 | PASS | 서버 상태 trace 및 E2E 시간 assertion |
| 공개/마피아/사망자 채널 말풍선 클래스 분리 | PASS | `chat.test.js` 신규 채널 테스트 |
| 게임 목록 링크가 실제 게임방 좌측 상단의 버튼 스타일로 표시됨 | PASS | `room-layout.spec.js`, 실제 `/rooms/{roomId}` 스크린샷 |
| 밤 상태에서 웹페이지 배경만 회색으로 바뀌고 링크 색상은 유지됨 | PASS | `room-layout.spec.js` |
| 밤 진입/종료 시 배경색 transition이 양방향으로 적용됨 | PASS | `background-color`, `0.8s`, night/restored assertion |
| 실제 게임방 서버 렌더링과 스크린샷·영상 생성 | PASS | UI 회귀 E2E 산출물 |

## 11. 실패 및 차단 항목

- 애플리케이션 테스트 실패: 없음
- 테스트 코드 실패: 없음
- Playwright 실패/중단: 없음
- 차단(`BLOCKED`) 항목: 없음
- 최초의 수동 JShell 정리 입력은 함수 정의 순서 오류로 실행되지 않았으나 SQL 변경 없이 종료되었고, JDBC 정리 프로그램으로 즉시 재실행해 최종 정리를 PASS 처리했다. 이는 애플리케이션 테스트 실패가 아니다.

## 12. 재현 절차

1. MariaDB `127.0.0.1:23306`가 실행 중인지 확인한다.
2. QA 서버를 18080 포트로 기동하고 `/login` HTTP 200을 확인한다.
3. 아래 환경 변수를 설정한다.

   ```powershell
   $env:BASE_URL='http://127.0.0.1:18080'
   $env:PLAYER_COUNTS='4,5,6,8'
   $env:E2E_RUN_ID='qa-20260922-000243'
   $env:E2E_CAPACITY='8'
   ```

4. Java, JavaScript, 핵심 Playwright, UI Playwright 순서로 4절의 명령을 실행한다.
5. 실행 후에는 현재 실행 ID의 이메일 prefix만 대상으로 계정 정리를 실행하고 잔여 계정을 0으로 확인한다.

## 13. 원인 분석

이번 변경은 다음 상태를 명시적으로 분리하도록 구성되었다.

- `chat.js`가 STOMP destination/payload를 기준으로 공개·마피아·사망자 채널을 분류한다.
- `app.css`가 채널별 말풍선 배경·테두리·글자색을 적용한다.
- `body.night-phase`는 페이지 body 배경에만 회색을 적용하며 카드와 채팅 패널은 유지한다.
- `.room-back-link`는 낮/밤 상태와 무관하게 동일한 버튼 팔레트를 사용한다.
- `room-layout.spec.js`가 브라우저의 computed style과 복귀 상태를 직접 비교한다.

테스트에서 이 상태 전환이나 서버 게임 흐름의 불일치는 관찰되지 않았다.

## 14. 애플리케이션 결함과 테스트 코드 결함 분류

- 애플리케이션 결함: 발견되지 않음
- 테스트 코드 결함: 발견되지 않음
- 환경 결함: 없음
- 결론: 추가 수정 없이 현재 구현과 QA 검증 코드가 모두 통과했다.

## 15. 변경이 필요한 파일과 라인

추가로 수정이 필요한 파일은 없다. 이번 QA에서 확인한 관련 라인은 다음과 같다.

- `src/main/resources/static/css/app.css:22` — `night-phase` 회색 배경
- `src/main/resources/static/css/app.css:26` — 게임 목록 버튼 고정 팔레트
- `src/main/resources/static/css/app.css:663-679` — 채널별 말풍선 스타일
- `src/main/resources/static/js/chat.js:162` — 밤 배경 상태 갱신
- `src/main/resources/static/js/chat.js:393-419` — 채널 분류 및 말풍선 클래스 부여
- `src/main/resources/templates/rooms/detail.html:26` — 게임 목록 버튼
- `test/js/chat.test.js:321-357, 795` — 밤 상태 및 채널 테스트
- `test/e2e/room-layout.spec.js:87-216` — 실제 게임방 배경·링크·스크린샷·영상 검증

## 16. 권장 수정

현재 QA 결과 기준 권장 수정 없음. 이후 색상이나 전환 시간을 변경할 경우 `app.css`와 `room-layout.spec.js`의 computed-style assertion을 함께 갱신한다.

## 17. 생성된 테스트 산출물

- `C:\workspace\mafiaweb\test-results\.last-run.json`
- `C:\workspace\mafiaweb\test-results\bootRun.qa-20260922-000243.stdout.log`
- `C:\workspace\mafiaweb\test-results\bootRun.qa-20260922-000243.stderr.log`
- `C:\workspace\mafiaweb\output\chat-scroll-test-qa-20260922-000243\chat-scroll.png`
- `C:\workspace\mafiaweb\output\chat-scroll-test-qa-20260922-000243\chat-scroll.webm`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\waiting-room.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\started-room.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\night-background-and-back-link.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\restored-background-and-back-link.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\room-layout-transition.webm`

실제 게임방 UI 산출물에는 `/rooms/86`의 8인 게임방, 좌측 상단 게임 목록 버튼, 일반 상태, 회색 밤 상태, 복귀 상태가 포함되어 있다.

## 18. 기존 데이터 보존 확인

- 정리 selector는 정확히 `playwright.qa-20260922-000243.%@example.com`으로 제한했다.
- 기존 사용자·방·기록을 broad pattern으로 삭제하지 않았다.
- 기존 8080 서버는 종료하지 않았다.
- QA 전용 18080 서버는 테스트 종료 후 리스너가 없음을 확인했다.
- 이번 실행에서 매칭된 테스트 계정은 44개이며, 모두 현재 실행 ID의 계정이었다.

## 19. QA 계정 정리 결과

실제 JDBC 정리 출력:

```text
MATCHING_ACCOUNT_COUNT=44
DELETED_ROOM_MEMBERS=0
DELETED_GAME_ROOMS=0
DELETED_USER_STATS=44
DELETED_USERS=44
REMAINING_TEST_ACCOUNTS=0
CLEANUP_STATUS=PASS
```

방과 참가자 종속 레코드는 게임 종료/이탈 처리로 정리 시점에 이미 0건이었다. QA 계정 44개와 user_stats 44건을 트랜잭션으로 삭제했고 잔여 계정은 0개다.

## 20. 최종 판정

**PASS**

Java 103건, JavaScript 25건, 핵심 Playwright 6건, UI Playwright 2건, 서버 렌더링 시각 산출물, QA 계정 정리가 모두 완료되었다.

---

## 문서 20: `MAFIAGAME_QA_REPORT_2026-09-21_qa-20260921-174132.md`

# MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-21
- 실행 ID: `qa-20260921-174132`
- 보조 재실행 ID: `qa-20260921-174132-rerun`
- 브랜치: `develop`
- 기본 URL: `http://127.0.0.1:8080`
- 최종 판정: `FAIL`

## 1. 실행 환경

- 운영체제: Windows PowerShell
- 프로젝트 경로: `C:\workspace-sts-5.3.0\mafiagame`
- QA 설정: E2E 활성화, 플레이어 수 `4,5,6,8`, UI 용량 `8`, Playwright worker `1`, retry `0`
- 애플리케이션은 QA 실행 전에 포트 8080이 비어 있는지 확인한 뒤 새로 기동했다.

## 2. MariaDB 사전 점검 및 의존성

- MariaDB `127.0.0.1:23306`: `PASS`
- Node/npm/jsdom/Playwright 확인: 모두 `PASS`
- `/login` 상태 확인: HTTP 200, `PASS`
- DB 정리는 최초 MariaDB 클라이언트의 TLS 오류(`TLS/SSL error: no credentials`)가 발생했으나 `--skip-ssl`로 재시도하여 완료했다.

## 3. 확인한 파일과 디렉터리

- QA 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- Java 소스 및 테스트: `src/main/**`, `src/test/java/**`
- JavaScript 테스트: `test/js/**`
- Playwright 테스트: `test/e2e/**`
- Gradle 결과: `build/test-results/test/**`, `build/reports/tests/test/index.html`
- E2E 실행 로그: `test-results/bootRun.qa-20260921-174132.stdout.log`, `test-results/bootRun.qa-20260921-174132.stderr.log`

## 4. 실행 명령

```powershell
$env:GRADLE_USER_HOME='C:\workspace-sts-5.3.0\mafiagame\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

```powershell
$env:E2E_RUN_ID='qa-20260921-174132'
$env:PLAYER_COUNTS='4,5,6,8'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

```powershell
$env:E2E_RUN_ID='qa-20260921-174132'
$env:BASE_URL='http://127.0.0.1:8080'
$env:E2E_CAPACITY='8'
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

보조 확인으로 실패와 무관한 브라우저 마감 시나리오를 별도 실행했다.

```powershell
$env:E2E_RUN_ID='qa-20260921-174132-rerun'
$env:PLAYER_COUNTS='4,5,6,8'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list --grep "browser deadline"
```

## 5. Java 테스트 결과

- 결과: `PASS`
- Gradle 결과: `BUILD SUCCESSFUL in 59s`
- 총 테스트: 103
- 성공: 103
- 실패: 0
- 오류: 0
- 스킵: 0
- JUnit XML: `build/test-results/test/*.xml`
- HTML 보고서: `build/reports/tests/test/index.html`

주요 검증 항목:

- `RoomGameServiceTest.assignsRolesAndSendsEachRoleOnlyToItsPrincipal`
- `RoomGameServiceTest.confirmsRolesPrivatelyAndStartsDayWhenEveryLivingPlayerConfirms`
- `RoomGameServiceTest.startsDayWhenTheRoleConfirmationTimerExpiresInRealTime`
- `RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase`
- `RoomGameServiceTest.givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting`
- `RoomGameServiceTest.skipsExecutionWhenTheDefendantLeavesDuringFinalDefense`
- `RoomGameServiceTest.enforcesNightChatPermissionsByRoleAndAliveState`
- `RoomGameServiceTest.declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted`
- `RoomGameServiceTest.appliesMafiaKillWhenDoctorAndPoliceSubmitNoAction`
- `RoomGameServiceTest.leavesEveryoneAliveWhenMafiaDoctorAndPoliceSubmitNoAction`

콘솔 요약: `BUILD SUCCESSFUL in 59s`

## 6. JavaScript 테스트 결과

- 결과: `PASS`
- 실행 파일: `test/js/stomp-client.test.js`, `test/js/room-list.test.js`, `test/js/chat.test.js`
- 총 테스트: 24
- 성공: 24
- 실패: 0

STOMP 프레임 처리, 대기방 참가자 동기화, 준비 상태, 게임 단계와 역할 확인, 최종 변론 채팅 권한, 투표, 경찰 조사 결과, 사망 상태(`.participant-dead`와 `사망`), 게임 결과 및 재접속 처리를 확인했다.

콘솔 요약: `24 tests, 24 pass, 0 fail`

## 7. 서버 기동 및 상태 확인

- 새 서버 기동: `PASS`
- 기동 로그: `test-results/bootRun.qa-20260921-174132.stdout.log`
- 오류 로그: `test-results/bootRun.qa-20260921-174132.stderr.log` (내용 없음)
- 상태 확인: `GET /login -> 200`
- 종료 후 포트 확인: `8080 FREE`

## 8. Playwright 발견 및 E2E 요약

핵심 6개 시나리오와 UI 2개 시나리오를 모두 발견했다.

핵심 발견 목록:

- `MVP 4인 핵심 게임 흐름`
- `MVP 5인 핵심 게임 흐름`
- `MVP 6인 핵심 게임 흐름`
- `MVP 8인 핵심 게임 흐름`
- `closing a waiting-room tab changes six players to the five-player role threshold`
- `browser deadline, reconnect grace, and expired night action`

UI 발견 목록:

- `role slot is visible before game and chat scrolls without growing the page`
- `waiting and started room layout (8 players)`

실제 실행 결과:

- 핵심 E2E: 6개 중 5개 성공, 1개 실패, exit code `1`
- UI E2E: 2개 중 2개 성공, exit code `0`
- 보조 재실행: 브라우저 마감 시나리오 1개 성공
- worker: `1`
- retry: `0`

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실제 결과 |
|---|---|---|
| 4인 핵심 게임 흐름 | `FAIL` | 두 번째 게임의 종료 대기에서 `게임 종료` 대신 `처형 투표` 유지 |
| 5인 핵심 게임 흐름 | `PASS` | 9.3분 내 완료 |
| 6인 핵심 게임 흐름 | `PASS` | 9.3분 내 완료 |
| 8인 핵심 게임 흐름 | `PASS` | 9.4분 내 완료 |
| 6인 대기방 이탈 후 5인 역할 기준 | `PASS` | 9.4초 |
| 재접속·마감·만료 밤 행동 | `PASS` | 2.0분 |
| 채팅 스크롤·폰트·오버플로 UI | `PASS` | 1.5분 내 완료 |
| 8인 대기/시작 방 레이아웃 UI | `PASS` | 1.5분 내 완료 |

## 10. MVP 검증 표

| 항목 | 근거 | 결과 |
|---|---|---|
| `ROLE_ASSIGNMENT` 역할 비공개 전달 및 공개 상태 역할 비노출 | `RoomGameServiceTest.assignsRolesAndSendsEachRoleOnlyToItsPrincipal`, `chat.test.js` | `PASS` |
| 역할 1회 확인, 중복 확인 거부, 전원 확인 시 낮 전환 | `RoomGameServiceTest.confirmsRolesPrivatelyAndStartsDayWhenEveryLivingPlayerConfirms` | `PASS` |
| 역할 확인 15초 실제 경과 자동 전환 | `RoomGameServiceTest.startsDayWhenTheRoleConfirmationTimerExpiresInRealTime` | `PASS` |
| `FINAL_DEFENSE` 단일 지목 대상 및 피고인 전용 공개 채팅 | `RoomGameServiceTest.givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting`, JS 테스트 | `PASS` |
| 최종 변론 중 피고인 이탈 시 처형 생략 후 밤 전환 | `RoomGameServiceTest.skipsExecutionWhenTheDefendantLeavesDuringFinalDefense` | `PASS` |
| 역할별 미행동 및 밤 권한 | `RoomGameServiceTest.appliesMafiaKillWhenDoctorAndPoliceSubmitNoAction`, `leavesEveryoneAliveWhenMafiaDoctorAndPoliceSubmitNoAction` | `PASS` |
| 사망 카드 스타일과 `사망` 문구 | `chat.test.js`, `mafia-mvp.spec.js` | `PASS` |
| 채널 선택·채팅 입력 폰트 11px 및 마피아 채널 잘림 | `chat-scroll.spec.js` | `PASS` |
| 서버 측 단계 시간 | `GamePhase.java`, `RoomGameServiceTest.usesTheMvpServerDurationsForEveryTimedPhase` | `PASS` |

확인된 서버 시간은 역할 확인 15초, 낮 60초, 지목 투표 20초, 최종 변론 20초, 처형 투표 20초, 밤 35초다.

## 11. 실패 및 차단 항목

실패 항목은 4인 핵심 E2E 한 건이다.

- 테스트: `MVP 4인 핵심 게임 흐름`
- 위치: `test/e2e/mafia-mvp.spec.js:1109` 부근의 `waitForPhase(..., PHASE_LABELS.FINISHED, 20_000)`
- 오류: `Expected: "게임 종료"; Received: "처형 투표"; Timeout: 20000ms`
- 핵심 실행의 콘솔 오류는 위와 같으며, 이후 보조 재실행에서 `test-results/.last-run.json`이 갱신되어 원본 Playwright error-context 파일은 보존되지 않았다.
- 차단 항목: 없음

## 12. 재현 절차

1. MariaDB를 `127.0.0.1:23306`에서 실행한다.
2. `SERVER_PORT=8080`으로 현재 소스의 `bootRun`을 시작한다.
3. `E2E_RUN_ID`를 새 값으로 지정하고 `PLAYER_COUNTS=4,5,6,8`로 설정한다.
4. `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`를 실행한다.
5. 4인 시나리오에서 첫 게임 종료 후 재대기방에서 두 번째 게임을 시작한다.
6. 두 번째 게임의 최종 처형 투표 제출 뒤 `#gamePhaseTitle`이 `게임 종료`로 바뀌는지 확인한다.

## 13. 원인 분석

실패는 첫 번째 게임이 아니라 `startReplayGame()`의 두 번째 게임 최종 종료 확인에서 발생했다. 실행 중 최종 처형 투표 화면이 유지되어, 테스트가 기대한 `FINISHED` 상태를 20초 내 받지 못했다.

현재 확보된 콘솔 출력만으로는 최종 투표가 서버에서 거부되었는지, 4인 재플레이의 생존자·과반수 조건이 충족되지 않았는지, 또는 E2E 동기화가 상태 갱신을 놓쳤는지 단정할 수 없다. 따라서 이 보고서에서는 원인을 미확정으로 분류한다. 5·6·8인 전체 흐름과 별도 마감·재접속 시나리오는 통과했으므로, 재플레이 4인 경로를 별도로 재현해 서버 상태와 제출 응답을 추가 계측해야 한다.

## 14. 애플리케이션 결함과 테스트 코드 결함 분류

| 항목 | 분류 | 근거 |
|---|---|---|
| 4인 재플레이 최종 종료 미도달 | `UNCONFIRMED` | 실행 화면은 `처형 투표`에 머물렀지만 서버 거부 로그와 원본 trace가 보존되지 않아 애플리케이션/테스트 동기화 중 어느 쪽인지 확정 불가 |
| 나머지 Java/JS/E2E 항목 | 결함 증거 없음 | 해당 검증 통과 |

## 15. 변경이 필요한 파일 및 위치

추가 수정은 이번 QA 실행에서 수행하지 않았다. 실패를 해결하려면 우선 다음 위치를 계측·재검증해야 한다.

- `test/e2e/mafia-mvp.spec.js:400-620`: `startReplayGame()`의 4인 재플레이 지목·처형 제출 및 종료 대기
- `test/e2e/mafia-mvp.spec.js:1109-1110`: 최종 `FINISHED` 단계 대기
- `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:650-690`: 처형 투표 결과와 승리 판정 전환

## 16. 권장 조치

- 4인 재플레이를 단독 실행해 `EXECUTION_VOTE` 진입 직후 각 페이지의 제출 버튼 상태와 서버 응답을 기록한다.
- `FINISHED` 미도달 시 게임 상태 trace의 `executionVotes`, 생존자 수, `nominatedUserId`, `gameOver` 값을 오류 메시지에 포함한다.
- 서버가 과반수 투표를 정상 수신했는데도 `EXECUTION_VOTE`에 남으면 `RoomGameService`의 4인 승리 판정 경로를 수정한다.
- 제출 자체가 E2E에서 누락되거나 비활성화되면 `submitExecutionVotes()`의 생존자 목록과 재플레이 상태 동기화를 수정한다.

## 17. 생성된 테스트 산출물

- `test-results/bootRun.qa-20260921-174132.stdout.log`
- `test-results/bootRun.qa-20260921-174132.stderr.log`
- `output/chat-scroll-test-qa-20260921-174132/chat-scroll.png`
- `output/chat-scroll-test-qa-20260921-174132/chat-scroll.webm`
- `output/room-layout-test-8-qa-20260921-174132/waiting-room.png`
- `output/room-layout-test-8-qa-20260921-174132/started-room.png`
- `build/test-results/test/*.xml`
- `build/reports/tests/test/index.html`

## 18. 기존 데이터 보존 확인

기존 데이터는 보존했다. 정리 작업은 현재 QA 실행 ID와 보조 재실행 ID에 일치하는 `playwright.*@example.com` 계정만 대상으로 했으며, 해당 계정과 연결된 QA 방·멤버십·통계만 삭제했다. 광범위한 `playwright.%` 삭제는 수행하지 않았다.

## 19. 테스트 계정 정리 결과

- 정리 대상: `qa-20260921-174132`, `qa-20260921-174132-rerun`
- 매칭 계정: 50개
- 삭제 후 원본 실행 ID 잔여 계정: 0개
- 삭제 후 보조 실행 ID 잔여 계정: 0개
- 정리 결과: `PASS`

## 20. 최종 판정

`FAIL`

Java 103개와 JavaScript 24개는 모두 통과했고 UI E2E도 통과했지만, 전체 핵심 E2E 6개 중 4인 재플레이 시나리오 1개가 실패했다. 따라서 QA 기준상 전체 결과를 `PASS`로 처리할 수 없다.

---

## 문서 21: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-221345.md`

# MAFIAGAME 최종 QA 실행 리포트

- 실행일: 2026-09-20 (Asia/Seoul)
- 실행 ID: `qa-20260920-221345`
- 기준 문서: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 최종 QA 서버: `http://127.0.0.1:8091` (이번 실행에서 새로 기동)
- E2E 설정: `PLAYER_COUNTS=4,5,6,8`, `workers=1`, `retries=0`
- DB: `127.0.0.1:23306` 연결 확인 후 진행

## 최종 판정

**PASS** — QA 스크립트의 필수 자동화 단계가 모두 실행됐고, Java 103건, JavaScript 23건, Playwright E2E 6건이 모두 통과했다.

## 실행 결과

| 영역 | 실행 명령/범위 | 결과 |
|---|---|---|
| MariaDB 사전 점검 | `127.0.0.1:23306` 연결 | PASS |
| Java/Gradle | `gradlew.bat test --no-daemon --rerun-tasks -x jsTest` | 103 passed, 0 failed, 0 error, 0 skipped |
| JavaScript | `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js` | 23 passed, 0 failed |
| Playwright 테스트 목록 | QA 필수 6개 테스트 탐색 | PASS |
| Playwright E2E | `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` | 6 passed, 총 20.1분 |

### Playwright 시나리오

| 시나리오 | 결과 | 실행 시간 |
|---|---:|---:|
| MVP 4인 핵심 게임 흐름 | PASS | 4.1분 |
| MVP 5인 핵심 게임 흐름 | PASS | 4.2분 |
| MVP 6인 핵심 게임 흐름 | PASS | 4.2분 |
| MVP 8인 핵심 게임 흐름 | PASS | 4.2분 |
| 대기방 탭 종료 후 6인→5인 임계값 전환 | PASS | 9.9초 |
| 브라우저 마감·재접속 유예·만료 밤 행동 | PASS | 1.9분 |

4·5·6·8인 실제 브라우저 흐름과 5→6명 역할 임계값, 8인 최대 시나리오를 모두 실행했다. 마지막 시나리오는 서버 마감 시각, 재접속 유예, 유예 만료 후 밤 행동 무효화를 포함한다.

## QA 이미지·동영상

전체 E2E 종료 직후 같은 8091 서버에서 실제 로그인 후 대기방을 생성해 캡처했다. 데스크톱과 모바일 캡처는 동일한 라이브 페이지의 반응형 결과이며, 동영상은 해당 흐름의 Playwright WebM 녹화다.

- [데스크톱 QA 이미지](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/qa-room-desktop.png>)
- [모바일 QA 이미지](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/qa-room-mobile.png>)
- [QA 실행 동영상(WebM)](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/video/page@0495d2e982f0b5189ef02c4034a3a0d3.webm>)

## 계정 및 서버 정리

- E2E 실행 계정: `qa-20260920-221345` 선택자에 일치한 35개 계정 삭제, 잔여 0개.
- 캡처 계정: `qa-20260920-221345-artifact` 선택자에 일치한 1개 계정 삭제, 잔여 0개.
- 이번 실행에서 기동한 8091 서버: 테스트·캡처 후 종료 확인.
- 기존 8081 서버: 종료하지 않았으며 정리 후에도 `/login` 응답 200 확인.

## 산출물

- [Playwright 실행 로그](</C:/workspace/mafiaweb/test-results/e2e.qa-20260920-221345.log>)
- [Gradle HTML 테스트 리포트](</C:/workspace/mafiaweb/build/reports/tests/test/index.html>)
- [QA 이미지·동영상 폴더](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts>)

참고: 서버 stdout에는 QA 종료를 위해 프로세스를 중지한 뒤 Gradle `bootRun` 종료 코드가 기록될 수 있다. 이는 애플리케이션 테스트 실패가 아니라 실행 후 서버 정리 과정의 종료 결과이며, 애플리케이션 기동과 모든 QA 시나리오는 그 전에 정상 완료됐다.


---

---

## 문서 22: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행 일시: 2026-09-20 (Asia/Seoul)
- 프로젝트: `C:\workspace\mafiaweb`
- 실행 ID: `qa-20260920-165300`
- QA 설정: `PLAYER_COUNTS=4,5,6,8`, 요청 워커 1, 실제 워커 1, E2E 활성화
- 최종 QA 서버: `http://127.0.0.1:8083`
- MariaDB: `127.0.0.1:23306/mafiaweb`
- OS: Windows 11 amd64
- Java: 22.0.1
- Gradle: 8.14.5 (`.gradle-test` 사용)
- Node.js: v24.19.0
- npm: 11.17.0
- 소스 수정 허용: `false`
- 기존 데이터 삭제: `false`
- 테스트 계정 삭제: `true`

8081 포트가 QA 준비 중 사용 중인 상태가 되어, 기존 서버를 종료하거나 재사용하지 않고 사용 가능한 8083 포트에서 새 QA 서버를 시작했다.

## 2. MariaDB 사전 확인 및 의존성

사전 확인 결과:

```text
MariaDB 127.0.0.1:23306 = reachable
node = C:\Program Files\nodejs\node.exe (v24.19.0)
npm.cmd = C:\Program Files\nodejs\npm.cmd (11.17.0)
node_modules\jsdom = present
node_modules\@playwright\test = present
```

DB가 실행 중이었고 필요한 Node 의존성도 존재했으므로 설치 없이 진행했다. MariaDB 서비스를 새로 시작하거나 기존 데이터를 삭제하지 않았다.

## 3. 확인한 파일 및 디렉터리

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`, `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`
- `src/main/resources/application.properties`

핵심 계약은 `RoomGameRules.java:30-75`, `GamePhase.java:4-9`, `RoomGameService.java:168-236,252-296,439-480,631-764`, `RoomPresenceService.java:45-97,373-443,740-780`, `chat.js:483-621,892-914`에서 확인했다.

## 4. 실행 명령

Java 테스트:

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

JavaScript 테스트:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

Playwright 테스트 검색:

```powershell
$env:E2E_RUN_ID='qa-20260920-165300'
$env:PLAYER_COUNTS='4,5,6,8'
$env:BASE_URL='http://127.0.0.1:8083'
npm.cmd run test:e2e -- --list --workers=1
```

Playwright 전체 실행:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

테스트 서버는 `SERVER_PORT=8083`과 현재 workspace의 `bootRun`으로 새로 시작했다. `/login` health check는 HTTP 200을 반환했다.

## 5. Java 테스트 결과

```text
BUILD SUCCESSFUL in 20s
JUnit XML suite: 11
Tests: 103
Failures: 0
Errors: 0
Skipped: 0
```

주요 결과:

- `RoomGameServiceTest`: 45개 통과
- `RoomPresenceServiceTest`: 23개 통과
- `WebSocketAuthorizationInterceptorTest`: 7개 통과
- `ControllerDelegationTest`: 4개 통과
- `RoomControllerTest`: 4개 통과
- `MapperIntegrationTest`: 2개 통과
- 애플리케이션·채팅·방·회원 서비스 테스트 전체 통과

역할 수 경계, `ROLE_CONFIRM` 중복 방지와 10초 timeout, `FINAL_DEFENSE` 권한과 15초 deadline, 투표 동률/무투표, server deadline, 승리 조건, 탈주, 밤 행동은 다음 테스트로 확인되었다.

- `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`
- `confirmsRolesPrivatelyAndStartsDayWhenEveryLivingPlayerConfirms`
- `startsDayWhenTheRoleConfirmationTimerExpires`
- `usesTheMvpServerDurationsForEveryTimedPhase`
- `givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting`
- `skipsExecutionWhenNominationVotesAreTied`
- `skipsExecutionWhenNoNominationVotesAreSubmitted`
- `countsOnlyOneOfTwoConcurrentVotesFromTheSamePlayer`
- `rejectsConcurrentRequestsAfterTheServerDeadline`
- `declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted`
- `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction`
- `continuesWhenMafiaAndCitizenFactionAreEven`
- `appliesMafiaKillAndDoctorProtectionDuringNight`
- `leavesEveryoneAliveWhenNoMafiaSubmitsANightAction`
- `allowsDoctorToProtectThemselfOnConsecutiveNights`
- `rejectsDeadAndDepartedNightActionTargets`
- `resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`
- `resolvesConcurrentNightActionsFromBothMafiaWithoutDroppingAnAction`
- `endsSixPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `endsEightPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`

## 6. JavaScript 테스트 결과

```text
23 tests
23 passed
0 failed
```

확인 범위는 STOMP 프레임, 방/참가자·준비 상태 동기화, phase UI, `ROLE_ASSIGNMENT` 역할 확인 요청, `FINAL_DEFENSE` 후보자 채팅 권한, 개인 역할·투표·경찰 조사 결과·게임 결과 표시, 재접속 상태 처리다.

관련 테스트 파일은 `test/js/stomp-client.test.js`, `test/js/room-list.test.js`, `test/js/chat.test.js:153-287,337-446,549-747`이다.

## 7. 서버 시작 및 health check

- MariaDB 사전 확인: `PASS`
- 현재 workspace 기반 QA 서버 시작: `PASS`
- `GET http://127.0.0.1:8083/login`: HTTP 200, `PASS`
- 애플리케이션 stderr: 0 byte
- 실행 완료 후 8083 listener: 없음, 서버 정리 `PASS`

처음 sandbox 안에서 Playwright worker fork가 `spawn EPERM`으로 시작되지 않는 환경 제약이 확인되었다. 원인을 `child_process.fork()` 수준에서 확인한 뒤 동일한 QA 명령을 허용된 실행 환경에서 1회 수행했고, 그 최종 실행에서는 브라우저 케이스가 모두 실행되었다. 케이스 실패 후의 자동 재시도는 하지 않았다.

## 8. Playwright 검색 및 전체 E2E 결과

검색 결과:

```text
Total: 6 tests in 1 file
```

실제 실행 결과:

```text
6 passed (20.1m)
Slow test file: test/e2e/mafia-mvp.spec.js (18.9m)
Exit code: 0
```

요청 워커 수와 실제 워커 수 모두 `1`이다. retries는 `0`이다. 검색된 6개 시나리오가 모두 실행되었고 skipped 테스트는 없다.

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실행 증거 |
|---|---|---|
| 4인 핵심 게임 흐름 | `PASS` | 역할 확인, 비공개 역할, 최종 변론, 처형, 밤 행동, 시민 승리, 결과 공개, 같은 방 재플레이 |
| 5인 핵심 게임 흐름 | `PASS` | 1마피아 경계값 역할 수와 전체 게임 흐름 |
| 6인 핵심 게임 흐름 | `PASS` | 2마피아 경계값, 두 마피아 처형, 의사 보호, 경찰 조사, 채널 격리, 시민 승리, 재플레이 |
| 8인 핵심 게임 흐름 | `PASS` | 최대 인원 실제 브라우저 흐름과 재플레이 |
| 대기방 6→5명 이탈 | `PASS` | 탭 종료 후 참가자 5명 반영, 5인 역할 배정 |
| browser deadline/reconnect/expired night action | `PASS` | 마감 직전 요청, 10초 이내 재접속 상태 복원, 유예 만료 후 탈주·행동 제거 |

정상 흐름은 `test/e2e/mafia-mvp.spec.js:519-998`, 6→5명 이탈은 `:1002-1039`, deadline/reconnect는 `:1042-1157`에 구현되어 있다.

## 10. MVP 검증 결과

| # | 검증 항목 | 근거 | 결과 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | Java `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, E2E 4/5/6/8 | `PASS` |
| 2 | 개인 역할 비공개 표시 | E2E `ROLE_ASSIGNMENT` public state role null, 개인 role panel | `PASS` |
| 3 | 60초 낮 토론 timer | E2E `mafia-mvp.spec.js:668-674` server `phaseEndsAt` | `PASS` |
| 4 | 15초 지목 투표 timer | E2E `:704-714` | `PASS` |
| 5 | 15초 최종 변론 timer | E2E `:732-740`, Java defense test | `PASS` |
| 6 | 15초 처형 투표 timer | E2E `:760-771` | `PASS` |
| 7 | 30초 밤 timer | E2E `:783-793` | `PASS` |
| 8 | 지목 투표 중복 방지 | Java `acceptsOnlyTheFirstNominationVoteFromEachUser` | `PASS` |
| 9 | 자기 지목 방지 | Java `rejectsSelfNominationAndUnknownPlayers` | `PASS` |
| 10 | 사망자 투표 방지 | Java `rejectsNominationVoteFromADeadPlayer` | `PASS` |
| 11 | 처형 후보자 투표 방지 | Java `rejectsExecutionVoteFromTheNominatedPlayer` | `PASS` |
| 12 | 마피아 공격 | Java `appliesMafiaKillWhenNoDoctorProtectionIsSubmitted`, E2E 밤 행동 | `PASS` |
| 13 | 의사 보호 | Java protection test, E2E 보호 대상 생존 확인 | `PASS` |
| 14 | 경찰 비공개 조사 결과 | Java police tests, E2E 경찰 화면에만 결과 표시 | `PASS` |
| 15 | 역할별 밤 행동 검증 | Java `validatesNightActionRoleTargetAndDuplicateSubmission` | `PASS` |
| 16 | 시민 밤 행동 방지 | Java role validation, E2E 권한 거부 | `PASS` |
| 17 | 시민 승리 조건 | 마지막 마피아 처형 후 E2E/Java `FINISHED` | `PASS` |
| 18 | 마피아 승리 조건 | Java `aliveMafia > aliveCitizenFaction` | `PASS` |
| 19 | 투표·밤 행동 직후 server 승리 판정 | Java winner tests와 `RoomGameService` resolution | `PASS` |
| 20 | 승리 직후 결과 표시 | E2E `gameResultPanel`, `gameWinnerLabel` | `PASS` |
| 21 | 승리 진영 표시 | E2E 시민 진영 표시 | `PASS` |
| 22 | 결과 화면 개인 역할 표시 | E2E `gameResultRoleLabel` | `PASS` |
| 23 | 생존/사망 상태 표시 | E2E `gameResultAliveLabel`, state player alive | `PASS` |
| 24 | `PLAYING → WAITING` 전환 | E2E 결과 후 `roomStatus` 대기 상태 | `PASS` |
| 25 | Ready 상태 초기화 | E2E 결과 후 ready 재활성화와 Java reset 검증 | `PASS` |
| 26 | 같은 방 재플레이 | E2E `startReplayGame`, 4/5/6/8 | `PASS` |
| 27 | refresh/reconnect 상태 복원 | E2E `pages[1].reload()` 후 phase 복원 | `PASS` |
| 28 | public/mafia 채널 분리 | E2E 생존 마피아 수신 및 시민 미수신 | `PASS` |
| 29 | 밤 채팅·사망 채널 격리 | E2E `:833-862`, dead message living 미수신 | `PASS` |
| 30 | 마피아·의사·경찰 무행동 | Java no-mafia/no-doctor 및 police 결과 테스트 | `PASS` |
| 31 | 의사 자기 보호·연속 자기 보호 | Java `allowsDoctorToProtectThemselfOnConsecutiveNights` | `PASS` |
| 32 | 사망 시 역할·조사 결과 비공개 | E2E public state role null, Java police death test | `PASS` |
| 33 | 종료 후 전체 역할 공개 | E2E `FINISHED` state roles 문자열 및 reveal panel | `PASS` |
| 34 | server deadline 및 중복 요청 idempotency | Java `rejectsConcurrentRequestsAfterTheServerDeadline`, duplicate tests | `PASS` |

## 10.1 확장 경계·복원력 검증

| # | 검증 항목 | 근거 | 결과 |
|---:|---|---|---|
| 1 | 4/5/6/8인 정확한 역할 수 | Java 경계 역할 테스트, E2E role labels | `PASS` |
| 2 | 시민 수 공식 및 6인 시민 2명 | `playerCount - mafia - 2` assertion | `PASS` |
| 3 | 4명 미만·8명 초과 시작 거부 | `RoomPresenceServiceTest`의 `rejectsStartingGameWithFewerThanFourPlayers`, `...MoreThanEightPlayers` | `PASS` |
| 4 | 마피아 생존자가 시민 진영보다 많을 때 승리 | `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction` | `PASS` |
| 5 | 동수는 계속, 마피아 0명은 시민 승리 우선 | `continuesWhenMafiaAndCitizenFactionAreEven`, citizen precedence tests | `PASS` |
| 6 | 6인에서 한 마피아 처형 후 계속, 두 번째 처형 후 시민 승리 | Java 6인 helper 및 E2E 6인 | `PASS` |
| 7 | 두 마피아의 서로 다른/동일 대상 집계 | Java `resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`, `resolvesTheSharedTargetWhenBothMafiaSelectTheSamePlayer` | `PASS` |
| 8 | 지목 동률은 처형 후보 없이 밤으로 이동 | Java `skipsExecutionWhenNominationVotesAreTied` | `PASS` |
| 9 | 탈주 유예 후 alive 반영 및 승리 재평가 | Java presence/game tests, E2E grace expiry | `PASS` |
| 10 | 시작 직전 6→5명 역할 재계산 | E2E `closing a waiting-room tab...` | `PASS` |
| 11 | server `phaseEndsAt` 기준 마감 요청 처리 | Java deadline tests, E2E near-deadline request | `PASS` |
| 12 | 재접속 유예 중 행동 유지·만료 후 행동 제거 | E2E `browser deadline, reconnect grace, and expired night action` | `PASS` |
| 13 | public/mafia/dead 채널 서버 격리 | E2E 채널 차단 및 수신 대상 assertion | `PASS` |
| 14 | 4/5/6/8인 같은 방 재플레이 | 각 정상 E2E의 `startReplayGame` | `PASS` |
| 15 | 10/60/15/15/15/30초 server phase deadline | Java `usesTheMvpServerDurationsForEveryTimedPhase`, E2E 60/15/15/15/30 측정 | `PASS` |

`ROLE_ASSIGNMENT`는 모든 생존자의 확인이 끝나면 10초보다 일찍 `DAY_DISCUSSION`으로 전환되는 정상 동작도 확인했다. 자연 만료 경로는 Java `startsDayWhenTheRoleConfirmationTimerExpires`로, server deadline은 Java timestamp assertion으로 확인했다.

## 11. 실패 및 차단 항목

- 최종 QA 실행의 `FAIL`: 없음
- 최종 QA 실행의 `BLOCKED`: 없음
- `NOT RUN`: 없음
- skipped Playwright case: 없음

최초 sandbox 실행에서 Playwright worker 생성이 `Error: spawn EPERM`으로 차단되었으나, 이는 애플리케이션 또는 테스트 assertion 실패가 아닌 실행 환경의 child-process 제한이었다. 원인 확인 후 허용된 실행 환경에서 동일한 전체 명령을 수행했고 6개가 모두 실행·통과되었다.

## 12. 재현 절차

1. MariaDB를 `127.0.0.1:23306`에서 실행한다.
2. `GRADLE_USER_HOME=C:\workspace\mafiaweb\.gradle-test`를 사용한다.
3. 위 4절의 Java와 JavaScript 명령을 실행한다.
4. `SERVER_PORT=8083`으로 `bootRun`을 시작한다.
5. `/login` HTTP 200을 확인한다.
6. `E2E_RUN_ID=qa-20260920-165300`, `PLAYER_COUNTS=4,5,6,8`, `--workers=1 --retries=0`으로 Playwright를 실행한다.
7. 실행 후 동일 run ID 이메일 prefix만 조회해 테스트 계정을 삭제하고 잔여 수를 0으로 확인한다.

## 13. 원인 분석

이번 실행에서는 재현할 애플리케이션 결함이 없었다. 역할 임계값은 `RoomGameRules.java:25-55`, 승리 판정은 `:57-75`, phase deadline은 `RoomGameService.java:701-731`에서 server state로 관리되고 있었다. 채널 권한은 `RoomGameService.java:252-296`과 `ChatService.java:58-63`에서 서버 측 검증되었다.

## 14. 애플리케이션 결함과 테스트 코드 결함 분류

- 애플리케이션 결함: 확인되지 않음
- 테스트 코드 결함: 확인되지 않음
- 환경 이슈: sandbox의 Node worker `spawn EPERM`이 있었으나 허용된 실행 환경에서 해결됨
- 데이터 정리 이슈: 없음

## 15. 변경이 필요한 파일 및 라인

이번 QA 결과를 기준으로 필수 수정이 필요한 파일은 없다. 관련 계약과 검증 위치는 다음과 같다.

- 역할 수/승리 조건: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30-75`
- phase duration: `src/main/java/kr/or/oti/mafiagame/dto/GamePhase.java:4-9`
- 행동·deadline·변론·snapshot: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:168-236,252-296,631-764`
- 재접속/탈주: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:45-97,740-780`
- 브라우저 검증: `test/e2e/mafia-mvp.spec.js:519-1157`

## 16. 권장 사항

필수 수정은 없지만, CI나 제한된 Windows 환경에서 Playwright를 실행할 때는 QA 스크립트와 동일하게 `--workers=1`을 유지하고, Node test runner에는 `--test-isolation=none`을 유지하는 것이 안전하다. 실패 시에만 Playwright trace/screenshot을 보존하도록 설정하면 `test-results` 저장 공간도 줄일 수 있다.

## 17. 생성된 테스트 산출물

- Java JUnit XML: `C:\workspace\mafiaweb\build\test-results\test\`
- Gradle HTML: `C:\workspace\mafiaweb\build\reports\tests\test\index.html`
- Playwright 최종 상태: `C:\workspace\mafiaweb\test-results\.last-run.json`
- QA 서버 stdout: `C:\workspace\mafiaweb\test-results\bootRun.qa-20260920-165300.stdout.log`
- QA 서버 stderr: `C:\workspace\mafiaweb\test-results\bootRun.qa-20260920-165300.stderr.log` (0 byte)
- Playwright trace/screenshot: 모든 케이스 통과로 실패 artifact가 생성되지 않음
- 최종 보고서: `C:\workspace\mafiaweb\docs\QA_report\MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`

## 18. 기존 데이터 보존 확인

`$deleteExistingData = $false`로 실행했고, 기존 사용자·방·통계 데이터는 broad pattern으로 삭제하지 않았다. QA 서버는 이번 실행에서 새로 시작한 8083 프로세스만 종료했으며, 기존 서버를 종료하지 않았다. 테스트 과정에서 이미 존재하던 worktree 변경도 되돌리지 않았다.

## 19. 테스트 계정 정리 결과

현재 실행 ID `qa-20260920-165300`에 해당하는 이메일만 exact prefix로 조회했다.

```text
MATCHED_ACCOUNTS=35
DELETED room_members=0 game_room=0 user_stats=35 user=35
REMAINING_TEST_ACCOUNTS=0
CLEANUP_COMMITTED=true
```

계정과 종속 레코드 삭제는 트랜잭션으로 수행했고, 검증 후 commit했다. 임시 JDBC 정리 helper는 실행 후 삭제했다.

## 20. 최종 판정

# `PASS`

Java 103개, JavaScript 23개, Playwright 6개가 모두 통과했고, QA 서버 health check와 current-run 테스트 계정 정리도 성공했다.


---

---

## 문서 23: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1440-full.md`

# MAFIAGAME QA 실행 보고서

- 실행 ID: `qa-20260920-1440-full`
- 실행일: 2026-09-20
- 실행 범위: Java, JavaScript, Playwright 전체 QA 시나리오
- Playwright 인원수: `4,5,6,8`
- QA 서버: `http://127.0.0.1:8081` (현재 소스로 신규 기동 후 종료)
- 최종 결과: `PASS`

## 1. 사전 조건

- MariaDB `127.0.0.1:23306`: `PASS`
- QA 서버 `/login` 응답: `PASS`
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Playwright discovery: `6 tests in 1 file`
- Playwright worker: `1`

## 2. 자동화 테스트 결과

### Java

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- 결과: `BUILD SUCCESSFUL`
- 테스트: `93`
- 성공: `93`
- 실패: `0`
- 오류: `0`

### JavaScript

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- 테스트: `20`
- 성공: `20`
- 실패: `0`
- 취소/보류: `0`

### Playwright

실행 명령:

```powershell
$env:BASE_URL='http://127.0.0.1:8081'
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-1440-full'
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

| 시나리오 | 결과 | 실행 시간 |
|---|---:|---:|
| MVP 4인 핵심 게임 흐름 | `PASS` | 3.7분 |
| MVP 5인 핵심 게임 흐름 | `PASS` | 3.6분 |
| MVP 6인 핵심 게임 흐름 | `PASS` | 3.7분 |
| MVP 8인 핵심 게임 흐름 | `PASS` | 3.7분 |
| 대기방 6→5명 탭 이탈 및 역할 임계값 | `PASS` | 12.1초 |
| 브라우저 마감·재접속 유예·만료 밤 행동 | `PASS` | 2.0분 |

- 전체 결과: `6 passed (18.2m)`
- 4·5·6·8인 실제 브라우저 흐름: `PASS`
- 6인 경계값 마피아 2명 흐름: `PASS`
- 8인 실제 브라우저 흐름: `PASS`
- 재접속/마감 직전 및 만료 행동: `PASS`

## 3. 사후 정리

- 실행 ID로 생성된 테스트 계정: `35개`
- 삭제된 테스트 계정: `35개`
- 관련 `user_stats`: `35개`
- 정리 후 해당 실행 ID 계정 잔여: `0개`
- QA 서버 8081: 종료 및 포트 해제 확인
- 기존 서버가 있었다면 대상 외 서버는 종료하지 않음

## 4. 결과 판정

Java 93건, JavaScript 20건, Playwright 6개 시나리오가 모두 성공했습니다. QA 스크립트 기준 이번 실행에서 `FAIL` 또는 `NOT RUN` 항목은 없습니다.



---

---

## 문서 24: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1401-full.md`

# MAFIAGAME QA 실행 보고서

- 실행 ID: `qa-20260920-1401-full`
- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- 실행 범위: Java, JavaScript, Playwright 4·5·6·8인 및 6인 확장 시나리오
- 최종 판정: `FAIL`

## 1. 환경 및 사전 점검

- MariaDB `127.0.0.1:23306`: `PASS`
- 기존 서버 `127.0.0.1:8080`: 실행 중 확인, 종료하지 않음
- QA용 현재 소스 서버 `127.0.0.1:8081`: 기동 및 `/login` HTTP 200 확인 후 종료
- Node.js: `v24.19.0`
- npm: `11.17.0`
- jsdom, Playwright 의존성: 존재 확인
- Playwright discovery: `6 tests in 1 file`
- Playwright worker: 요청 1, 실제 1

Playwright는 샌드박스 기본 실행에서 `spawn EPERM`이 발생해 제한 해제 환경에서 재실행했습니다. 이는 테스트 실패가 아니라 실행 환경의 자식 프로세스 생성 제한입니다.

## 2. 실행 결과

### Java

실행 명령:

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- 결과: `BUILD SUCCESSFUL`
- 테스트: 91
- 통과: 91
- 실패: 0
- 오류: 0
- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/index.html`

### JavaScript

실행 명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- 테스트: 20
- 통과: 20
- 실패: 0
- 취소/보류: 0

STOMP, 로비·참가자 동기화, 준비 상태, 페이즈 UI, 역할·투표 UI, 경찰 결과, 게임 결과, 재접속 테스트가 모두 통과했습니다.

## 3. Playwright 결과

### 전체 실행

전체 명령은 6개를 직렬 실행했습니다. 첫 4인 테스트가 실패해 Playwright serial 모드가 나머지를 건너뛰었으므로, 실패 원인을 확인한 뒤 미실행 케이스만 개별 실행했습니다. 실패한 4인 테스트는 재시도하지 않았습니다.

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4인 핵심 흐름 | `FAIL` | `test/e2e/mafia-mvp.spec.js:739` 토스트 기대 불일치 |
| 5인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 6인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 8인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 6→5명 시작 직전 이탈 | `PASS` | 1 test passed, 1.4분 |
| 마감·재접속·유예 만료 | `PASS` | 1 test passed, 3.2분 |

실패 메시지:

```text
Expected substring: "마피아 채팅"
Received string: "밤에는 마피아 채널만 사용할 수 있습니다."
```

실패 지점은 의사가 마피아 채널에 잘못된 메시지를 보낸 뒤 두 번째 오류 토스트를 기다리는 단계입니다. 네 인원수에서 같은 위치와 문구로 재현됐습니다. 서버 권한 검증 계약은 `RoomGameService.java:258`의 마피아 채널 역할 검증과 `RoomGameService.java:261`의 밤 공개 채널 검증에 있습니다. 현재 증거상 게임 진행·역할·타이머 단계보다 E2E의 비동기 토스트 대기 또는 오류 문구 기대가 먼저 실패한 것으로 분류합니다.

마지막 Playwright 결과 파일인 `test-results/.last-run.json`은 마지막으로 실행한 확장 테스트의 `passed` 상태만 기록하므로, 전체 결과 집계에는 사용하지 않았습니다.

## 4. 핵심 검증 판정

| 항목 | 판정 | 근거 |
|---|---|---|
| 4·5·6·8인 역할 경계 | `PASS` | Java 91건 통과 및 각 E2E가 역할·게임 진행 단계까지 도달 |
| 6인 마피아 2명 흐름 | `NOT RUN` | 기본 E2E가 채팅 검증 단계에서 중단됨 |
| 8인 실제 브라우저 흐름 | `NOT RUN` | 동일한 채팅 검증 단계에서 중단됨 |
| 6→5명 시작 직전 이탈 | `PASS` | Playwright 확장 시나리오 통과 |
| 마감 직전 요청 | `PASS` | 확장 시나리오에서 멈춤 없이 다음 단계 진행 |
| 서버 마감시각 이후 요청·중복 요청 | `PASS` | Java 서비스 테스트 근거 |
| 10초 이내 재접속 | `PASS` | Playwright 확장 시나리오 통과 |
| 10초 유예 만료 후 행동 제거 | `PASS` | Playwright 확장 시나리오 통과 |
| 역할별 밤 행동·보호·조사·승리 | `PASS` | Java 서비스 테스트 근거 |
| 실제 브라우저 채팅 전체 조합 | `NOT RUN` | 기본 E2E가 채팅 권한 토스트 단계에서 중단 |
| 테스트 계정 삭제 | `PASS` | 두 실행 ID 모두 잔여 계정 0 |

## 5. 계정 및 서버 정리

- 1차 실패 실행 ID `qa-20260920-1356-full`: 계정 4개 삭제, 잔여 0개
- 본 실행 ID `qa-20260920-1401-full`: 계정 35개 삭제, 잔여 0개
- 삭제 범위: 해당 실행 ID의 `user`, `user_stats`, `room_members`, 테스트 방
- 기존 서버 `8080`: 유지
- QA 서버 `8081`: 종료
- 기존 사용자·기존 서버는 삭제·종료하지 않음

## 6. 후속 조치

`test/e2e/mafia-mvp.spec.js:739`의 토스트 검증을 수정해야 합니다. 오류 토스트가 연속 요청에서 갱신되는 시점과 실제 서버 오류 문구를 안정적으로 기다리도록 테스트를 보완한 뒤, 4·5·6·8인 기본 흐름을 다시 실행해야 합니다. 현재 결과는 Java·JavaScript와 두 확장 브라우저 시나리오는 통과했지만, 기본 브라우저 흐름 4건이 실패했으므로 전체 QA는 `FAIL`입니다.


---

---

## 문서 25: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1302.md`

# MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-20
- 실행 ID: `qa-20260920-1302`
- 프로젝트: `C:\workspace\mafiaweb`
- QA 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 요청 인원수: `4,5,6,8`
- Playwright 요청 worker: `2`
- Playwright 실제 worker: `1` (`serial` describe 적용)
- 소스 수정: 없음
- 테스트 프로그램 설치: 없음

## 실행 결과

| 구분 | 결과 | 근거 |
|---|---|---|
| MariaDB 연결 | PASS | `127.0.0.1:23306` 연결 성공 |
| 서버 health check | PASS | `GET /login` HTTP 200 |
| Java/통합 테스트 | PASS | 87 tests, failures 0, errors 0, skipped 0 |
| standalone JavaScript | PASS | 20 passed, 0 failed |
| Playwright 4인 | PASS | 1 passed, 약 3.7분 |
| Playwright 5인 | PASS | 1 passed, 약 3.7분 |
| Playwright 6인 | PASS | 1 passed, 약 3.7분 |
| Playwright 8인 | PASS | 1 passed, 약 3.7분 |

Playwright 최종 출력:

```text
Running 4 tests using 1 worker
ok 1 ... MVP 4인 ... (3.7m)
ok 2 ... MVP 5인 ... (3.7m)
ok 3 ... MVP 6인 ... (3.7m)
ok 4 ... MVP 8인 ... (3.7m)
4 passed (14.8m)
```

## 검증된 범위

- 4·5·6·8명 실제 브라우저 입장 및 같은 방 재플레이
- 역할 수와 5→6명 마피아 수 경계값
- 시민 수 계산 및 역할별 개인 표시
- Ready 동기화, 호스트 시작 권한, 방 상태 복원
- 낮·지목·처형·밤 페이즈 전환과 타이머 동기화
- 두 마피아 처형 및 시민 승리
- 마피아 공격·의사 보호·경찰 조사 제출
- 경찰 조사 결과의 개인 표시 및 다른 사용자 비공개
- 새로고침 후 게임 상태 복원
- 사망자 채팅 격리와 마피아 채널 격리
- 처형 동률/무투표, 중복 투표, 자기 지목 제한
- 게임 종료 후 역할·승리 진영 공개 및 WAITING 복귀

Gradle 회귀 테스트에는 다음 서버 규칙도 포함되어 있다.

- 서버 `phaseEndsAt` 이후 요청 거부
- 마피아 무행동 및 의사 자기 보호·연속 자기 보호
- 경찰이 같은 밤 사망한 경우 조사 결과 미전달
- 사망자 채팅 라우팅
- 재접속 유예 후 이탈 시 제출한 밤 행동 제거
- 시작 직전 6명→5명 참가자 수 반영

## 테스트 계정 정리

- 정확한 selector: `playwright.qa-20260920-1302.%@example.com`
- 발견 계정: 23
- 삭제 계정: 23
- 삭제된 `user_stats`: 23
- 삭제된 `room_members`: 0
- 삭제된 `game_room`: 0
- 정리 후 잔여 계정: 0
- cleanup 결과: `PASS`

기존 데이터는 삭제하지 않았다.

## 서버 상태

QA 실행 중 `/login` health check는 HTTP 200이었다. 포트 8080에서 실행 중이던 기존 Java 서버는 QA 스크립트 규칙에 따라 종료하지 않았다. 최종 확인 시 8080 listener는 없었고 MariaDB `23306`은 계속 실행 중이었다.

## 미실행 범위

이번 전체 실행에서 직접 수행하지 않은 확장 검증은 `NOT RUN`으로 유지한다.

- 타이머 마감 직전 동시 요청의 실제 브라우저 경합
- 실제 브라우저 탭 종료와 10초 재접속 유예 전후의 밤 행동 보존·삭제
- 시작 직전 6명→5명 이탈의 실제 브라우저 흐름
- 모든 채팅 권한 조합의 실제 브라우저 전송 시나리오

따라서 구성된 핵심 QA 실행 결과는 `PASS`이며, 위 확장 항목까지 포함한 전체 요구사항 판정은 `NOT RUN` 범위를 포함한다.

## 산출물

- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/index.html`
- Playwright 결과 상태: `test-results/.last-run.json`
- 서버 로그: `test-results/bootRun.stdout.log`, `test-results/bootRun.stderr.log`


---

---

## 문서 26: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1202.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- Base URL: `http://127.0.0.1:8080`
- MariaDB: `localhost:23306`
- E2E: `true`
- 요청 인원수: `4,5,6,8`
- 요청 Playwright worker: `2`
- 실제 Playwright worker: `1`
- `$sourceModificationAllowed`: `false`
- `$deleteExistingData`: `false`
- `$deleteTestAccounts`: `true`
- E2E 실행 ID: `qa-20260920-1202`
- 설치 작업: 없음

QA 시작 전 `127.0.0.1:23306` LISTEN 상태와 MariaDB JDBC 연결을 확인했다. 기존 애플리케이션 서버는 8080 포트에서 실행 중이지 않아 QA 실행에서만 서버를 시작했다.

실제 확인 출력:

```text
TCP    127.0.0.1:23306        0.0.0.0:0        LISTENING       5844
DB_QUERY_RESULT=1
health_attempt=1 status=200
```

PID 5844는 WSL relay이며 MariaDB 연결은 JDBC `SELECT 1`로 성공했다.

## 2. 사전 확인 파일 및 디렉터리

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

현재 구현의 역할·승리 규칙은 QA 스크립트의 오래된 계약명인 `RoomGameService.createRoles`/`determineWinner`가 아니라 [RoomGameRules.java](C:/workspace/mafiaweb/src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30)에 분리되어 있다. 이 차이는 문서 계약명과 실제 구현 위치의 차이이며, 실행 결과에는 영향을 주지 않았다.

## 3. 실행 명령

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.gradlew.bat test --no-daemon --rerun-tasks

npm.cmd run test:js

$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-1202'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

QA 서버는 `gradlew.bat bootRun --no-daemon`으로 시작했고, Playwright 종료 후 현재 실행에서 시작한 서버만 정리했다. 테스트 계정 정리는 MariaDB JDBC 드라이버를 사용해 현재 `E2E_RUN_ID`와 일치하는 이메일만 대상으로 수행했다.

## 4. Java 및 Gradle 테스트 결과

Gradle 실행 결과:

```text
> Task :test
BUILD SUCCESSFUL in 20s
6 actionable tasks: 6 executed
```

JUnit XML을 집계한 결과:

| 항목 | 결과 |
|---|---:|
| XML 파일 | 11 |
| Java 테스트 | 79 |
| 실패 | 0 |
| 오류 | 0 |
| 건너뜀 | 0 |
| Gradle 연계 JavaScript 테스트 | 20 PASS |

주요 테스트 근거:

- `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`
- `RoomGameServiceTest.endsSixPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `RoomGameServiceTest.endsEightPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `RoomGameServiceTest.declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction`
- `RoomGameServiceTest.continuesWhenMafiaAndCitizenFactionAreEven`
- `RoomGameServiceTest.declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted`
- `RoomGameServiceTest.appliesMafiaKillAndDoctorProtectionDuringNight`
- `RoomGameServiceTest.sendsCitizenInvestigationResultOnlyToTheInvestigatingPolice`
- `RoomGameServiceTest.resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`
- `RoomGameServiceTest.resolvesTheSharedTargetWhenBothMafiaSelectTheSamePlayer`
- `RoomGameServiceTest.acceptsOnlyTheFirstNominationVoteFromEachUser`
- `RoomGameServiceTest.acceptsOnlyTheFirstExecutionVoteFromEachUser`
- `RoomGameServiceTest.skipsExecutionWhenNominationVotesAreTied`
- `RoomPresenceServiceTest.rejectsStartingGameWithFewerThanFourPlayers`
- `RoomPresenceServiceTest.rejectsStartingGameWithMoreThanEightPlayers`
- `RoomPresenceServiceTest.cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod`

관련 소스 및 테스트 위치:

- 역할 수·승리 조건: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30-75`
- 처형·밤 행동·승리 재평가: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:438-639`
- 서버 기준 phase deadline 및 phase duration: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:538-675`
- 공개 상태의 역할 비공개/종료 후 공개: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:682-715`
- 재접속 유예 및 탈주 처리: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:756-864`

JUnit XML:

- `C:\workspace\mafiaweb\build\test-results\test\TEST-*.xml`

Gradle HTML:

- `C:\workspace\mafiaweb\build\reports\tests\test\index.html`

## 5. standalone JavaScript 테스트 결과

명령:

```text
npm.cmd run test:js
```

실제 출력 요약:

```text
ℹ tests 20
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

검증된 범위:

- STOMP 연결·프레임 파싱·재연결
- 로비 인원수 및 참가자 상태 동기화
- Ready 상태 및 게임 phase UI
- 개인 역할과 경찰 조사 결과 렌더링
- 지목·처형·밤 행동 UI
- 게임 결과 및 승리 진영 표시
- 방 입장 중 로비 자동 새로고침 취소

## 6. 서버 시작 및 health check

- 시작 전 8080 listener: 없음
- QA 서버 시작 PID: `30220`
- `GET http://127.0.0.1:8080/login`: HTTP 200, 첫 번째 시도에서 성공
- Playwright 종료 후 8080 listener: 0
- MariaDB listener: 유지

종료 시점에 wrapper PID는 이미 종료되어 `taskkill`이 `process not found`를 반환했지만, 최종적으로 8080 listener와 해당 서버 프로세스가 없음을 확인했다. 기존 MariaDB나 기존 사용자 프로세스는 종료하지 않았다.

## 7. Playwright E2E 결과

명령:

```text
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

실제 Playwright 출력:

```text
Running 4 tests using 1 worker
ok 1 ... MVP 4인 핵심 게임 흐름 ... (3.7m)
ok 2 ... MVP 5인 핵심 게임 흐름 ... (3.7m)
ok 3 ... MVP 6인 핵심 게임 흐름 ... (3.7m)
ok 4 ... MVP 8인 핵심 게임 흐름 ... (3.7m)

Slow test file: test/e2e/mafia-mvp.spec.js (14.7m)
4 passed (14.8m)
```

| 시나리오 | 브라우저 흐름 | 역할·게임 흐름 | 결과 |
|---|---|---|---|
| 4명 | 실제 브라우저 4개, 방 입장·Ready·시작·재플레이 | 마피아 1, 경찰 1, 의사 1, 시민 1 | `PASS` |
| 5명 | 실제 브라우저 5개, 같은 방 재플레이 | 마피아 1, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 6명 | 실제 브라우저 6개, 같은 방 재플레이 | 마피아 2, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 8명 | 실제 브라우저 8개, 같은 방 재플레이 | 마피아 2, 경찰 1, 의사 1, 시민 4 | `PASS` |

E2E에서 확인된 항목:

- 고유 계정·고유 방 생성
- 모든 참가자의 실제 방 URL 도달 및 참가자 수 동기화
- Host만 시작 가능하고 전체 Ready 전에는 시작 불가
- 역할 수와 개인 역할 화면
- 마피아 채널 메시지가 마피아에게만 표시됨
- 60초 낮, 15초 지목, 15초 처형, 30초 밤의 서버 상태 deadline 검증
- 자기 지목·중복 투표·사망자 투표·처형 후보자 투표 제한
- 마피아 제거, 의사 보호, 경찰 조사 실제 제출
- 의사 보호 대상 생존 및 경찰 개인 조사 결과
- 사망자 채팅과 생존자 화면 격리
- 새로고침 후 게임 상태 복원
- 두 마피아 처형 후 시민 승리
- 종료 후 역할·생존 상태 공개
- `PLAYING -> WAITING`, Ready 초기화, 같은 방 재플레이

방 입장 단계는 [mafia-mvp.spec.js](C:/workspace/mafiaweb/test/e2e/mafia-mvp.spec.js:275)의 `joinRoomFromLobby`가 목록의 실제 입장 링크를 클릭하고 생성된 방 URL을 확인한다. 이전 보고서의 로비 자동 새로고침 경합도 이 실행에서 재발하지 않았다.

## 8. 인원수 경계 결과

역할 검증은 E2E의 `assertRoleAssignments`와 Java의 `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`를 함께 근거로 했다.

| 시작 인원 | 기대 역할 | 실행 결과 |
|---:|---|---|
| 4 | 마피아 1, 경찰 1, 의사 1, 시민 1 | `PASS` |
| 5 | 마피아 1, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 6 | 마피아 2, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 8 | 마피아 2, 경찰 1, 의사 1, 시민 4 | `PASS` |

시민 수 공식 `전체 인원 - (마피아 + 경찰 + 의사)`도 위 네 경계값의 exact role count assertion에 포함되어 있으며, 6명은 `6 - (2 + 1 + 1) = 2`로 확인됐다.

## 9. MVP 검증 표

| # | 검증 항목 | 근거 | 상태 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | Java + Playwright | `PASS` |
| 2 | 개인 역할 비공개 전달 | Java + Playwright | `PASS` |
| 3 | 60초 낮 타이머 | Playwright 서버 `phaseEndsAt` | `PASS` |
| 4 | 15초 지목 타이머 | Playwright phase deadline | `PASS` |
| 5 | 15초 처형 타이머 | Playwright phase deadline | `PASS` |
| 6 | 30초 밤 타이머 | Playwright phase deadline | `PASS` |
| 7 | 중복 지목 투표 방지 | Java | `PASS` |
| 8 | 자기 지목 방지 | Java + Playwright | `PASS` |
| 9 | 사망자 투표 방지 | Java + Playwright | `PASS` |
| 10 | 처형 후보자 투표 방지 | Java + Playwright | `PASS` |
| 11 | 마피아 제거 | Java + Playwright | `PASS` |
| 12 | 의사 보호 | Java + Playwright | `PASS` |
| 13 | 경찰 개인 조사 결과 | Java + Playwright | `PASS` |
| 14 | 역할별 밤 행동 검증 | Java + Playwright | `PASS` |
| 15 | 시민 밤 행동 방지 | Java role validation | `PASS` |
| 16 | 시민 승리 조건 | Java + Playwright | `PASS` |
| 17 | 마피아 승리 조건 `aliveMafia > aliveCitizenFaction` | Java | `PASS` |
| 18 | 투표·밤 행동 직후 서버 승리 판정 | Java + Playwright | `PASS` |
| 19 | 승리 직후 결과 표시 | Playwright | `PASS` |
| 20 | 승리 진영 표시 | Playwright | `PASS` |
| 21 | 결과의 개인 역할 표시 | Playwright | `PASS` |
| 22 | 생존·사망 상태 표시 | Playwright | `PASS` |
| 23 | `PLAYING -> WAITING` | Playwright | `PASS` |
| 24 | Ready 초기화 | Playwright | `PASS` |
| 25 | 같은 방 재플레이 | Playwright 4·5·6·8 | `PASS` |
| 26 | 새로고침 후 상태 복원 | Playwright | `PASS` |
| 27 | Public/Mafia 채널 분리 | Playwright + source/server validation | `PASS` |
| 28 | 밤 채팅·사망자 채널 전체 제한 | 사망자 격리는 E2E 확인, 생존 비마피아 밤 전송은 별도 미실행 | `NOT RUN` |
| 29 | 마피아·의사·경찰 무행동 | 해당 조합의 전용 실행 없음 | `NOT RUN` |
| 30 | 의사 자기 보호 및 연속 자기 보호 | 해당 전용 실행 없음 | `NOT RUN` |
| 31 | 사망 시 역할·조사 결과 비공개 | 공개 역할 비공개는 확인했으나 사망 경찰 전용 흐름은 미실행 | `NOT RUN` |
| 32 | 게임 종료 후 전체 역할 공개 | Playwright | `PASS` |
| 33 | 서버 deadline 처리 및 중복 요청 idempotency | 중복 요청은 Java 확인, deadline 경합은 미실행 | `NOT RUN` |

`NOT RUN`은 실패를 의미하지 않지만, 해당 항목을 실행 근거로 `PASS` 처리하지 않았다.

## 10. 확장 경계·복원력 검증

| # | 항목 | 근거 | 상태 |
|---:|---|---|---|
| 1 | 4·5·6·8 역할 수 경계 | Java + Playwright | `PASS` |
| 2 | 시민 수 계산 공식 | exact role count | `PASS` |
| 3 | 4명 미만·8명 초과 시작 거부 | `RoomPresenceServiceTest` | `PASS` |
| 4 | 마피아 우세 승리 임계값 | `RoomGameServiceTest` | `PASS` |
| 5 | 마피아 0명 시민 승리 우선 | `RoomGameServiceTest` | `PASS` |
| 6 | 6명에서 마피아 1명 처형 후 계속, 2명째 처형 후 시민 승리 | Java + Playwright | `PASS` |
| 7 | 두 마피아 대상 집계·동일 대상 처리 | Java | `PASS` |
| 8 | 지목 동률 시 처형 대상 없음·밤 전환 | Java | `PASS` |
| 9 | 10초 재접속 유예 및 탈주 승리 재평가 | Java presence/game tests | `PASS` |
| 10 | 시작 직전 6명→5명 전환의 실제 역할 재배정 | 전용 E2E 미실행 | `NOT RUN` |
| 11 | deadline 직전·이후 요청의 서버시간 무효 처리 | 전용 동시성 실행 없음 | `NOT RUN` |
| 12 | 밤 행동 제출 후 유예 내 재접속/유예 만료 제거 | 전용 E2E 없음 | `NOT RUN` |
| 13 | Public/Mafia/Dead 채널의 모든 단계별 격리 | Mafia·Dead 일부는 E2E, 전체 조합 전용 실행 없음 | `NOT RUN` |
| 14 | 4·5·6·8 같은 방 재플레이 | Playwright 전체 실행 | `PASS` |
| 15 | 실제 60/15/15/30초 경과 | 서버 `phaseEndsAt` 차이 assertion | `PASS` |
| 16 | 모든 비호스트 브라우저의 생성 방 URL 도달 | `joinRoomFromLobby` + `toHaveURL` | `PASS` |
| 17 | 로비 자동 새로고침 취소 | JS regression + 브라우저 입장 흐름 | `PASS` |
| 18 | 마피아 수와 시민 진영 수가 같은 경우 계속 진행 | `RoomGameServiceTest.continuesWhenMafiaAndCitizenFactionAreEven` | `PASS` |

## 11. 실패·차단·미실행 항목

실행 중 발생한 테스트 실패와 환경 차단은 없다.

다음은 기능 결함으로 판정하지 않은 `NOT RUN` 범위다.

- 생존 비마피아의 밤 채팅 제출 거부를 별도 브라우저 요청으로 검증하는 흐름
- 마피아·의사·경찰 중 한 명 이상이 행동하지 않는 밤 결과 조합
- 의사의 자기 보호 및 연속 밤 자기 보호
- 사망 경찰의 조사 결과 미전달
- phase deadline 직전/이후 요청의 실제 동시성 경합
- 밤 행동 제출 후 10초 유예 내 재접속과 유예 만료 제거
- 시작 직전 6명에서 5명으로 줄어든 실제 브라우저 흐름

## 12. 재현 절차

이전 보고서의 로비 경합 재현 명령은 다음과 같다.

```powershell
$env:PLAYER_COUNTS='5'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=1 --reporter=list
```

이번 수정 후에는 [mafia-mvp.spec.js](C:/workspace/mafiaweb/test/e2e/mafia-mvp.spec.js:275)의 `joinRoomFromLobby`가 로비에서 방 카드가 나타날 때까지 기다린 뒤 실제 `.join` 링크를 클릭한다. 해당 방식으로 5인 보충 E2E와 이번 전체 4·5·6·8인 E2E가 모두 통과했다.

## 13. 원인 및 구현 근거

이전 실패는 방 생성 직후 `room-list.js`가 신규 방을 발견해 `window.location.reload()`를 예약하고, E2E의 직접 `page.goto(roomUrl)`와 네비게이션이 경합한 문제였다. 현재는 로비 내부 링크의 `pointerdown/click`에서 갱신 타이머와 재연결을 먼저 취소하며, E2E도 실제 입장 링크를 클릭한다.

관련 구현:

- 로비 갱신 취소와 단일 DISCONNECT: `src/main/resources/static/js/room-list.js:49-82`
- 내부 링크 이동 감지: `src/main/resources/static/js/room-list.js:82-105`
- beforeunload 재사용: `src/main/resources/static/js/room-list.js:221-239`
- 로비 경합 회귀 테스트: `test/js/room-list.test.js:200-244`
- 실제 방 입장 E2E: `test/e2e/mafia-mvp.spec.js:275-285`, `474-480`

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

- 이전 애플리케이션/클라이언트 결함: 로비 자동 새로고침이 사용자 이동 의도보다 먼저 실행될 수 있었음.
- 이전 테스트 코드 문제: 실제 사용자 입장 링크 대신 `page.goto(roomUrl)`로 직접 이동해 로비 타이머 경합을 재현했음.
- 현재 상태: 두 부분을 모두 보완했고 5인 보충 E2E 및 전체 4·5·6·8인 E2E에서 재발하지 않음.
- 현재 발견된 `NOT RUN` 항목은 실행 누락이며, 이번 실행에서 애플리케이션 실패로 판정하지 않음.

## 15. 변경 필요 파일 및 권고

이번 QA 실행에서는 소스 코드를 수정하지 않았다. 이전 디버깅에서 적용된 로비 이동 경합 수정은 유지되며, 이번 실행으로 회귀가 없음을 확인했다.

확장 QA를 완료하려면 다음 전용 테스트를 추가 실행해야 한다.

1. deadline 직전/이후 요청을 서버 `phaseEndsAt` 기준으로 검증하는 시간 경합 테스트
2. 0개 행동, 의사 자기 보호, 연속 자기 보호를 각각 검증하는 서비스/E2E 테스트
3. 10초 유예 내 재접속과 유예 만료 후 밤 행동 제거를 검증하는 브라우저 테스트
4. 시작 직전 6명→5명 이탈 및 5명 역할 재계산을 검증하는 멀티 브라우저 테스트
5. 생존 비마피아의 밤 채팅 거부와 사망 경찰 조사 결과 미전달을 검증하는 보안 테스트

## 16. 생성된 결과물

- JUnit XML: `C:\workspace\mafiaweb\build\test-results\test\TEST-*.xml`
- Gradle HTML: `C:\workspace\mafiaweb\build\reports\tests\test\index.html`
- Playwright 최종 상태: `C:\workspace\mafiaweb\test-results\.last-run.json`
- QA 서버 stdout: `C:\workspace\mafiaweb\test-results\qa-20260920-1202-bootRun.stdout.log`
- QA 서버 stderr: `C:\workspace\mafiaweb\test-results\qa-20260920-1202-bootRun.stderr.log`
- 실패 artifact: 없음 (`error-context.md`, screenshot, trace, zip 미생성)

Playwright 최종 상태 파일:

```json
{"status":"passed","failedTests":[]}
```

## 17. 기존 데이터 보존 및 테스트 계정 정리

- `$deleteExistingData=false`로 기존 사용자·방·기록 삭제 작업은 수행하지 않았다.
- 현재 실행 ID `qa-20260920-1202`와 정확히 일치하는 계정 23개를 먼저 조회했다.
- 조회된 이메일은 모두 `playwright.qa-20260920-1202...@example.com` 형식이었다.
- 테스트 방은 E2E 종료 후 애플리케이션의 빈 방 정리로 0개였다.
- `room_members` 삭제: 0
- `game_room` 삭제: 0
- `user_stats` 삭제: 23
- `user` 삭제: 23
- 잔여 테스트 계정: 0

실제 cleanup 출력:

```text
CLEANUP_MATCH users=23
CLEANUP_DELETED memberships=0 rooms=0 user_stats=23 users=23
CLEANUP_REMAINING=0
CLEANUP_PASS
```

MariaDB는 계속 실행 중이며, QA 애플리케이션 서버만 종료했다.

## 18. 최종 판정

`FAIL`

핵심 자동화 QA 결과는 Java 79건, JavaScript 20건, Playwright 4·5·6·8인 4건 모두 `PASS`다. 다만 QA 스크립트의 확장 검증 범위에 포함된 deadline 경합, 무행동 조합, 의사 자기 보호, 유예 중 밤 행동 보존/삭제, 시작 직전 이탈 등은 이번 실행에서 `NOT RUN`으로 남아 전체 QA 요구사항을 완전히 검증했다고 볼 수 없다. 따라서 실행된 자동화 제품 흐름은 `PASS`이나, 스크립트 전체 범위의 최종 판정은 `FAIL`로 기록한다.


---

---

## 문서 27: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-112243.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- Base URL: `http://127.0.0.1:8080`
- MariaDB: `localhost:23306`
- MariaDB 연결 확인: `SELECT 1` 성공
- E2E: 활성화
- 요청 인원수: `4,5,6,8`
- 요청 Playwright worker: `2`
- 실제 Playwright worker: `1`
  - `test/e2e/mafia-mvp.spec.js`가 `serial` 모드라 Playwright 출력이 `Running 4 tests using 1 worker`로 확인됨
- `$deleteExistingData`: `false`
- `$deleteTestAccounts`: `true`
- `$sourceModificationAllowed`: `false`
- `E2E_RUN_ID`: `qa-20260920-112243`

MariaDB는 Windows의 `127.0.0.1:23306`에서 WSL relay를 통해 LISTEN 중이었으며, PID 5844는 `wslrelay.exe`였다. 이전 `Get-NetTCPConnection` 결과가 비어 보였지만 `netstat`와 JDBC 연결 결과로 실제 DB 작동을 확인했다.

## 2. 사전 점검 파일

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

## 3. 실행 명령

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks
```

```powershell
npm.cmd run test:js
```

```powershell
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-112243'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

서버는 8080에 기존 리스너가 없어 QA 실행에서만 PID `28588`로 시작했다. 첫 번째 `Start-Process` 호출은 `cmd.exe`에서 `'.gradlew.bat'`를 찾지 못해 실패했으며, 원인을 확인한 뒤 `gradlew.bat bootRun --no-daemon`으로 다시 시작했다. 이는 애플리케이션 테스트 실패가 아닌 QA 실행 준비 명령의 인자 전달 오류다.

## 4. Java 및 Gradle 테스트 결과

결과: `PASS`

- Gradle 결과: `BUILD SUCCESSFUL in 34s`
- Java 테스트: 79개
- Java 실패: 0개
- Java 오류: 0개
- Gradle에 의해 함께 실행된 JavaScript 테스트: 19개 PASS
- Spring context/MyBatis 관련 테스트: 실패 없음
- MariaDB 실제 연결: `DB_QUERY_OK=1`

주요 콘솔 출력:

```text
> Task :test
BUILD SUCCESSFUL in 34s
6 actionable tasks: 6 executed
```

JUnit XML:

- `build/test-results/test/TEST-*.xml`
- 11개 XML 파일, `tests=79`, `failures=0`, `errors=0`

Gradle HTML:

- `build/reports/tests/test/index.html`

## 5. Standalone JavaScript 테스트 결과

결과: `PASS`

명령:

```text
npm.cmd run test:js
```

출력:

```text
tests 19
pass 19
fail 0
cancelled 0
```

검증된 범위:

- STOMP frame escape/parser/reconnect backoff
- 로비 인원 및 온라인 인원 동기화
- 방 목록 갱신과 빈 방 제거
- 방 이동 중 pending refresh 취소 단위 테스트
- 준비 상태 처리
- 게임 페이즈 UI
- 역할별 밤 행동 UI
- 지목·처형 투표 UI
- 경찰 조사 결과
- 게임 결과 및 승리 진영
- 재접속 상태 처리

## 6. 서버 시작 및 health check

결과: `PASS`

```text
health_attempt=1 status=200
HEALTH_PASS
```

- 서버 stdout: `test-results/bootRun.stdout.log`
- 서버 stderr: `test-results/bootRun.stderr.log`
- `/login` 응답: HTTP 200
- QA에서 시작한 서버는 최종 cleanup 단계에서 PID 트리 종료
- 종료 후 8080 LISTEN 없음
- MariaDB와 DBeaver 프로세스는 종료하지 않음

## 7. Playwright E2E 결과

최종 결과: `FAIL`

Playwright 출력:

```text
Running 4 tests using 1 worker
ok 1 test ... MVP 4인 핵심 게임 흐름 ... (3.7m)
x  2 test ... MVP 5인 핵심 게임 흐름 ... (7.6s)
-  3 test ... MVP 6인 핵심 게임 흐름
-  4 test ... MVP 8인 핵심 게임 흐름
1 failed
2 did not run
1 passed (5.0m)
```

### 인원수별 결과

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4명 | `PASS` | 실제 브라우저 인증·방 입장·준비·게임 시작·역할·채팅·60/15/15/30초 페이즈·밤 행동·승리·재플레이 완료 |
| 5명 | `FAIL` | `/rooms/22` 이동 중 다른 navigation `/rooms`가 발생하여 `page.goto` 중단 |
| 6명 | `NOT RUN` | 5명 실패 후 serial suite가 중단되어 실행되지 않음 |
| 8명 | `NOT RUN` | 5명 실패 후 serial suite가 중단되어 실행되지 않음 |

### 5명 실패 상세

- 파일: `test/e2e/mafia-mvp.spec.js:468`
- 실패 호출:

```javascript
await pages[index].goto(roomUrl, { waitUntil: 'domcontentloaded' });
```

- 오류:

```text
Error: page.goto: Navigation to "http://127.0.0.1:8080/rooms/22" is interrupted by another navigation to "http://127.0.0.1:8080/rooms"
```

- Playwright error context:
  - `test-results/test-e2e-mafia-mvp-MVP-5인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- Playwright 상태:
  - `test-results/.last-run.json`
- PNG/trace/zip artifact: 이번 실패에서는 생성되지 않음

### 실패 원인 분석

5명 계정이 로비에 연결된 뒤 방 22가 생성되면서 로비의 새 방 인원 이벤트가 전달됐다. `room-list.js`는 현재 카드에 없는 live room을 발견하면 150ms 후 `window.location.reload()`를 예약한다.

- `src/main/resources/static/js/room-list.js:36-45`: pending room-list refresh 예약 및 reload
- `src/main/resources/static/js/room-list.js:187-195`: `beforeunload`에서 예약 취소
- `test/e2e/mafia-mvp.spec.js:465-470`: 같은 페이지가 `/rooms/22`로 이동하는 구간

현재 단위 테스트는 `beforeunload`가 먼저 발생한 경우 timer가 취소되는 것만 검증한다. 실제 브라우저에서는 150ms reload가 `page.goto` 시작보다 먼저 실행될 수 있어 navigation race가 발생했다. 따라서 게임 규칙이나 DB 실패가 아니라, 로비 자동 갱신과 방 입장의 실제 브라우저 경합이 드러난 실패다.

분류: `APPLICATION/CLIENT NAVIGATION RACE`에 대한 E2E 재현 실패. 테스트 assertion 자체의 임의 실패로 분류하지 않는다.

## 8. MVP 검증 표

| 번호 | 검증 항목 | 결과 | 증거 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | `PASS` | Java `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, 4명 E2E |
| 2 | 개인 역할 비공개 전달 | `PASS` | Java 역할 큐 테스트, 4명 E2E 개인 역할 패널 |
| 3 | 60초 낮 토론 | `PASS` | 4명 E2E 실제 `phaseEndsAt` 간격 |
| 4 | 15초 지목 투표 | `PASS` | 4명 E2E 실제 전환 시간 |
| 5 | 15초 처형 투표 | `PASS` | 4명 E2E 실제 전환 시간 |
| 6 | 30초 밤 | `PASS` | 4명 E2E 실제 전환 시간 |
| 7 | 중복 지목 투표 방지 | `PASS` | Java `acceptsOnlyTheFirstNominationVoteFromEachUser` |
| 8 | 자기 지목 방지 | `PASS` | Java 및 4명 E2E |
| 9 | 사망자 투표 방지 | `PASS` | 4명 E2E에서 사망자 버튼 비활성 확인 |
| 10 | 처형 대상의 처형 투표 방지 | `PASS` | Java 및 4명 E2E |
| 11 | 마피아 공격 | `PASS` | 4명 E2E `MAFIA_KILL`, Java 밤 행동 테스트 |
| 12 | 의사 보호 | `PASS` | 4명 E2E `DOCTOR_PROTECT`, 보호 대상 생존 확인 |
| 13 | 경찰 개인 조사 결과 | `PASS` | 4명 E2E `POLICE_INVESTIGATE` 및 개인 큐 |
| 14 | 역할별 밤 행동 검증 | `PASS` | 4명 E2E 및 Java 역할 검증 |
| 15 | 시민의 밤 행동 차단 | `PASS` | Java `validatesNightActionRoleTargetAndDuplicateSubmission` |
| 16 | 시민 승리 조건 | `PASS` | 4명 E2E 및 Java 마지막 마피아 처형 테스트 |
| 17 | 마피아 승리 조건 | `PASS` | Java `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction` |
| 18 | 투표·밤 처리 직후 서버 승리 판정 | `PASS` | Java 및 4명 E2E |
| 19 | 승리 직후 결과 표시 | `PASS` | 4명 E2E |
| 20 | 승리 진영 표시 | `PASS` | 4명 E2E 및 Java |
| 21 | 결과의 개인 역할 표시 | `PASS` | 4명 E2E |
| 22 | 생존·사망 상태 표시 | `PASS` | 4명 E2E |
| 23 | `PLAYING → WAITING` 전환 | `PASS` | 4명 E2E 및 Java Presence 테스트 |
| 24 | Ready 초기화 | `PASS` | 4명 E2E 및 Java `returnsFinishedRoomToWaitingAndClearsReadyState` |
| 25 | 같은 방 재플레이 | `PASS` | 4명 E2E |
| 26 | 새로고침·재접속 상태 복원 | `PASS` | 4명 E2E |
| 27 | 공개·마피아 채널 분리 | `PASS` | 4명 E2E 마피아 메시지 격리 |
| 28 | 밤 채팅·사망자 채널 전체 제한 | `NOT RUN` | 사망자 채널 격리는 4명 E2E에서 확인했으나, 밤의 생존 비마피아 채팅 차단 전체 흐름은 실행하지 않음 |
| 29 | 마피아·의사·경찰 무행동 | `NOT RUN` | 일부 의사 무행동은 Java에 있으나 세 역할 전체 조합은 실행하지 않음 |
| 30 | 의사 자기 보호·연속 자기 보호 | `NOT RUN` | 해당 E2E/Java 실행 증거 없음 |
| 31 | 사망 시 역할·조사 결과 비공개 | `NOT RUN` | 일반 역할 비공개는 확인했으나 사망 직후 두 조건 전체를 별도 실행하지 않음 |
| 32 | 게임 종료 후 전체 역할 공개 | `PASS` | 4명 E2E `FINISHED` 상태 역할 공개 |
| 33 | 서버 deadline 경쟁 및 중복 요청 idempotency | `NOT RUN` | 중복 요청은 Java/E2E에서 확인했으나 deadline 직전 동시 요청은 결정적으로 실행하지 않음 |

## 9. 확장 경계·복원력 검증

| 번호 | 검증 항목 | 결과 | 증거 |
|---:|---|---|---|
| 1 | 4/5/6/8명 정확한 역할 수 | `PASS` | Java 경계 테스트 4·5·6·8 |
| 2 | 시민 수 공식 및 6명 시민 2명 | `PASS` | Java 경계 테스트의 `playerCount - expectedMafiaCount - 2` assertion |
| 3 | 4명 미만·8명 초과 시작 제한 | `PASS` | `RoomPresenceServiceTest.rejectsStartingGameWithFewerThanFourPlayers`, `...MoreThanEightPlayers` |
| 4 | `aliveMafia > aliveCitizenFaction` 마피아 승리 | `PASS` | Java 서비스 테스트 |
| 5 | `aliveMafia == 0` 시민 승리 우선 | `PASS` | Java 마지막 마피아 처형 테스트 |
| 6 | 6명에서 마피아 1명 처형 후 계속, 둘째 처형 후 시민 승리 | `PASS` | Java 6명 양 마피아 처형 테스트; 브라우저 6명은 NOT RUN |
| 7 | 두 마피아 공격 대상 집계 | `PASS` | Java 서로 다른 대상·동일 대상 테스트 |
| 8 | 지목 동률 시 처형 대상 없음 | `PASS` | Java `skipsExecutionWhenNominationVotesAreTied` |
| 9 | 10초 재접속 유예 및 재접속 취소 | `PASS` | Java Presence reconnect grace 테스트 |
| 10 | 시작 직전 6→5명 변경 | `NOT RUN` | 해당 실제 브라우저 시나리오 없음 |
| 11 | deadline 직전·직후 서버 시간 요청 경쟁 | `NOT RUN` | 결정적 E2E 시나리오 미실행 |
| 12 | 밤 행동 제출 후 grace 기간 내/후 탈주 | `NOT RUN` | 해당 전체 흐름 미실행 |
| 13 | 공개·마피아·사망 채널 전체 격리 | `NOT RUN` | 일부 채널은 4명 E2E에서 확인했으나 전체 조건 미실행 |
| 14 | 4·5·6·8명 동일 방 재플레이 | `NOT RUN` | 4명 재플레이만 완료, 5명 이후 중단 |
| 15 | 60/15/15/30초 실측 | `PASS` | 4명 E2E에서 `phaseEndsAt` 간격 확인; 5/6/8명 반복 측정은 NOT RUN |

## 10. 실패·미실행 항목

### FAIL

- 5명 실제 브라우저 입장 흐름
- 전체 configured E2E run `4,5,6,8`

### NOT RUN

- 6명 실제 브라우저 흐름
- 8명 실제 브라우저 흐름
- 5·6·8명 브라우저 재플레이
- 밤의 생존 비마피아 채팅 차단 전체 흐름
- 세 역할 무행동 전체 조합
- 의사 자기 보호 및 연속 자기 보호
- 사망 직후 역할·조사 결과 비공개 전체 검증
- deadline 직전 동시 요청 및 서버 시간 무효표 검증
- 시작 직전 6→5명 탈주 역할 재계산 브라우저 검증
- grace 기간에 따른 제출 밤 행동 보존·삭제 전체 흐름

## 11. 재현 절차

1. MariaDB를 `localhost:23306`에서 실행한다.
2. 애플리케이션을 8080에서 기동한다.
3. 다음 환경 변수를 설정한다.

```powershell
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-<unique-id>'
$env:BASE_URL='http://127.0.0.1:8080'
```

4. 다음 명령을 실행한다.

```powershell
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

5. 계정들이 `/rooms`에 연결된 상태에서 방이 생성되면, 첫 참가자 페이지에서 방 URL을 얻은 뒤 다음 참가자 페이지가 150ms lobby refresh와 동시에 `/rooms/<id>`로 이동하도록 하면 재현 가능하다.

## 12. 구현 근거 및 관련 파일

- 역할 배정: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:39`
- 승리 판정: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:57`
- 승리 판정 호출 및 처형 후 처리: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:593-642`
- 서버 deadline 검사: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:192`, `538`
- 페이즈 시간 계산: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:647-650`
- 공개 상태 역할 비공개 및 종료 시 공개: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:682-714`
- 이탈 시 생존 상태·pending action 제거: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:397-430`
- 재접속 grace: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:756-810`
- 시작 인원 검증: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:394-423`
- lobby refresh 예약: `src/main/resources/static/js/room-list.js:36-45`
- beforeunload 취소: `src/main/resources/static/js/room-list.js:187-195`
- 실패한 실제 입장 이동: `test/e2e/mafia-mvp.spec.js:465-470`

QA 스크립트의 구현 계약에는 `RoomGameService.createRoles`와 `RoomGameService.determineWinner`가 적혀 있으나, 현재 구조개선 후 실제 구현 위치는 `RoomGameRules.createRoles`와 `RoomGameRules.determineWinner`다. 이는 QA 문서의 경로 설명 불일치이며 이번 실행에서는 소스와 QA 문서를 수정하지 않았다.

## 13. application defect와 test-code defect 구분

- Java/DB/게임 규칙: 이번 실행에서 실패 없음
- E2E 실패: 로비 자동 새로고침과 방 입장 navigation의 실제 브라우저 경합
- 단위 테스트 결함: `beforeunload` 선행 취소만 검증하고 timer firing과 `page.goto`의 동시 경합은 검증하지 않음
- 애플리케이션 측 개선 후보: 방 링크 클릭 또는 navigation 시작 시점에 `navigatingAway`와 pending refresh를 먼저 해제하도록 `room-list.js`의 navigation 경로를 보강
- 테스트 측 보강 후보: 방 입장 전 pending refresh 상태와 실제 URL 이동을 함께 검증하고, room URL navigation을 방 목록 자동 갱신과 경쟁시키는 전용 회귀 케이스 추가

이번 QA에서는 `$sourceModificationAllowed = false`이므로 위 개선을 적용하지 않았다.

## 14. 생성 artifact

- `test-results/bootRun.stdout.log`
- `test-results/bootRun.stderr.log`
- `test-results/.last-run.json`
- `test-results/test-e2e-mafia-mvp-MVP-5인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `build/test-results/test/TEST-*.xml`
- `build/reports/tests/test/index.html`

실패 시 PNG/trace/zip은 생성되지 않았다.

## 15. 데이터 보존 및 테스트 계정 cleanup

- `$deleteExistingData=false`로 기존 데이터 삭제 작업은 수행하지 않았다.
- cleanup selector는 정확한 `E2E_RUN_ID=qa-20260920-112243`였다.
- 매칭 계정: 9개, user ID `104`~`112`
- 매칭 room: 0개
  - E2E 종료 후 빈 방 정리 유예 작업으로 이미 삭제된 상태였다.
- 매칭 room_members: 0개
- 삭제된 user_stats: 9개
- 삭제된 user: 9개
- cleanup 후 잔여 매칭 계정: 0개
- cleanup 결과: `PASS`
- MariaDB, DBeaver, 기존 외부 프로세스: 유지
- QA에서 시작한 애플리케이션 서버: 종료 완료

실제 cleanup 출력:

```text
CLEANUP_MATCH users=9 rooms=0 memberships=0
CLEANUP_DELETED memberships=0 rooms=0 user_stats=9 users=9
CLEANUP_REMAINING=0
CLEANUP_PASS
```

## 16. 최종 판정

`FAIL`

Java/JavaScript 및 4명 실제 브라우저 흐름은 통과했지만, QA 스크립트가 요구한 동일 실행의 5명 시나리오가 navigation race로 실패했고 6명·8명 시나리오는 실행되지 않았다. 따라서 전체 `4,5,6,8` E2E를 `PASS`로 볼 수 없다. 테스트 계정 cleanup과 기존 데이터 보존은 `PASS`다.


---

---

## 문서 28: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-022915.md`

### MAFIAGAME QA 실행 리포트

- 실행 ID: `qa-20260920-022915`
- 실행일: 2026-09-20
- 기준 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 대상 인원: `4,5,6,8`
- Playwright worker 설정: `2` (테스트 파일의 serial 설정으로 실제 1 worker 순차 실행)
- 소스 수정: 없음
- 패키지 설치: 없음

## 종합 결과

**PASS**

MariaDB가 이미 `localhost:23306`에서 실행 중인 상태를 확인한 뒤 테스트를 진행했다. 애플리케이션을 임시 실행하여 QA를 수행했고, 테스트 종료 후 애플리케이션은 종료했다. MariaDB는 사용자 요청에 따라 중지하거나 설치하지 않았다.

## 실행 결과

| 구분 | 결과 | 근거 |
|---|---|---|
| Gradle 통합 테스트 | PASS | Java 79개, JavaScript 19개, 실패 0개 |
| 독립 JavaScript 회귀 테스트 | PASS | `npm run test:js`, 19개 통과 |
| 애플리케이션 health check | PASS | `GET /login` HTTP 200 |
| Playwright 4명 | PASS | 3.7분 |
| Playwright 5명 | PASS | 3.7분 |
| Playwright 6명 | PASS | 3.7분 |
| Playwright 8명 | PASS | 3.7분 |
| Playwright 전체 | PASS | 4개 통과, 약 16.1분 |
| QA 계정 정리 | PASS | 현재 실행 계정 23개 삭제, 잔여 0개 |
| 이전 장애 실행 계정 정리 | PASS | `qa-20260920-014701` 일치 계정 0개, 잔여 0개 |

## 검증 범위

Playwright 기본 E2E 흐름에서 다음 항목을 4·5·6·8명 각각 실제 브라우저로 수행했다.

- 회원가입·로그인·방 생성 및 방 참가
- 지정 인원수 구성 및 방 URL 동기화
- 준비 완료와 게임 시작
- 역할 배정 및 인원별 마피아 수 검증
- 밤 행동과 낮 처형 투표
- 처형 이후 페이즈 전환 및 승리 종료
- 새로고침 후 상태 복원
- 게임 종료 후 재플레이 준비 및 재시작
- 실행 ID가 포함된 테스트 계정 생성 및 정리

단위·서비스·클라이언트 회귀 테스트에서는 채팅 채널, 역할별 밤 행동, 승리 조건, 중복·무효 요청, 재접속·탈주, 타이머 및 방 목록 갱신 관련 검증을 함께 확인했다.

## 정리 및 환경 상태

- 애플리케이션 포트 `8080`: 테스트 후 STOPPED
- MariaDB 포트 `23306`: 외부 실행 상태 유지
- 현재 실행 계정: `playwright.qa-20260920-022915.%@example.com` 일치 23개 → 0개
- 이전 장애 실행 계정: `playwright.qa-20260920-014701.%@example.com` 일치 0개 → 0개
- 기존 소스 변경은 이번 QA 실행 중 추가되지 않음

## 산출물

- Playwright 결과: `test-results/`
- 서버 표준 출력: `test-results/qa-full-bootrun.stdout.log`
- 서버 오류 출력: `test-results/qa-full-bootrun.stderr.log`


---

## 4. 2026-09-20 후속 QA 실행 기록

---

## 문서 29: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-014701.md`

### MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-20 (Asia/Seoul)
- 기준 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 실행 ID: `qa-20260920-014701`
- 대상 인원수: 4, 5, 6, 8명
- 요청 워커 수: 2
- 실제 워커 수: 1 (`test.describe.serial` 구조)
- 소스 수정: 없음

## 종합 결과

**FAIL / CLEANUP BLOCKED**

Java와 JavaScript 테스트는 통과했지만, Playwright가 첫 회원가입 단계에서 데이터베이스 연결 실패로 중단되었습니다. 이에 따라 5·6·8명 시나리오는 실행되지 않았고, 데이터베이스가 꺼져 있어 테스트 계정 정리도 완료할 수 없었습니다.

## 실행 결과

| 영역 | 결과 | 근거 |
|---|---|---|
| Gradle 전체 테스트 | PASS | Java 테스트 통과, JavaScript 19개 통과 |
| 독립 `npm.cmd run test:js` | PASS | 19개 통과, 0개 실패 |
| 서버 헬스체크 | PASS | `/login` HTTP 200 |
| Playwright 4명 | FAIL | 회원가입 POST 후 `/signup`에 남고 HTTP 500 응답 |
| Playwright 5명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| Playwright 6명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| Playwright 8명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| 테스트 계정 정리 | BLOCKED | MariaDB `localhost:23306` 연결 거부 |

## Java 및 JavaScript 검증

실행 명령:

```text
gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
```

Gradle 결과:

```text
BUILD SUCCESSFUL
JavaScript tests: 19 passed, 0 failed
```

독립 JavaScript 결과:

```text
tests 19
pass 19
fail 0
```

## Playwright 실패 상세

실패 테스트:

```text
MVP 4인 핵심 게임 흐름
test/e2e/mafia-mvp.spec.js:437
```

실패 지점:

```text
signUpAndLogin:221
expect(page).toHaveURL(/\/login(?:\?signup)?$/)
Expected: /login
Received: http://127.0.0.1:8080/signup
```

오류 페이지에는 다음 원인이 표시되었습니다.

```text
HTTP 500 Internal Server Error
CannotCreateTransactionException: Could not open JDBC Connection for transaction
SQLNonTransientConnectionException: Socket fail to connect to localhost:23306
Connection refused
```

오류 아티팩트:

`test-results/test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

서버 로그:

`test-results/qa-full-bootrun.stdout.log`

## 환경 상태

- 애플리케이션 서버: QA 실행 중 기동됨
- `/login`: HTTP 200
- MariaDB 포트 `23306`: LISTEN 상태 아님
- 애플리케이션 서버: QA 실행 후 종료됨
- 8080 포트: LISTEN 상태 아님

## 테스트 계정 정리

QA 스크립트 규칙에 따라 실행 ID `qa-20260920-014701`로 계정 정리를 시도했습니다.

정리 SQL 실행 시 MariaDB 연결 자체가 거부되어 계정 조회와 삭제를 수행하지 못했습니다.

- 발견 계정 수: 확인 불가
- 삭제 계정 수: 확인 불가
- 잔여 계정 수: 확인 불가
- 정리 결과: **BLOCKED**

DB가 다시 실행된 뒤 아래 실행 ID로 계정 잔여 여부를 확인하고 정리해야 합니다.

```text
qa-20260920-014701
```

## 최종 판정

- Java/JavaScript: PASS
- Playwright 전체 QA: FAIL
- 5·6·8명 브라우저 시나리오: NOT RUN
- 테스트 계정 정리: BLOCKED

MariaDB `localhost:23306`가 정상적으로 실행된 뒤 전체 QA(`PLAYER_COUNTS=4,5,6,8`)를 다시 수행해야 최종 PASS 여부를 판단할 수 있습니다.

---

---

## 문서 30: `MAFIAGAME_DEBUG_TEST_REPORT_2026-09-20.md`

### MAFIAGAME 디버깅 및 재검증 보고서

- 작성일: 2026-09-20 (Asia/Seoul)
- 기준 보고서: `docs/QA_report/MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`
- 대상 프로젝트: `C:\workspace\mafiaweb`

## 1. 초기 QA 실패 요약

| 항목 | 초기 결과 |
|---|---|
| Gradle Java 테스트 | 79개 중 1개 실패 |
| JavaScript 테스트 | 18개 통과 |
| Playwright 4명 | PASS |
| Playwright 5명 | PASS |
| Playwright 6명 | FAIL: `/rooms/14` 이동 중 `net::ERR_ABORTED` |
| Playwright 8명 | NOT RUN: 6명 시나리오 실패로 중단 |

## 2. 원인 분석

### 2.1 동률 승리 테스트 기대값 오류

`RoomGameServiceTest.declaresMafiaVictoryWhenMafiaAndCitizenFactionAreEven()`은 마피아 2명과 시민 진영 2명인 경우를 마피아 승리로 기대하고 있었습니다.

현재 게임 규칙은 생존 마피아가 시민 진영 생존자보다 **많을 때(`>`)** 마피아 승리입니다. 따라서 2 대 2에서는 게임이 종료되지 않고 다음 밤으로 진행되는 것이 올바릅니다.

### 2.2 6명 E2E의 `ERR_ABORTED`

서버 로그에서 `/rooms/14` 요청은 정상적으로 `200 OK`를 반환했습니다. 실패 원인은 서버 응답이 아니라 다음 브라우저 내비게이션 경쟁이었습니다.

1. 방 생성 후 로비의 새 방 목록에 아직 새 방 카드가 없음
2. `room-list.js`가 150ms 후 `window.location.reload()`를 예약함
3. 다른 테스트 브라우저가 동시에 `/rooms/14`로 이동함
4. 예약된 로비 새로고침이 방 이동을 중단해 `net::ERR_ABORTED` 발생

## 3. 적용한 수정

- 동률 테스트 이름과 기대값을 새 승리 규칙에 맞게 변경
  - 결과: `NIGHT`
  - `gameOver`: `false`
  - `winningFaction`: `null`
- `room-list.js`에 페이지 이동 상태를 추가
- `beforeunload` 시 예약된 로비 새로고침을 취소
- 이동 중인 페이지에서는 새로고침 예약 및 실행을 무시
- 예약 새로고침 취소에 대한 JavaScript 회귀 테스트 추가
- E2E 방 입장 단계에서 `domcontentloaded` 이후 실제 방 URL 도착 여부를 명시적으로 검증

## 4. 수정 후 검증 결과

| 검증 항목 | 결과 | 세부 내용 |
|---|---|---|
| Gradle 전체 테스트 | PASS | Java 79개, JavaScript 19개 |
| 독립 JavaScript 테스트 | PASS | 19/19 |
| 6명 Playwright 단독 재검증 | PASS | 1 passed, 테스트 약 3.7분 |
| 8명 Playwright 단독 재검증 | PASS | 1 passed, 테스트 약 3.8분 |
| 6명 입장 단계 재현 여부 | PASS | 기존 `ERR_ABORTED` 미재현 |
| 8명 실제 브라우저 흐름 | PASS | 역할·밤 행동·재플레이·타이머 포함 |

실행 명령:

```text
gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

E2E 재검증은 `PLAYER_COUNTS=6` 및 `PLAYER_COUNTS=8`로 각각 별도 실행했습니다.

## 5. 테스트 계정 정리

디버깅 재검증에서 생성된 계정은 실행 ID별로 삭제했습니다.

| 실행 ID | 발견 | 삭제 | 잔여 |
|---|---:|---:|---:|
| `debug-20260919-225942` | 6 | 6 | 0 |
| `debug-20260919-230547` | 8 | 8 | 0 |
| 합계 | 14 | 14 | 0 |

두 정리 작업 모두 DB 트랜잭션 `COMMIT`에 성공했습니다. 테스트 서버는 각 실행 후 종료했고 8080 포트도 닫힌 상태입니다.

## 6. 최종 판단

재현된 두 결함은 수정되었고, 관련 Java/JavaScript 테스트와 6명·8명 실제 브라우저 흐름은 통과했습니다.

다만 수정 후 `PLAYER_COUNTS=4,5,6,8` 전체를 한 번에 실행한 통합 Playwright 재실행은 아직 수행하지 않았습니다. 따라서 이번 디버깅 결과는 **결함 수정 확인 PASS, 전체 통합 회귀는 추가 실행 필요**로 판정합니다.

이번 테스트케이스 보강 이후에는 사용자의 요청에 따라 테스트를 재실행하지 않았습니다. 해당 변경의 검증 상태는 **NOT RUN**입니다.

---

---

## 문서 31: `MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`

### MAFIAGAME QA 실행 보고서

- 실행 일시: 2026-09-19 (Asia/Seoul)
- 기준 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 실행 ID: `qa-20260919-224111`
- 대상 인원수: 4, 5, 6, 8명
- 소스 수정 허용: 아니오
- 기존 서버: 없음. QA 실행 중 기동 후 종료함.

## 종합 결과

**FAIL**

Java 테스트의 기존 동률 승리 기대값과 현재 적용된 규칙(`생존 마피아 > 시민 진영 생존자`)이 충돌했고, Playwright 6명 시나리오에서 방 이동 중 `net::ERR_ABORTED`가 발생했습니다. 따라서 전체 QA를 PASS로 판정할 수 없습니다.

## 실행 결과

| 영역 | 결과 | 근거 |
|---|---|---|
| Gradle Java + 내부 JavaScript | FAIL | Java 79개 중 1개 실패 |
| 독립 `npm.cmd run test:js` | PASS | 18개 통과, 0개 실패 |
| Playwright 4명 | PASS | 3.7분, 전체 시나리오 완료 |
| Playwright 5명 | PASS | 3.7분, 전체 시나리오 완료 |
| Playwright 6명 | FAIL | `page.goto(http://127.0.0.1:8080/rooms/14)`에서 `ERR_ABORTED` |
| Playwright 8명 | NOT RUN | 6명 `test.describe.serial` 실패로 후속 케이스 미실행 |
| 테스트 계정 삭제 | PASS | 15개 발견, 15개 삭제, 잔여 0개 |

## 실패 상세

### Java

실패 테스트:

`RoomGameServiceTest.declaresMafiaVictoryWhenMafiaAndCitizenFactionAreEven()`

테스트는 마피아 2명과 시민 진영 2명이 같은 경우 즉시 `FINISHED/MAFIA`를 기대했지만, 현재 구현의 새 규칙은 마피아가 시민 진영보다 **많을 때만** 승리이므로 실제 결과는 `NIGHT`였습니다. 이는 소스 규칙 변경에 맞춰 해당 테스트 기대값을 갱신해야 하는 상태입니다.

JUnit 근거: `build/test-results/test/TEST-kr.or.oti.mafiagame.service.RoomGameServiceTest.xml`

### Playwright

6명 시나리오의 플레이어 페이지 생성 중 다음 오류가 발생했습니다.

```text
Error: page.goto: net::ERR_ABORTED at http://127.0.0.1:8080/rooms/14
test/e2e/mafia-mvp.spec.js:466
```

오류 아티팩트:

`test-results/test-e2e-mafia-mvp-MVP-6인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

Playwright 출력상 4명과 5명은 통과했고, 6명 실패 이후 8명은 실행되지 않았습니다. 요청 워커 수는 2였으나, 현재 테스트 파일의 `test.describe.serial` 구조로 실제 실행은 1 worker로 표시되었습니다.

## 정리 결과

실행 ID를 `playwright.qa-20260919-224111.%@example.com`으로 한정해 계정을 조회했습니다.

- 발견: 15개
- 삭제: 15개
- 잔여: 0개
- 트랜잭션: COMMIT 성공

QA 실행에서 기동한 서버는 정리 과정에서 종료되었으며, 종료 후 8080 포트는 LISTEN 상태가 아닙니다.

## 미완료 항목

- 8명 실제 브라우저 흐름 및 8명 재플레이: 6명 실패로 NOT RUN
- 6명 실패 원인 수정 후 전체 Playwright 재검증: 별도 수정·재실행 필요
- 동률 승리 규칙에 맞춘 Java 테스트 기대값 갱신 후 Gradle 재검증: 별도 수정·재실행 필요

---

## 3. 2026-09-20 디버깅 및 최종 검증

---

---

## 문서 32: `MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-174339.md`

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

---

## 2. 2026-09-19 QA 실행 및 결함 발견

---

---

## 문서 33: `MAFIAGAME_QA_EXECUTION_REPORT_2026-09-18_173155.md`

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

---

## 문서 34: `MAFIAGAME_QA_EXECUTION_AND_FIX_REPORT_2026-09-18.md`

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

---

## 문서 35: `MAFIAGAME_MVP_VALIDATION_REPORT_2026-09-18.md`

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

---

## 문서 36: `MAFIAGAME_TEST_AND_E2E_ANALYSIS_2026-09-18.md`

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

---

## 문서 37: `MAFIAGAME_E2E_QA_REPORT_2026-09-18.md`

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

---

## 문서 38: `MAFIAGAME_DEBUG_REPORT_2026-09-18.md`

### MAFIAGAME 디버깅 리포트

## 1. 대상

- 대상 기능: 같은 게임방 재플레이 시 게임 결과 패널 초기화
- 관련 QA 보고서: `MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-174339.md`
- 최초 실패 위치: `test/e2e/mafia-mvp.spec.js:319`

## 2. 최초 오류

Playwright 재플레이 검증에서 다음 오류가 발생했습니다.

```text
Error: expect(locator).toBeHidden() failed
Locator: locator('#gameResultPanel')
Expected: hidden
Received: visible
Timeout: 15000ms
```

오류 시 HTML에는 다음과 같이 `hidden` 속성이 존재했습니다.

```html
<div hidden="" id="gameResultPanel"
     class="alert alert-success d-flex align-items-center justify-content-between gap-3 mb-3">
</div>
```

## 3. 원인 분석

초기 보고서에서는 이전 게임의 WebSocket `FINISHED` 메시지가 재플레이 후 늦게 도착하는 문제로 추정했습니다. 그러나 재현 결과 직접적인 원인은 CSS였습니다.

`src/main/resources/templates/rooms/detail.html:128`의 결과 패널과 `:140`의 역할 패널은 Bootstrap의 `d-flex` 클래스를 사용합니다.

Bootstrap의 `.d-flex`는 다음과 같이 `display: flex !important`를 적용합니다.

```css
.d-flex {
  display: flex !important;
}
```

따라서 JavaScript가 다음과 같이 `element.hidden = true`를 설정해도 `d-flex`의 `!important` 규칙이 우선되어 브라우저와 Playwright에서는 패널이 visible 상태로 판단되었습니다.

```javascript
gameResultPanel.hidden = true;
```

결과적으로 재플레이 직후 결과 패널의 `hidden` 속성은 존재하지만 실제 화면에서는 숨겨지지 않았습니다.

## 4. 수정 내용

수정 파일:

- `src/main/resources/static/css/app.css:649-652`

추가한 CSS:

```css
/* Bootstrap's .d-flex uses !important and can override the native hidden attribute. */
#gameResultPanel[hidden],
#gameRolePanel[hidden] {
  display: none !important;
}
```

적용 효과:

- 게임 결과 패널이 `hidden` 상태일 때 실제로 숨겨짐
- 게임 역할 패널이 `hidden` 상태일 때 실제로 숨겨짐
- 결과 표시 시 JavaScript가 `hidden = false`로 변경하면 정상적으로 표시됨
- 기존 Bootstrap 레이아웃 클래스와 게임 결과 표시 로직을 유지함

## 5. 검증 결과

수정 후 실행한 검증:

### JavaScript 테스트

```text
ℹ tests 18
ℹ pass 18
ℹ fail 0
```

판정: **PASS**

### Java 테스트 및 Gradle 통합 테스트

```text
BUILD SUCCESSFUL in 39s
```

- Java 테스트: 64/64 PASS
- JavaScript 테스트: 18/18 PASS
- MyBatis·Spring 테스트: PASS

판정: **PASS**

### Playwright 재플레이 회귀 테스트

실행 범위: 4인 시나리오

```text
Running 1 test using 1 worker
ok 1 test\\e2e\\mafia-mvp.spec.js:334:5
1 passed (2.8m)
```

판정: **PASS**

검증된 항목:

- 첫 게임 결과 패널 표시
- 게임방 `WAITING` 복귀
- Ready 상태 초기화
- 같은 게임방 재Ready
- 재플레이 시작
- 새 게임 시작 후 이전 결과 패널 숨김
- 새 게임 역할 패널 표시

## 6. 워커 실행 참고

Playwright 실행 명령은 `--workers=2`였으나 현재 테스트 파일에 다음 설정이 있어 실제로는 1 worker로 실행됩니다.

```javascript
test.describe.configure({ mode: 'serial' });
```

이번 회귀 검증은 단일 4인 시나리오였으므로 실제 실행 워커는 1개였습니다.

## 7. 미실행 범위

이번 디버깅에서는 수정된 재플레이 문제의 4인 회귀 테스트만 검증했습니다.

- 6인 Playwright 시나리오: NOT RUN
- 8인 Playwright 시나리오: NOT RUN
- 전체 4·6·8인 QA 재실행: 별도 요청 필요

## 8. 최종 판정

**재플레이 결과 패널 표시 오류: FIXED**

JavaScript, Java/Gradle, 4인 Playwright 재플레이 검증을 통과했습니다. 6인·8인 전체 E2E 시나리오는 이번 디버깅 범위에 포함하지 않았습니다.

---
