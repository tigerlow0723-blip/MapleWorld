# Armor Synergy Specification (Updated v2)

## 1. 목적 (Objective)
방어구(Armor) 아이템의 고유한 패시브 효과(Max HP 증감 및 현재 체력 연동), 액티브 사용 효과(Cost 지불 후 인접 아이템 버프 부여), 그리고 스테이지 경과에 따른 변환 로직을 구현합니다.

## 2. 데이터 구조 및 속성 정의 (Data_Table)
- **HP (패시브)**: 인벤토리에 장착 시 유저의 최대 체력(Max HP)과 현재 체력(Current HP)이 동시 증가. 장착 해제 시 동시 감소.
- **Cost (액티브)**: 전투 중 방어구 아이템 사용 시 소모되는 MP 비용.
- **Count (액티브)**: 전투 중 한 턴에 해당 방어구를 사용할 수 있는 횟수.
- **사용 옵션 (액티브 버프)**: 방어구 사용 시, 인접한 특정 타겟(무기/포션)에게 부여하는 스탯 보너스.
  - `atk_Percent(%)`: 공격력 증감률
  - `critRate(%)`: 치명타 확률 증감
  - `critDmg(%)`: 치명타 데미지 증감
  - `weaponCost`: 인접 무기의 MP 소모 비용 증감
  - `min_~ / max_~`: 능력치의 최소/최대 범위 (방어구 생성 시 랜덤 롤링으로 값 확정)
- **고유 옵션 (변환)**: 아이템을 인벤토리에 보유한 상태로 경과한 스테이지(Stage) 수에 따라 다른 아이템으로 자동 전환.

## 3. 요구사항 및 상세 로직 (Requirements & Logic)

### 3.1. HP 패시브 증감 및 어뷰징 방지 (PlayerManager)
- 방어구가 인벤토리에 배치/이동/해제될 때마다 `PlayerManager`에서 Max HP를 재계산합니다.
- **어뷰징 방지 (동기화 처리)**: 
  - 방어구 장착으로 Max HP가 `+N` 증가하면, `currentHP`도 `+N` 증가시킵니다.
  - 방어구 해제로 Max HP가 `-N` 감소하면, `currentHP`도 `-N` 감소시킵니다.
  - ⚠️ 단, 해제 시 `currentHP`가 1 미만으로 떨어지지 않게 최소 `1`로 보정(`math.max(1, currentHP)`)해야 합니다.

### 3.2. 방어구 액티브 사용 및 인접 버프 (BattleManager / Item)
1. **랜덤 롤 확정 (Random Roll 생성 시점)**:
   - "장비 등급 주문서" 시스템과 동일하게, 아이템이 **처음 생성(Instantiate)되거나 인벤토리에 들어갈 때** `Data_Table`의 `min_~` 및 `max_~` 컬럼 값을 기반으로 `math.random(min, max)`을 통해 수치를 굴립니다.
   - 굴려진 수치는 아이템 인스턴스(슬롯/컴포넌트 데이터)에 확정 고정되어, 이후 동일 아이템의 수치가 변하지 않아야 합니다.
2. **액티브 사용 시퀀스 (OnUse)**:
   - 전투 중 방어구를 클릭해 사용하면, 해당 아이템의 `cost`만큼 플레이어의 MP를 소모하고, 해당 턴의 남은 `count`를 1 차감합니다.
3. **타겟 버프 부여**:
   - 방어구 사용 시 상하좌우로 인접한 타겟 아이템(무기 또는 포션)을 검색합니다.
   - **무기(Weapon)**: 롤링된 `atk_Percent(%)`, `critRate(%)`, `critDmg(%)`, `weaponCost` 수치를 **인접한 무기**에 버프로 부여합니다. (효과 지속 시간은 '이번 턴 종료 시까지'를 기본으로 합니다)
   - **포션(Potion)**: 주스팅 방어구처럼 `min_hpRecovery(%)`가 존재한다면 인접한 포션의 체력 회복량을 증폭시킵니다.

### 3.3. 스테이지 경과 변환 로직 (Stage Transformation)
- **대상**: 아이템 ID `2006` (노가다 목장갑) ➔ `2007` (공10 노가다 목장갑)
- **로직**:
  - 매 "스테이지 클리어(또는 스테이지 진입)" 시점에 인벤토리에 보존된 아이템들의 `heldStages` (보유 스테이지 수)를 +1 증가시킵니다.
  - 만약 `itemId == 2006`이고 `heldStages >= 2`라면, 해당 슬롯의 아이템 ID를 `2007`로 변경하고 UI 및 데이터를 동기화합니다.

## 4. UI 툴팁 표기 (ItemTooltipUI.mlua)
방어구 아이템 툴팁(`StatsText` 주변 혹은 별도 텍스트 UI)에는 다음 내용이 모두 표시되어야 합니다. (100% 영문)
1. **기본 스탯 (Passive/Active Base)**:
   - `hp`: "Max HP: +{hp}"
   - `cost`: "MP Cost on Activation: {cost}"
   - `count`: "Usable {count} time(s) per turn"
2. **옵션 설명글 (Description)**: 
   - `Data_Table`의 `text` 컬럼 내용을 우선 출력합니다. (예: `Option: Adjacent weapon's Crit DMG +10% ~ +30%`)
3. **확정된 롤링 수치 표시 (Rolled Stats)**:
   - 아이템 생성되어 **랜덤 롤이 이미 완료**된 상태라면, 아래와 같이 확정된 수치를 추가로 `<color=#FFD54F>` (노란색 등)을 사용해 하단에 명시합니다.
   - 예시: 
     - "Rolled: Crit DMG +22%"
     - "Rolled: Weapon MP Cost -2"
     - "Rolled: Crit Rate -15%, Crit DMG +120%"

## 5. 코딩 규칙 (Coding Guidelines for Codex)
- **100% English Rule**: UI 출력 문자열, 로그 메시지, 변수명은 모두 영어로 작성합니다. (한글 주석 작성 금지)
- `Data_Table` 컬럼명에 공백이나 특수문자포함(`atk (%)` 등) 시 파싱 매핑에 유의하세요.
