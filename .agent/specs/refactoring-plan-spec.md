# 목표 (Objective)
현재까지 작성된 주요 코어 매니저 스크립트(`GameManager`, `BattleManager`, `PlayerManager`, `RewardManager` 등)의 코드를 리뷰하고, 기능 추가 및 수정으로 인해 발생한 불필요한 코드(Dead Code)나 복잡한 구조를 리팩토링하여 유지보수성을 높입니다.

# 리팩토링 상세 목록 (Refactoring Plan)

## 1. GameManager.mlua 정리
- **사용되지 않는 상점 NPC 로직 삭제**
  - 기존(or 초기 버전)에 구현하려다 취소된 것으로 보이는 `ShowRandomShopNPC()` 및 `DoubleMoney()` 등의 메서드가 남아 있습니다. 현재 게임의 상점 로직은 `EnterShop()`과 `ShopPanel`을 통하는 방식으로 개편되었으므로 해당 코드는 모두 삭제하여 구조를 깔끔하게 유지합니다.
- **주요 수정 대상 함수:** `ShowRandomShopNPC()`, `DoubleMoney()` 삭제.

## 2. PlayerManager.mlua 계산식 구조 리팩토링
- **중복된 아이템/버프 스탯 계산 통합**
  - `CalcFinalATK`, `CalcFinalHP`, `CalcFinalACC`, `CalcFinalCritRate`, `CalcFinalCritDMG` 메서드들이 각각 `self.inventory`를 순회하며(Loop) 자신의 속성(atk, hp, acc 등)만 더하는 중복된 계산 구조를 가지고 있습니다.
  - 성능상 큰 무리는 없으나, 코드가 길어지고 유지보수가 어려우므로 헬퍼 함수를 도입하여 통합하거나 반복문을 줄이는 방향으로 리팩토링이 필요할 수 있습니다.
  - (현재는 안전성이 최우선이므로 당장 통합하지는 않더라도, 명세상 이슈가 됨을 기록해 둡니다. 이번 리팩토링에서는 명확히 사용되지 않는 옛날 코드만 1차 제거합니다.)

## 3. RewardManager.mlua 정리
- **정비 모드(Maintenance Mode) 로직 확인**
  - 현재 보상 획득 로직이 `ItemDisplayArea` 및 `GameManager:OnBattleVictory()`를 통해 구현되어 UI에서 직접 보상을 클릭하고 드래그-앤-드롭하는 방식(`Drag and Drop`)으로 진행됩니다. 
  - 과거 터미널/로그 기반 테스트용으로 작성되었던 `GenerateRewards()`, `PrintDroppedItems()`, `PickUpItem()`, `DropItem()`, `FinishMaintenance()` 등의 콘솔 전용 정비모드 로직은 실제 게임 뷰어에서는 쓰이지 않습니다. 
  - 따라서 `RewardManager` 내의 이 콘솔용 시뮬레이션 코드들을 삭제하고, 순수하게 데이터매니저에서 아이템을 받아오는 가벼운 컴포넌트로 유지합니다.

## 4. ItemTooltipUI.mlua 및 InventoryUI.mlua 최적화 (건너뜀)
- UI 쪽은 이벤트 바인딩과 좌표 계산 로직이 복잡하지만 현재 마우스 클릭, 드래그 드롭 기능이 모두 정상 작동하고 있어, 자칫 건드리면 버그가 발생할 확률이 높습니다. 이 부분은 리팩토링 대상에서 일단 제외합니다.

# 요약 사항
이번 구조 개선 작업에서는 동작 방식에 영향을 미치지 않는 **"과거 기획 용도 및 콘솔 테스트 목적의 죽은 코드(Dead Code)"**를 안전하게 삭제하는 것에 집중합니다.
1. `GameManager.mlua`: `ShowRandomShopNPC`, `DoubleMoney` 메서드 삭제
2. `RewardManager.mlua`: `isMaintenanceMode`, `PrintDroppedItems`, `PrintInventory`, `PickUpItem`, `DropItem`, `FinishMaintenance` 및 연관된 테스트 함수 삭제. (단순히 ItemManager를 통해 드롭 리스트를 넘겨주는 기능만 남길 것)
