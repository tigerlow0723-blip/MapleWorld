# Codex 작업 명세서: 코드 통합

> **작업 기준 문서**: `.agent/specs/integration-spec.md`  
> **작업 브랜치**: `HeungGyu`  
> **mLua 문법 참조**: MCP 도구 `mcp_msw-mcp_mlua_grammer` 사용  
> **작업 전 필수**: `/mlua-workflow` 워크플로우 확인

---

## 작업 1: DataManager.mlua — LoadItemTable() 수정

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/DataManager.mlua`

### 수정 대상: LoadItemTable() (146~172행)

### 변경 내용
기존 `type` 필드가 `tonumber()`로 파싱되는 부분을 **문자열 그대로** 저장하도록 변경하고, `width`, `height`, `desc` 필드 파싱을 추가한다.

### 변경할 필드 파싱

| 필드 | 기존 | 변경 후 |
|------|------|---------|
| type | `tonumber(ds:GetCell(i, "type")) or 1` | `ds:GetCell(i, "type") or "weapon"` (문자열 그대로) |
| width | 없음 | `tonumber(ds:GetCell(i, "width")) or 1` 추가 |
| height | 없음 | `tonumber(ds:GetCell(i, "height")) or 1` 추가 |
| desc | 없음 | `ds:GetCell(i, "desc") or ""` 추가 |

### 변경하지 않는 것
- 나머지 모든 필드 파싱은 그대로 유지
- 테이블명 `"Data_Table - 아이템리스트"` 그대로 유지
- 메서드 시그니처 변경 없음

---

## 작업 2: ItemManager.mlua — 문자열 type 대응

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/ItemManager.mlua`

### 수정 1: GetItemTypeName() (45~54행)

현재 정수 비교를 **문자열 비교**로 변경:

| 현재 조건 | 변경 후 조건 | 반환값 |
|-----------|-------------|--------|
| `typeId == 1` | `typeId == "weapon"` | "무기" |
| `typeId == 2` | `typeId == "armor"` | "방어구" |
| `typeId == 3` | `typeId == "consumable"` | "소모품" |
| (없음) | `typeId == "expand"` 추가 | "확장" |

파라미터 타입도 변경: `integer typeId` → `string typeId`

### 수정 2: GenerateDropItems() (56~95행)

드랍 아이템 복사 시 아래 필드 추가 복사:
- `drop.width = item.width or 1`
- `drop.height = item.height or 1`
- `drop.desc = item.desc or ""`

기존 복사 필드(id, type, name, cost, atk 등)는 모두 유지.

### 수정 3: GetTotalItemStats() (15~43행)

변경 없음 (그대로 유지).

---

## 작업 3: Item.mlua — 전투 스탯 프로퍼티 추가

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/Item.mlua`

### 추가할 프로퍼티 (기존 프로퍼티 아래에 추가)

`hp` 프로퍼티(25행) 아래에 다음 프로퍼티 추가:

| 이름 | 타입 | 기본값 |
|------|------|--------|
| cost | integer | 0 |
| atkPercent | integer | 0 |
| accPercent | integer | 0 |
| critRate | integer | 0 |
| critDmg | integer | 0 |
| hpPercent | integer | 0 |
| spawnGroup | integer | 0 |

### InitFromTable() 수정 (96~114행)

1. 테이블명 변경: `"ItemTable"` → `"Data_Table - 아이템리스트"`
2. 추가 필드 파싱 (기존 파싱 코드 아래에 추가):
   - cost ← `_DataService:GetCell(dataSet, row, "cost")`
   - atkPercent ← `_DataService:GetCell(dataSet, row, "atkPercent")`
   - accPercent ← `_DataService:GetCell(dataSet, row, "accPercent")`
   - critRate ← `_DataService:GetCell(dataSet, row, "critRate")`
   - critDmg ← `_DataService:GetCell(dataSet, row, "critDmg")`
   - hpPercent ← `_DataService:GetCell(dataSet, row, "hpPercent")`
   - spawnGroup ← `_DataService:GetCell(dataSet, row, "Spawn_Group")`
3. imageRUID 매핑: `spriteRUID ← _DataService:GetCell(dataSet, row, "imageRUID")`

### FindItemRowById() 수정 (117~126행)

테이블명 파라미터 → 호출 시 `"Data_Table - 아이템리스트"` 전달되도록 InitFromTable에서 변경.

---

## 작업 4: PlayerManager.mlua — 인벤토리 연동

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/PlayerManager.mlua`

### 추가 프로퍼티

`inventory` 프로퍼티(29행) 아래에 추가:
- `property any inventoryComp = nil` — Inventory 컴포넌트 참조

### OnBeginPlay() 수정 (40~42행)

초기화 시 Inventory 컴포넌트 탐색 시도 추가:
- `self.inventoryComp = self.Entity.Inventory`
- nil이면 log로 경고만 출력 (없어도 기존 동작 유지)

### 추가 메서드: SyncInventoryFromGrid()

