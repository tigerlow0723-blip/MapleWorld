# 영구 스크롤 보관소 및 무기 강화 연동 명세서 (permanent-scroll-ui-spec)

## 1. 목적 (Purpose)
'장비 등급 주문서'(9)와 '장비 확정 등급 주문서'(10)를 일반 인벤토리에 넣지 않고, 별도의 2칸짜리 전용 패널(ScrollPanel)에 영구 보관합니다. 해당 패널에 표시된 수량을 확인하고 드래그 앤 드롭을 지원하여 `weapon-upgrade-spec.md`에서 규정한 장비 강화 기능을 전담하도록 구조를 개편합니다.

## 2. 파일 목록 (File List)
- **수정 대상 파일**
  - `Scripts/PlayerManager.mlua` (스크롤 개수 스탯 보존 로직 추가)
  - `Scripts/ItemDisplayArea.mlua` & `ShopUI.mlua` (획득 또는 구매 시 스크롤 처리 로직 하이재킹)
  - `Scripts/InventoryUI.mlua` (기존 OnDragRelease 등에서 처리하려던 업그레이드 로직 제거/이관)
  - **[NEW]** `Scripts/ScrollInventoryUI.mlua` (2칸짜리 스크롤 UI 및 강화 드래그 전담)

## 3. 데이터 구조 (Data Structure)

### 3.1 PlayerManager 속성 추가
| 변수명 | 타입 | 설명 | 기본값 |
|---|---|---|---|
| `scrollNormal` | integer | 일반 주문서(ID: 9) 보유량 | 0 |
| `scrollGuaranteed` | integer | 확정 주문서(ID: 10) 보유량 | 0 |

## 4. 메서드 시그니처 및 변경 사항 (Method Signatures)

### 4.1 `Scripts/PlayerManager.mlua`
- **메서드**: `AddScroll(typeId: integer, amount: integer)`
  - **설명**: `typeId`가 9면 `scrollNormal` 증가, 10이면 `scrollGuaranteed` 증가.
- **메서드**: `UseScroll(typeId: integer, amount: integer) : boolean`
  - **설명**: 해당하는 스크롤 개수가 `amount`보다 크거나 같으면 차감하고 `true` 리턴. 모자라면 `false` 리턴.

### 4.2 `Scripts/ItemDisplayArea.mlua`
- **메서드**: `SellRemainingItems()`
  - **변경사항**: `itemEntity`의 `itemId`가 9나 10일 경우, 파기(Destroy) 전 골드로 50G 환산하는 방식에서 제외하고, `PlayerManager:AddScroll(itemId, 1)`을 호출한 뒤 `Destroy` 한다. 즉 남은 아이템 판매 버튼을 누르거나 스테이지가 종료되어 남은 아이템을 정리할 때 스크롤은 돈이 아니라 스크롤 인벤토리로 넘어간다.

### 4.3 `Scripts/InventoryUI.mlua`
- **의존성 분리**: 기존 `weapon-upgrade-spec.md`에서 구현하려던 `TryUpgradeItem` 로직을 지우고, 일반 인벤토리의 드래그&드롭에서는 장비 아이템의 이동만 전담한다.

### 4.4 `Scripts/ScrollInventoryUI.mlua` (신규 작성)
- **메서드**: `UpdateUI()`
  - **설명**: `PlayerManager`에서 `scrollNormal`과 `scrollGuaranteed` 값을 읽어 화면 2칸에 텍스트(`TextComponent.Text`)로 갱신한다. (ex: "x3")
  - 수량이 0이면 수량 텍스트를 "x0" (혹은 빈 텍스트)로 만들고, 아이콘의 알파값을 낮춰(반투명) 불활성화를 표현한다.
- **메서드**: `OnScrollDragAction(itemType: integer, touchPoint: Vector2)`
  - **설명**: 2개의 스크롤 UI 이미지 컴포넌트에 터치 릴리즈(`ScreenTouchReleaseEvent`) 콜백을 연결한다. 이벤트 릴리즈 시점의 `touchPoint` 아래에 강화 대상 무기 엔티티가 있는지 검사한다.
- **메서드**: `ProcessUpgrade(scrollId: integer, weaponTarget: Component)`
  - **수정 사항**: `weapon-upgrade-spec.md`에서 정의한 로직 (Legendary 판단 -> 확률 처리(20, 10, 5, 100) -> 실패 시 스크롤 소모 / 성공 시 스크롤 소모 후 `InitFromTable(next_upgrade_id)` 호출)을 이 클래스에서 직접 수행.

## 5. 이벤트 흐름 (Event Flow)
- **획득 시**: RewardChest 혹은 상점에서 남은 아이템 자동 판매(정산) 발동 -> 주문서(9,10)발견 -> 골드 대신 `PlayerManager:AddScroll` 호출됨 -> `ScrollInventoryUI:UpdateUI()` 갱신.
- **사용 시**: ScrollPanel 아이콘(9 혹은 10) 드래그 후 무기에 드롭 -> `PlayerManager:UseScroll`로 개수 소모 -> 확률 계산 -> 무기 진화 혹은 실패 로고 출력 -> `UpdateUI()` 갱신.

## 6. 특별 지시 사항
- 새롭게 추가되는 `ScrollInventoryUI.mlua`는 독립적으로 동작해야 하며, `UIMain.mlua`가 매 스테이지/턴 갱신될 때마다 `UpdateUI()`를 연쇄적으로 호출하도록 연결한다.
- 모든 스크립트 작성은 Python 등의 별도 파일 처리 유틸을 사용하지 않고 직접 mLua 파일로 생성한다.
