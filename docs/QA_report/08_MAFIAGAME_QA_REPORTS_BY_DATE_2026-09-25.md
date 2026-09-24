# MAFIAGAME QA 보고서 — 2026-09-25

- 포함 보고서 수: 1
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-25_qa-20260924-232947.md`

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
