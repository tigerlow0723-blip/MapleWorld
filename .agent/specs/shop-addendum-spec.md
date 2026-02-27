# 상점 현행화 추록 (Shop Spec Addendum)

> **역작성**: 기존 `shop-spec.md` 이후 Codex가 추가/변경한 상점 기능 역추적

---

## 목적

기존 `shop-spec.md`에 반영되지 않은 상점 시스템 변경사항을 보충한다.

---

## 1. 상점 티어 UI 시각화 (신규)

### ShopGradeUI 엔티티
- 상점 등급에 따라 시각적 표시 변경
- `ShopGradeUI_Rare`, `ShopGradeUI_Epic`, `ShopGradeUI_Legendary` 자식 엔티티
- 현재 티어에 해당하는 엔티티만 활성화, 나머지 비활성
- `TxtShopTier` 텍스트 컴포넌트에 등급명 표시

### ShopNPC 엔티티
- 상점 등급에 따라 NPC 이미지 변경
- `NPC_Rare`, `NPC_Epic`, `NPC_Legendary` 자식 엔티티
- 현재 티어에 해당하는 NPC만 활성화

---

## 2. 구매 수량 제한 (신규)

### 금 원석 구매 제한
- `goldOrePurchaseCount` 프로퍼티로 추적
- 상점 열릴 때마다 0으로 리셋
- 최대 구매 개수 제한 적용

### 돼지고기 가격 인상 시스템
- `porkPurchaseCount` 프로퍼티로 구매 횟수 추적
- 구매할 때마다 가격 인상
- `porkItemId = 11`

---

## 3. 상점 아이템 풀 변경 (업데이트)

### CollectShopItemSlots → table
- 슬롯 구조:
  - `lowAtkScroll`: 하급 무기 공격력 주문서
  - `midAtkScroll`: 중급 무기 공격력 주문서
  - `highAtkScroll`: 고급 무기 공격력 주문서
  - `gradeScroll`: 장비 등급 주문서
  - `fixedGradeScroll`: 장비 등급 확정 주문서
  - `shopConsumable`: 상점 전용 소모품
  - `goldOre`: 금 원석

### BuildTierPool(tier) → table
- 티어별 아이템 풀 구성
- DataManager.ItemTable에서 `shopTier` 매칭으로 필터링
- 중복 방지 (`usedItemIds` 체크)

---

## 4. 상점 아이템 툴팁 (신규)

- 상점 카드에 호버/우클릭 시 `ItemTooltipUI`로 툴팁 표시
- `tooltipHoverDelay = 1.0` 후 자동 표시
- 마우스 이동 시 위치 추적 후 재호출

---

## 5. 아이템 영역 상호작용 규칙 (업데이트)

| 페이즈 | ItemDisplayArea 상태 |
|--------|---------------------|
| Reward | 비활성화 |
| → Preparation | 딜레이 후 활성화 |
| Shop | 열림과 동시에 활성화 유지 |
| Shop 닫힘 | 비활성화 |
| 정비 시간 | 활성화 |

---

## 6. 무제한 구매 (변경)

- 기존: 품절 시 카드 파괴
- 현재: 상점 물품 무제한 구매 가능 (금 원석만 수량 제한)
- 카드 클릭 시 아이템 생성하되 카드는 파괴하지 않음

---

## 주의사항

- 기존 `shop-spec.md`와 함께 읽어야 전체 상점 시스템을 이해할 수 있음
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
