# 코덱스 최신 패치 명세서 (Codex Patch Spec)

## 목표 (Objective)
코덱스(Codex)가 방금 구현 및 수정한 소스코드의 내용을 역으로 분석하여, TD(기술 감독)의 명세서 및 프로젝트 아키텍처 문서의 무결성을 맞춥니다. 본 명세서는 **이벤트 기반 아키텍처(Event-Driven)의 실제 구현 내역**과, 그와 동시에 처리된 **핵심 시스템 버그 픽스 내용**을 다룹니다.

---

## 1. 이벤트 구동 아키텍처 (Event-Driven Architecture) 완벽 적용

기존의 촘촘한 의존성(Tight Coupling)을 끊어내고, Pub-Sub 패턴을 적용하여 UI와 Core Logic을 완벽히 분리했습니다.

### 1-1. 신규 이벤트(Event) 객체
- **`PlayerStatChangedEvent`**: 플레이어의 능력치, 체력, 행동력(Cost), 재화(Gold), 주문서 스택 등이 변동될 때 발생하는 이벤트입니다.
- **`InventoryChangedEvent`**: 인벤토리 내 아이템 추가, 이동, 판매, 사용 등으로 가방 내부 상태(Grid)가 변동될 때 발생하는 이벤트입니다.

### 1-2. 발신자 (Sender) 구현 로직
- **`PlayerManager.mlua`**
  - 공통 브로드캐스팅 채널 획득: `ResolveEventBroadcasterEntity()`를 통해 전역 싱글톤 역할을 하는 `GameSystem` 엔티티(`/maps/map01/GameSystem`)를 찾아 이벤트를 발송합니다.
  - 적용처: `RestoreCost`, `UseCost`, `TakeDamage`, `Heal`, `LevelUp`, `AddGold`, `SpendGold`, `AddScroll`, `UseScroll`. 
  - 과거에 UI 스크립트를 찾아 직접 `UpdateUI()`를 부르던 찌꺼기 로직을 전면 제거하고 `self:EmitPlayerStatChangedEvent()`로 교체했습니다.
- **`InventoryUI.mlua`**
  - 아이템 드래그-앤-드롭 완료, 버리기(Trash), 상점 판매, 소모품(Consumable) 사용 등 가방 배열에 연산이 끝나는 즉시 `self:EmitInventoryChangedEvent()`를 호출하여 브로드캐스팅합니다.

### 1-3. 수신자 (Receiver) 구현 로직
- **`UIMain.mlua`**
  - `@EntityEventHandler` 데코레이터를 이용해 두 가지 이벤트를 수신 대기합니다.
  - `OnPlayerStatChangedEvent` 수신 시 -> `self:UpdateUI()` 호출 (HP/Cost/Boss UI 갱신)
  - `OnInventoryChangedEvent` 수신 시 -> `self:RefreshScrollInventoryUI()` 및 `self:UpdateUI()` 동시 갱신

---

## 2. 인벤토리 직렬화(Serialization) 키(Key) 버그 픽스

- **원인 분석**: MSW 또는 데이터 동기화 과정에서 딕셔너리(Table)의 숫자형 Key(`itemId`)가 문자열(String)로 형변환되어 넘어오는 심각한 이슈가 있었습니다. 이로 인해 루프를 돌 때 에러가 나거나 아이템 인식이 누락되었습니다.
- **조치 사항 (`Inventory.mlua`, `InventoryUI.mlua`, `PlayerManager.mlua`)**:
  - 기존 `for itemId, info in pairs(placedItems) do` 로직을 전면 폐기.
  - `for placedKey, info in pairs(self.inventoryComp.placedItems) do` 형식으로 변경.
  - Key나 구조체 내부의 아이디를 강제로 숫자로 파싱(`tonumber(info.itemId) or tonumber(placedKey)`)하는 삼항 체크 방식을 도입하여, 문자열로 변질된 데이터 테이블도 안전하게 로드하도록 무결성을 확보했습니다.

---

## 3. 아이템 보상 드롭 필터링 (Reward Drop Filter)

- **조치 사항 (`ItemManager.mlua`)**:
  - 전투 승리 시 전리품을 무작위로 생성할 때, 앞으로 등장할 "상점 전용 아이템"이나 "이벤트 아이템"이 떨어지지 않도록 필터링을 추가했습니다.
  - CSV 데이터 테이블 상의 `isRewardDrop` 플래그(1=드롭가능, 0=드롭불가)를 읽어, 1인 경우에만 몬스터 드롭 풀(filteredItems)에 편입시키는 안전장치를 구현했습니다.

---

## 4. 시각적 연출 및 UI 자잘한 픽스 (Visual Fixes)

- **`ItemDisplayArea.mlua`**: `ShapeHitCell` (아이템 형태 표시용 더미 셀) 기능을 토글할 때 투명도(Alpha) 값이 제대로 꺼지지 않고 먹통이 되던 렌더러 이슈를 고쳤습니다. 이제 가시성이 완벽히 동기화됩니다.
- **`UIMain.mlua`**: 몬스터의 개별 체력바(Slider)를 띄울 때 초과된 `TextComponent` 검색 구조를 `Caching` 기법을 통해 한 번만 찾도록 최적화했습니다 (렉/프레임 저하 근절).

---

## 향후 작업 (Next Step)
이제 기초 공사(아키텍처 모듈화 및 직렬화 안정성)가 가장 완벽한 형태로 다져졌습니다. 추후 새로운 아이템을 추가하거나(synergy_scroll), 전투 규칙(Block/Status)을 추가할 때 기존 코드 충돌 없이 빠르고 독립적으로 개발할 수 있는 구조가 되었습니다.
