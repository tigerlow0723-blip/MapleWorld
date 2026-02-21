# Codex 작업 명세서: 상점 및 잔여 보상 획득 로직

> **작업 기준 문서**: `.agent/specs/shop-spec.md`
> **작업 브랜치**: `HeungGyu`
> **mLua 문법 참조**: MCP 도구 `mcp_msw-mcp_mlua_grammer` 사용
> **작업 전 필수**: `/mlua-workflow` 워크플로우 확인
> **[CRITICAL RULE] ONLY ENGLISH ALLOWED IN SCRIPTS**: Codex MUST write all script comments, `log()` messages, and logic context entirely in English. Do NOT write any Korean in the generated mlua scripts to prevent severe EUC-KR encoding corruption. (However, tables or item names requiring Korean to function in MSW Maker should use Korean where functionally necessary.)

---

## 작업 1: DataManager.mlua (런타임 가격 데이터 주입)
### 파일 위치 반경
`Lucky_Backpack/RootDesk/MyDesk/DataManager.mlua`
### 작업 상세 (상세명세 6-1 참고)
- `LoadItemTable()` 메서드 내에서 `Data_Table - 아이템 - 장비/방어구/기타` 등을 읽고 메모리에 적재할 때, 특정한 `name`을 식별하여 `price` 필드를 강제로 주입합니다.
- 다음 아이템들에 대해 다음과 같이 하드코딩으로 `price`를 삽입해야 합니다 (영어 주석 필수):
  - `장비 등급 주문서` = 50
  - `하급 무기 공격력 주문서` = 100
  - `고급 무기 공격력 주문서` = 500
  - `랜덤 무기 공격력 주문서` = 2000
  - `장비 등급 확정 주문서` = 1500
  - `돼지고기` = 150
  - `금의 원석` = 500
- CSV 파일 구조를 변경하지 않고 코드 단에서 `itemData.price`를 설정하도록 합니다.

---

## 작업 2: GameManager.mlua & ItemDisplayArea.mlua (잔여 보상 자동 환전)
### 작업 상세 (상세명세 6-5 참고)
**ItemDisplayArea.mlua**
- 추가 메서드 `SellRemainingItems()` 구현.
- `self.spawnedItems` (화면에 남겨진 아이템 배열)을 역순으로 순회.
- 남아있는 각 아이템 엔티티마다 고정 골드 +50 씩 계산하여 누적 골드 합산 산출.
- 산출된 총 골드를 `PlayerManager:AddGold(amount)` 호출 등으로 플레이어 스탯에 더해줌.
- 순회한 모든 아이템 엔티티에 대해 `Destroy()` 호출 및 `self.spawnedItems` 배열을 `{}`로 초기화하여 메모리를 완벽히 비움.

**GameManager.mlua**
- 전투가 끝나고 보상 정비 파트를 끝낸 뒤, 상점 창(또는 다음 페이즈)으로 넘어가기 직전에 `self.itemDisplayArea:SellRemainingItems()`를 호출하도록 연결합니다.

---

## 작업 3: ShopUI.mlua (티어 추첨 및 동적 상점 UI 렌더링)
### 파일 위치 반경
`Lucky_Backpack/RootDesk/MyDesk/ShopUI.mlua`
### 작업 상세 (상세명세 2-2, 6-3 참고)
1. **리롤(Refresh) 버튼 렌더링 로직 제거**: 기존에 있던 `BtnRefresh` 처리 로직을 완전히 삭제합니다.
2. **상점 티어 추첨 로직(`RollShopTier`) 추가**: 
   - Rare (50%), Epic (25%), Unique (15%), Legendary (10%) 확률로 티어를 무작위 결정합니다.
   - 결정된 티어는 UI(`TxtShopTier`) 텍스트로 업데이트합니다.
3. **아이템 풀 필터링 (`GenerateShopItems`)**:
   - `DataManager`의 전체 ItemTable에서 정해진 상점 티어의 "출현 풀(Pool)"에 속하는 아이템만 필터링합니다. ex) Rare 등급은 "빨간 물약", "하얀 물약", "단검", "나무 방패", "장비 등급 주문서", "하급 무기 공격력 주문서", "돼지고기" 등. (명세서 2-2의 티어별 아이템 구성 참조)
   - 중복 확률이나 최대 구매 가능 수량(1~3개) 제한 로직이 반영되면 더욱 좋습니다 (선택사항).
