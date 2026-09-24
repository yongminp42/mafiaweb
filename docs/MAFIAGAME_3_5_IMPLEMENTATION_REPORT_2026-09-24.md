# MAFIAGAME 기능 구현 보고서 — 기능 리스트 3.5 (F-18~F-24)

- 작성일: 2026-09-24
- 대상: `docs/FEATURE_IMPLEMENTATION_LIST.md`의 3.5 변경 예정안 7개 항목
- 조사 방법: 현재 소스, DB 매퍼·마이그레이션, 테스트 코드와 작업 트리 변경 사항의 정적 대조
- 구현 코드에 대한 이번 보고서 작성 중 테스트 실행: 없음
- 전체 Full QA 상태: **BLOCKED** — MariaDB `127.0.0.1:23306` 연결 사전 점검 실패

## 1. 요약

3.5의 F-18~F-24는 현재 애플리케이션 소스와 관련 테스트 코드에 구현 내용이 들어 있다. 역할 구성, 첫 밤 시작, 설정 저장 모달, Spy 접선 여부를 반영한 parity 판정, 30초 재접속 유예, DuckDNS용 Linux 배포 구성, 게임 결과별 계정 통계가 각각 서버 로직 또는 운영 파일로 구현되어 있다.

아래 내용은 코드와 테스트 정의를 확인한 구현 보고다. 테스트 소스가 있다는 사실은 테스트가 통과했다는 뜻이 아니다. 2026-09-24 Full 프로필 실행은 DB 사전 점검에서 멈췄으므로 당시 F-18~F-24의 런타임 검증 결과는 없었다. 상세 실행 상태는 [2026-09-24 날짜별 QA 보고서](QA_report/07_MAFIAGAME_QA_REPORTS_BY_DATE_2026-09-24.md)에 기록되어 있다. 이후 Full QA의 실행 결과는 [2026-09-25 QA 보고서](QA_report/MAFIAGAME_QA_REPORT_2026-09-25_qa-20260924-232947.md)를 참고한다.

| 항목 | 현재 코드 상태 | 검증 상태 |
| --- | --- | --- |
| F-18 인원별 역할표 | 4~8명 변경안 반영 | 테스트 정의 존재, 이번 실행 미검증 |
| F-19 첫 페이즈 NIGHT | 역할 확인 완료 또는 타이머 만료 후 NIGHT, 첫 밤 종료 후 낮 | 테스트 정의 존재, 이번 실행 미검증 |
| F-20 설정 모달 저장 피드백 | 성공 시 redirect 뒤 모달 재개방, footer에 성공 안내 | 테스트 정의 존재, 이번 실행 미검증 |
| F-21 Mafia parity | 미접선 Spy 제외, 접선 Spy 포함, Mafia팀 전멸 시 시민 승 우선 | 테스트 정의 존재, 이번 실행 미검증 |
| F-22 재접속 유예 | 게임 중 마지막 세션 종료 후 설정 가능한 기본 30초 유예 | 테스트 정의 존재, 이번 실행 미검증 |
| F-23 DuckDNS | 갱신기·systemd service/timer·설치·진단 스크립트 제공 | 운영 서버 배포·DNS 확인 미수행 |
| F-24 계정 통계 | 완료 게임 단위 원자적·중복 방지 갱신과 프로필 표시 | DB 통합·E2E 실행 미검증 |

## 2. 항목별 구현 내용

### 2.1 F-18 — 4~8명 인원별 역할표

`RoomGameRules.createRoles`의 지원 인원별 고정 역할 목록을 변경안에 맞췄다. 역할 목록은 고정으로 두고 참가자 ID 목록을 섞어 각 역할이 배정되는 사용자를 무작위화하는 기존 구조는 유지했다.

| 인원 | 구현된 역할 구성 |
| ---: | --- |
| 4명 | Mafia 1, Police 1, Doctor 1, Citizen 1 |
| 5명 | Mafia 1, Police 1, Doctor 1, Citizen 2 |
| 6명 | Mafia 1, Spy 1, Police 1, Doctor 1, Soldier 1, Citizen 1 |
| 7명 | Mafia 2, Police 1, Doctor 1, Soldier 1, Medium 1, Citizen 1 |
| 8명 | Mafia 2, Spy 1, Police 1, Doctor 1, Soldier 1, Medium 1, Citizen 1 |

