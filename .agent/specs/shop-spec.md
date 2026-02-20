# 작업 명세서: 상점(Shop) 구매 및 판매 시스템 통합

> **목표**: 
> 1. 전투 보상으로 획득한 골드(Gold) 재화를 활용하는 상점 시스템 구축.
> 2. `Preparation`(정비) 단계에서 특정 조건(예: 3스테이지 클리어 후)에 상점 팝업 호출.
> 3. 골드를 지불하여 3~5개의 랜덤 아이템 중 선택 구매 기능.
> 4. 인벤토리에 들어 있는 아이템을 우클릭 또는 특정 조작으로 상점에 판매(Gold 획득)하는 기능.

---

## 1. 재화(Gold) 구조 점검 및 보완 (PlayerManager.mlua, DataManager.mlua)

현재 `PlayerManager`에는 `gold` 프로퍼티가 정의되어 있으나 이를 활용하거나 획득하는 로직이 미비합니다.

### 1-1. 몬스터 처치 및 스테이지 클리어 골드 획득 (BattleManager.mlua)
- 전투 승리(`EndBattle("Victory")`) 시 발동되는 `CollectRewards` 동작을 보완합니다.
- 각 몬스터(또는 스테이지 난이도) 데이터베이스(`MonsterTable.csv`)에 지정된 `goldReward` 값을 합산하여 `self.playerManager.gold` 량에 누적합니다.
- 획득한 골드는 UI(로비/정비 화면의 골드 텍스트)에 즉각 반영되어야 합니다.

### 1-2. 아이템 가격/판매가 데이터 (ItemTable.csv)
- 현재 아이템의 전투 소모 비용은 `cost`에 적혀 있으며, **상점 구매가인 `price` 필드는 아직 개발/입력되지 않은 상태(미구현)**입니다.
- **[주의 사항]**: 현재 코드는 임시방편으로 `price` 컬럼이 없으면 `cost` 값을 가져다가 가격으로 취급하도록 우회되어 있습니다. 추후 CSV에 `price`가 추가되면 이를 분리하여 온전하게 적용해야 합니다!
- **아이템 판매가**는 기본적으로 구매가의 `50%`(또는 고정 수식)로 스크립트에서 자동 계산되도록 기획합니다.

---

## 2. 상점 UI (ShopUI.mlua 신규 구현)

메이커에서 새로운 UI 그룹(`ShopPanel`)을 만들고 통제하는 스크립트입니다.
> **디자인 레퍼런스(오토체스 류 덱빌딩 상점)**
> - 가로로 긴 하단 인터페이스 형태 
> - 맨 왼쪽에 "새로고침(주사위 아이콘)" 패널
> - 우측에 나란히 세워진 5개의 "상품 카드 패널"

### 2-1. 메이커(Maker) 화면에서 만들 UI 엔티티 (Hierarchy 계층 구조)
상점이 열리는 정확한 타이밍은 **[전투 승리 -> 보상 상자 정리 -> '다음으로' 버튼 클릭 시]** 상점창이 화면에 팝업되는 순서입니다.

**UI 계층 구조도 (Workspace -> `ui` -> `UIGroup` 밑에 생성):**
- **`ShopPanel`** (`SpriteGUIRendererComponent` 및 빈 스크립트 **`ShopUI`** 부착)
  - 기본 상태(Inspector): `Enable = false` (평소엔 무조건 꺼둠)
  - **`BtnRefresh` (새로고침 버튼)**: (`ButtonComponent`, `SpriteGUIRendererComponent`)
    - 주사위 아이콘과 "새로고침💰2" 텍스트 포함
  - **`ItemList` (가로 진열대)**: 
    - 상점 아이템 카드 5개가 나란히 진열되는 그룹. 비워둠.
    - **상품 카드 템플릿 (`ItemCardTemplate`)**: (`ButtonComponent`, `UITransformComponent`)
      - 카드를 클릭해야 하므로 버튼 부착. 그 속에는 다음 3가지만 노출.
      1. `이미지(Sprite)`: 아이템 사진.
      2. `가격(Text)`: 이미지 아래 코인 아이콘 + 판매가.
      3. `이름(Text)`: 최하단 상품명.
  - **`PlayerCoin` (기존 TxtPlayerGold 대체)**: 빈 객체 컨테이너. 내부에 코인 이미지(`ImgCoin` SpriteGUIRenderer)와 보유 골드 텍스트(`TxtPlayerCoin` TextComponent) 자식 개체를 포함합니다. (ShopUI 스크립트 연결 완료됨)
  - **`BtnCloseShop`**: (`ButtonComponent`) 상점 닫고 다음 스테이지(정비)로 넘어가는 닫기 버튼.

