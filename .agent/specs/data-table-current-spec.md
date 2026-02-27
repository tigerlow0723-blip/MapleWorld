# 데이터 테이블 현행화 명세서 (Data Table Current State Spec)

> **역작성**: DataManager의 현재 구현 상태를 역분석한 데이터 테이블 구조 명세

---

## 목적

DataManager가 로드하는 모든 CSV 데이터 테이블의 현재 스키마와 파싱 로직을 문서화한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `DataManager.mlua` | 모든 데이터 테이블 로드 및 파싱 |

---

## 로드되는 테이블 목록 (LoadAllTables)

| # | 메서드 | 프로퍼티 | CSV 이름 |
|---|--------|----------|----------|
| 1 | LoadMonsterTable | MonsterTable | Data_Table - 몬스터리스트 |
| 2 | LoadBossTable | BossTable, BossBasicTable | Data_Table - 보스 |
| 3 | LoadSpawnTable | SpawnTable | Data_Table - 스폰 |
| 4 | LoadItemTable | ItemTable | Data_Table - 아이템 - 장비/방어구/기타 (3개) |
| 5 | LoadBaseStatTable | BaseStatTable | Data_Table - 기본스탯 |
| 6 | LoadLevelStatTable | LevelStatTable | Data_Table - 레벨스탯 |
| 7 | LoadSkillTable | SkillTable | Data_Table - 스킬 |
| 8 | LoadCorrectionTable | CorrectionTable | Data_Table - 보정치 |
| 9 | LoadMapTable | MapTable | Data_Table - 맵 |
| 10 | LoadDiceRollTable | DiceRollTable, DiceRollTable2 | Data_Table - 주사위눈 |
| 11 | LoadStartItemTable | StartItemTable | Data_Table - 시작아이템 |
| 12 | LoadSoundTable | SoundTable | Data_Table - 사운드 |
| 13 | LoadTutorialTable | TutorialTable | Data_Table - 튜토리얼 |

---

## 아이템 테이블 3분할 구조

### Data_Table - 아이템 - 장비 (weapon)
| 컬럼 | 설명 |
|------|------|
| id, type, name, grade, cost, sell_price | 기본 |
| atk, acc, critRate, critDmg, atkCount | 전투 스탯 |
| width, height, shapeMask | 그리드 형태 |
| min_atk, max_atk | 시너지 주문서 범위 |
| spawn_Group, spawn_rate | 소환 그룹/확률 |
| imageRUID, desc, next_upgrade_id | 리소스/설명/업그레이드 체인 |

### Data_Table - 아이템 - 방어구 (armor)
| 컬럼 | 설명 |
|------|------|
| id, type, name, grade, cost, sell_price | 기본 |
| hp, count | 패시브 HP / 사용 횟수 |
| atk_Percent, critRate, critDmg | 시너지 버프 (고정값 또는 범위) |
| weaponCost, min_weaponCost, max_weaponCost | 무기 코스트 감소 |
| min_hpRecovery, max_hpRecovery | 포션 회복 증폭 |
| synergyTarget | 시너지 대상 (weapon/potion/none) |
| shapeMask, imageRUID, desc, text | 형태/리소스/설명 |

### Data_Table - 아이템 - 기타 (consumable/etc)
| 컬럼 | 설명 |
|------|------|
| id, type, name, cost, price, sell_price | 기본 |
| hp, hpPercent | 회복량 |
| spawn_Group, spawn_rate | 소환 그룹/확률 |
| desc, text, imageRUID, shapeMask | 리소스/설명 |

---

## 주요 파싱 유틸리티

### GetCellString(ds, row, colA, colB) → string
- colA 우선 시도, 실패 시 colB 시도 (호환성)

### GetCellNumber(ds, row, colA, colB, default) → integer
- GetCellString 후 tonumber 변환

### NormalizeShapeMask(shapeMask) → string
- `1,1,1` → `111`, 줄바꿈으로 행 구분, 여백 최적화(compact)

### GetCsvHeaderSet(tableName) → table
- 테이블별 유효 컬럼 목록 반환 (pcall 안전 접근용)

---

## 시작 아이템 시스템

### StartItemTable

| 필드 | 타입 | 설명 |
|------|------|------|
| itemId | integer | 시작 시 지급할 아이템 ID |
| count | integer | 수량 (기본 1) |

### 적용 흐름 (GameManager.StartGame)
1. StartItemTable 순회
2. 각 아이템을 ItemDisplayArea에 생성
3. `isInitializingItems = true` 동안 이벤트 발생 억제
4. 초기화 완료 후 false

---

## 초기 골드 지급

- GameManager.StartGame에서 플레이어에게 초기 골드 지급
- `PlayerManager:AddGold(amount)` 호출

---

## 주의사항

- 3개 아이템 테이블은 하나의 ItemTable로 병합됨 (id 기준 dict)
- 컬럼명 불일치 대응: GetCellString의 colA/colB 폴백 패턴
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
