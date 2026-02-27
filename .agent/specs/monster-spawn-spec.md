# 몬스터 소환 명세서 (Monster Spawn Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

스테이지별 몬스터 소환, 풀(Pool) 기반 랜덤 선택, 시각적 입장 연출, 타겟팅 시스템을 포함한 몬스터 소환 전체 흐름.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `MonsterManager.mlua` | 몬스터 스폰, 비주얼 생성, 입장 연출, 타겟 하이라이트 |
| `DataManager.mlua` | SpawnTable, MonsterTable 로드 |
| `BattleManager.mlua` | 전투 시작 시 SpawnMonsters 호출 |
| `GameManager.mlua` | 스테이지 전환 시 스폰 트리거 |

---

## 데이터 구조

### SpawnTable (DataManager.SpawnTable)

| 필드 | 타입 | 설명 |
|------|------|------|
| stageGroup | integer | 스테이지 그룹 ID |
| monsterId | string | 소환할 몬스터 ID (쉼표 구분 가능) |
| minMonsters | integer | 최소 소환 수 |
| maxMonsters | integer | 최대 소환 수 |
| poolId | integer | 몬스터 풀 ID (랜덤 소환용) |
| isBoss | boolean | 보스 스테이지 여부 |
| bossId | string | 보스 ID |

### MonsterTable (DataManager.MonsterTable)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 몬스터 고유 ID |
| name | string | 이름 |
| spawnGroup | integer | 소속 풀 |
| hp | number | 체력 |
| atk | number | 공격력 |
| accuracy | number | 명중률 |
| model | string | 모델 리소스 |
| rewardExp | integer | 보상 경험치 |
| rewardGold | integer | 보상 골드 |
| attackDelay | number | 공격 딜레이 |
| patternProbability | integer | 스킬 패턴 발동 확률 |
| deathDelay | number | 사망 후 파괴 딜레이 |

---

## 소환 흐름

### SpawnMonsters(stageId, dataMgr) → void

1. SpawnTable에서 해당 stageId의 소환 정보 조회
2. 고정 몬스터 ID가 있으면 해당 몬스터 직접 스폰
3. 풀 기반 소환(poolId > 0)이면:
   - GetMonstersByPool(poolId)로 후보군 획득
   - math.random(minMonsters, maxMonsters)로 소환 수 결정
   - 후보군에서 랜덤 선택
4. 각 몬스터에 대해 SpawnVisual 호출

### SpawnVisual(monster, index, isBoss, totalCount) → void

1. 몬스터 모델 리소스로 엔티티 동적 생성
2. 위치 배정 (monsterSpawnArea 기준, 인덱스별 오프셋)
3. 입장 애니메이션 재생 (WALK 상태)
4. `pendingSpawnEntranceCount += 1`
5. 입장 완료 후 `pendingSpawnEntranceCount -= 1`

---

## 타겟팅 시스템

### UpdateTargetHighlight(index) → void
- 선택된 몬스터에 하이라이트 표시
- 이전 타겟의 하이라이트 해제

### GetFirstAliveMonsterIndex() → integer
- 생존한 첫 번째 몬스터 인덱스 반환

### 타겟 전환 (UIMain 연동)
- UIMain.targetMonsterIdx에 현재 타겟 저장
- 몬스터 사망 시 다음 생존 몬스터로 자동 전환 (BattleManager에서 처리)

---

## 몬스터 공격 패턴

### MonsterAction(index) → void
- 보스면 BossAction 호출
- 일반 몬스터: patternProbability% 확률로 스킬공격, 나머지 기본공격

### MonsterBasicAttack(index) → void
- 기본 공격력(atk)으로 플레이어에게 데미지
- ATTACK1 애니메이션 재생

### MonsterSkillAttack(index) → void
- 스킬 데이터 기반 공격 (다단히트, 디버프 등)
- SKILL1 애니메이션 재생
- 다단히트 시 hitCount에 비례한 추가 애니메이션 시간

---

## 시각 피드백

### ProcessMonsterHitVisual(monster, damage, isCritical) → void
- `DamageSkinSettingComponent` 활용한 데미지 스킨 표시
- 크리티컬 여부에 따른 시각적 차이

---

## 주의사항

- IsSpawnEntranceFinished() == false 동안 플레이어 공격 불가
- isPhaseTransitioning / isDyingAnimating 중 전투 종료 판정 지연
- stateTokenByEntity로 엔티티별 애니메이션 상태 관리
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