### 2-2. 상점 노출 타이밍과 로직 (`GameManager.mlua` & `ShopUI.mlua` 연계)
- 1. **등장(On)**: `GameManager`에서 보상을 모두 줍고 정비 종료를 눌렀을 때(`EndPreparation()`), `self.gamePhase = "Shop"`가 되면서 `ShopPanel` 엔티티의 `Enable = true`로 화면에 나타납니다.
- 2. **세팅**: 켜지는 즉시 `ShopUI:OpenShop()`이 발동하며 무작위 5개의 아이템 카드가 `ItemList` 안에 렌더링 됩니다.
- 3. **퇴장(Off)**: 유저가 `BtnCloseShop` 버튼을 누르면, 상점 패널의 `Enable = false`로 꺼버린 뒤, `GameManager`에 신호를 보내 다음 스테이지(`currentStage + 1`)의 **정비(Preparation) 단계**로 사이클을 깔끔하게 다시 돌립니다!

### 2-3. 새로고침 (Reroll) 로직 (`OnClickRefresh()`)
- 유저가 좌측의 새로고침 버튼을 누를 때 발동.
- 조건 판정: `playerManager.gold >= 2` (예: 새로고침 비용 2골드)
- 지불 처리: `playerManager.gold -= 2`
- 갱신 처리: 현재 진열된 모든 카드를 품절(초기화) 처리하고, 배열(`shopItems`)을 지운 뒤, 2-2번 항목의 `무작위 5개 뽑기 및 렌더링` 로직을 그대로 재차 실행합니다.

---

## 3. 아이템 구매(Buy) 로직

상점에 진열된 아이템(상품)을 유저가 **터치(클릭)**할 때 발생합니다.

### 3-1. 조건 및 실행 단계
1. **돈(Gold) 확인**: `playerManager.gold >= 클릭한 아이템의 가격(price)` 검사.
2. **공간 확인**: `playerManager:AddItem(아이템데이터)`를 가상으로(미리보기) 때려보거나, 단순히 구입 직후 `ItemDisplayArea`(바닥)에 먼저 던져주는 방식을 고려.
   - *팁: 백팩히어로는 보통 상점 아이템을 사면 인벤토리가 꽉 찰 것에 대비해 일단 마우스 커서나 바닥(여분 보상칸)으로 보냅니다.*
   - **설계 결론**: 구입 성공 시, 아이템 엔티티를 `ItemDisplayArea` 쪽에 추가 스폰시킵니다.
3. **지불**: `playerManager.gold -= 아이템 가격` 실행 및 UI 갱신.
4. **품절 처리**: 상점 진열대에 있던 그 아이템 엔티티는 파괴(품절)됩니다.

---

## 4. 아이템 판매(Sell) 로직

인벤토리 정리 중, 쓸모없는 아이템을 버리는 대신 돈으로 바꾸는 기능입니다.

### 4-1. 드래그 & 드롭 판매 (InventoryUI.mlua 연계)
- 현재 아이템을 드래그하여 가방 바깥 아무데나 놓으면 `ReturnToOrigin`(원래 위치 복귀) 됩니다.
- 상점이 열려있는(`gamePhase == "Shop"`) 동안만, 드래그한 아이템을 상점 패널 특정 구역(`SellArea`)에 떨어뜨리면 아이템이 판매되는 이벤트를 발생시킵니다.
  1. `itemId`를 통해 `Data_Table`에서 구매가를 조회하고 나누기 2(판매가)를 합니다.
  2. 아이템을 가방(`Inventory`) 및 UI에서 완전히 영구 삭제(파괴)합니다.
  3. `playerManager.gold += 판매가` 적용 및 로깅.

---

## 5. Codex 작업 지시 요약

