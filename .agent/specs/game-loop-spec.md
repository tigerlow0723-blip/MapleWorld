# 작업 명세서: 인벤토리 정비 및 전투 루프 분리

> **목표**: 기존에 게임 진입 시 즉시 몬스터가 소환되고 전투가 시작되던 흐름을 분리하여, **1. 정비(Preparation) 단계**를 먼저 거친 뒤 UI 조작을 통해 **2. 전투(Battle) 단계**로 진입하게끔 시스템 상태를 재설계한다.

---

## 1. 개요 및 요구사항

### 1.1 단계 정의
* **정비 (Preparation) 단계**
  * 게임 시작 시점 또는 스테이지 진입 직후의 상태.
  * 몬스터 스폰 안 함.
  * 초반 지급 아이템이나 보상 아이템 상자를 표시하고 가방(인벤토리) 정리를 수행가능함.
* **전투 (Battle) 단계**
  * 플레이어가 UI 상에서 **[전투 시작]** 버튼을 누르면 진입하는 상태.
  * 이 기점부터 인벤토리 아이템을 드래그하거나 편집하는 조작은 비활성화/제한됨.
  * 해당 스테이지 몬스터 스폰.
  * 기존 구조처럼 턴제 전투 진행. 전투 시 인벤토리에 올려둔 무기들만 사용할 수 있음.

---

## 2. 파일 수정 작업 내역

### 2.1 GameManager.mlua 수정
* **목적**: 게임 상태를 즉시 전투 상태가 아닌 `Preparation` 대기 상태로 이주하도록 수정 및 전투 트리거 함수 제공.

1. **상태값 지정 수정 (`StartGame` 및 `ProceedToStage`)**
   - `self.gamePhase` 값을 `Preparation`으로 명시적으로 할당한다.
   - `StartGame(classId)` 내 진행 흐름 중 기본 무기/방패가 인벤토리(가방)에 바로 들어가도록 하고 대기.
   
2. **`EnterBattle()` 메서드 변경**
   - 기존의 즉시 `self.battleManager:StartBattle(self.currentStage)`를 호출하는 로직을 제거한다.
   - 몬스터 매니저에게 몬스터 예비 로드가 필요하다면 데이터를 확보하되 화면엔 렌더하지 않아야 하므로, 그냥 **`StartBattle` 호출을 보류**한다.
   - 향후 전투 진입 시점을 알려주는 기능으로 용도를 바꿀 것.

3. **신규 메서드: `TriggerBattleStart()`**
   - **파라미터**: 없음
   - **동작**:
     - `self.gamePhase = "Battle"`로 상태 전이.
     - `log`로 알림: "[GameManager] 전투 시작 버튼 눌림. 몬스터 소환 개시"
     - `self.battleManager:StartBattle(self.currentStage)` 호출.

### 2.2 UIMain.mlua 수정
* **목적**: 전투 시작 버튼과, 현재 단계(Preparation / Battle)에 따른 UI 가시성(활성/비활성) 제어

1. **프로퍼티 및 이벤트 추가**
   - `property Entity btnBattleStart = nil` 추가.
   - `ConnectEvents()`에서 해당 버튼의 클릭 이벤트를 구독:
     - 클릭 시 `gameManager`가 `Preparation` 상태일 때만 `self.gameManager:TriggerBattleStart()` 호출.
   
2. **`UpdateUI()` 갱신 규칙 반영**
   - `gamePhase == "Preparation"`일 때:
     - "전투 시작" 버튼: `Enable = true`
     - "턴 종료" 버튼 등 전투 조작 버튼: `Enable = false`
   - `gamePhase == "Battle"`일 때:
     - "전투 시작" 버튼: `Enable = false`
     - "턴 종료" 버튼: `Enable = true`
     - (추가 작업 지시) 인벤토리 드래그/정리 등 UI 비활성화 로직 추후 확장 준비.

### 2.3 BattleManager.mlua 수정
* **목적**: 기존 전투 흐름을 변경되는 시점에 맞춰 안전하게 실행하도록 보완.
* 메서드 `StartBattle(stageId)`의 역할은 그대로 유지한다. 단, 호출 시점이 `StartGame` 직후가 아닌, 플레이어가 직접 **[전투 시작]버튼**을 누른 시점으로 변경됨을 숙지해야 함.

---

## 3. 구현 간 테스트 플로우 (Codex용 검증)
1. 클라이언트(Maker) 실행 후 게임에 진입한다.
2. 몬스터가 화면에 바로 소환되지 않고, 기본 아이템(낡은검 등)만 처리된 게임 화면을 확인한다. (콘솔에 PlayerManager 작동 로그 존재)
3. UI에 있는 **[전투 시작]** 버튼을 찾아 클릭한다. 
4. 이 시점에 `BattleManager:StartBattle()`을 호출하며 지정된 몬스터(Stage 1)가 등장하고 전투 턴에 돌입하는지 확인한다.
5. 전투 종료(승리/패배) 후 정비 페이지(`Preparation`)로 정상 복귀 또는 보상상자 팝업이 전개되는지 본다.
