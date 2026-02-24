# Armor Synergy Specification

## 1. 목적 (Objective)
- 인벤토리에 배치된 방어구(Armor) 아이템 간의 위치 시너지 효과를 추가하여, 플레이어의 스탯(예: Max HP 또는 방어력)을 증가시킵니다.
- `PlayerManager`에서 시너지를 계산하고, `ItemTooltipUI`에서 이를 유저에게 표시합니다.

## 2. 대상 파일 (Files to Modify)
- `/Scripts/PlayerManager.mlua`
- `/Scripts/ItemTooltipUI.mlua`

## 3. 요구사항 및 상세 로직 (Requirements & Logic)

### 3.1. `PlayerManager.mlua` 변경
1. **메서드 추가**: `CalcArmorSynergy()`
   - **설명**: 인벤토리 그리드를 순회하며 배치된 `armor` 타입 아이템을 찾습니다.
   - **로직**:
     - 무기 시너지(`CalcWeaponSynergyAtk()`)와 유사하게 동작합니다.
     - 각 방어구가 차지하는 셀의 상하좌우(상하좌우 인접 셀)를 확인합니다.
     - 인접 셀에 다른 `armor` 항목이 있다면, 인접한 방어구 개수에 비례하여 시너지 보너스 수치를 계산합니다 (예: 인접 방어구 1개당 Max HP +15 또는 방어력 +2. 기본값은 PD와 협의하되 코덱스는 임의의 상수 `bonusSynergyHp = 15`를 사용하도록 설정).
     - 방어구 간 중복 계산을 방지하기 위해 계산된 쌍(Pair)이나 셀 단위 방문 기록을 사용합니다.
2. **메서드 수정**: `CalcTotalItemStats()` 또는 `CalcFinalHP()`, `CalcFinalDef()`
   - `CalcArmorSynergy()`에서 반환된 값을 전체 체력(`itemHp`) 또는 방어력(`itemDef`)에 합산합니다.

### 3.2. `ItemTooltipUI.mlua` 변경
1. **메서드 추가**: `SetArmorSynergyText(integer itemId, table itemData, Vector2 screenPos)`
   - **설명**: 무기 시너지 텍스트(`SetWeaponSynergyText`)와 유사하게, 해당 방어구 주변에 다른 방어구가 있어 발생하는 시너지 보너스를 툴팁 `TxtSynergy` 텍스트에 표시합니다.
   - **출력 포맷 (영어 필수)**: `"[Synergy] Max HP +{value}"` 또는 `"[Synergy] DEF +{value}"`.

## 4. 코딩 규칙 (Coding Guidelines for Codex)
- **100% English Rule**: 모든 주석(Comments), `log()` 메시지, UI에 출력되는 하드코딩된 문자열, 변수명은 **반드시 100% 영어**로 작성해야 합니다. (EUC-KR 인코딩 충돌 방지)
- 타입 캐스팅 방어: `tonumber()`, `tostring()` 등을 활용해 nil 참조를 방지하세요.