4. **동적 카드 생성 및 가로 스냅 좌표 수학 연산 (Dynamic Spawning)**:
   - 배열에 있는 5장 짜리 카드를 고정적으로 노출하던 기존 로직 폐기.
   - 추첨된 아이템 개수(`n`) 기반으로 `ItemCardTemplate` 엔티티를 부모(`ItemList`) 아래에 `Clone("ItemCard_"..i)` 으로 복제 생성합니다.
   - **X좌표 동적 연산**: MSW의 `HorizontalBoxLayoutGroup`이 부재하므로, 각 카드의 UI X 좌표 길이를 계산해 (ex: width가 100이고 여백이 20이면 120 단위로 오프셋 이동) 가로로 이쁘게 나열합니다. 첫 카드의 시작 지점을 중심으로 계산하여야 합니다.
   - 카드 클릭(`OnClickCard`)으로 상품을 구매하면, 유저 골드를 삭감하고 해당 UI 카드 엔티티(Clone) 자체를 파괴(`Destroy`)합니다. 
   - 동시에 **`GameManager.itemDisplayArea:CreateItemEntity(아이템ID)`** 를 호출하여 구매한 실제 아이템 클론을 바닥에 스폰시킵니다.
   - ⚠️ **중요 (임시 보관 정렬 방지)**: 생성이 완료된 아이템 클론의 `UITransformComponent.anchoredPosition` 값을 고정된 스폰 좌표(예: `Vector2(0, 100)` 또는 임의 지정)로 직접 세팅해주어 안착시킵니다. 절대 **`ArrangeItems()`를 호출하지 마세요**. 유저가 바닥에 자유롭게 테트리스 해놓은 가방 밖 보관 아이템들의 위치가 싹 쓸려 나가는 것을 방지하기 위함입니다.
   - UI 쪽 빈 공간을 채우도록 나머지 형제 상점 카드들에 대해 다시 좌표 연산을 태워 촘촘히 재렌더링 시킵니다.

---

## 작업 4: InventoryUI.mlua (상점 판매 기능 - TrySellDrop)
### 파일 위치 반경
`Lucky_Backpack/RootDesk/MyDesk/InventoryUI.mlua`
### 작업 상세 (상세명세 6-4 참고)
- `TrySellDrop` 메서드 내부 구현을 고도화합니다.
- 배치 가능한 상점 판매 구역(`SellArea`)을 판별(`IsInSellArea`)한 뒤, 마우스 터치 업(Drop) 시 발동.
- 아이템 `price` 기반으로 50%의 환율(`price * 0.5`)을 계산해 골드로 환원하고, `PlayerManager`의 재화 스탯을 상승시킵니다.
- 환전 처리가 종료되면, 화면에 드래그 중인 엔티티를 `Destroy`하고 인벤토리 관리 시스템 배열 내부에서 완전 삭제(`self.Entity.Inventory:RemoveItem`) 시킵니다.

---

## 작업 5: InventoryUI.mlua & ItemDisplayArea.mlua (인벤토리 외부 드롭 시 자유 배치 Staging 처리)
### 파일 위치 반경
`Lucky_Backpack/RootDesk/MyDesk/InventoryUI.mlua`
`Lucky_Backpack/RootDesk/MyDesk/ItemDisplayArea.mlua`
### 작업 상세 (상세명세 6절 다이어그램 참고)
- **ItemDisplayArea.mlua 추가 기능**:
  - `AddReturnedItem(itemEntity, dropPosition)` 메서드를 새로 만듭니다. 전달받은 엔티티를 자기 자신(`self.Entity:AttachChild`)의 자식으로 등록하고, `self.spawnedItems` 배열에 도로 편입시킵니다.
  - ⚠️ **중요**: 이때 `self:ArrangeItems()`를 절대 호출하지 마세요. 대신 전달받은 `dropPosition`(Vector2) 좌표를 바탕으로 해당 아이템 클론의 `UITransformComponent.anchoredPosition` 값을 세팅해주어, 유저가 놓은 그 자리에 정확히 고정(Free Placement)되도록 만듭니다.
- **InventoryUI.mlua `OnDragRelease` 방어 로직 수정**:
  - 사용자가 아이템을 드래그해서 가방 밖(일반 빈 화면)에 드롭했을 경우, 기존에는 `ReturnToOrigin()` 을 불렀으나, 이제는 **바닥(`ItemDisplayArea`) 로 아이템을 반환해 그 좌표에 고정(Staging)**하도록 합니다.
  - 가방에 들어있던 아이템이라면 `Inventory:RemoveItem`으로 그리드 데이터를 먼저 지워줍니다.
  - 이후 `GameManager.itemDisplayArea:AddReturnedItem(self.dragState.itemEntity, 현재 드롭 터치 좌표)`를 호출하여 아이템을 바닥 해당 위치에 안착시킵니다.
  - (판매 영역에 드롭된 게 아닐 때만 이 반환 로직이 타야 합니다.)

---

## 작업 순서 요약
1. **작업 1**: `DataManager` 수정하여 아이템 기본 테이블 적재 시 price 하드코딩 데이터 주입
2. **작업 2**: `ItemDisplayArea` 와 `GameManager` 에 남은 전리품 50골드 환전 처리 로직 삽입
3. **작업 3**: `ShopUI` 에 상점 티어 롤링 단계 및 X좌표 수학적 보간 동적 렌더링 카드 스크립트 작성
4. **작업 4**: `InventoryUI` 에 상점 진열대에 드롭 시 아이템 판매(`TrySellDrop`) 처리 구현
5. **작업 5**: `InventoryUI` 외부 드롭 시 아이템을 `ItemDisplayArea`로 반환(`AddReturnedItem`) 하는 로직 연결
