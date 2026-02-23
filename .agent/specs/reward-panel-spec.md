# 전투 보상 패널(Reward Panel) 연출 명세서

## 목표 (Objective)
기존 시스템은 `RewardChest`를 열면 즉시 `ItemDisplayArea`에 모든 보상 아이템이 떨어지는 구조였습니다. 이 경우 장비 주문서 등이 `ScrollPanel`로 가야 함에도 물리적으로 가방 위(`ItemDisplayArea`)에 섞이는 시각적 혼동과 버그가 발생할 수 있습니다.
이를 방지하기 위해 **"보상 확인 전용 팝업 패널(Reward Panel)"**을 먼저 띄우고, 패널에서 아이템들을 가시적으로 보여준 뒤 일괄적으로 각각의 보관함(`ItemDisplayArea` 또는 `ScrollPanel`)으로 날아가듯 수납되는 연출(플로우)을 구현합니다.

---

## 1. 신규 UI: `RewardPanel` 구성

`UIMain` 하위에 전투 보상을 보여줄 전용 패널 엔티티를 구성해야 합니다.
- **경로**: `/ui/UIGroup/RewardPanel`
- **구조**:
  - `BtnReceive`: 보상 수령(화면 터치 시 즉시 수납되는 버튼 역할 겸 백그라운드)
  - `TxtTitle`: "BATTLE REWARD" 등 제목
  - `RewardList`: 획득한 아이템 카드들을 가로로 나열할 Layout 그룹. (ShopPanel의 ItemList와 유사)
  - `RewardCardTemplate`: 개별 아이템의 아이콘과 이름을 렌더링할 프리팹/오리지널 템플릿.

## 2. 작업 흐름 (Workflow)

### Step 1: `GameManager` (보상 상자 열림 처리 변경)
- 기존: `GameManager:OpenRewardChest()` 호출 시 `itemDisplayArea:CreateItemEntity(...)`를 즉시 반복.
- 변경: `GameManager:OpenRewardChest()` 호출 시, 드롭될 아이템 목록(Table)을 구성한 뒤 새로 만들 `RewardUI` 스크립트를 깨워(Enable) 목록을 전달힙니다.

### Step 2: `RewardUI` 스크립트 제작 및 연출
- 전달받은 목록을 바탕으로 `RewardCardTemplate`를 복제하여 중앙 패널에 아이템들을 나란히 띄웁니다.
- **Auto-Close 타이머**: 패널이 열린 직후 3초(`_TimerService:SetTimerOnce(..., 3.0)`) 뒤에 자동으로 닫히는 콜백을 예약합니다.
- **터치 Close**: 플레이어가 화면(버튼)을 터치해도 즉시 타이머를 취소하고 닫힘 처리를 실행합니다.

### Step 3: 보상 수납 (Distribution)
패널이 닫히는 순간(`OnCloseRewardPanel()`):
1. 보상 배열을 순회합니다.
2. `itemData.type == "scroll"` (주문서) 또는 id가 9/10번인 경우:
   - `PlayerManager:AddScroll(itemId, 1)` 호출.
3. 일반 장비/소비 아이템인 경우:
   - 기존처럼 `ItemDisplayArea:CreateItemEntity(itemId, index)`를 호출하여 정상적으로 맵 위에 떨어뜨립니다.
4. 패널 가시성을 끄고 무대를 다음 단계(Preparation Phase)로 넘깁니다.

---

## 3. 코드 설계 (Methods)

### `RewardUI.mlua` (신규 컴포넌트 스크립트)
```lua
@Component
script RewardUI extends Component

    property table pendingRewards = {}
    property string rewardPanelPath = "/ui/UIGroup/RewardPanel"
    property string rewardListPath = "/ui/UIGroup/RewardPanel/RewardList"
    property string cardTemplatePath = "/ui/UIGroup/RewardPanel/RewardCardTemplate"
    property integer closeTimerId = 0
    property any gameManager = nil

    method void ShowRewards(table rewardItems)
        -- 1. 패널 Enable=true
        -- 2. 이전 카드들 파괴 (Clear)
        -- 3. rewardItems를 순회하며 cardTemplate 복제 및 정보 세팅
        -- 4. 3초 타이머(self.closeTimerId) 세팅하여 ClosePanel() 예약
    end

    method void ClosePanel()
        -- 1. 타이머가 살아있다면 캔슬 (_TimerService:ClearTimer)
        -- 2. 패널 Enable=false
        -- 3. pendingRewards를 순회하며 주문서는 PlayerManager로, 장비는 ItemDisplayArea로 배분.
        -- 4. GameManager의 상태를 업데이트 (Preparation Phase 전환)
    end

    -- 터치 버튼 이벤트
    method void OnClickReceive()
        self:ClosePanel()
    end
end
```

### `GameManager.mlua` 수정 사항
- `OpenRewardChest()` 호출 시에 즉각적인 드랍이 아닌 `self.uiMain.RewardUI:ShowRewards()`를 호출하도록 구조 변경.

## 4. 진행 절차
1. TD가 본 명세서를 확정하고 Codex에게 지시합니다.
2. Codex는 UI 계층에 `RewardPanel`을 복제/생성하고 `RewardUI.mlua` 스크립트를 붙입니다.
3. `GameManager`의 상자 개방 로직을 `RewardUI` 패널로 리디렉션합니다.
4. (중요) `PlayerManager:AddScroll`과 정상적으로 주문서 수납이 인계되는지, 일반 아이템은 `ItemDisplayArea`에 펼쳐지는지 확인합니다.
