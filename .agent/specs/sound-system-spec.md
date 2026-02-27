# 사운드 시스템 명세서 (Sound System Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

전투, UI 인터랙션, 배경음 등 모든 게임 사운드를 데이터 드리븐으로 관리한다.
CSV 데이터 테이블에서 사운드 정보(RUID, 볼륨, 제목 등)를 로드하고, 게임 내 각 상황에 맞게 SFX/BGM을 재생한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `SoundManager.mlua` | 사운드 재생 전담 컴포넌트 |
| `DataManager.mlua` | SoundTable 로드 (`LoadSoundTable`) |
| `GameManager.mlua` | BGM 재생 트리거 (`PlayStageBGM`) |
| `MonsterManager.mlua` | 몬스터/보스 피격 SFX 트리거 |
| `BattleManager.mlua` | 무기/소모품 사용 SFX 트리거 |
| `UIMain.mlua` | 버튼 클릭 SFX 호출 |

---

## 데이터 구조

### SoundTable (DataManager.SoundTable)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | integer | 사운드 고유 ID |
| title | string | 사운드 이름 (검색 키) |
| ruid | string | MSW 리소스 RUID |
| volume | number | 재생 볼륨 (0.0 ~ 1.0) |
| loop | boolean | 반복 재생 여부 (BGM용) |

---

## 메서드 정의

### SoundManager.mlua

#### PlaySFX(soundId: integer) → void
- **실행 공간**: ClientOnly
- SoundTable에서 soundId로 조회하여 `_SoundService:PlaySound(ruid, volume)` 호출
- 데이터 누락/빈 RUID 시 log 경고 후 무시

#### PlaySFXByTitle(title: string, defaultSoundId: integer) → void
- **실행 공간**: ClientOnly
- SoundTable을 순회하며 title이 일치하는 항목 검색
- 못 찾으면 defaultSoundId로 폴백하여 PlaySFX 호출
- 용도: `"boss_hit_101"`, `"monster_hit_5"` 등 동적 키로 사운드 매핑

#### PlayBGM(soundId: integer) → void
- **실행 공간**: ClientOnly
- SoundTable에서 조회 후 `_SoundService:PlayBGM(ruid, volume)` 호출
- 빈 RUID면 기존 BGM 정지 (`StopBGM`)

#### StopBGM() → void
- **실행 공간**: ClientOnly
- `_SoundService:StopBGM(false)` 호출

---

## BGM 매핑 (GameManager.PlayStageBGM)

| 스테이지 | BGM ID |
|----------|--------|
| 1~3 | 1002 |
| 4, 6 | 1003 |
| 5 | 1005 |
| 7 | 1007 |
| 8~9 | 1008 |
| 10 | 1010 |
| 타이틀 | 1001 |

---

## SFX 트리거 포인트

| 상황 | 호출 위치 | SFX |
|------|-----------|-----|
| 몬스터 피격 | MonsterManager.DamageMonster | `PlaySFXByTitle("monster_hit_{id}")` |
| 보스 피격 | MonsterManager.DamageMonster | `PlaySFXByTitle("boss_hit_{id}")` |
| 보스 공격 | MonsterManager.BossAction | `PlaySFXByTitle("boss_atk_{effectType}")` |
| 소모품 사용 | BattleManager | `PlaySFX(2005)` |
| UI 버튼 클릭 | UIMain.ConnectEvents | `PlaySFX(5004)` |

---

## 주의사항

- SoundManager는 GameSystem 엔티티(`/maps/map01/GameSystem`)에 부착
- OnBeginPlay에서 DataManager를 자동 참조
- 모든 재생 메서드는 ClientOnly (@ExecSpace)
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
