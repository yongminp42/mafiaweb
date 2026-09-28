# MAFIAGAME QA 보고서 — 2026-09-27

- 포함 보고서 수: 1
- 정렬 기준: 실행 시각 오름차순

## 요약

| 실행 ID | 프로필 | 판정 | 차단 또는 결과 |
|---|---|---|---|
| `qa-20260927-182005-120` | Regression | **BLOCKED** | MariaDB `127.0.0.1:23306` 연결 실패. DB 사전 점검 후 Java, JavaScript, Playwright 및 서버를 실행하지 않음. |

## 원문

1. [MAFIAGAME_QA_REPORT_2026-09-27_qa-20260927-182005-120.md](./MAFIAGAME_QA_REPORT_2026-09-27_qa-20260927-182005-120.md)

미실행 항목은 PASS로 계산하지 않았다. Node fork 점검은 권한 허용 실행 문맥에서 통과했지만, MariaDB 필수 사전 점검 실패를 해소하지 못했으므로 Regression 실행 전체는 BLOCKED다.
