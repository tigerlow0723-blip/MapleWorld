# 아키텍처 무결성 진단 보고서

> **작성일**: 2026-02-27
> **작성자**: TD (Antigravity)
> **대상**: Lucky Backpack 전체 코드베이스 (22개 스크립트, 17,343줄)

---

## 진단 요약

| 항목 | 수치 | 심각도 |
|------|------|--------|
| God Class (1000줄 이상) | **7개** | 🔴 높음 |
| GetEntityByPath 하드코딩 | **50+ 건** | 🔴 높음 |
| SetTimerOnce 사용 | **55건** | 🟡 중간 |
| ClearTimer 있는 파일 | **7개** / 12개 타이머 사용 파일 | 🟡 중간 |
| 매니저 교차 참조 | **675+건** | 🔴 높음 |

---

## 1. God Class 문제 🔴

1000줄 이상 스크립트 목록:

| # | 스크립트 | 줄수 | 책임 수 |
|---|---------|------|---------|
| 1 | **InventoryUI.mlua** | **2,394줄** | 그리드 렌더링 + 드래그앤드롭 + 판매 + 전투사용 + 툴팁호버 + 셀확장 |
| 2 | **UIMain.mlua** | **2,134줄** | HUD + 버튼바인딩 + 미니게임UI + 보스UI + 클리어/실패 + 튜토리얼 + 사운드호출 |
| 3 | GameManager.mlua | 1,860줄 | 게임 상태 + 인트로 + 연출 + 스테이지 + 로비 + 초기화 |
| 4 | BattleManager.mlua | 1,615줄 | 전투 + 턴 + 공격 + 몬스터턴 + 시너지 |
| 5 | ShopUI.mlua | 1,248줄 | 상점UI + 카드생성 + 구매 + 판매 + 티어 |
| 6 | MonsterManager.mlua | 1,222줄 | 소환 + 비주얼 + 보스 + 패턴 + 입장연출 |
| 7 | PlayerManager.mlua | 1,187줄 | 스탯 + HP + 시너지 + 인벤연동 + 이벤트 |

### 핵심 위험
- **InventoryUI** (2,394줄): 드래그앤드롭, 판매, 전투 사용, 툴팁 호버가 한 파일에 몰림
- **UIMain** (2,134줄): 게임 전체 UI가 한 파일에 집중. 미니게임/보스/클리어/실패 UI까지 포함
- 한 파일 수정 시 다른 기능에 사이드이펙트 발생 가능성 극도로 높음

---

## 2. 경로 하드코딩 (GetEntityByPath) 🔴

### 파일별 호출 횟수

| 파일 | 호출 수 | 문제 |
|------|---------|------|
| UIMain.mlua | **40건** | `"/ui/UIGroup/Clear"`, `"/ui/maingroup/mainscreen"` 등 직접 경로 |
| ShopUI.mlua | **15건** | `"/maps/map01/GameSystem"` 등 |
| UIMyInfoSimple.mlua | 2건 | |
| SoundManager.mlua | 1건 | `"/maps/map01/GameSystem"` |

### 주요 위험 패턴

**대소문자 불확실 → 폴백 패턴 남발**:
```
self.uiClear = GetEntityByPath("/ui/UIGroup/Clear")
if self.uiClear == nil then
    self.uiClear = GetEntityByPath("/ui/UIGroup/clear")  -- 폴백
end
```
→ `Clear`, `clear`, `fail`, `Fail`, `restart`, `retry` 등 **6곳 이상**에서 대소문자 폴백 발생

**`/maps/map01/GameSystem`** 절대 경로가 3개 스크립트(ShopUI, SoundManager, InventoryUI)에 하드코딩됨. 맵 이름이 바뀌면 일괄 수정 필요.

---

## 3. 타이머 관리 🟡

### 타이머 사용 vs 정리 현황

| 파일 | SetTimerOnce 수 | ClearTimer 존재 |
|------|----------------|----------------|
| GameManager | 14건 | ✅ 있음 (introTimerId 등) |
| BattleManager | 8건 | ✅ 있음 (monsterTurnTimerId 등) |
| MonsterManager | 7건 | ❌ **없음** |
| MiniGameManager | 5건 | ❌ **없음** |
| UIMain | 6건 | ✅ 있음 (bossPoisonFxTimerId 등) |
| InventoryUI | 4건 | ✅ 있음 |
| PlayerManager | 2건 | ❌ **없음** |
| RewardChest | 2건 | ❌ **없음** |
| ScrollInventoryUI | 3건 | ✅ 있음 |
| RewardUI | 1건 | ✅ 있음 |
| ShopUI | 1건 | ✅ 있음 |

