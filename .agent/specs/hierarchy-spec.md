# Maker Hierarchy 구성 명세서: 인벤토리 & 아이템 진열

> 코드 분석 기반으로 유추한 Maker에서 만들어야 할 엔티티/UI 구조  
> **PD가 Maker에서 직접 생성해야 하는 항목**

---

## 전체 구조 다이어그램

```
UIGroup (UI 레이어)
├── InventoryPanel (엔티티)          ← Inventory + InventoryUI 컴포넌트 부착
│   ├── GridContainer (엔티티)       ← 36개 셀의 부모
│   │   ├── Cell_1_1                ← SpriteGUIRendererComponent
│   │   ├── Cell_1_2
│   │   ├── ...
│   │   ├── Cell_1_6
│   │   ├── Cell_2_1
│   │   ├── ...
│   │   └── Cell_6_6               ← 총 36개 (6x6)
│   └── (드래그 중 아이템이 여기 붙음)
│
├── ItemDisplayArea (엔티티)         ← ItemDisplayArea 컴포넌트 부착
│   └── (보상 아이템 엔티티가 동적 생성됨)
│
├── ItemTemplate (엔티티, 비활성)     ← Item 컴포넌트 부착 (복제용 원본)
│   └── SpriteGUIRendererComponent
│
├── RewardChest (엔티티)             ← RewardChest 컴포넌트 부착 (보상 상자 버튼)
│   └── ButtonComponent
│
└── UIMain (엔티티)                  ← UIMain 컴포넌트 부착
    ├── BtnBattleStart (엔티티)      ← [새로 추가] 전투 시작 버튼
    │   ├── ButtonComponent
    │   └── TextComponent ("전투 시작")
    ├── BtnTurnEnd (엔티티)          ← 턴 종료 버튼
    ├── ... (기타 슬롯, 게이지 등)
```

---

## 1. InventoryPanel 엔티티

### 용도
인벤토리 그리드 UI의 최상위 엔티티. 그리드 데이터와 UI 로직을 모두 담당.

### 필요 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| **UITransformComponent** | UI 위치/크기 설정 |
| **Inventory** (스크립트) | 그리드 데이터 관리 (6x6, 셀 상태) |
| **InventoryUI** (스크립트) | 드래그앤드롭, 셀 렌더링, 하이라이트 |

### InventoryUI 프로퍼티 설정 (Inspector)

| 프로퍼티 | 값 | 설명 |
|----------|-----|------|
| gridContainerPath | `"/ui/UIGroup/InventoryPanel/GridContainer"` (실제 경로에 맞게) | GridContainer 엔티티 경로 |
| dragLayerPath | `""` (미사용 가능) | 드래그 레이어 경로 |
| cellSize | `62` | 셀 간격 (60px 셀 + 2px 빈틈) |

---

## 2. GridContainer 엔티티 (InventoryPanel의 자식)

### 용도
36개 셀 엔티티의 부모 컨테이너.

### 필요 컴포넌트
- **UITransformComponent** — 그리드 전체 위치/크기

### 자식 엔티티: Cell_r_c (36개)

**이름 규칙**: `Cell_{행}_{열}` (1-indexed)

Cell_1_1, Cell_1_2, Cell_1_3, Cell_1_4, Cell_1_5, Cell_1_6,  
Cell_2_1, Cell_2_2, ..., Cell_6_6

### 각 Cell 엔티티 필요 컴포넌트

| 컴포넌트 | 설정 |
|----------|------|
| **UITransformComponent** | 크기: **60x60** (시각적 크기) |
| **SpriteGUIRendererComponent** | 색상은 코드에서 제어됨 |

### 셀 배치 (위치 계산)

셀 간격 = **62px** (60px 셀 + 2px 빈틈). 좌표는 중앙 기준 대칭 배치:

| 열/행 | 1 | 2 | 3 | 4 | 5 | 6 |
|-------|-----|-----|-----|-----|-----|-----|
| X좌표 | -155 | -93 | -31 | 31 | 93 | 155 |
| Y좌표 | 155 | 93 | 31 | -31 | -93 | -155 |

예시:
- Cell_1_1 → (-155, 155)
- Cell_1_6 → (155, 155)
- Cell_6_1 → (-155, -155)
- Cell_6_6 → (155, -155)

**추천**: 한 셀을 먼저 만들고, 복제한 뒤 위치만 조정

---

## 3. ItemDisplayArea 엔티티

### 용도
보상 아이템을 진열하는 영역. 전투 승리 후 드랍된 아이템이 여기에 표시됨.

### 필요 컴포넌트

| 컴포넌트 | 설정 |
|----------|------|
| **UITransformComponent** | 인벤토리 옆 또는 위에 배치 |
| **ItemDisplayArea** (스크립트) | 아이템 진열 로직 |

### ItemDisplayArea 프로퍼티 설정

| 프로퍼티 | 값 | 설명 |
|----------|-----|------|
| inventoryUIPath | InventoryPanel 엔티티의 전체 경로 | 드래그앤드롭 대상 |
| slotSize | `80` | 아이템 표시 크기 |
| verticalSpacing | `100` | 아이템 간 세로 간격 |
| horizontalOffset | `40` | 좌우 엇갈림 오프셋 |
| itemTemplatePath | ItemTemplate 엔티티의 전체 경로 | 복제용 원본 |

---

## 4. ItemTemplate 엔티티 (비활성 상태)

### 용도
아이템 엔티티의 복제 원본. **Maker에서 비활성(Enable=false)** 상태로 존재.  
ItemDisplayArea가 이 엔티티를 Clone하여 실제 아이템 생성.

### 필요 컴포넌트

