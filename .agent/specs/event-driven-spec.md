# Event-Driven Architecture 도입 명세서 (Event-Driven Spec)

## 목적 (Objective)
기존 `PlayerManager` 및 `InventoryUI` 등 핵심 로직에서 다른 컴포넌트(특히 UI)를 찾아내어 직접 함수를 호출(`self.gameManager.uiMain:UpdateUI()`)하던 **강결합(Tight Coupling)** 방식을 제거합니다. 대신 커스텀 컴포넌트 이벤트를 송출(`SendEvent`)하고, UI가 이를 감지하여 스스로 업데이트하도록(Pub-Sub 패턴) 변경하여 모듈 독립성을 확보합니다.

## 1. 신규 이벤트(Event) 스크립트 생성

MSW Maker에서 새로운 스크립트를 생성하되, `Component`가 아닌 **`Event`** 타입으로 두 개의 스크립트를 생성합니다.

### 1-1. `PlayerStatChangedEvent`
- **역할**: 플레이어의 체력, 코스트(행동력), 골드 등 플레이어 스탯 리소스가 변동되었음을 알리는 이벤트.
- **프로퍼티 (Properties)**:
  - (현재는 순수 트리거 용도로 쓸 것이므로 추가 프로퍼티는 불필요하거나, 필요시 `senderId` 문자열 정도만 둘 수 있음)
  ```lua
  @Event
  script PlayerStatChangedEvent extends Event
      -- No explicit properties needed for simple trigger
  end
  ```

### 1-2. `InventoryChangedEvent`
- **역할**: 인벤토리 내 아이템 추가, 삭제, 위치 이동 등 가방 아키텍처에 변동이 생겼음을 알리는 이벤트.
- **프로퍼티 (Properties)**:
  ```lua
  @Event
  script InventoryChangedEvent extends Event
  end
  ```

---

## 2. 기존 스크립트 리팩토링 (Sender / Receiver 설정)

### 2-1. `PlayerManager.mlua` (이벤트 송신자 - Sender)
- **대상 메서드**: `AddCost`, `SpendCost`, `HealHP`, `TakeDamage`, `AddGold`, `SpendGold` 등 스탯 증감이 발생하는 모든 메서드.
- **변경 사항**: 
  - 과거: `if self.gameManager.uiMain ~= nil then self.gameManager.uiMain:UpdateUI() end`
  - **변경**: `self.Entity:SendEvent(PlayerStatChangedEvent())` (또는 게임 매니저 엔티티 / 로컬스페이스로 SendEvent)
  - **참고**: 원활한 브로드캐스팅을 위해 자기 자신의 Entity 뿐만 아니라, 필요하다면 공통 조상(예: `GameSystem` 엔티티)을 통해 `SendEvent`를 호출할 수도 있습니다. 본 명세서에서는 `_EventSender`를 활용하기 위해 특정 공통 엔티티(예: `_EntityService:GetEntityByPath("/maps/map01/GameSystem")`)에 발송하거나, `self.Entity`에 발송 후 UI가 이를 캐치하게 설계합니다. 최적의 방안은 `self.Entity:SendEvent(PlayerStatChangedEvent())`를 호출하는 것입니다.

### 2-2. `InventoryUI.mlua` / `ItemManager.mlua` (이벤트 송신/수신)
- 아이템이 성공적으로 드롭&배치되거나, 플레이어가 아이템을 팔았을 때 `InventoryChangedEvent`를 `SendEvent` 합니다.

### 2-3. `UIMain.mlua` (이벤트 수신자 - Receiver)
- **역할**: 플레이어/인벤토리 변경 이벤트를 수신하여 `UpdateUI()` 및 `UpdateMonsterHPBars()` 등을 자동으로 호출.
- **이벤트 핸들러 추가**:
  ```lua
  @EntityEventHandler
  method void OnPlayerStatChangedEvent(PlayerStatChangedEvent event)
      self:UpdateUI()
  end

  @EntityEventHandler
  method void OnInventoryChangedEvent(InventoryChangedEvent event)
      self:RefreshScrollInventoryUI()
      self:UpdateUI()
  end
  ```
- **주의사항**: 위 핸들러가 동작하려면 `UIMain.mlua`가 이벤트를 발생시키는 엔티티(예: `GameSystem` 또는 `PlayerManager`가 붙은 엔티티)의 이벤트를 수신할 수 있도록 체인이 연결되어야 합니다. Codex는 이벤트를 보낼 때 `LocalEntity` 브로드캐스트나 특정 상위 Entity를 활용해 수신 범위를 맞춰주어야 합니다.

---

## 3. 영문 작성 원칙 (English Only Rule)
- ⚠️ Codex가 작성할 스크립트의 **주석(comments)** 및 **`log()` 메시지** 등 스크립트 내부 문자는 반드시 **100% 영어**로 작성해야 합니다. (EUC-KR 인코딩 충돌 방지)

## 4. 진행 절차 (Workflow)
1. Codex는 `PlayerStatChangedEvent.mlua`와 `InventoryChangedEvent.mlua` 스크립트를 생성합니다.
2. `PlayerManager.mlua`를 검색하여 `self.gameManager.uiMain:UpdateUI()`나 이와 유사한 직접 UI 호출을 모조리 제거하고 `Event` 발송 코드로 대체합니다.
3. `UIMain.mlua` 하단에 Event Handler를 추가하여 UI가 반응하도록 맞춥니다.
4. 드래그-앤-드롭이나 상점 아이템 구매 후 UI가 정상 갱신되는지 확인합니다.
