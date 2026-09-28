# MAFIAGAME QA 보고서 — 2026-09-28

- 포함 보고서 수: 7
- 정렬 기준: 실행 시각 오름차순
- 프로필 정책: Smoke·Regression은 Full 전용 데스크톱 진행 녹화를 요구하지 않으며, Full은 녹화 게이트를 통과하지 못하면 DB와 테스트를 시작하지 않는다.

## 실행 요약

| 실행 ID | 프로필 | 판정 | 핵심 결과 |
|---|---|---|---|
| `qa-20260928-124507-081-18a5` | Smoke | **FAIL** | Java 145건 중 4건 실패, Playwright core/UI 각 1건 실패. JavaScript 43건과 서버·계정 정리는 통과. |
| `qa-20260928-131742-991-f301` | Smoke | **PASS** | Java 145건, JavaScript 43건, 4인 core와 5인 UI 흐름, 서버·계정 정리 통과. |
| `qa-20260928-140303-full-blocked` | Full | **BLOCKED** | 전용 PowerShell 창 미확인으로 녹화 게이트에서 중단. 후속 검사는 모두 NOT RUN. |
| `qa-20260928-141448-946-149f` | Full | **BLOCKED** | PowerShell `Get-ExecutionPolicy` 보안 모듈 로드 실패로 시작 게이트에서 중단. |
| `qa-20260928-141752-234-7c3f` | Full | **BLOCKED** | `ffmpeg.exe` 또는 `ffprobe.exe` 미탐지로 녹화 게이트에서 중단. |
| `qa-20260928-144515-266-46a2` | Full | **BLOCKED** | FFmpeg가 종료되거나 유효한 녹화 파일을 생성하지 못해 녹화 사전 점검에서 중단. |
| `qa-20260928-151906-493` | Regression | **PASS** | Java 148건, core 3건, UI 2건 통과. 원문 기준 JavaScript는 44건 중 제품 로직 43건 통과였고, 문서 계약 검사 1건은 이후 수정 후 44건 전부 통과. |

## 판정 해석 및 후속 조치

- Smoke 첫 실행의 Java/Playwright 실패는 이후 같은 날 Smoke 재실행에서 해소되어, 후속 Smoke 실행은 PASS다.
- Full 네 실행은 모두 녹화 시작·검증 게이트에서 차단되었다. 따라서 Full의 MariaDB, Java, JavaScript, Playwright 결과를 PASS로 추정하지 않는다.
- Regression 실행은 9/27에는 MariaDB 연결 문제로 BLOCKED였고, 9/28에는 테스트·서버·계정 정리까지 완료되어 PASS했다.
- 9/28 Regression 원문 작성 시점의 `e2e-profile.test.js` 문서 계약 검사 실패는 테스트 코드 수정 후 `.\gradlew.bat jsTest --no-daemon` 및 `npm.cmd run test:js`에서 44/44 PASS로 재검증했다.

## 원문 목록

1. [Smoke — qa-20260928-124507-081-18a5](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-124507-081-18a5.md)
2. [Smoke — qa-20260928-131742-991-f301](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-131742-991-f301.md)
3. [Full — qa-20260928-140303-full-blocked](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-140303-full-blocked.md)
4. [Full — qa-20260928-141448-946-149f](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-141448-946-149f.md)
5. [Full — qa-20260928-141752-234-7c3f](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-141752-234-7c3f.md)
6. [Full — qa-20260928-144515-266-46a2](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-144515-266-46a2.md)
7. [Regression — qa-20260928-151906-493](./MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-151906-493.md)
