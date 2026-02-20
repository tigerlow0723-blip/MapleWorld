# 작업 명세서: 전투 페이즈 인벤토리 드래그 잠금 및 터치 공격 연동

> **목표**:
> 1. 전투(`Battle`) 상태일 때 인벤토리 내 아이템의 위치 이동(드래그) 및 인벤토리 밖으로 빼는 수정 행위 전면 금지.
> 2. 전투 상태에서는 아이템 터치 시 드래그가 아닌 **'아이템 사용(무기 공격)'** 이벤트가 발생하도록 조작 분기.
> 3. 그리드형 인벤토리에 맞춰 기존 배열 인덱스(index) 기반이었던 전투 공격 논리를 **아이템 고유 ID(itemId)** 기반으로 재구성.

---

## 1. 드래그 방지 및 무기 공격 분기 (InventoryUI.mlua)

현재 `StartDrag` 메서드는 아이템 터치 시 무조건 드래그를 시작하도록 설계되어 있습니다. 이를 전투 상태에 맞춰 분기해야 합니다.

### `StartDrag` 메서드 로직 보완 단계
1. 가장 상단에서 **게임 상태(Phase) 조회**:
   - `_EntityService`를 통해 `GameSystem` 엔티티를 찾고, 그 하위의 `GameManager` 컴포넌트를 가져옵니다.
   - `GameManager.gamePhase`가 `"Battle"` (전투 중)인지 확인합니다.
2. **전투 상태(`Battle`)일 경우의 예외 처리 (수정 방지)**:
   - 드래그를 시작하는 코드 흐름으로 내려가지 않아야 합니다. (즉시 동작 중단)
   - 대신 클릭한 `itemEntity`의 내부 `Item` 컴포넌트를 살펴봅니다.
   - `itemType`이 `"weapon"`(무기)인지 확인하고, 무기가 아니라면 안내 로그를 남긴 채 작업을 종료합니다.
   - 무기라면, `GameSystem`의 `BattleManager` 컴포넌트를 찾아 새로 작성할 메서드인 `OnPlayerUseItemById`를 호출합니다.
   - 이때 파라미터로 해당 아이템의 `itemId`와 타겟 몬스터 인덱스(`UIMain`의 `targetMonsterIdx`를 참초하거나 없다면 기본값 1)를 넘겨줍니다.
3. 전투 상태가 아니라면 기존 드래그 로직을 정상 수행합니다.

---

## 2. 아이템 ID 기반 전투 공격 전개 (BattleManager.mlua)

기존 `OnPlayerUseItem`은 1차원 배열용 인덱스(`itemIndex`)를 받아 작동했으나, 이제 그리드 인벤토리를 도입함으로써 정렬 순서가 불규칙해졌으므로 고유 아이템 ID(`itemId`)를 직접 받아 공격하는 것이 정확합니다.

### 신규 추가 메서드: `OnPlayerUseItemById`
- **공간**: 기본(Server/Client 유동적 적용을 위한 기존 패턴 유지)
- **파라미터**: `integer itemId`, `integer targetMonsterIdx`
- **로직 단계**:
  1. 기존 공격 메서드와 동일하게 플레이어의 턴(`currentTurn == "Player"`)인지, 플레이어가 살아있는지 검증합니다.
  2. 파라미터로 넘어온 `itemId`를 이용해 `self.dataManager:GetItemData(itemId)`를 호출하여 아이템의 스탯 정보 묶음을 확보합니다.
  3. 무기(`type == "weapon"`)인지 한 번 더 안전 검사를 수행합니다.
  4. 코스트 소모 검사(`self.playerManager:UseCost`)를 돌리고, 코스트가 부족하면 공격을 취소합니다.
  5. `CalculatePlayerDamage` 헬퍼 메서드에 아이템 데이터를 넘겨 최종 데미지를 구합니다.
  6. 산출된 데미지를 타겟 몬스터(`self.monsterManager:DamageMonster`)에게 입히고 타격 피드백/로그를 출력합니다.
  7. *(참고사항)* 무기 공격이므로 사용 후 소모품처럼 아이템이 파괴되지 않으며, 턴 종료 체크는 여전히 플레이어의 [턴 종료] 수동 클릭으로 넘깁니다.

---

## 3. Codex 작업 지시 요약

1. **`InventoryUI.mlua`**: `StartDrag` 최상단에 `GameSystem`의 `GameManager.gamePhase`를 조회하여 `"Battle"`이면 드래그를 리턴(Block)하고, 클릭한 아이템이 무기일 때 `BattleManager:OnPlayerUseItemById`를 호출하는 조건문 추가.
2. **`BattleManager.mlua`**: `itemId`를 매개변수로 받아 `DataManager`에서 직접 아이템 스펙을 조회하고 공격/코스트를 처리하는 `OnPlayerUseItemById` 신규 함수 작성. (기존 로직 이식)
