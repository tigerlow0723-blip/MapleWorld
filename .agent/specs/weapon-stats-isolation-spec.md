# 무기 스탯 개별 적용 수정

## 문제 정의

현재 `CalcFinalATK()`가 인벤토리의 **모든** 아이템의 `atk` 값을 합산하고 있어, 가방에 무기가 여러 개 있으면 전부 더해진 공격력이 적용됨.

**기대 동작**: 아이템을 클릭하여 공격할 때, **그 무기 하나만의 공격력 + 캐릭터 기본 스탯 + 비무기 장비 스탯**이 적용되어야 함.

---

## 영향 분석

| 스탯 | 현재 방식 | 변경 후 방식 |
|------|-----------|-------------|
| ATK | 모든 아이템 합산 | 비무기 아이템 + **클릭한 무기 1개**만 적용 |
| ATK% | 모든 아이템 합산 | 비무기 아이템 + **클릭한 무기 1개**만 적용 |
| CritRate | 모든 아이템 합산 | 비무기 아이템 + **클릭한 무기 1개**만 적용 |
| CritDmg | 모든 아이템 합산 | 비무기 아이템 + **클릭한 무기 1개**만 적용 |
| ACC | 모든 아이템 합산 | 비무기 아이템 + **클릭한 무기 1개**만 적용 |
| HP/DEF | 기존 동일 | 변경 없음 |

---

## 수정 대상 파일

### [MODIFY] PlayerManager.mlua

#### CalcFinalATK — 시그니처 변경

- `method number CalcFinalATK(integer weaponItemId)`
- **weaponItemId**: 공격에 사용할 무기 ID (0이면 무기 스탯 미반영)
- 인벤토리 순회 시 `item.type == "weapon"` → **스킵**
- `weaponItemId > 0` → `dataManager:GetItemData(weaponItemId)`로 조회, 해당 무기의 `atk`, `atkPercent`만 합산

#### CalcFinalCritRate — 동일 패턴 변경

- `method number CalcFinalCritRate(integer weaponItemId)`
- weapon 스킵 → 선택 무기만 `critRate` 적용

#### CalcFinalCritDMG — 동일 패턴 변경

- `method number CalcFinalCritDMG(integer weaponItemId)`
- weapon 스킵 → 선택 무기만 `critDmg` 적용

#### CalcFinalACC — 동일 패턴 변경

- `method number CalcFinalACC(integer weaponItemId)`
- weapon 스킵 → 선택 무기만 `accPercent` 적용

---

### [MODIFY] BattleManager.mlua

#### CalculatePlayerDamage (line 225-239)

- `CalcFinalATK()` → `CalcFinalATK(itemData.id)`
- `CalcFinalCritRate()` → `CalcFinalCritRate(itemData.id)`
- `CalcFinalCritDMG()` → `CalcFinalCritDMG(itemData.id)`

#### OnPlayerUseItemById (line 128)

- `CalcFinalACC()` → `CalcFinalACC(itemId)`

---

### [MODIFY] RewardManager.mlua (line 116, 로그용)

- `CalcFinalATK()` → `CalcFinalATK(0)` (로그 전용, 무기 없이 기본 스탯만 출력)

---

## ⚠️ 스크립트 작성 규칙

- 주석, `log()` 메시지 등 스크립트 내부 문자는 반드시 **100% 영어**로 작성

---

## 검증 방법

### MSW Maker에서 수동 테스트
1. 인벤토리에 **무기 2개** 보유 상태로 전투 진입
2. 무기 A 클릭 → 데미지 = 기본ATK + 무기A ATK 확인
3. 무기 B 클릭 → 데미지 = 기본ATK + 무기B ATK 확인
4. 두 무기 공격력이 합산되지 않는지 확인
