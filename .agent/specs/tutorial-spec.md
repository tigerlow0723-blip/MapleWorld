# 작업 명세서: 튜토리얼 초기 보상 고정 및 전투 진입 시 인벤토리 잠금

> **목표**:
> 1. 첫 보상 상자 클릭 시 랜덤이 아닌 확정 아이템(ID 1~5) 지급
> 2. 전투 진입 시 사용하지 않은 ItemDisplayArea의 남은 보상 아이템 일괄 삭제
> 3. 전투 중에는 ItemDisplayArea 배치 및 인벤토리 밖의 요소 조작 불가 보호
> 4. [핵심] 인벤토리에 이미 장착된 아이템 엔티티는 삭제되지 않도록 락(Lock) 처리

---

## 1. 튜토리얼 보상 확정 지급 (ItemDisplayArea.mlua)

현재 코드는 `RewardChest`가 렌더링 영역(ItemDisplayArea)에 랜덤으로 아이템을 나열하게 되어 있습니다. 첫 진입을 상정하기 위해 별도의 확정 지급 메서드 명세를 마련합니다.

### 신규 추가 메서드: `GenerateTutorialItems`
- **공간**: `ClientOnly`
- **파라미터**: 없음
- **동작 단계**:
  1. 기존 `spawnedItems` (생성된 아이템 배열)을 역순으로 순회하며 잔여 아이템 엔티티들을 파괴(`Destroy`)하고 테이블을 비웁니다.
  2. 고정 지급할 아이템 ID 목록(1부터 5까지 순차 배열)을 메모리에 준비합니다.
  3. 반복문을 돌며 순서대로 `CreateItemEntity`를 호출하여 화면에 스폰 시킵니다.
  4. 마지막으로 `ArrangeItems`를 호출하여 아이템 간 간격을 정렬합니다.

---

## 2. 상자(RewardChest.mlua) 클릭 동작 분기

`RewardChest.mlua`에서 일반 드롭/튜토리얼 확정 드롭의 분기가 필요합니다. 초기 버전이므로 일단 기존 상자 클릭 동작을 완전히 튜토리얼 기능으로 덮어씌웁니다.

### `SpawnItems` 메서드 동작 변경
- **동작 단계**:
  - 기존에는 `displayArea` 컴포넌트를 가져와 `GenerateRandomItems`를 호출했습니다.
  - 이 호출부를 위 1번에서 작성한 `GenerateTutorialItems` 호출로 변경합니다. (무조건 1~5번 고정 드롭 발생)

---

## 3. 전투 진입 시 잔여 보상 싹쓸이 (GameManager.mlua)

플레이어가 [전투 시작] 버튼을 눌러 상태(`gamePhase`)가 `Battle`로 변경될 때, 바닥(`ItemDisplayArea`)에 버려진 잉여 아이템들을 삭제하여 화면을 치워야 합니다.

### `TriggerBattleStart` 메서드 보완 단계
- 몬스터 스폰(전투 시작)을 위임하기 직전(혹은 직후)에 다음 청소 단계를 추가합니다.
  1. `itemDisplayArea` 컴포넌트가 연결되어 있는지 유효성 검사.
  2. 연결되어 있다면, 해당 컴포넌트의 명시적인 클리어 함수(아래 명세될 `ClearAllItems`)를 호출합니다.
  3. `pendingRewards` (정비 중 쌓여있던 보상 배열 버퍼) 상태를 빈 테이블로 초기화합니다.

---

## 4. ItemDisplayArea.mlua 정리 전담 헬퍼 (인벤토리 보호 포함!)

가장 중요한 파일입니다. 단순히 배열을 날려버리는 것을 넘어, 플레이어가 이미 가방(Inventory)에 담은 아이템은 파괴되면 안 됩니다.

### 신규 추가 메서드: `ClearAllItems`
- **공간**: `ClientOnly`
- **파라미터**: 없음
- **동작 조건표 및 단계**:
  1. `spawnedItems` 배열을 끝에서부터 첫 번째까지 역순으로 순회 검사합니다.
  2. **가장 중요한 보호 조건 체크 (If 분기)**:
     - 검사 중인 `itemEntity`의 현재 부모(`Parent`)가 자기 자신(`ItemDisplayArea` 렌더기)인 경우에만 `Destroy`를 수행하여 파괴합니다.
     - 만약 플레이어가 가방에 담아서 부모가 이미 `InventoryUI` 쪽으로 변경된 엔티티라면, 파괴하지 않고 건너뜁니다! (수명 유지)
  3. 순회하며 조건 체크가 끝난 요소들은 안전하게 배열 테이블에서 제거하여 참조를 끊습니다.
- **연계 스펙**: 이를 작성한 뒤, 기존의 `GenerateRandomItems`나 추가될 `GenerateTutorialItems` 첫 구역에 산재해있던 "무조건 삭제 루프"를 모조리 지우고, 이 `ClearAllItems` 호출 하나로 통일 대체합니다.

---

## 5. UI 및 조작 차단 설계

- **전투 중 아이템 인벤토리 외부 조작**:
  - `gamePhase`가 `Battle`로 넘어가면, 위 4번 과정을 통해 **바닥에 떨어진 잉여 아이템이 존재하지 않게 됩니다.**
  - 따라서 집어들 아이템이 없고, 보상 UI 생성 로직도 닫혀있어 화면 조작과 맞물릴 껀덕지가 자연스럽게 사라집니다. 기존 `OnClickSlot` 등에서 `Battle` 페이즈일 때 사용할 수 있는 무기 외 동작만 걸러내는 로직은 이미 전 명세에서 완비되었습니다.

---

## 6. Codex(수행자) 요약 지시
- `ItemDisplayArea.mlua`: 보호 조건(부모 비교)이 들어간 `ClearAllItems` 메서드를 추가하고, 공통화. 튜토리얼 지급용 `GenerateTutorialItems` 구현.
- `RewardChest.mlua`: 클릭 이벤트 발동 시 랜덤 대신 `GenerateTutorialItems` 호출.
- `GameManager.mlua`: `TriggerBattleStart` 전환 시 `ItemDisplayArea`의 청소 메서드 호출.
