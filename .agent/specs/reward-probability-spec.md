# 보상 아이템 확률 병합 시스템 명세서 (reward-probability-spec)

## 1. 목적 (Purpose)
상자 개봉 시 무기/방어구 등 아이템이 무작위로 뜨는 로직을 수정합니다. 무기(Weapon)의 경우 총 64종이 각각 뜨지 않고, "레어 등급 무기" 16종만 리스트에 올라옵니다. 리스트에서 선택되었을 때 내부 확률(Rare 70%, Epic 25%, Unique 5%)로 최종 등급이 정해지도록 구현합니다.

## 2. 파일 목록 (File List)
- **수정 대상 파일**
  - `Scripts/DataManager.mlua` (데이터 테이블 파싱 반영)
  - `Scripts/ItemDisplayArea.mlua` (확률 그룹 및 스폰 적용)

## 3. 데이터 구조 (Data Structure)

### 3.1 Item 속성 추가/변경 사항 (DataManager.mlua)
로딩되는 `itemData` 테이블에 아래 속성을 명시적으로 담습니다 (이미 `weapon-upgrade-spec.md`에서 부분 반영).
| 변수명 | 타입 | 설명 | 기본값 |
|---|---|---|---|
| `grade` | string | 장비 등급 (Rare, Epic, Unique, Legendary). 기타 타입은 "". | "" |
| `nextUpgradeId` | integer | 강화/진화 시 다음 등급의 아이템 ID. 없으면 0. | 0 |

## 4. 메서드 시그니처 및 변경 사항 (Method Signatures)

### 4.1 `Scripts/DataManager.mlua` 변경 사항
- **메서드**: `GetCsvHeaderSet(tableName: string) : table`
  - **설명**: `tableName`이 `"Data_Table - 아이템 - 장비"`일 때 반환하는 `headers` 테이블에 `headers["grade"] = true` 와 `headers["next_upgrade_id"] = true` 를 추가.
- **메서드**: `LoadItemTable()`
  - **설명**: 컬럼 매핑 로직에서 `grade` (문자열)와 `next_upgrade_id` (숫자)를 파싱하여 개별 아이템 데이터 객체(`data.grade`, `data.nextUpgradeId`)에 할당하는 코드 추가.

### 4.2 `Scripts/ItemDisplayArea.mlua` 변경 사항
- **메서드**: `GenerateRandomItems(count: integer)`
  - **설명**: 보상상자 클릭 시 무작위로 아이템 목록을 뽑아주는 로직을 수정.
  - **로직 흐름표**
    1. `DataManager`에서 전체 `ItemTable`을 순회하면서 스폰 대상 리스트(`normalItemIds`)를 구성.
    2. 생성 조건: `isGoldOre`가 아니고 `hasValidSprite`가 참일 것.
    3. 그룹화 조건 추가: 무기(`itemData.type == "weapon"`)일 경우, **`itemData.grade == "Rare"`** 인 경우에만 `normalItemIds`에 추가. (이로 인해 64개의 무기가 16개로 압축됨). 방어구나 기타 장비는 그대로 추가.
    4. 생성 단계: `normalItemIds`에서 랜덤하게 ID를 하나 뽑았을 때(이 ID를 `selectedId`라고 함), 해당 아이템이 "weapon" 타입이고 "Rare" 등급이라면 랜덤 굴림(1~100)을 실시.
    5. **확률 적용**:
       - **1~70 (70%)**: 그대로 `selectedId` (Rare) 사용.
       - **71~95 (25%)**: 해당 아이템의 `nextUpgradeId`를 스폰 ID로 사용 (Epic). (만약 0이라면 Rare 사용)
       - **96~100 (5%)**: 해당 아이템의 `nextUpgradeId`(Epic)의 데이터 값을 찾아 읽어, 그 Epic 장비의 `nextUpgradeId`를 스폰 ID로 사용 (Unique).
    6. 최종 산출된 스폰 ID 구성을 `spawnItemIds` 배열에 넣고 기존처럼 화면에 배치(CreateItemEntity).

## 5. 이벤트 흐름 (Event Flow)
- 유저 보상 상자 클릭 (RewardChest: OnButtonClick)
  -> `ItemDisplayArea:GenerateRandomItems` 호출
  -> DataManager의 아이템 구조에서 무기를 Rare 16개로만 추려서 테이블 풀(Pool) 생성
  -> 무작위 풀 뽑기 수행 후 무기가 뽑히면 확률 판정에 따라 희귀도 상승 적용
  -> UI 드롭 (70/25/5 확률 분배)

## 6. 특별 지시 사항 (TD Rules Enforcement)
- 수학/랜덤 함수 사용 시 `math.random(1, 100)`을 사용한다.
- 모든 로그, 텍스트 변수 내용은 영문(US)으로 작성한다.
- 파이썬 등 외부 스크립트 작성은 금지되며 모든 구현은 명세서에 지시된 대로 mLua 스크립트(.mlua)를 직접 핸들링한다.