실제 차이가 있었던 5명·7명 구성을 수정했다. 5명에서는 Spy를 빼고 Citizen 슬롯을 하나 추가했다. 7명에서는 Spy를 빼고 Medium을 추가했다. 4명·6명·8명 구성은 유지했다.

주요 코드: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:41`의 `createRoles`, 역할 배정 진입점은 같은 파일의 `assignRoles`다.

테스트 정의: `src/test/java/kr/or/oti/mafiagame/service/RoomGameServiceTest.java:107`의 `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`가 4·5·6·7·8명 각각의 역할 개수와 구성을 비교하도록 작성되어 있다. 실제 테스트 결과는 이번 QA에서 얻지 못했다.

### 2.2 F-19 — 역할 확인 뒤 첫 밤부터 시작

게임 생성 시 서버는 기존처럼 먼저 `ROLE_ASSIGNMENT`를 열고 역할을 개인 큐로 전달한다. 모든 생존 참가자가 확인을 제출하면 즉시 첫 `NIGHT`로 넘어가며, 확인하지 않은 참가자가 있으면 역할 확인 타이머가 끝난 뒤 같은 첫 밤으로 넘어간다. 첫 밤 결과를 정산한 다음 `DAY_DISCUSSION`을 시작하도록 타이머 전이를 연결했다.

페이즈 전환은 서버의 `GamePhase`와 종료 시각을 기준으로 처리한다. 현재 기본 시간은 역할 확인 15초, 첫 밤 35초, 낮 토론 60초다. `MAFIAGAME_PHASE_PROFILE=short` 테스트 설정에서는 시간 검증을 빠르게 하도록 timed phase를 3초로 줄일 수 있다. Full 프로필은 production 시간을 사용한다.

주요 코드:

- 시작 상태와 개인 역할 전달: `RoomGameService.java:81`, 초기 `ROLE_ASSIGNMENT` 설정은 `RoomGameService.java:110`
- 모든 역할 확인 시 첫 밤 전환: `RoomGameService.java:232` 부근의 `submitAction`
- 역할 확인 타이머 만료 시 첫 밤 전환: `RoomGameService.java:695`의 phase timeout 처리
- 첫 밤 정산 후 낮 전환: `RoomGameService.java:772`의 `moveAfterNight`
- 기본 phase 길이: `src/main/java/kr/or/oti/mafiagame/dto/GamePhase.java:4`

테스트 정의: `RoomGameServiceTest.java:151`의 `confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms`, `:199`의 `startsTheFirstNightWhenTheRoleConfirmationTimerExpiresInRealTime`, `:252`의 `usesTheMvpServerDurationsForEveryTimedPhase`. 브라우저 게임 시나리오도 첫 `ROLE_ASSIGNMENT → NIGHT → DAY_DISCUSSION` 순서를 기다리고, Full에서는 첫 밤의 실제 종료 시간을 확인하도록 변경되어 있다.

### 2.3 F-20 — 설정 저장 성공 뒤 모달과 안내 유지

방 설정 POST 성공 시 컨트롤러가 flash attribute `roomSettingsSuccess`에 정확한 문구 `방 설정이 저장되었습니다.`를 저장하고 방 상세 페이지로 redirect한다. Thymeleaf 템플릿은 문구를 게임방 상단이 아니라 설정 모달 footer 왼쪽에 표시한다. 페이지 하단 스크립트는 성공 또는 오류 flash 값이 있으면 Bootstrap 설정 모달을 다시 연다. 따라서 redirect 후에도 사용자는 열린 모달 안에서 저장 결과를 확인할 수 있다.

설정 입력에는 4~8명 정원 선택, 비밀번호 켜기·변경·해제 기능이 포함되어 있다. 이 보고서의 F-20 구현은 저장 응답과 모달 표시 동작에 관한 내용이다. 정원·비밀번호의 서버 권한 검증은 기존 room settings 서비스 경로에서 처리한다.

주요 코드:

- 성공 flash 설정 및 redirect: `src/main/java/kr/or/oti/mafiagame/controller/RoomController.java:127`
- 모달 입력·footer 안내: `src/main/resources/templates/rooms/detail.html:249`
- flash 값에 따른 모달 재개방: `rooms/detail.html:442`

테스트 정의: `src/test/java/kr/or/oti/mafiagame/controller/RoomControllerTest.java:131`의 `savingRoomSettingsFlashesTheSuccessMessageForTheModal`은 controller flash 값과 redirect를 확인한다. `test/e2e/room-layout.spec.js:34`의 `waiting and started room layout (...)`은 브라우저에서 비밀번호 신규 설정·변경·해제 후 모달이 열려 있고 footer 안내가 표시되는지 확인하도록 작성되어 있다.

### 2.4 F-21 — Spy 접선 여부를 반영한 Mafia parity

승리 판정에서 생존 Mafia팀 전체 수와 parity 계산용 수를 분리했다. Spy를 제외한 Mafia팀 생존자는 parity 계산에 포함하고, Spy는 Mafia 조사로 접선이 완료되어 `mafiaChatUnlocked`가 true인 경우에만 parity 수에 포함한다. 시민 진영 생존자는 Mafia팀 역할이 아닌 생존자를 대상으로 계산한다.

승리 순서는 시민 진영 승리 조건을 먼저 검사한다. 생존 Mafia팀이 0명이면 parity 수치와 무관하게 시민 진영 승리다. 그 다음 `mafiaTeamAliveForParity >= citizenFactionAlive`이면 Mafia 진영 승리다. 따라서 동수 상황과 접선하지 않은 Spy 제외 규칙을 함께 처리한다.

주요 코드: `RoomGameRules.java:99`의 `determineWinner`, Spy contact 상태는 `RoomGameService.java:1101` 부근에서 설정되고 game player rule adapter에서 제공된다.

테스트 정의:

- `src/test/java/kr/or/oti/mafiagame/service/RoomGameRulesTest.java:14`의 `uncontactedLivingSpyDoesNotTurnMafiaMinorityIntoParityVictory`
- 같은 파일 `:25`의 `contactedLivingSpyCountsTowardMafiaParityVictory`
- `RoomGameServiceTest.java:717`의 `countsOnlyAContactedSpyTowardTheMafiaParityThreshold`
- `RoomGameServiceTest.java:655`의 `endsOneMafiaOneDoctorGameAtParityBeforeTheNightCanRepeat`

### 2.5 F-22 — 게임 중 30초 재접속 유예

게임방의 마지막 WebSocket 세션이 사라졌을 때에만 참가자 이탈 후보로 처리한다. 같은 사용자가 여러 세션을 열어 두었다면 남은 세션이 있는 동안에는 이탈 예약을 만들지 않는다. 게임 중 마지막 세션 종료 후 기본 30초를 예약하고, 같은 사용자 세션이 유예 안에 다시 등록되면 기존 예약을 취소한다.

유예가 만료되면 Presence 계층에서 세션이 없는 참가자를 제거하고 최신 참가 상태를 방송한 뒤 Game 계층에 이탈을 알린다. Game 계층은 플레이어를 사망 처리하고 지목·처형·밤 행동 대기열과 역할 확인 상태에서 제외한 다음 승리 조건을 재평가한다. 따라서 만료된 플레이어의 제출 행동이 다음 밤에 적용되지 않으며, 이탈만으로 게임 종료 조건이 충족되면 결과 전환도 가능하다.

유예 값은 `mafiagame.room.game-departure-grace-period` 설정으로 주입되며 기본값은 `30s`다. 테스트에서는 짧은 유예를 주입할 수 있어 시간 의존 로직을 분리해서 확인할 수 있다.

주요 코드:

- 기본값·설정 주입: `RoomPresenceService.java:47`, `RoomPresenceService.java:89`
- 재접속 때 예약 취소: `RoomPresenceService.java:230`
- 마지막 세션 종료 감지: `RoomPresenceService.java:661`
- 만료 예약: `RoomPresenceService.java:1030`; 유예 만료 시 참가 제거·Game 통지: `RoomPresenceService.java:1072`
- 이탈자의 행동 제거와 승리 재평가: `RoomGameService.java:540`
- 운영 기본값: `src/main/resources/application.properties:20`

테스트 정의: `src/test/java/kr/or/oti/mafiagame/service/RoomPresenceServiceTest.java:125`의 `cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod`, `RoomGameServiceTest.java:760`의 `removesAQueuedNightActionWhenAPlayerLeavesAfterReconnectGrace`, `test/e2e/mafia-mvp.spec.js:1526`의 `browser deadline, reconnect grace, and expired night action`이 있다. 이 테스트들은 이번 실행에서 돌지 않았다.

### 2.6 F-23 — DuckDNS 공인 IPv4 변경 대응

Linux 운영 환경용 파일을 `ops/duckdns/`에 추가했다.

- `update-duckdns.sh`: DuckDNS 갱신 URL에 직접 IP를 고정하지 않고 DuckDNS가 요청 출처의 공인 주소를 반영하도록 호출한다. 토큰은 `curl --config -` 표준 입력으로 전달해 명령행 인자에 넣지 않는다. 상태 파일에는 시도 시각, 마지막 성공 시각, `OK`/`KO`/`ERROR` 상태만 기록한다. 실패 응답에서는 마지막 성공 시각을 보존한다. `umask`와 파일 권한도 제한한다.
- `mafiagame-duckdns.service`: 네트워크 준비 뒤 한 번 실행하는 제한된 systemd oneshot 서비스다. 전용 동적 사용자, 격리 설정, `NoNewPrivileges`, 보호된 시스템 경로와 장치 설정을 사용한다.
- `mafiagame-duckdns.timer`: 부팅 30초 후 시작하고 마지막 실행 이후 5분마다 반복하며, 시스템이 일시 정지된 동안의 누락 실행을 보정하도록 `Persistent=true`를 사용한다.
- `install.sh`: root 권한을 확인한 뒤 updater·진단기·unit 파일을 설치한다. 환경 파일이 없으면 예제 파일을 소유자 전용 권한으로 배치한다. 예시 도메인·토큰이 남아 있으면 실제 값을 설정하라는 안내 후 종료하고, 값이 설정되어 있으면 timer를 enable/start한다.
- `diagnose-duckdns.sh`: 운영자가 공급한 현재 공인 IPv4, updater 결과, `dig` 또는 `nslookup`의 A 레코드를 순서대로 대조하도록 돕는다. 실제 공인 IP나 토큰을 코드에 포함하지 않는다.

자동화 테스트 `test/js/duckdns.test.js:14`에는 모든 플랫폼에서 설정 텍스트를 확인하는 정적 계약 테스트와 `:32`의 POSIX Bash mock curl 실행 테스트가 있다. 실행 테스트는 성공 `OK`·거부 `KO`·토큰 비노출·마지막 성공 시각 보존을 확인하며, Windows에서는 Bash 실행 테스트가 skip되도록 정의되어 있다.

운영 구성 파일의 주요 위치는 `ops/duckdns/update-duckdns.sh:1`(umask·설정 검증·갱신·상태 기록), `mafiagame-duckdns.service:1`, `mafiagame-duckdns.timer:1`, `install.sh:1`, `diagnose-duckdns.sh:1`이다.

**운영 한계:** 파일과 설치 절차가 저장소에 구현된 상태다. 이 작업 환경에서 Linux systemd에 설치하거나 timer를 enable하지 않았고, 실제 DuckDNS 계정, DNS 전파, 외부 접속도 확인하지 않았다. 따라서 F-23의 코드/배포물 구현과 실제 운영 배포 검증은 구분한다.

### 2.7 F-24 — 완료 게임별 계정 누적 통계

각 게임 인스턴스에 UUID `gameId`를 부여한다. 게임이 `FINISHED`가 되는 경로에서 모든 참가자에 대해 승리 여부를 계산해 `GameResultStatsService.recordCompletedGame`에 넘긴다. 승리 faction과 참가자 역할 faction을 비교하므로 접속이 끊겼거나 사망한 참가자도 완료 시점 참가 명단에 있으면 결과 집계 대상이다. 완료 전에는 이 경로를 호출하지 않는다.

`GameResultStatsService`는 Spring `@Transactional` 안에서 다음 순서로 처리한다.

1. game ID, 승리 faction, 참가자 목록과 중복 user ID 여부를 검증한다.
2. 고유 키인 `game_completion.game_id`에 완료 기록을 삽입한다.
3. 이미 존재하는 game ID이면 중복 완료 호출로 보고 통계 갱신 없이 반환한다.
4. 각 참가자의 `user_stats.total_games`와 승리 또는 패배 카운터를 증가시킨다. MyBatis upsert가 통계 행이 없을 때는 삽입하고, 있을 때는 기존 값에 더한다.
5. 중간 참가자 갱신이 실패하면 트랜잭션이 완료 기록과 통계 변경을 함께 rollback하도록 한다.

재경기는 새로운 `GameRoom`과 UUID를 사용하므로 정상 완료 시 통계를 한 번 더 올린다. 같은 게임 결과의 방송 재전달이나 서비스 재호출은 동일 game ID의 unique key로 중복 집계를 막는다. 사용자 프로필 서비스는 `user_stats`에서 총 게임·승리·패배를 읽으며 행이 없으면 기본 `UserStats` 값을 사용한다. 프로필 화면에는 세 숫자를 별도로 표시한다. 경기별 상세 이력 테이블은 이 F-24 요약 통계 범위에 포함하지 않았다.

주요 파일:

- `src/main/java/kr/or/oti/mafiagame/service/GameResultStatsService.java:23` — 입력 검증, transaction, 중복 완료 처리와 participant update
- `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:808` 부근 — 종료 시 outcome 생성·통계 기록 (`recordCompletedGame` 호출: `:817`)
- `RoomGameService.java:1164` — 게임별 UUID
- `src/main/java/kr/or/oti/mafiagame/dao/UserMapper.java:17` 및 `src/main/resources/mappers/UserMapper.xml:43` — completion 및 통계 SQL
- `src/main/resources/db/migration/V1__create_game_completion.sql:1` — 고유 게임 완료 테이블
- `mafiasql.sql`, `src/test/resources/schema.sql` — 개발·테스트 스키마 반영
- `src/main/java/kr/or/oti/mafiagame/service/UserService.java:25`, `src/main/resources/templates/users/detail.html:42` — 프로필 통계 조회·표시
- `build.gradle:25`, `application.properties:12` — Flyway dependency와 migration 설정

테스트 정의: `src/test/java/kr/or/oti/mafiagame/service/RoomGameServiceTest.java:216`의 `recordsOneOutcomeForEveryParticipantWhenTheGameFinishes`, `:244`의 `doesNotRecordStatisticsBeforeACompletedGame`, `src/test/java/kr/or/oti/mafiagame/dao/MapperIntegrationTest.java:46`의 `completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed`. 브라우저 core E2E는 완료 뒤 참가자별 총 게임·승패와 재경기 후 증가를 확인하도록 추가됐다.

## 3. 테스트·QA 코드 변경

구현 동작이 테스트 범위에 연결되도록 다음 변경이 들어 있다.

- `RoomGameServiceTest`: 새 역할표 5개 경계값, 역할 확인 이후 NIGHT 전환, 실시간 역할 타이머, 완료·미완료 통계, 접선 Spy parity 등을 검증하는 테스트 정의를 추가했다.
- `RoomGameRulesTest`: 미접선·접선 Spy의 parity 판단을 분리해 검증한다.
- `RoomPresenceServiceTest`: 30초 재접속 유예를 주입하고 유예 중 재접속 시 예약을 취소하는 테스트를 추가했다.
- `RoomControllerTest` 및 `test/e2e/room-layout.spec.js`: flash 메시지, 모달 재개방, 비밀번호 설정·변경·해제 후 안내를 검증한다.
- `MapperIntegrationTest` 및 `src/test/resources/schema.sql`: 완료 ID 중복 호출의 1회 집계와 PLAYING 방 재시작 복구 등 DB 매퍼 통합 조건을 추가했다.
- `test/e2e/mafia-mvp.spec.js`: 5·7명 역할 기대치, 첫 밤 순서, 실제 production 밤 시간, 게임 통계·재경기 및 30초 재접속 시나리오를 반영했다.
- `package.json`: DuckDNS 테스트를 JS 테스트 명령에 포함했다. `test/js/e2e-profile.test.js`는 QA runbook·패키지 명령·E2E profile 범위가 서로 일치하는지 정적으로 확인하도록 확장됐다.

이는 테스트가 실행 가능하도록 정의된 범위다. 아래 DB 사전 조건 때문에 통과 여부를 이번 보고서에서 주장하지 않는다.

## 4. 검증 상태와 한계

이전 사용자 요청에 따라 Full QA를 시작했으나 `Test-NetConnection`에서 `127.0.0.1:23306`이 연결 불가로 반환됐다. QA runbook의 규칙상 Java, JavaScript, Playwright discovery, 애플리케이션 서버 기동 전에 중단했다. MariaDB 설치·기동은 하지 않았다.

따라서 이번 보고서에서 말하는 구현은 소스·마이그레이션·테스트 코드의 정적 확인 결과다. 테스트 결과, DB migration 적용 결과, production phase 실제 시간, DuckDNS 외부 DNS 응답과 systemd 동작은 아직 검증되지 않았다. 관련 출력과 차단 사유는 `docs/QA_report/07_MAFIAGAME_QA_REPORTS_BY_DATE_2026-09-24.md`에 있다.

## 5. 기능 리스트 문서와 현재 구현 간 불일치

`docs/FEATURE_IMPLEMENTATION_LIST.md`의 3.5 제목은 현재 반영 상태를 설명하도록 변경됐지만, 내용은 이전 구현 상태를 기술한다. 현재 소스와 대조하면 아래 내용은 문서 동기화가 필요한 stale 설명이다.

- F-18: 현재 5명·7명 역할표가 변경안에 맞는데, 3.5.1 본문은 여전히 이전 역할표라고 적는다.
- F-19: 현재 역할 확인 뒤 첫 NIGHT 전이가 구현됐는데, 3.5.2는 DAY_DISCUSSION으로 시작한다고 적는다.
- F-20: 성공 문구 footer·모달 재개방이 구현됐는데, 3.5.3은 상단 메시지·이전 동작을 현재 상태로 적는다.
- F-21: parity에서 미접선 Spy를 제외하도록 구현됐는데, 3.5.4는 접선 여부와 무관하게 포함된다고 적는다.
- F-22: 설정 기본값이 30초인데, 3.5.5와 체크리스트 일부는 10초·미구현으로 남아 있다.
- F-23·F-24: updater·migration·계정 통계 코드가 존재하지만, 3.5.6·3.5.7 및 상위 기능 표·체크박스에는 미구현 표시가 남아 있다.

이 보고서 요청에 따라 구현 리스트 자체는 수정하지 않았다. 목록의 완료 표시와 “현재 동작” 문구를 맞추는 것은 별도 문서 갱신 작업으로 남는다. 운영 DNS와 DB 기반 QA가 막힌 점은 문서 표기와 별도로 유지해야 한다.

## 6. 최종 결론

F-18~F-24의 기능별 구현 코드는 현재 작업 트리에서 확인된다. 기능별 역할 배정·페이즈 전이·모달 피드백·승리 판정·재접속 예약·DuckDNS 운영 파일·중복 방지 통계 저장이 각각 관련 소스와 테스트 정의로 연결되어 있다.

다만 실행 검증은 완료되지 않았다. MariaDB 연결이 가능해진 뒤 Full QA를 재실행하고, DuckDNS는 별도로 Linux systemd 설치와 격리된 테스트 도메인으로 운영 검증해야 한다. 이후 `FEATURE_IMPLEMENTATION_LIST.md`의 stale 상태 설명도 구현 사실과 QA 결과에 맞춰 갱신해야 한다.
