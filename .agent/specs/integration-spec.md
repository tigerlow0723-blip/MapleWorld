# 코드 통합 명세서: 인벤토리 시스템 병합

> 작성일: 2026-02-19  
> 방침: **제거 최소화, 없는 것을 추가하는 방향으로 통합**  
> 결정: type 필드 = **문자열** ("weapon", "armor", "consumable", "expand")

---

## 1. 아이템 테이블 병합

### 대상 파일: `Data_Table - 아이템리스트.csv`

현우님 테이블을 기본으로, **width, height, desc 컬럼 추가** + **type을 문자열로 변환**.  
PD의 `ItemTable.csv`는 테스트용이므로 통합 후 제거.

### 병합 후 컬럼 순서

| 순서 | 컬럼 | 설명 |
|------|------|------|
| 1 | id | 정수 |
| 2 | type | 문자열: weapon / armor / consumable / expand |
| 3 | name | 아이템 이름 |
| 4 | width | 그리드 가로 크기 (기본 1) |
| 5 | height | 그리드 세로 크기 (기본 1) |
| 6 | cost | 코스트 |
| 7 | atk | 공격력 |
| 8 | atkPercent | 공격력 % |
| 9 | accPercent | 명중률 % |
| 10 | critRate | 치명타 확률 |
| 11 | critDmg | 치명타 데미지 |
| 12 | hp | 체력 |
| 13 | hpPercent | 체력 % |
| 14 | def | 방어력 |
| 15 | Spawn_Group | 드랍 그룹 |
| 16 | desc | 설명 텍스트 |
| 17 | imageRUID | 이미지 리소스 ID |

### 데이터 (기존 10개 + expand 1개)

| id | type | name | width | height | cost | atk | atkPercent | accPercent | critRate | critDmg | hp | hpPercent | def | Spawn_Group | desc | imageRUID |
|----|------|------|-------|--------|------|-----|-----------|-----------|----------|---------|-----|----------|-----|-------------|------|-----------|
| 1 | weapon | 낡은검 | 1 | 2 | 3 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 기본 검 | (기존값) |
| 2 | weapon | 강철검 | 1 | 2 | 4 | 18 | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 2 | 강화된 검 | (기존값) |
| 3 | weapon | 화염지팡이 | 1 | 2 | 5 | 25 | 10 | 0 | 5 | 10 | 0 | 0 | 0 | 3 | 화염 마법 지팡이 | (기존값) |
| 4 | weapon | 암흑단검 | 1 | 1 | 3 | 15 | 0 | 10 | 15 | 20 | 0 | 0 | 0 | 3 | 그림자 단검 | (기존값) |
| 5 | armor | 가죽갑옷 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 20 | 0 | 3 | 1 | 기본 갑옷 | (기존값) |
| 6 | armor | 강철갑옷 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 40 | 5 | 6 | 2 | 강화된 갑옷 | (기존값) |
| 7 | armor | 마법로브 | 2 | 2 | 0 | 0 | 5 | 0 | 0 | 5 | 15 | 0 | 2 | 3 | 마법 방어구 | (기존값) |
| 8 | consumable | 체력포션 | 1 | 1 | 2 | 0 | 0 | 0 | 0 | 0 | 30 | 0 | 0 | 1 | HP 회복 포션 | (기존값) |
| 9 | consumable | 각성물약 | 1 | 1 | 3 | 0 | 10 | 10 | 5 | 0 | 0 | 0 | 0 | 2 | 스탯 강화 물약 | (기존값) |
| 10 | weapon | 용암도끼 | 2 | 1 | 6 | 35 | 15 | 0 | 10 | 15 | 0 | 0 | 0 | 4 | 최강 무기 | (기존값) |
| 11 | expand | 인벤토리 확장 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 인벤토리 칸 활성화 | NONE |

### width/height 배정 근거

- 단검류(1x1), 검/지팡이류(1x2), 갑옷/방패류(2x2), 도끼/표창(2x1)
- 소모품(1x1), 확장 아이템(1x1)

---

## 2. DataManager.mlua 수정

### LoadItemTable() 수정 내용

