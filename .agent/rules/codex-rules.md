# Codex 실무 프로그래머 Rules

## 역할 정의
- **직책**: 실무 프로그래머
- **지시 수령**: TD (Antigravity)가 작성한 작업 명세서
- **작업 범위**: 명세서에 기재된 내용만 구현 (임의 판단 금지)

## 작업 절차
1. `.agent/specs/` 폴더의 명세서를 읽는다
2. 명세서에 기재된 파일을 생성/수정한다
3. 아래의 mLua 규칙을 반드시 준수한다
4. 완료 후 변경 내역을 보고한다

## mLua 필수 규칙

### 파일 구조
```lua
@Component
script 컴포넌트이름 extends Component

-- property 선언부
property 타입 이름 = 기본값

-- method 선언부
@ExecSpace("ClientOnly"|"ServerOnly"|"Client,Server")
method 반환타입 메서드이름(파라미터타입 파라미터이름)
    -- 구현
end

end
```

### 문법 제약
- **⚠️ 영어 전용(Only English) 원칙**: 스크립트 내부의 모든 주석, `log()` 출력문, 문자열 등은 반드시 **영어(English)**로만 작성한다. 한글을 포함하면 인코딩 오류(EUC-KR)로 인해 스크립트가 파괴된다. (단, 메이커의 데이터 테이블명 등 불가피한 시스템 참조명 예외)
- **반환 타입은 1개만**: `method integer, integer Foo()` ❌ → `method table Foo()` ✅
- **continue 사용 가능**: 표준 Lua에는 없지만 mLua에서는 사용 가능
- **복합 대입 연산자 사용 가능**: `+=`, `-=`, `*=`, `/=`
- **coroutine 사용 불가**
- **super 대신 `__base`** 사용
- **전역 변수 대신 Property** 사용

### ExecSpace 규칙
- UI 관련 코드: `@ExecSpace("ClientOnly")`
- 게임 데이터 변경: `@ExecSpace("ServerOnly")`
- 양쪽 실행: `@ExecSpace("Client,Server")`

### @Sync 규칙
- UI 엔티티(`/ui` 아래)에서는 `@Sync` 사용 금지 (클라이언트 전용이라 동작 안 함)
- 월드 엔티티에서만 `@Sync` 사용

### UI 이벤트 규칙
- **UI 엔티티 터치**: `UITouchReceiveComponent` + `UITouchDownEvent` 사용
- **UI 버튼 클릭**: `ButtonComponent` + `ButtonClickEvent` 사용
- **월드 엔티티 터치**: `TouchReceiveComponent` + `TouchEvent` 사용
- ❌ UI 엔티티에 `TouchReceiveComponent` 금지

### 색상 적용
- `SpriteGUIRendererComponent`의 색상 속성: `Color` (❌ `ImageColor` 아님)
- 이미지 설정: `ImageRUID` 속성에 RUID 문자열 대입

### 좌표 변환
- UI 전역 좌표: `_UILogic:ScreenToUIPosition(screenPos)` — 최상위 UI 기준
- UI 로컬 좌표: `_UILogic:ScreenToLocalUIPosition(screenPos, parentUITransform)` — 특정 부모 기준
- `anchoredPosition`은 부모 기준이므로 반드시 `ScreenToLocalUIPosition` 사용

## 파일 위치 규칙
- mLua 스크립트: `Test_BackPack/RootDesk/MyDesk/` 에 저장
- CSV 데이터: `Test_BackPack/RootDesk/MyDesk/` 에 저장
- 명세서/문서: `.agent/specs/` 에 저장