### 위험 지점
- **MonsterManager**: 7개 타이머 사용, ClearTimer 0개 → 스테이지 전환 시 고스트 콜백 위험
- **MiniGameManager**: 5개 타이머 사용, ClearTimer 0개 → 미니게임 중 강제 퇴장 시 콜백 잔류
- **PlayerManager**: 2개 타이머 사용, ClearTimer 0개 → 경미한 위험

---

## 4. 매니저 간 강결합 (Tight Coupling) 🔴

### 의존성 그래프

```
GameManager(중심) ─┬─➡ PlayerManager
                   ├─➡ BattleManager
                   ├─➡ MonsterManager
                   ├─➡ DataManager
                   ├─➡ UIMain
                   ├─➡ MiniGameManager
                   ├─➡ SoundManager
                   ├─➡ ShopUI
                   ├─➡ RewardUI
                   ├─➡ ItemDisplayArea
                   └─➡ RewardChest

UIMain ─────────── ─➡ GameManager ─➡ DataManager (체인 참조)
                     ─➡ BattleManager
                     ─➡ PlayerManager
                     ─➡ MiniGameManager (GameManager 경유)
                     ─➡ SoundManager (GameManager 경유)
```

### 핵심 문제: 체인 참조
```
self.gameManager.dataManager.DiceRollTable
self.gameManager.miniGameManager:EnterSubPlay()
self.gameManager.soundManager:PlaySFX(5004)
```
→ UIMain이 GameManager를 통해 2~3단계 체인으로 다른 매니저에 접근
→ 중간 참조가 nil이면 런타임 에러 발생 (null guard 필요)
→ `if self.gameManager and self.gameManager.soundManager then` 방어 코드가 **15+ 곳**에 반복

---

## 5. 이벤트 구동 패턴 적용 현황 (1단계 점검)

| 항목 | 상태 |
|------|------|
| PlayerStatChangedEvent | ✅ 구현됨 (PlayerManager → UIMain) |
| InventoryChangedEvent | ✅ 구현됨 |
| UI 직접 갱신 호출 제거 | ⚠️ 부분적 (일부 직접 호출 잔존) |
| SoundManager 직접 호출 | ❌ 이벤트 미적용 (체인 참조) |
| ShopUI ↔ GameManager | ❌ 직접 참조 (이벤트 미적용) |

→ **이벤트 구동 아키텍처 1단계 부분 완료** (약 40%)

---

## 6. 종합 등급 및 권장 순위

| 등급 | 영역 | 조치 |
|------|------|------|
| 🔴 긴급 | God Class 분할 | InventoryUI → DragController/BattleTouchController 분리 |
| 🔴 긴급 | 경로 하드코딩 | @Property 기반 엔티티 참조로 전환, 대소문자 통일 |
| 🟡 주의 | 타이머 미정리 | MonsterManager/MiniGameManager에 OnEndPlay ClearTimer 추가 |
| 🟡 주의 | 체인 참조 | UIMain → SoundManager 직접 참조 또는 이벤트 전환 |
| 🟢 양호 | 이벤트 아키텍처 | 기본 골격은 갖춰짐 (PlayerStatChangedEvent 등) |
| 🟢 양호 | 데이터 무결성 | DataManager의 테이블 로드/파싱은 안정적 |

---

## TD 소견

현재 게임은 **정상 런타임 동작 중**이며, 유저에게 보이는 버그는 대부분 패치된 상태입니다.

다만, 향후 **기능 추가/수정 시 사이드이펙트 위험이 매우 높은 구조**입니다. 특히:
1. InventoryUI(2,394줄)와 UIMain(2,134줄)은 수정 한 줄이 전혀 다른 기능을 깨뜨릴 수 있음
2. 경로 하드코딩은 Maker에서 엔티티 이름/위치 변경 시 즉시 장애 유발
3. 타이머 미정리는 드물지만 간헐적 크래시(ghost callback) 원인이 될 수 있음

**PD 결정이 필요한 사항**: 이 진단 결과를 기반으로 리팩토링 작업에 착수할 것인지, 아니면 현 상태에서 기능 추가를 계속할 것인지 방향 판단 부탁드립니다.
