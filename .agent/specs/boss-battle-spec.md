# 보스 전투 명세서 (Boss Battle Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

3페이즈 보스 전투 시스템. 보스는 페이즈마다 HP가 리셋되고, 모델(스프라이트)이 변경되며, 고유 패턴을 사용한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `MonsterManager.mlua` | 보스 스폰, 페이즈 전환, 보스 행동 |
| `BattleManager.mlua` | 전투 흐름 제어 (턴, 승리/패배) |
| `DataManager.mlua` | BossTable, BossBasicTable 로드 |
| `UIMain.mlua` | 보스 HP바, 페이즈 표시 |

---

## 데이터 구조

### BossBasicTable

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 보스 고유 ID |
| name | string | 보스 이름 |
| hpPhase1 / 2 / 3 | number | 페이즈별 최대 HP |
| atkPhase1 / 2 / 3 | number | 페이즈별 공격력 |
| modelPhase1 / 2 / 3 | string | 페이즈별 모델 리소스 |
| deathDelayPhase1 / 2 / 3 | number | 페이즈 전환 시 사망 애니메이션 딜레이 |

### BossTable (패턴)

| 필드 | 타입 | 설명 |
|------|------|------|
| bossId | string | 보스 ID (BossBasicTable과 매핑) |
| phase | integer | 해당 패턴이 적용되는 페이즈 |
| effectType | string | 공격 유형 (기본공격, 스킬, shield, heal 등) |
| damage | number | 데미지 또는 힐량(%) |
| hitCount | integer | 다단히트 횟수 |
| probability | integer | 해당 패턴 발동 확률 (가중치) |

---

## 보스 스폰 흐름

### SpawnBoss(bossId, dataMgr) → void

1. BossBasicTable에서 기본 정보 로드
2. BossTable에서 페이즈별 패턴 목록 로드
3. 보스 객체 생성:
   - 초기 HP = hpPhase1, 공격력 = atkPhase1
   - 모델 = modelPhase1
   - 페이즈 = 1
4. monsterList에 추가 (인덱스 1)
5. SpawnVisual로 시각적 엔티티 생성

---

## 페이즈 전환 흐름

### DamageMonster 내 페이즈 전환 로직

1. 보스 HP가 0 이하로 떨어지면:
   - 현재 페이즈 < 3이면:
     a. `isPhaseTransitioning = true`
     b. 현재 엔티티에 **사망 애니메이션** 재생 (DIE 상태)
     c. `deathDelay` 후 기존 엔티티 파괴
     d. 다음 페이즈의 HP/ATK/모델로 갱신
     e. 새 비주얼 스폰
     f. 1.5초 후 `isPhaseTransitioning = false`
   - 페이즈 3 사망 시:
     a. `isDyingAnimating = true`
     b. **DIE2** 애니메이션 재생
     c. deathDelayPhase3 후 엔티티 파괴
     d. `isDyingAnimating = false`

---

## 보스 행동 (BossAction)

### 패턴 선택 로직

1. 현재 페이즈에 해당하는 패턴 목록 필터링
2. 가중치 기반 확률로 패턴 선택
3. 패턴 유형별 처리:

| effectType | 동작 |
|------------|------|
| (일반 공격) | MonsterBasicAttack 호출 |
| shield | `boss.shieldActive = true` |
| heal | 보스 HP를 maxHP의 (damage)% 만큼 회복 |
| dot | 플레이어에 DoT 효과 부여 |
| multi | `hitCount`만큼 다단히트 |
| debuff | `incomingDmgUp` 적용 (N턴간 피해 증가) |

### 쉴드 메커니즘
- `shieldActive = true` 시 플레이어 공격이 대미지 0
- 쉴드는 1턴 유지 (다음 플레이어 턴 시작 시 해제되는 구조)

---

## UI 연동

### 보스 HP바
- UIMain에서 `sliderBossHP`, `txtBossHP` 사용
- 매 프레임 `OnUpdate`에서 `UpdateMonsterHPBars` 호출로 갱신
- `lastBossPhase`로 페이즈 변경 감지 시 UI 전환

### 페이즈 전환 중 상태
- `isPhaseTransitioning = true` 동안 플레이어 조작 불가
- `isDyingAnimating = true` 동안 전투 종료 판정 지연

---

## 주의사항

- 보스는 monsterList[1]에 항상 단일 존재
- `isBossBattle` 플래그로 일반 몬스터 전투와 분기
- 사운드 연동: `PlaySFXByTitle("boss_hit_{id}")`, `PlaySFXByTitle("boss_atk_{effectType}")`
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