1. **테이블 수정**: `ItemTable.csv`에 `price` (골드 가격) 열 추가. `MonsterTable.csv`에 `goldDrop` 열 추가.
2. **`ShopUI.mlua` 신규 컴포넌트**: 상품 리스트 렌더링, `OpenShop()` 로직(무작위 아이템 스폰) 구현.
3. **`PlayerManager.mlua`**: 골드 증감 계산 함수 구현.
4. **`InventoryUI.mlua`**: 상점 페이즈 시 드래그 & 드롭 판매(SellArea 타겟 오버랩 체크) 분기 추가.

---

## 6. 스크립트 구현 내용 및 Codex 참고 명세 (AS-IS)

현재 시스템은 위 명세에 따라 다음과 같이 구현되어 있습니다. 향후 버그 수정 및 유지보수를 위해 Codex는 다음 구조를 반드시 참고해야 합니다.

### 6-1. DataManager.mlua (데이터 로드 및 파싱 정규화)
- **`LoadItemTable()`**: `Data_Table - 아이템 - 장비 / 방어구 / 기타` 3개의 CSV로 분할된 테이블을 순환하며 모든 아이템 목록을 로드합니다.
- **`NormalizeShapeMask(shapeMask)` 메서드**: `1,1,1` 또는 `1/1/1` 등 비정형 텍스트를 읽어 여백을 최적화한 뒤 `/"표를 구분자로` 포맷팅하여 메모리(ItemTable)에 저장합니다.

### 6-2. BattleManager.mlua & MonsterManager.mlua (상점용 골드 보상)
- **`CollectRewards()`**: 죽은 몬스터 데이터 내부의 `rewardGold` 및 `goldDrop`을 합산합니다.
- 승리 분기망에서 곧바로 `PlayerManager:AddGold(골드량)`를 호출하여 상점 구매재화 값을 즉각 연동합니다.

### 6-3. ShopUI.mlua (UI 로직 및 아이템 비용 연동)
- **`OpenShop()` & `GenerateShopItems()`**: 총 5개의 랜덤 카드를 표시합니다. 이때 `price`가 없으면 `cost`를 대체 가격으로 활용합니다 (`GetItemPrice()`).
- **`OnClickRefresh()`**: 유저가 수동 리롤 요청 시, 내 골드가 2 이상(`refreshCost`) 일 때 `SpendGold()`하고 진열 목록을 전체 갱신(Re-draw)합니다.
- **`OnClickCard(index)`**: 골드가 충분하면 아이템을 구매하며, 성공하면 배열을 지우고 `ItemDisplayArea`에 카드 이미지를 스폰시킵니다.
- **[이슈 트래킹]**: 간헐적으로 리롤 시 이전 아이템의 카드 이미지가 그대로 남아 이름과 불일치하는 "유령 스프라이트" 현상이 발견되었습니다. 현재 방어 로직(`ImageRUID` 명시적 초기화)을 넣었으나 엔진 이슈로 완화되지 않을 수 있으므로, **추후 전체 아이템 데이터에 모든 `imageRUID`가 채워진 상태에서 다시 한 번 버그 유무를 재테스트**해야 합니다.

### 6-4. InventoryUI.mlua (판매 구역 드래그 드롭)
- **`TrySellDrop(touchPoint)`**: 화면 터치 후 놓을 때 상점이 열려 있고(`GameManager.gamePhase == "Shop"`), 좌표 영역이 판매 구역(`SellArea`) 안(`IsInSellArea`)일 경우 `SellItemById(itemId)`를 실행합니다.
- **`SellItemById(itemId)`**: 아이템의 `price` 대조 후 50%의 환율(`GetSellPrice()`)을 계산해 골드로 환원하고 엔티티와 슬롯 정보를 완전 삭제합니다.

### 6-5. Item.mlua (도형의 회전 및 그리드 연동)
- **`Rotate90Degrees()`**: 유저가 회전(R 키 또는 우클릭) 시, 배열로 저장된 `shapeMatrix`를 90도 회전(전치/역순)시킵니다. 인벤토리 `CanPlace` 함수 호출 시에도 새로 바뀐 크기(가로세로 `width/height` 변환)에 대응합니다.
