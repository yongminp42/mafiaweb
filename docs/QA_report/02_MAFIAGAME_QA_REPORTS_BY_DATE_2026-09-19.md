# MAFIAGAME QA 보고서 — 2026-09-19

- 포함 보고서 수: 1
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`

---

## 문서 1: `MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`

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