- 파라미터: 없음
- 반환값: 없음
- 동작:
  1. `self.inventoryComp`가 nil이면 아무것도 하지 않고 반환
  2. `self.inventory = {}` 로 초기화
  3. `self.inventoryComp.placedItems`를 pairs로 순회
  4. 각 itemId에 대해 `self.dataManager:GetItemData(itemId)` 호출
  5. 반환된 데이터가 nil이 아니면 `self.inventory`에 추가
  6. `self:RecalcAllStats()` 호출

### AddItem() 수정 (356~360행)

- 기존 동작 유지 (배열에 추가 + RecalcAllStats)
- **추가**: inventoryComp가 있으면 빈 셀 자동 탐색 후 PlaceItem 호출
  1. `self.inventoryComp`가 nil이 아닌지 확인
  2. `itemData.width or 1`, `itemData.height or 1` 가져오기
  3. 6x6 그리드를 r=1~6, c=1~6 순회하며 `inventoryComp:CanPlace(r, c, w, h)` 확인
  4. 첫 번째 배치 가능 위치에 `inventoryComp:PlaceItem(r, c, itemData.id, w, h)` 호출
  5. 배치 불가 시 log_warning 출력

### RemoveItem() 수정 (362~369행)

- 기존 동작 유지
- **추가**: inventoryComp가 있으면 해당 아이템의 그리드 배치도 제거
  1. 제거될 아이템의 id 가져오기
  2. `self.inventoryComp:RemoveItem(itemId)` 호출

---

## 작업 5: Inventory.mlua — 헬퍼 메서드 추가

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/Inventory.mlua`

### 추가 메서드: GetAllItemIds()

- 파라미터: 없음
- 반환: table (정수 배열)
- 동작:
  1. 빈 배열 result 생성
  2. `self.placedItems`를 pairs로 순회
  3. 각 key(=itemId)를 result에 추가
  4. result 반환

기존 코드 변경 없음.

---

## 작업 6: ItemDisplayArea.mlua — DisplayItems 메서드 추가

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/ItemDisplayArea.mlua`

### 추가 메서드: DisplayItems(table itemDataList)

- 실행 공간: ClientOnly
- 파라미터: itemDataList — 아이템 데이터 테이블의 배열 (각 요소에 id 필드 포함)
- 반환: 없음
- 동작:
  1. 기존 spawnedItems 정리 (GenerateRandomItems와 동일한 정리 로직)
  2. itemDataList를 순회 (i = 1 ~ #itemDataList)
  3. 각 아이템에 대해 `self:CreateItemEntity(itemDataList[i].id, i - 1)` 호출
  4. `self:ArrangeItems()` 호출

기존 메서드(GenerateRandomItems, CreateItemEntity, ArrangeItems) 변경 없음.

---

## 작업 7: GameManager.mlua — 보상 흐름 연결

### 파일 위치
`Lucky_Backpack/RootDesk/MyDesk/GameManager.mlua`

### 추가 프로퍼티

기존 프로퍼티 섹션에 추가:
- `property any itemDisplayArea = nil`

### OnBeginPlay() 수정 (46~106행)

매니저 참조 설정 부분 아래에 추가:
- 엔티티 트리에서 `ItemDisplayArea` 컴포넌트를 가진 엔티티 탐색
- 방법: `self.Entity.Parent`에서 `GetChildByName("ItemDisplayArea", true)` 시도
- 찾으면 해당 엔티티의 `.ItemDisplayArea` 컴포넌트를 `self.itemDisplayArea`에 할당

### OnBattleVictory() 수정 (189~210행)

기존 pendingRewards 생성 후, 아래 로직 추가:
- `self.itemDisplayArea`가 nil이 아니면 `self.itemDisplayArea:DisplayItems(self.pendingRewards)` 호출
- log 출력: "[GameManager] 보상 아이템 UI 표시"

기존 코드 변경 없음, 추가만.

---

## 작업 8: 불필요 파일 제거

### 제거 대상
- `Lucky_Backpack/RootDesk/MyDesk/ItemTable.csv`
- `Lucky_Backpack/RootDesk/MyDesk/ItemTable.userdataset`
- `Lucky_Backpack/RootDesk/MyDesk/MyComponent.mlua`
- `Lucky_Backpack/RootDesk/MyDesk/MyComponent.codeblock`

### 제거 방법
git rm으로 제거 후 커밋.

---

## 작업 순서 (의존성 순)

1. 작업 1 (DataManager) — 테이블 파싱이 먼저
2. 작업 2 (ItemManager) — DataManager 의존
3. 작업 3 (Item) — 테이블 참조 변경
4. 작업 5 (Inventory) — 헬퍼 메서드 추가 (독립)
5. 작업 4 (PlayerManager) — Inventory, DataManager 의존
6. 작업 6 (ItemDisplayArea) — 독립
7. 작업 7 (GameManager) — ItemDisplayArea 의존
8. 작업 8 (파일 제거) — 마지막
