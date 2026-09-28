# MAFIAGAME Full QA 보고서

## 1. 실행 환경

- 실행 날짜: 2026-09-28
- 실행 ID: `qa-20260928-140303-full-blocked`
- 선택 프로필: Full (사용자 선택 3번)
- 선택 범위: 4·5·6·7·8인 핵심 게임 흐름과 각 인원수 재경기, 6인 복원력 시나리오 2건, 210건 채팅 스크롤, 8인 UI 검증
- 페이즈 프로필: `production`
- 최종 판정: **BLOCKED**

## 2. MariaDB 사전 점검 및 의존성

- Full 필수 데스크톱 진행 녹화 사전 점검: **BLOCKED**
- 최대화 PowerShell 시작은 PID 5668을 반환했지만, PowerShell 창은 데스크톱 창 목록에서 확인되지 않았다. 런처가 실행됐다는 실행별 폴더나 콘솔 전사도 생기지 않아 실제 화면 녹화를 시작했는지 검증할 수 없었다.
- 따라서 녹화 도구, MariaDB, Node 의존성 및 Playwright worker 검사는 실행하지 않았다.
- MariaDB 연결: **NOT RUN** (녹화 준비 게이트에서 중단)

## 3. 확인한 파일 및 디렉터리

- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`: Full 실행 범위, 녹화 우선 조건, 사전 점검, 테스트 및 정리 절차 확인
- `AGENTS.md`: Full 녹화가 준비되지 않으면 테스트를 시작하지 않고 한국어 BLOCKED 보고서를 남겨야 하는 규칙 확인
- 실행 부트스트랩 파일: `output/test_output/2026-09-28/qa-run-full-profile3-launcher/launch-full-qa.ps1`
- 이번 실행은 녹화 게이트에서 끝나 애플리케이션 소스·QA 테스트·DB 설정을 읽거나 변경하지 않았다.

## 4. 실행한 명령 및 결과

- `Start-Process -FilePath powershell.exe ... -WindowStyle Maximized -PassThru`: PID 5668 반환
- `Get-Process -Id 5668`: PowerShell 프로세스, 시작 시각 `2026-09-28T13:57:53.4237942+09:00`, 기본 창 제목 및 창 핸들 확인
- `sky.list_windows()`: PowerShell 창이 목록에 포함되지 않음
- 런처 PID는 이번 시작 시도의 프로세스이며 시작 시각도 일치함을 확인한 뒤 종료했고, 종료 후 프로세스가 없는 것을 확인했다.
- MariaDB·Gradle·Node·npm·Playwright·QA 서버 명령은 실행하지 않았다.
- 부트스트랩 시도 기록: `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/bootstrap-attempt.log`

## 5. Java 테스트

**NOT RUN** — Full 녹화 시작 게이트를 통과하지 못해 Gradle 테스트를 실행하지 않았다.

## 6. JavaScript 테스트

**NOT RUN** — Full 녹화 시작 게이트를 통과하지 못해 Node 테스트를 실행하지 않았다.

## 7. 서버 시작 및 상태 확인

**NOT RUN** — QA 애플리케이션 서버를 시작하지 않았다. 기존 프로세스나 포트를 종료·변경하지 않았다.

## 8. Playwright 실행 및 시나리오 목록

- 프로필: Full
- 인원수: `4,5,6,7,8`
- 재경기: 4·5·6·7·8인 각 1회
- 복원력: 6→5명 시작 직전 이탈, 재접속 유예·기한 경합
- UI: 210건 채팅 스크롤, 8인 레이아웃·프로필·방 설정
- 워커: `1`
- 페이즈: `production`
- 발견·실행: **NOT RUN** — 녹화 게이트 이전에 중단

## 9. 인원수별·복원력별 결과

| 범위 | 판정 | 근거 |
|---|---|---|
| 4인 흐름 및 재경기 | NOT RUN | 테스트 미실행 |
| 5인 흐름 및 재경기 | NOT RUN | 테스트 미실행 |
| 6인 흐름 및 재경기 | NOT RUN | 테스트 미실행 |
| 7인 흐름 및 재경기 | NOT RUN | 테스트 미실행 |
| 8인 흐름 및 재경기 | NOT RUN | 테스트 미실행 |
| 6→5 시작 직전 이탈 | NOT RUN | 테스트 미실행 |
| 재접속 유예·기한 경합 | NOT RUN | 테스트 미실행 |
| 채팅 스크롤 210건 | NOT RUN | 테스트 미실행 |
| 8인 레이아웃·프로필 | NOT RUN | 테스트 미실행 |

## 10. MVP 검증표

| MVP 항목 | 판정 | 근거 |
|---|---|---|
| 1–40: 역할, 게임 규칙, 타이머, 채널, 화면 및 복구 | NOT RUN | 테스트 미실행 |
| 41: Full 진행 시작·종료 화면 및 연속 영상 | BLOCKED | 필수 녹화를 시작하고 검증하지 못함 |
| 42–56: 방 설정, 권한, 역할 경계, 재접속, 통계 및 경험치 | NOT RUN | 테스트 미실행 |

## 11. 차단 항목 및 원인 분석

Full QA 지침은 DB 점검과 첫 테스트보다 먼저 전체 데스크톱 녹화를 시작하고, 전용 PowerShell 화면에 실제 진행과 최종 판정을 표시하도록 요구한다. PowerShell 실행 프로세스는 만들어졌으나 창 목록에서 화면을 확인하지 못했고, 실행별 콘솔 전사 및 MP4도 생성되지 않았다. 따라서 필수 녹화가 진행 중인 같은 화면에서 QA를 수행할 수 있는지 검증되지 않아 Full 시작 게이트에서 중단했다. 녹화 프로그램이 없다고 가정하지 않았고, 프로그램 존재 여부도 녹화 세션 안에서 검사하지 않았다.

재현 방법: 전용 PowerShell 창을 데스크톱 창 인벤토리에서 확인할 수 있도록 실행한 뒤, 같은 창에서 부트스트랩이 시작되는지 확인한다. 녹화 시작 마커·영상·콘솔 전사를 확인하고, 그 상태에서 새 실행 ID로 프로필 3을 다시 시작한다.

## 12. 테스트 계정 및 서버 정리

- 테스트 계정 정리: **NOT RUN** (이번 실행은 테스트 계정을 생성하지 않음)
- QA 서버 정리: **NOT RUN** (이번 실행은 QA 서버를 시작하지 않음)
- 부트스트랩 PowerShell 프로세스: 이번 실행의 PID 5668임을 확인해 종료하고, 종료 후 프로세스가 없음을 확인함

## 13. 최종 판정 및 산출물

**BLOCKED** — Full의 필수 데스크톱 녹화 시작을 확인할 수 없어 DB·테스트·서버 단계를 시작하지 않았다. 미실행 검사는 PASS로 판정하지 않았다.

- 연속 영상 경로 (미생성): `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/qa-progress-full.mp4`
- 시작 프레임 경로 (미생성): `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/qa-progress-start.png`
- 종료 프레임 경로 (미생성): `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/qa-progress-final.png`
- 녹화 로그 경로 (미생성): `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/qa-progress-recorder.log`
- 부트스트랩 점검 기록: `output/test_output/2026-09-28/qa-run-qa-20260928-140303-full-blocked/bootstrap-attempt.log`
