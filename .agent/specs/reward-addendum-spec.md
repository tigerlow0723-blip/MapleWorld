# 보상 시스템 현행화 추록 (Reward System Addendum)

> **역작성**: 기존 `reward-probability-spec.md`, `reward-panel-spec.md` 이후 변경사항 역추적

---

## 목적

보상 아이템 생성 확률, 확장 아이템 지급, ItemManager 현재 로직을 보충 문서화한다.

---

## 1. 보상 아이템 생성 현행 로직 (ItemManager.GenerateDropItems)

### 풀 구성 단계

1. DataManager.ItemTable 전체 순회
2. `spawn_Group`에 따라 분류:
   - expandPool (spawn_Group == 2): 확장 아이템
   - weaponRarePool: weapon + Rare 등급
   - armorPool: armor 타입
   - etcPool: 기타/소모품
3. `isRewardDrop` 플래그 체크 (0이면 드롭 풀 제외)

### 확장 아이템 지급 (변경)
- 기존: 확장 아이템 0~1개
- 현재: **1~3개** 보상으로 지급
- expandPool에서 랜덤 선택 (중복 허용)

### 카테고리별 가중치 선택
- PickCategoryByWeight 함수:
  - weapon: 가중치 4
  - armor: 가중치 3
  - etc: 가중치 3
- 해당 카테고리에 아이템이 없으면 가중치 0

### 무기 등급 확률 (RollWeaponGrade)
- Rare 무기가 선택되면 등급 상승 롤:
  - 1~70 (70%): Rare 유지
  - 71~95 (25%): Epic (nextUpgradeId)
  - 96~100 (5%): Unique (Epic의 nextUpgradeId)

### spawn_rate 기반 선택 (PickAndRemoveBySpawnRate)
- 아이템별 spawnRate를 가중치로 사용
- totalWeight 합산 후 랜덤 뽑기
- spawnRate가 0이면 일반 랜덤 폴백

---

## 2. 보상 상자 흐름 현행화

### RewardManager.GenerateRewards(stageId, dataMgr)
- dropCount = math.random(3, 5)
- ItemManager.GenerateDropItems(stageId, dropCount, dataMgr) 호출

### 보상 표시 (RewardUI.ShowRewards)
- 카드 템플릿 Clone으로 동적 생성
- 가로 정렬 (ArrangeRewardCards)
- 3초 후 자동 닫힘 또는 터치로 닫힘
- 닫힘 시 DistributeRewards 호출

### 보상 분배 (DistributeRewards)
- 일반 아이템: ItemDisplayArea에 생성
- 골드: PlayerManager.AddGold
- 주문서: PlayerManager.AddScroll

---

## 3. 주문서류 type 변경 이력

- 기존: 주문서가 기타(etc) 테이블에 혼재
- 현재: type 필드 세분화
  - `atk_scroll`: 무기 공격력 주문서
  - `grade_scroll`: 등급 주문서
  - `fixed_grade_scroll`: 등급 확정 주문서
  - `consumable`: 일반 소모품
  - `potion`: 포션류 (HP 회복)

---

## 주의사항

- 기존 `reward-probability-spec.md`의 확률 구조는 유지됨
- 확장 아이템 지급 개수만 1~3으로 변경
- ItemManager에서의 `isRewardDrop` 필터는 codex-patch-spec에서 추가됨
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
