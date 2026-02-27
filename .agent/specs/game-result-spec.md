# 게임 결과 명세서 (Game Result Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

게임 클리어, 사망/실패, 재시도, 로비 복귀 등 게임 진행 결과에 따른 UI 표시 및 상태 전환을 관리한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `GameManager.mlua` | 게임 상태 전환 (StartGame, 클리어/실패 판정) |
| `UIMain.mlua` | 클리어/실패 UI 표시, 재시작/로비 버튼 |
| `BattleManager.mlua` | 전투 종료 판정 (Victory/Defeat) |
| `PlayerManager.mlua` | 사망 판정 (HP ≤ 0) |

---

## 게임 상태 (GameManager.gameState)

| 상태 | 설명 |
|------|------|
| Init | 초기화 중 |
| Title | 타이틀/메인 메뉴 |
| Playing | 게임 진행 중 |
| Clear | 전 스테이지 클리어 |
| GameOver | 플레이어 사망 |

---

## 게임 페이즈 (GameManager.gamePhase)

| 페이즈 | 설명 |
|--------|------|
| None | 초기값 |
| Preparation | 정비 시간 (아이템 배치/상점) |
| Battle | 전투 진행 중 |
| Reward | 보상 획득 |
| Shop | 상점 이용 |
| MiniGame | 미니게임 (5스테이지) |

---

## 클리어 흐름

1. BattleManager.EndBattle("Victory") 호출
2. 보상 생성 (RewardManager.GenerateRewards)
3. 경험치/골드 지급 (PlayerManager)
4. 마지막 스테이지인 경우:
   - gameState = "Clear"
   - UIMain에서 클리어 UI 표시 (`uiClear.Enable = true`)
5. 아닌 경우:
   - 다음 스테이지 준비 (gamePhase = "Preparation")

### 클리어 UI (UIMain)

| 엔티티 | 역할 |
|--------|------|
| uiClear | 클리어 화면 패널 (`/ui/UIGroup/Clear`) |
| btnClearRestart | 재시작 버튼 (`/ui/UIGroup/Clear/restart`) |

- 재시작 버튼 클릭 시:
  1. 클리어 UI 숨기기
  2. 게임 초기화
  3. 로비(메인 메뉴)로 이동

---

## 실패 (사망) 흐름

1. PlayerManager.TakeDamage에서 HP ≤ 0 감지
2. gameState = "GameOver"
3. UIMain에서 실패 UI 표시 (`uiFail.Enable = true`)

### 실패 UI (UIMain)

| 엔티티 | 역할 |
|--------|------|
| uiFail | 실패 화면 패널 (`/ui/UIGroup/fail`) |
| btnRetry | 재시도 버튼 (`/ui/UIGroup/fail/restart` 또는 `.../retry`) |

- 재시도 버튼 클릭 시:
  1. 실패 UI 숨기기
  2. 게임 초기화
  3. 로비(메인 메뉴)로 이동 (`ShowMainMenuTitle`)

---

## 게임 초기화 (재시작 공통)

### StartGame(classId) 재호출 또는 ShowMainMenuTitle

1. gameState = "Title"
2. 인벤토리 초기화 (아이템 전부 제거)
3. 플레이어 스탯 리셋 (HP, Cost, Gold, Level)
4. 스테이지 리셋 (currentStage = 1)
5. 모든 UI 패널 비활성화
6. 메인 메뉴 표시
7. 타이틀 BGM 재생 (ID: 1001)

---

## 로비 복귀

### ShowMainMenuTitle (GameManager)
- gameState = "Title"
- UIMain.ShowMainMenu 호출
- BGM 타이틀 재생

### ShowMainMenu (UIMain)
- maingroup 활성화
- UIGroup 비활성화
- uiMainMenu 표시

### HideMainMenu (UIMain)
- maingroup 비활성화
- UIGroup 활성화

---

## 주의사항

- 클리어/실패 UI 엔티티 경로는 대소문자 차이 가능 (`Clear`/`clear`, `fail`/`Fail`)
- ResolveFailUI, ResolveClearUI에서 여러 경로 시도
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
