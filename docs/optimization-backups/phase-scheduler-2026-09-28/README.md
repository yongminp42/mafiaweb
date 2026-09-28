# 페이즈 스케줄러 최적화 백업 및 재적용 안내

## 현재 상태

2026-09-28에 성능 비교를 위해 적용했던 페이즈 스케줄러 병렬 처리 변경은 롤백했다. 현재 애플리케이션 코드는 작업자 한 개를 사용한다. 이 폴더에는 비교 보고서, 최적화 코드 스냅샷, 해당 변경 전용 패치, 테스트 코드, 측정 자료를 보존한다.

이 백업은 향후 재적용 검토를 위한 기록이다. 측정 결과는 고정 작업량을 사용한 로컬 실험 결과이며, 실제 게임·DB·WebSocket 경로의 운영 성능을 보장하지 않는다.

## 보관 파일

- `optimization-phase-scheduler-comparison-ko.html`: 롤백 전 최적화 구현을 대상으로 작성한 상세 비교 보고서
- `optimization-candidate-phase-scheduler-ko.md`: 병목의 배경과 원래 최적화 범위 문서
- `GamePhaseScheduler-four-worker-snapshot.java.txt`: 작업자 네 개, 방별 예약 작업 ID 검사를 포함한 최적화 적용 당시 전체 클래스
- `RoomGameService-scheduler-only.patch`: 페이즈 예약 콜백의 작업 ID를 확인하도록 한 변경만 담은 패치. 다른 사용자 변경은 포함하지 않는다.
- `GamePhaseSchedulerTest.java.txt`: 병렬 실행, 예약 교체·취소, 오래된 콜백 보호 테스트
- `measurement-evidence/`: 실행 환경, 벤치마크 소스, 434개 콜백 원자료, 집계표를 보관합니다. `classes/`, `gradle-test-report/`, `junit-xml/`은 재생성 가능한 빌드·테스트 산출물이므로 로컬 백업에는 남기되 Git 커밋에서는 제외합니다.

## 재적용 순서

1. 현재 브랜치와 작업 폴더의 미커밋 변경을 확인하고, 이 최적화를 다시 적용할 시점의 `RoomGameService` 내용을 살핀다.
2. `GamePhaseScheduler-four-worker-snapshot.java.txt` 내용을 `src/main/java/kr/or/oti/mafiagame/service/GamePhaseScheduler.java`에 적용한다. 이 클래스에 새로운 수정이 생겼다면 전체 덮어쓰기 대신 차이를 먼저 병합한다.
3. 저장소 루트에서 패치가 현재 파일에 맞는지 확인한 뒤 적용한다.

   ```powershell
   git apply --check docs/optimization-backups/phase-scheduler-2026-09-28/RoomGameService-scheduler-only.patch
   git apply docs/optimization-backups/phase-scheduler-2026-09-28/RoomGameService-scheduler-only.patch
   ```

   패치가 거부되면 파일 전체를 복원하지 말고 `advancePhase`와 `scheduleNextPhase`의 해당 부분만 현재 코드에 맞게 병합한다. 특히 `RoomGameService` 전체 파일을 백업본으로 덮어쓰지 않는다.
4. `GamePhaseSchedulerTest.java.txt`를 `src/test/java/kr/or/oti/mafiagame/service/GamePhaseSchedulerTest.java`로 복원한다.
5. 관련 테스트를 실행한다.

   ```powershell
   .\gradlew.bat test --tests "kr.or.oti.mafiagame.service.GamePhaseSchedulerTest" -x jsTest
   .\gradlew.bat test --tests "kr.or.oti.mafiagame.service.RoomGameServiceTest" -x jsTest
   .\gradlew.bat test
   ```

6. 성능 비교가 필요하면 `measurement-evidence/PhaseSchedulerBenchmark.java`와 당시 측정 조건을 확인한다. 측정 시점의 실험 조건은 Java 21.0.12, Windows 11, 고정 콜백 작업 50ms, 방 수 1·2·4·8·16개, 조건별 7회 반복이었다. 재실행 전 현재 코드와 환경을 확인하고 새 출력 폴더에 별도 결과를 남긴다.

## 다시 적용할 때 확인할 설계 포인트

- 서로 다른 방의 페이즈 콜백은 최대 네 작업자가 병렬 처리한다. 한 방의 상태 전환은 기존 `game.lock` 안에서 실행한다.
- 방별 예약 작업 ID를 사용해 예약이 교체되거나 취소된 뒤 늦게 시작한 구 콜백이 최신 예약을 완료 처리하거나 페이즈를 진행시키지 못하게 한다.
- 실행 중인 오래된 콜백과 새 예약이 겹치는 경우를 테스트한다. 단순히 작업자 수만 늘리면 이 경쟁 조건을 놓칠 수 있다.
- 작업자 네 개는 당시 비교에서 사용한 값이다. 운영 환경의 동시 방 수와 콜백 시간을 확인한 뒤 작업자 수를 다시 정한다.

## 당시 측정 결과와 해석

- 동시 4개 방: 대기 p95 202.836ms → 15.311ms (92.45% 감소)
- 동시 8개 방: 대기 p95 451.776ms → 77.915ms (82.75% 감소)
- 동시 16개 방: 대기 p95 941.283ms → 202.353ms (78.50% 감소)
- 동시 16개 방에서 콜백 처리 p50은 약 62ms로 비슷했다. 개선된 값은 고정 작업량 실험에서의 방 간 대기 지연이다.

이 실험은 예약 만료 시점부터 콜백 시작까지의 대기를 비교했다. 실제 운영 트래픽, DB 저장, WebSocket 전달, 특정 서버에서의 페이즈 지연은 별도로 측정하지 않았다. 따라서 보고서 수치로 실제 사용자가 체감하는 지연 개선량을 단정하지 않는다.

## QA 진행 상태

롤백 직전 QA 프로필 2는 환경 사전 점검까지만 진행했다. DB 읽기 연결과 로컬 테스트 도구의 준비를 확인했지만, Java/JavaScript 테스트, 애플리케이션 서버, Playwright 흐름은 실행하지 않았다. 사전 점검 자료는 당시 `output/test_output/2026-09-28/qa-run-qa-20260928-192705-490/`에 남아 있다.
