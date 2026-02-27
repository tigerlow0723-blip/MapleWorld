# 전투 시스템 현행화 추록 (Battle System Addendum)

> **역작성**: 기존 `battle-interaction-spec.md`, `game-loop-spec.md` 이후 추가된 전투 관련 변경사항

---

## 목적

기존 전투/게임루프 명세서에 반영되지 않은 전투 시스템 변경사항을 보충한다.

---

## 1. 소모품/포션 사용 시스템 (신규)

### OnPlayerUseConsumableById(itemId) → boolean
- 아이템 타입이 `potion`이면 `OnPlayerUsePotionByComponent` 호출
- 그 외 소모품:
  - 코스트 소모 후 hp/atkPercent/accPercent 등 효과 적용
  - 아이템 엔티티 파괴 (일회용)

### OnPlayerUsePotionByComponent(potionComp) → boolean
- 포션은 인벤토리에 잔류 (멤 파괴 안 함)
- 방어구 시너지 버프 반영: `tempArmorPotionHpPercent`
  - 인접 방어구의 포션 HP 회복 버프를 곱연산으로 증폭
- HP 회복: flatHeal + hpPercent(최대HP의 %) 모두 지원

---

## 2. 방어구 액티브 사용 시스템 (신규)

### OnPlayerUseArmorByComponent(armorComp) → boolean
- 사용 조건: 플레이어 턴, 코스트 보유, 잔여 사용 횟수 > 0
- 코스트 소모 후 `armorRemainingCount -= 1`
- `synergyTarget` 필드에 따라 인접 아이템에 버프 부여:
  - `"weapon"`: 인접 무기에 atk%/critRate%/critDmg%/weaponCost 버프
  - `"potion"`: 인접 포션에 hpRecovery% 버프
- 수치는 min_~/max_~ 범위로 아이템 생성 시 랜덤 롤링 후 확정

### 초기화 메커니즘
- 매 전투 시작: `ClearArmorTemporaryEffects` (모든 임시 버프 리셋)
- 매 턴 시작: `ResetArmorActivationCounts` (사용 횟수 리셋)
- 플레이어 턴 종료 시: `ClearArmorTemporaryEffects` (버프 만료)

---

## 3. 무기 시너지 색상 표시 (신규)

### 혼합색 시너지 (ItemDisplayArea 연동)
- 무기에 2종 이상의 시너지 주문서가 붙어있으면 혼합색으로 표시
- 단일 시너지: 해당 등급 색상
- 복합 시너지: 혼합 색상
- 방어구/포션 시너지도 색상 반영

---

## 4. 몬스터 턴 고도화 (업데이트)

### 몬스터 턴 흐름
1. 플레이어 턴 종료 버튼 클릭
2. `OnMonsterTurnStart`:
   - 몬스터 인덱스 순서대로 행동
   - 각 몬스터의 monsterTurnTimerId로 순차 실행
3. 각 몬스터:
   - `MonsterAction(index)` 호출
   - 공격/스킬 판정 → 데미지 → 애니메이션
   - 피격 SFX 재생
4. 모든 몬스터 행동 완료 후 `OnMonsterTurnEnd`:
   - 무기 공격 횟수 리셋
   - 방어구 사용 횟수 리셋
   - DoT 효과 처리
   - 플레이어 턴 전환

### DoT 효과 시스템
- `playerDotEffects` 테이블로 관리
- 매 턴 종료 시 잔여 DoT 데미지 적용
- 턴 경과에 따라 자동 만료

---

## 5. 보상 페이즈 제어 (업데이트)

### 다음 버튼 비활성화 규칙
- 보상 페이즈(Reward)에서는 "다음" 버튼 비활성화
- 보상 패널이 닫힌 후에만 활성화

### ItemDisplayArea delay
- 보상 → 정비 전환 시 딜레이 적용
- `MarkItemDisplayAreaDelayRequired()` → `BeginItemDisplayAreaDelayIfNeeded()`
- 딜레이 완료 후 ItemDisplayArea 활성화 및 UpdateUI 호출

---

## 6. 슬라이더 바 조작 방지 (신규)

- HP/Cost/Boss HP 슬라이더에 `CanvasGroupComponent` 추가
- `Interactable = false`로 설정하여 플레이어 드래그 방지

---

## 7. RNG 시드 독립화 (신규)

### 클라이언트별 독립 RNG
- `GameManager.clientRandomSeed`: 유저별 독립 시드
- `HashSeedSource(sourceText)`: 유저ID + 시간 + 엔티티ID 해싱
- `ReseedClientRandom(reason)`: 주요 분기점에서 reseed
  - OnBeginPlay, StartGame, 상점 열기, 보상 생성 시 호출

---

## 주의사항

- 이 추록은 기존 `battle-interaction-spec.md`와 `game-loop-spec.md`를 보완함
- 두 명세서를 함께 읽어야 전체 전투 시스템을 이해할 수 있음
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
