# 무기 강화 시스템 설계서 (weapon-upgrade-spec)

## 1. 목적 (Purpose)
'장비 등급 주문서'(일반)와 '장비 등급 확정 주문서'를 인벤토리/장비창에 있는 무기 아이템에 드래그 앤 드롭하여 등급을 올리는 시스템을 구현한다.

## 2. 파일 목록 (File List)
- **수정 대상 파일**
  - `Scripts/Item.mlua` (데이터 로딩 및 속성 추가)
  - `Scripts/InventoryUI.mlua` (드래그 앤 드롭 처리)
  - `Scripts/Inventory.mlua` (아이템 소모 처리)

## 3. 데이터 구조 (Data Structure)

### 3.1 Item 속성 추가 사항
| 변수명 | 타입 | 설명 | 기본값 |
|---|---|---|---|
| `grade` | string | 장비의 등급(Rare, Epic, Unique, Legendary). 데이터 테이블에서 추출. | "" |
| `next_upgrade_id` | integer | 강화를 통해 한 단계 올랐을 때 변환될 아이템 ID. 없으면 0. | 0 |

## 4. 메서드 시그니처 및 변경 사항 (Method Signatures)

### 4.1 `Scripts/Item.mlua` 변경 사항
- **메서드**: `InitFromTable(itemId: integer)`
  - **설명**: 아이템 테이블에서 데이터를 긁어와 초기화할 때, `grade` 와 `next_upgrade_id` 값을 파싱해 본인 Property에 캐싱한다.
  - **주의 사항**: `Data_Table - 아이템 - 장비` 의 21번째 열(`grade`), 22번째 열(`next_upgrade_id`) 파싱 로직 추가.

### 4.2 `Scripts/InventoryUI.mlua` 추가 사항
- **메서드**: `TryUpgradeItem(touchPoint: Vector2) : boolean`
  - **파라미터**: `touchPoint` (드롭한 화면 좌표)
  - **반환값**: 업그레이드 액션이 수행되었으면 `true`, 그렇지 않으면 `false`
  - **동작 설명**: 현재 드래그 중인 아이템(`dragState.itemEntity.Item`)이 강화 주문서(단축 ID: 9 혹은 10)인지 판별한다. `touchPoint` 아래에 강화 대상 무기 엔티티가 있는지 검사한다. 강화 조건을 충족하면 `ProcessUpgrade`를 호출한다.

- **메서드**: `ProcessUpgrade(scrollItemTarget: Component, weaponTarget: Component)`
  - **설명**: 주문서로 지정된 무기를 강화하는 실제 로직과 확률 처리 및 결과 연출을 담당한다.
  - **로직 흐름표**
    1. `scrollItemTarget`의 `itemId`가 9(일반 주문서)인지 10(확정 주문서)인지 판별.
    2. 무기의 `next_upgrade_id`가 0이거나 `grade`가 "Legendary"라면, 로그오류(영어)를 출력하고 강화 중단.
    3. 일반 주문서(9)일 경우 확률 체크:
       - Rare(20%), Epic(10%), Unique(5%)
       - 확률 판정 실패 시: 주문서 1개 소모 함수 호출, 강풍/사운드 등 실패 로그만 남김, 종료.
    4. 확률 판정 성공 혹은 확정 주문서(10)일 경우:
       - 주문서 1개 소모 함수 호출.
       - 타겟 무기 엔티티의 `Item` 컴포넌트 데이터 및 UI(Grid 내용)를 `next_upgrade_id`로 재초기화.
       - 성공 로그 출력.

### 4.3 `Scripts/InventoryUI.mlua` 기존 코드 수정
- **메서드**: `OnDragRelease(event: ScreenTouchReleaseEvent)`
  - **수정 설명**: 타겟 빈 공간에 Drop하기 전, 먼저 `TryUpgradeItem(touchPoint)` 함수를 호출하여, 대상 위치에 무기가 있어서 강화를 시도했는지 판별. 시도했다면 드롭 처리를 멈추고 `EndDrag()` 호출 후 종료.

## 5. 이벤트 흐름 (Event Flow)
- 플레이어가 인벤토리에서 주문서 터치 (OnPointerHold/OnDragMove)
  -> 목표 무기 위에 위치시킨 뒤 손을 뗌 (OnDragRelease)
  -> `InventoryUI`에서 `TryUpgradeItem` 진입
  -> UI 위치 상 무기가 존재하고, 드래그 객체가 9/10번 아이템이면 `ProcessUpgrade` 실행
  -> 결과에 따라 무기가 변환되거나 및 주문서가 사라짐 (Grid/UI Update)

## 6. 특별 지시 사항 (TD Rules Enforcement)
- 코드 블록: 메서드 구현부를 생성할 때 모든 텍스트 코드는 mLua 룰을 따른다.
- 언어 규칙: `log()`의 메시지나 주석은 영문(US)으로 작성한다.
- 강제하지 않은 세부 UI 연출이나 Effect는 스펙이 없으므로 일단 생략하거나 기본 콘솔 로그에 영어로 표시하여 가시화한다.
