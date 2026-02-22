# 아이템 툴팁 창 구현 명세서 (item-tooltip-spec)

## 1. 목적 (Purpose)
아이템 위에 마우스를 1초간 올려두거나(Hover), 드래그 앤 드롭 홀딩 상태가 아닐 때 우클릭(Right-Click)을 하면 해당 아이템의 상세 정보를 보여주는 툴팁 UI를 화면에 띄웁니다. 주어진 디자인 레퍼런스를 바탕으로 아이템의 이름, 이미지, 형태(ShapeMask), 등급, 스탯, 코스트 등을 규격화하여 표시합니다.

## 2. 파일 목록 (File List)
- **수정 대상 파일**
  - `Scripts/InventoryUI.mlua` (그리드 내 아이템 엔티티에 Hover 타이머 및 우클릭 이벤트 리스너 추가)
  - `Scripts/ItemDisplayArea.mlua` (보유 전 바닥에 떨어진 아이템 또는 인벤토리 외 아이템에 대한 이벤트)
  - **[NEW]** `Scripts/ItemTooltipUI.mlua` (툴팁 내용 연동 및 UI 위치 변경 로직)

## 3. UI 구조 (UI Structure)
UI 에디터에서 `TooltipPanel` 이라는 최상위 패널 안에 아래 구성요소들을 배치합니다.
| 컴포넌트 엔티티 이름 | 타입 (Component) | 설명 |
|---|---|---|
| `TooltipPanel` | UIEmpty | 툴팁 전체 패널 (기본 숨김 처리 DefaultShow = false) |
| `Bg` | SpriteGUIRenderer | 반투명 검은색 둥근 사각형 베이스 |
| `NameText` | TextComponent | 맨 위 가로 전체. 아이템 이름 (굵게, 큰 글씨) |
| `ItemImage` | SpriteGUIRenderer | 중앙 부근. 아이템 이미지 RUID 반영 |
| `TypeText` | TextComponent | 이미지 좌측 하단. 아이템의 타입 (예: Weapon, Armor) |
| `GradeText` | TextComponent | 이미지 우측 하단. 아이템 등급 (예: 레어) 및 등급별 색상 |
| `ShapeGrid` | UIEmpty | 우측 상단. 파란색 사각형으로 ShapeMask(모양) 표시 |
| `Divider` | SpriteGUIRenderer | 중앙 가로선 구분선 (얇은 실선) |
| `StatsText` | TextComponent | 구분선 아래. 공격력: x, 치명타 등 스탯 나열 |
| `CostText` | TextComponent | 맨 아래. "공격 시 소모 MP: X" (하늘색 `#87CEEB` 텍스트) |

### 3.1 아이템 등급별 텍스트 색상 (Grade Color)
- Rare: 하늘색 (Blue/Cyan 계열)
- Epic: 보라색 (Purple)
- Unique: 노란색/금색 (Yellow)
- Legendary: 초록색 (Green) 
*(참고: 추후 PD 요청에 따라 색상 코드(#) 수정 가능)*

## 4. 메서드 시그니처 및 변경 사항 (Method Signatures)

### 4.1 `Scripts/ItemTooltipUI.mlua` (신규)
- **메서드**: `ShowTooltip(itemId: integer, screenPos: Vector2)`
  - **설명**: `DataManager`를 통해 `itemId`에 해당하는 `itemData`를 읽어온 뒤, 위 UI 구조의 각종 `Text` 및 `ImageRUID`를 세팅합니다.
  - **세팅 규칙**:
    1. 스탯 텍스트는 `atk`, `critRate`, `critDmg` 등이 0이 아닐 때만 개행(`\n`)을 포함하여 문자열을 합쳐서 `StatsText`에 입력.
    2. `CostText`는 `itemData.cost` 값으로 "공격 시 소모 MP: [값]" 입력.
    3. `ShapeGrid` 하위에 있는 사각형 이미지들을 지우고 `itemData.shapeMask`를 기반으로 파란색 정사각형 이미지를 가로세로 좌표에 맞게 소환하여 모양을 그려줍니다.
    4. 툴팁의 위치 좌표(UITransformComponent.anchoredPosition)를 터치 위치(`screenPos`)에서 살짝 우측 하단 혹은 마우스를 가리지 않는 위치로 이동시킨 뒤, 컴포넌트 패널을 보이게(Visible = true) 합니다.
- **메서드**: `HideTooltip()`
  - **설명**: `TooltipPanel` 패널을 강제로 숨깁니다 (Visible = false).

### 4.2 `Scripts/InventoryUI.mlua` (이벤트 훅킹)
기존에 생성되는 아이템 엔티티(`SpawnItemInGrid`)에 이벤트를 추가합니다.
- **이벤트 핸들러 추가**:
  - `UITouchEnterEvent`: 발동 시 1초 타이머(`_TimerService:SetTimerOnce`)를 가동합니다. 1초 뒤 콜백 안에서 현재 드래그 상태가 아니면 `ItemTooltipUI:ShowTooltip`을 호출합니다. (마우스 좌표 기록 필요)
  - `UITouchLeaveEvent`: 마우스가 나가면 실행 중이던 1초 대기 타이머를 즉시 취소(`ClearTimer`)하고, 열려있다면 `ItemTooltipUI:HideTooltip()`을 호출합니다.
  - `PointerClickEvent` (우클릭 감지): 우클릭(ActionType/Button 등 판별) 이벤트 진입 시, **현재 "드래그(홀딩) 중인 아이템이 없을 때"** 에만 즉시 `ShowTooltip`을 띄웁니다.

## 5. 이벤트 흐름 (Event Flow)
1. 유저가 인벤토리의 특정 아이템 위로 마우스를 올립니다.
2. 1초가 경과될 때까지 마우스를 치우지 않으면 툴팁창이 짠 하고 나타남.
3. 또는 올리자마자 바로 우클릭(Right Click)을 하면 대기 없이 즉시 나타남.
   *(드래그 홀딩 중인 다른 아이템이 손에 있는 상태에서 우클릭을 하면 그건 '회전' 명령이므로 툴팁을 띄우지 않습니다.)*
4. 마우스가 아이템 밖으로 빠져나가면 툴팁이 즉시 사라짐.

## 6. 특별 지시 사항 (TD Rules)
- 모든 로그, 변수, 주석 코드는 영문 텍스트 내에서 작성한다.
- 툴팁 `NameText` 또는 `StatsText` 등 컴포넌트를 조작할 때, 해당 엔티티가 `nil`인지 검증하는 방어 코드를 반드시 넣는다.
- ShapeMask 파란색 사각형 생성 시 이미 존재하는 자식들을 싹 다 돌면서 날린(Destroy) 후 다시 그리는 풀링/비우기 방식을 사용한다.
