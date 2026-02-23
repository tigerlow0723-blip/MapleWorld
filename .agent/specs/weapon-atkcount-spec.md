# 목표 (Objective)

무기 타입(weapon) 아이템에 턴 당 공격 횟수(`atkCount`) 제한 기능을 추가하고, 툴팁 UI에 해당 공격 횟수를 표시합니다. 매 플레이어 턴이 시작될 때마다 공격 횟수는 초기화됩니다.

# 구현 상세 목록 (Implementation Details)

### 1. Item.mlua 파일 (데이터 프로퍼티 추가)
**목적:** 개별 아이템 인스턴스가 자신의 공격 횟수와 현재 남은 횟수를 기억하게 함.
- **로직 구현 상태:**
  1. `Item` 컴포넌트 프로퍼티에 `atkCount` (integer, 기본값 0)와 `currentAtkCount` (integer, 기본값 0) 추가 완료.
  2. `InitFromTable` 함수 내에서 `pcall`을 사용해 `data_table`에서 "atkCount" 컬럼 값을 안전하게 가져와 `self.atkCount`에 할당.
  3. 값이 유효하지 않을 경우 `math.max(0, ...)`를 통해 안전망을 구축하고, `self.currentAtkCount = self.atkCount`로 초기 처리.

### 2. BattleManager.mlua 파일 (공격 횟수 초기화 및 차감)
**목적:** 전투 시 남은 공격 횟수를 확인 및 차감하고, 턴 시작 시 이를 리셋함.
- **로직 구현 상태:**
  1. `ResetWeaponAttackCounts()` 헬퍼 메서드를 추가하여 인벤토리(`placedItems`) 내 모든 Weapon 타입 아이템의 `.Item` 컴포넌트를 찾아 `currentAtkCount`를 초깃값(`atkCount`)으로 초기화함.
  2. 이 초기화 메서드를 플레이어 턴이 시작되는 지점인 `StartBattle`의 하단부와 `OnMonsterTurnEnd`의 하단부에 각각 호출하여 매 턴마다 횟수가 리셋되도록 보장함.
  3. `OnPlayerUseItemById` 메서드에서 플레이어가 공격을 시도할 때, 무기 컴포넌트를 가져와 `maxAtkCount > 0` 인데 `currentAtkCount < 1` 인 상황이면 `log(...)`를 띄우고 `return` 처리하여 공격을 막음.
  4. 실제 타격 판정 및 데미지 처리가 이뤄진 직후(스탯 차감 완료 지점)에 `maxAtkCount > 0`인 무기에 한해 `currentAtkCount`를 1 감소시킴. (`math.max(0, currentAtkCount - 1)`)

### 3. ItemTooltipUI.mlua 파일 (공격 횟수 텍스트 표시)
**목적:** 툴팁 패널에 무기의 남은 공격 횟수와 최대 횟수를 표시함.
- **계층 구조 상태:**
  1. MSW Maker의 `TooltipPanel` 하위에 UI Text 엔티티를 추가하고 `TxtAtkCount`라 명명함.
- **로직 구현 상태:**
  1. `ItemTooltipUI` 내 프로퍼티로 해당 `TxtAtkCount`의 엔티티 매핑 경로 및 프로퍼티 할당 완료.
  2. `SetAtkCountText(integer itemId, table itemData)` 기능을 구현하여 `ShowTooltip(...)` 과정에서 호출하도록 구성함.
  3. 해당 아이템 타입이 "weapon"이 아니거나 `atkCount` 존재 여부가 충족되지 않으면 `SetEnable(false)` 및 텍스트 빈 값 처리.
  4. 조건에 맞는 무기인 경우, 아이템 컴포넌트(`FindTooltipItemComponent(itemId)`)에서 실제 `currentAtkCount`를 읽어온 뒤 "Attack Count: [현재] / [최대]" 형태로 텍스트를 출력시키고 뷰를 활성화함(`SetEnable(true)`).

# 코딩 가이드라인 (Coding Guidelines) / 변경 주의사항
- 스펙이 이미 구현 완료된 상태이므로 본 문서는 구현 당시의 **역설계(Reverse-Engineering) 명세서**로서 기능합니다.
- 추후 턴제 로직 변경이나 다단히트 무기 등이 추가될 경우, `ResetWeaponAttackCounts()` 부분과 차감 로직 부분(`OnPlayerUseItemById`)을 우선 검토해야 합니다.
