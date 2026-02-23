# 구조 및 무결성 개선 명세서 (Architecture & Integrity Spec)

## 목표 (Objective)
기존 프로토타이핑 단계에서 급하게 연결된 **스크립트 간의 강한 결합(Tight Coupling)**을 해소하고, 데이터의 **무결성(Integrity)**을 보장하며, 컴포넌트 재사용성을 극대화하기 위한 **모듈화(Modularity)** 리팩토링 및 아키텍처 개선 방안을 정의합니다.

## 현행 구조의 문제점 분석

### 1. 매니저 간의 강결합 (Tight Coupling)
- **상황**: `GameManager`가 모든 매니저(`PlayerManager`, `BattleManager`, `RewardManager` 등)의 참조를 직접 소유하고 역으로 주입(`SetManagers`)하고 있습니다.
- **상황 2**: 개별 매니저 내부나 UI 스크립트 내부에서 다른 스크립트나 엔티티 경로(`_EntityService:GetEntityByPath(...)`)를 직접 하드코딩하여 참조하고 있습니다.
- **문제점**: 파일 하나의 이름이나 계층 구조 방향이 조금만 바뀌어도 모든 시스템이 도미노처럼 끊어집니다. 

### 2. UI와 비즈니스 로직의 혼재
- **상황**: `PlayerManager` 같은 데이터/로직 전담 클래스에서 `InventoryUI`나 `ScrollPanel` 하위 컴포넌트에 접근하여 함수를 호출하거나, 반대로 `InventoryUI`에서 판매 스탯 계산 로직을 들고 있습니다.
- **문제점**: UI의 형태가 바뀌면 게임 핵심 로직 코드를 수정해야 하는 치명적인 유지보수 문제(의존성 역전 원칙 위배)가 발생합니다.

### 3. 무결성 (Data Integrity) 위험
- **상황**: 전투 중 몬스터의 HP나 플레이어의 스탯이 이중으로 덮어써지거나, 이벤트 타이머(`_TimerService:SetTimerOnce`)가 살아있는 상태에서 스테이지가 전환될 경우 널 포인터 참조가 발생할 수 있습니다.

---

## 해결 및 리팩토링 방안 (Solutions)

### 1단계: 이벤트 구동 방식(Event-Driven Architecture) 도입
- **개념**: 모듈이 다른 모듈을 직접 호출하지 않고, **"이벤트(Event)"**를 발생시키면 관심 있는 다른 모듈이 이를 듣고 처리하도록 변경합니다.
- **예시 (현재)**: `PlayerManager`가 아이템을 먹으면 `GameManager.uiMain:UpdateUI()`를 직접 호출함.
- **예시 (변경 후)**: `PlayerManager`는 단순히 `InventoryChangedEvent`를 서버/로컬 스페이스로 송신(`sender:SendEvent`). `UIMain` 컴포넌트는 해당 이벤트를 수신(`@EventSender`)하여 스스로 `UpdateUI()`를 실행.
- **적용 대상**: `UpdateUI()`, `RefreshScrollInventoryUI()` 등 UI 갱신 로직 전반.

### 2단계: 의존성 주입(DI) 단일화 
- **개념**: 의존성 주입을 `GameManager`가 하위 매니저에게 뿌리되, 필요한 최소한의 데이터만 주고받도록 인터페이스를 제한합니다.
- **개선**: `ShopUI` 등 컴포넌트 내부에서 `_EntityService:GetEntityByPath(...)`를 남발하지 않고, `@Property`로 노출한 뒤 Maker 환경에서 드래그-앤-드롭으로 참조를 걸어주거나, 초기화 단계에서 루트 엔티티를 통해 캐싱하는 방식으로 전환합니다. (이미 일부 적용 중이나 완벽한 분리 요망)

### 3단계: 단일 책임 원칙 (SRP) 기반 모듈화 파편화
- **개선 대상**: `InventoryUI.mlua` (현존하는 1700줄짜리 갓(God) 클래스)
- **리팩토링 방향**: 
  - `InventoryUI`: 순수하게 그리드 렌더링, 인벤토리 배열 출력 기능만 담당.
  - `DragAndDropController` (신설): 화면상의 포인트 클릭, 마우스 드래그 추적, 아이템 겹침 판정 로직만 담당.
  - `ItemTooltipController` (기존 로직 분리): 툴팁 타이머 및 렌더링 독립.

### 4단계: 무결성(Integrity) 및 라이프사이클 관리
- 매니저가 파괴되거나 스테이지를 전환할 때, 켜져 있는 `_TimerService` ID들을 담아두는 배열을 파괴자(`OnEndPlay` 나 `ClearAll`) 구간에서 명시적으로 삭제(`ClearTimer`)하여 메모리 누수와 고스트 이벤트를 차단합니다. (이미 `InventoryUI.mlua` 등 일부에 적용된 방식을 모든 매니저로 체계화)

---

## 진행 우선순위 제안
현재 백팩 히어로 시스템은 정상 런타임 동작을 보여주고 있으므로, 대규모 아키텍처 개편(3, 4단계)은 후순위로 미루고, 당장 겪고 있는 UI 결합도 문제(1, 2단계)를 우선적으로 해소하는 구조적 패턴을 새로 작성된 기능부터 단계적으로 적용하는 것을 권장합니다.
