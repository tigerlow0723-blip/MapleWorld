# 미니게임 명세서 (MiniGame Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

스테이지 5에서 진행되는 **홀짝 주사위 미니게임** 시스템.
플레이어가 금의 원석을 소비하여 홀/짝을 맞히면 금괴로 교환, 다이아몬드를 획득하는 도박성 콘텐츠.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `MiniGameManager.mlua` | 미니게임 로직 전담 |
| `UIMain.mlua` | Stage5 UI 패널 전환/표시 |
| `GameManager.mlua` | 미니게임 진입/퇴장 트리거 |

---

## 프로퍼티 (MiniGameManager)

| 프로퍼티 | 타입 | 설명 |
|----------|------|------|
| ORE_PRICE | integer | 금 원석 가격 (100) |
| GOLD_BAR_PRICE | integer | 금괴 가격 (1000) |
| DIAMOND_PRICE | integer | 다이아몬드 가격 (10000) |
| isMiniGameActive | boolean | 미니게임 진행 중 여부 |
| subState | string | 현재 하위 상태 |
| lastDiceRoll | integer | 첫 번째 주사위 눈 |
| lastDiceRoll2 | integer | 두 번째 주사위 눈 |
| lastChoice | integer | 플레이어 선택 (1=홀, 2=짝) |
| lastRoundWin | boolean | 최근 라운드 승리 여부 |
| DOUBLE_SEVEN_REWARD_ITEM_ID | integer | 더블 7 보상 아이템 ID (14) |

---

## 상태 흐름 (subState)

```
None → Shop → Play → Roll → Roll2 → ResultRoll → Result → Play/Shop
```

| subState | 설명 |
|----------|------|
| None | 미니게임 비활성 |
| Shop | 상점 화면 (금괴 판매, 원석 구매) |
| Play | 홀/짝 선택 대기 |
| Roll | 첫 번째 주사위 굴리는 중 |
| Roll2 | 두 번째 주사위 굴리는 중 |
| ResultRoll | 성공/실패 결과 표시 |
| Result | 최종 결과 표시 후 루프 복귀 |

---

## 메서드 정의

### Init(gMgr, pMgr, dMgr, ui) → void
- GameManager, PlayerManager, DataManager, UIMain 참조 저장
- SyncDiceTimingConfig 호출로 DataManager로부터 타이밍 설정 동기화

### StartMiniGame() → void
- isMiniGameActive = true, subState = "Shop"
- UI 갱신

### PlayOddEven(choice: integer) → void
- 금 원석이 없으면 subState → "Shop" 복귀
- 원석 1개 소비
- 주사위 2개를 순차 타이머로 굴림
- **주사위 확률**: 1(5%), 7(5%), 2~6(각 18%)
- 합산 홀/짝 판정 후 승패 결정

### 특수 결과 처리
- **더블 1 (1+1)**: 플레이어 HP 50% 감소
- **더블 7 (7+7)**: 다이아몬드 아이템(ID=14) 지급

### SellAllGoldBar() → void
- 보유 금괴를 모두 판매하여 골드 획득

### ExitMiniGame() → void
- 미니게임 종료, 상점 닫기, 다음 스테이지 진행

---

## UI 연동 (UIMain)

| UI 엔티티 | 용도 |
|-----------|------|
| Stage_5_1 | 상점 화면 |
| Stage_5_2 | 플레이 화면 |
| Stage_5_3 | 결과 화면 |
| Stage_5_4 | 추가 UI |
| Stage_5_game | 게임 메인 패널 |
| uiStage5_Success | 성공 이미지 |
| uiStage5_Fail | 실패 이미지 |
| uiStage5_SuccessRoll / FailRoll | 결과 롤 이미지 |

### 주사위 이미지
- `stage5DiceRollRUIDs`: 첫 번째 주사위 눈 이미지 RUID
- `stage5DiceRollRUIDs2`: 두 번째 주사위 눈 이미지 RUID
- DataManager.DiceRollTable / DiceRollTable2에서 로드

---

## 타이밍 설정 (DataManager 연동)

| 설정값 | 기본값 | 설명 |
|--------|--------|------|
| rollDisplayDuration | DiceRollDelay | 주사위 표시 시간 |
| resultDisplayDuration | DiceResultDelay | 결과 표시 시간 |
| successFailDisplayDuration | (내부값) | 성공/실패 표시 시간 |
| rollResultExtraDelay | 0.5 | 추가 딜레이 |

---

## 주의사항

- 금 원석 / 금괴 / 다이아몬드는 인벤토리 아이템으로 관리 (ID 기반)
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
