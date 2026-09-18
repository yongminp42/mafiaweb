# MAFIAGAME 디버깅 리포트

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