- width, height, desc 필드 추가 파싱
- type 필드를 문자열로 저장 (기존: `tonumber()` → 변경: 문자열 그대로)
- 기본값: width=1, height=1, desc=""

---

## 3. ItemManager.mlua 수정

### GetItemTypeName() 수정

- 기존: 정수 비교 (typeId == 1 → "무기")
- 변경: 문자열 비교 (typeId == "weapon" → "무기")

### GenerateDropItems() 수정

- 드랍 아이템 복사 시 width, height, desc 필드도 복사

---

## 4. Item.mlua 수정

### 프로퍼티 추가

- cost (integer, 기본 0)
- atkPercent (integer, 기본 0)
- accPercent (integer, 기본 0)
- critRate (integer, 기본 0)
- critDmg (integer, 기본 0)
- hpPercent (integer, 기본 0)
- spawnGroup (integer, 기본 0)

### InitFromTable() 수정

- 테이블명: `"ItemTable"` → `"Data_Table - 아이템리스트"`
- 추가 필드 파싱: cost, atkPercent, accPercent, critRate, critDmg, hpPercent, Spawn_Group
- imageRUID → spriteRUID 매핑

---

## 5. PlayerManager.mlua 수정

### 인벤토리 참조 방식 변경

- `property table inventory = {}` → **유지** (하위 호환)
- `property any inventoryComp = nil` **추가**
- OnBeginPlay() 에서 `self.inventoryComp = self.Entity.Inventory` 시도

### 스탯 계산 메서드 수정 방침

- 기존 `for i=1, #self.inventory` 루프는 **그대로 유지**
- 대신 `inventory` 테이블을 **Inventory.placedItems에서 동기화**하는 헬퍼 메서드 추가

### 추가 메서드: SyncInventoryFromGrid()

- 동작: Inventory 컴포넌트의 placedItems를 순회하여 DataManager에서 아이템 데이터를 가져와 self.inventory 배열을 재구성
- 호출 시점: 아이템 배치/제거 후
- 이렇게 하면 기존 스탯 계산 코드 수정이 최소화됨

### AddItem() / RemoveItem() 수정

- AddItem(): Inventory 컴포넌트가 있으면 빈 셀 자동 탐색 후 PlaceItem 호출
- RemoveItem(): Inventory 컴포넌트가 있으면 RemoveItem 호출
- 양쪽 모두 호출 후 SyncInventoryFromGrid() 실행

---

## 6. ItemDisplayArea.mlua 수정

### 추가 메서드: DisplayItems(table itemDataList)

- 동작: RewardManager/GameManager에서 생성한 아이템 데이터 배열을 받아 엔티티로 변환
- 각 아이템에 대해 CreateItemEntity(itemId, index) 호출
- 기존 GenerateRandomItems()는 유지 (독립 기능)

---

## 7. GameManager.mlua 수정

### OnBattleVictory() 수정

- 기존 pendingRewards 생성 로직 유지
- ItemDisplayArea가 연결되어 있으면 DisplayItems() 호출하여 UI 표시

### 추가 프로퍼티

- `property any itemDisplayArea = nil`
- OnBeginPlay()에서 엔티티 탐색으로 연결

---

## 8. 제거 대상

| 파일 | 이유 |
|------|------|
| ItemTable.csv | Data_Table - 아이템리스트.csv로 통합 |
| ItemTable.userdataset | 위와 동일 |
| MyComponent.mlua + .codeblock | 빈 컴포넌트 (108byte) |

---

## 9. 검증 계획

### Maker 테스트 (PD 수동 검증)

1. Maker에서 프로젝트 열기 → 콘솔에서 DataManager 로그 확인
   - "아이템 10 개 로딩" 대신 "아이템 11 개 로딩" 표시되어야 함
2. 인벤토리 UI 열기 → 3x3 그리드 표시 확인
3. 아이템 드래그앤드롭으로 배치 확인
4. 인벤토리 확장 아이템 사용 시 셀 활성화 확인
5. 전투 승리 후 보상 아이템 진열 확인
6. 배치된 아이템 스탯이 플레이어에 반영되는지 로그 확인
