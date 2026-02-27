# 코덱스 패치 명세서: 보상 패널 연출 (Reward Panel Patch Spec)

## 목표 (Objective)
기존에 상자를 열면 아이템이 바닥에 즉시 떨어지던 로직을 개선하여, 화면 중앙에 팝업 패널을 띄워 획득한 아이템들을 보여준 뒤 배분하는 "보상 연출 시스템(Reward Presentation Panel)"에 대한 코덱스(Codex)의 실제 구현 내역을 역설계하여 기록합니다.

---

## 1. UI 구조체 및 컴포넌트 연결 (`RewardUI.mlua`)
- **컴포넌트 경로**: `/ui/UIGroup/RewardPanel`
- **주요 기능**:
  - `ShowRewards(table rewardItems)`: 게임 매니저로부터 드롭될 아이템 목록을 넘겨받아 `RewardPanel`을 띄웁니다.
  - `SpawnRewardCard(integer index)`: 주어진 아이템 목록 개수만큼 `RewardImgTemplate` (프리팹 형태의 템플릿 UI)를 복제하여 `RewardList` (부모 컨테이너) 하위에 붙입니다.
  - `ArrangeRewardCards()`: 가로 너비(`listWidth`)와 아이템 카드 너비(`cardWidth`)를 계산하여, 가운데를 기준으로 예쁘게 정렬되도록 트랜스폼 X좌표를 수학적으로 재계산하여 배치합니다.
  - **자동 닫힘 및 터치 닫힘**: 패널이 열리면 3초(`_TimerService:SetTimerOnce`) 뒤에 닫히는 타이머가 가동되며, 동시에 배경이나 리스트 밖을 터치(`UITouchDownEvent`)하면 타이머를 즉시 끄고 패널을 닫도록 이중 안전장치가 적용되었습니다.

## 2. 기존 매니저 리팩토링 및 배분 로직
### 2-1. `GameManager.mlua`
- `StartGame` 및 `ProceedToStage`: 무작위 아이템을 생성하던 로직이, 상자 개방 시점으로 온전히 편입되었습니다.
- `OpenRewardChest()`: 상자를 여는 즉시 바닥에 아이템을 렌더링하던 로직을 완전히 삭제하고, 대신 중앙의 `RewardUI.mlua`를 호출하여 패널 연출을 시작하도록 리다이렉트 처리했습니다.
- 에러 대비 폴백(Fallback): 혹시라도 UI가 파괴되었거나 찾을 수 없을 때를 대비해, 패널 없이 즉시 분배하는 `DistributePendingRewardsWithoutPanel()` 함수를 별도 구현해 안정성을 높였습니다.

### 2-2. `RewardChest.mlua`
- 상자 클릭 시 동작(`SpawnItems`)을 더미로 만들지 않고, 내부적으로 `GameManager:OpenRewardChest()`를 호출하여 일관된 이벤트 흐름을 타게 수정했습니다.

### 2-3. 아이템 배분 (Distribution)
- 패널이 닫히는 `ClosePanel()` 순간, 혹은 폴백이 터진 순간에 `DistributeRewards()`가 실행됩니다.
- **주문서 판독**: `itemType == "scroll"` 이거나 `itemId == 9` (강화 주문서), `itemId == 10` (시너지 주문서) 인 경우 -> 바닥에 떨어뜨리지 않고 **`PlayerManager:AddScroll()`**을 호출하여 숨겨진 재화(ScrollPanel)로 수납합니다.
- **나머지(장비/소비)**: 기존대로 `ItemDisplayArea:CreateItemEntity()`를 호출하여 인벤토리 상단 바닥에 드롭되게 처리했습니다.

---

## 완료 확인 (Status: ✅ Done)
보상 패널 연출 시스템 및 배분 로직 모두 구현 및 검증 완료. 협업자(Hyunwoo) 브랜치와의 Git 병합도 UIGroup.ui 수동 병합을 통해 해결 완료되었습니다. (관련 대화: `707dbbec` Merging UI Conflicts 참조)