| 컴포넌트 | 설정 |
|----------|------|
| **UITransformComponent** | 크기: 60x60 (1x1 셀 기준) |
| **SpriteGUIRendererComponent** | 아이템 이미지 표시용 |
| **Item** (스크립트) | 아이템 데이터 모델 |
| **UITouchReceiver** (또는 동등한 터치 수신 컴포넌트) | 드래그 시작 이벤트용 |

### Item 프로퍼티 초기값

| 프로퍼티 | 값 |
|----------|-----|
| itemId | `0` (Clone 후 코드에서 설정) |
| inventoryUIPath | `""` (Clone 후 코드에서 설정) |

> **중요**: 이 엔티티는 **직접 보이면 안 됨**. 반드시 Visible=false 또는 Enable=false 설정.

---

## 5. RewardChest 엔티티

### 용도
보상 상자 버튼. 클릭 시 ItemDisplayArea에 랜덤 아이템 생성 후 자신을 파괴.

### 필요 컴포넌트

| 컴포넌트 | 설정 |
|----------|------|
| **UITransformComponent** | 버튼 위치/크기 |
| **SpriteGUIRendererComponent** | 보상 상자 이미지 |
| **ButtonComponent** | 클릭 이벤트 발생 |
| **RewardChest** (스크립트) | 클릭 → 아이템 생성 로직 |

### RewardChest 프로퍼티 설정

| 프로퍼티 | 값 |
|----------|-----|
| displayAreaPath | ItemDisplayArea 엔티티의 전체 경로 |
| itemCount | `5` (한번에 생성할 아이템 수) |

---

## 5-1. BtnBattleStart 엔티티 (새로 추가)

### 용도
튜토리얼 또는 정비(Preparation) 단계에서 가방 정리를 마친 뒤 **실제 전투(몬스터 스폰 및 턴 시작)를 트리거**하는 버튼.

### 계층 위치 (추천)
- `UIGroup` 하위 또는 기존 `UIMain` 엔티티 그룹 하위에 배치.

### 필요 컴포넌트

| 컴포넌트 | 설정 |
|----------|------|
| **UITransformComponent** | 화면 우측 하단 등 눈에 띄는 곳 |
| **ButtonComponent** | 클릭 이벤트 타겟용 |
| **TextComponent** | Text = "전투 시작" |
| **SpriteGUIRendererComponent** | 시각적 버튼 영역 |

> **UIMain 프로퍼티 연결**: 이 버튼을 만든 뒤, **UIMain 컴포넌트(인스펙터)의 `BtnBattleStart` 프로퍼티**에 이 엔티티를 드래그 앤 드롭해서 연결해야 합니다. (Codex가 코드 갱신 후 나타남)

---

## 6. 기존 로직 엔티티 (현우님 코드, 이미 존재해야 함)

### GameLogic 엔티티 (같은 엔티티에 매니저 6개 부착)

코드를 보면 `self.Entity.DataManager`, `self.Entity.PlayerManager` 등으로 접근하므로, **하나의 엔티티에 모든 매니저를 부착**해야 한다:

| 컴포넌트 | 비고 |
|----------|------|
| GameManager | 게임 흐름 제어 |
| DataManager | 데이터 로딩 |
| PlayerManager | 플레이어 관리 |
| MonsterManager | 몬스터 관리 |
| BattleManager | 전투 로직 |
| ItemManager | 아이템 드랍 |
| RewardManager | 보상 관리 |
| **Inventory** (추가!) | 그리드 인벤토리 데이터 |

> GameManager.OnBeginPlay()에서 `self.Entity.Parent:GetChildByName("ItemDisplayArea", true)`로 ItemDisplayArea를 찾으므로, **GameLogic 엔티티의 부모** 아래에 ItemDisplayArea가 있어야 함.

---

## 7. 엔티티 경로 참조 관계도

```
경로 설정이 필요한 프로퍼티 → 어디를 가리키는지

InventoryUI.gridContainerPath   → GridContainer 엔티티 경로
ItemDisplayArea.inventoryUIPath → InventoryPanel 엔티티 경로
ItemDisplayArea.itemTemplatePath → ItemTemplate 엔티티 경로
RewardChest.displayAreaPath     → ItemDisplayArea 엔티티 경로
Item.inventoryUIPath            → InventoryPanel 엔티티 경로 (코드에서 자동 설정)
```

---

## 8. Maker에서의 생성 순서 (추천)

1. **ItemTemplate** 먼저 생성 (복제 원본)
2. **GridContainer** + 36개 Cell 생성
3. **InventoryPanel** 생성 → GridContainer를 자식으로 넣기
4. **ItemDisplayArea** 생성 → itemTemplatePath 설정
5. **RewardChest** 생성 → displayAreaPath 설정
6. 기존 GameLogic 엔티티에 **Inventory** 컴포넌트 추가
7. 각 프로퍼티의 **엔티티 경로** 설정

---

## 9. 체크리스트 (구현 완료 내역)

- [x] InventoryPanel 엔티티 생성 (Inventory + InventoryUI 부착)
- [x] GridContainer 엔티티 생성 (InventoryPanel 자식)
- [x] Cell_1_1 ~ Cell_6_6 (36개) 셀 엔티티 생성
- [x] ItemTemplate 엔티티 생성 (비활성, Item + SpriteGUIRenderer 부착)
- [x] ItemDisplayArea 엔티티 생성 (ItemDisplayArea 부착)
- [x] RewardChest 엔티티 생성 (RewardChest + Button 부착)
- [x] **BtnBattleStart 엔티티 새로 생성 및 UIMain 컴포넌트에 연결 (`btnBattleStart` 프로퍼티)**
- [x] 기존 GameLogic에 Inventory 컴포넌트 추가
- [x] 모든 경로 프로퍼티 설정
