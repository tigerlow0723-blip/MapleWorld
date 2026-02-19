# 아이템 나열 & 보상 상자 명세서

> **상태**: 📝 작성 완료 → Codex 구현 대기
> **작성자**: TD (Antigravity)
> **최종 수정**: 2026-02-19

---

## 1. 개요

보상 상자를 클릭하면 아이템 진열 영역에 랜덤 아이템 5개가 세로 물결(지그재그) 형태로 생성된다.
플레이어는 진열된 아이템을 드래그하여 인벤토리에 배치한다.

## 2. 새 파일

### 2-1. RewardChest.mlua (신규)

**용도**: 보상 상자 버튼. 클릭 시 아이템 5개 생성.

**Property**:
| 이름 | 타입 | 설명 |
|------|------|------|
| displayAreaPath | string | 아이템 진열 영역(ItemDisplayArea) 엔티티 경로 |
| itemCount | integer | 생성할 아이템 수 (기본값 5) |

**Method**:

#### OnBeginPlay (ClientOnly)
- ButtonClickEvent 연결 → SpawnItems 호출

#### SpawnItems (ClientOnly)
- displayAreaPath에서 ItemDisplayArea 컴포넌트를 찾음
- ItemDisplayArea의 GenerateRandomItems 호출
- 호출 후 **자기 자신(RewardChest 엔티티)을 Destroy** — 상자는 1회용

---

### 2-2. ItemDisplayArea.mlua (신규)

**용도**: 아이템 진열 영역 관리. 아이템 생성, 배치, 제거 담당.

**Property**:
| 이름 | 타입 | 설명 |
|------|------|------|
| inventoryUIPath | string | InventoryUI 엔티티 경로 (드래그 연동) |
| slotSize | integer | 슬롯 크기 (기본값 80) |
| verticalSpacing | integer | 세로 간격 (기본값 100) |
| horizontalOffset | integer | 좌우 지그재그 오프셋 (기본값 40) |
| spawnedItems | table | 현재 진열된 아이템 엔티티 목록 |
| itemTemplatePath | string | 아이템 엔티티 템플릿 경로 (복제 원본) |

**Method**:

#### GenerateRandomItems (ClientOnly)
- **파라미터**: count (integer)
- **동작**:
  1. 기존 진열 아이템이 있으면 전부 Destroy
  2. ItemTable.csv에서 expand 타입을 제외한 아이템 ID 목록 수집
  3. 그 중 count개를 **중복 없이** 랜덤 선택 (선택된 아이템은 목록에서 제거). count가 목록 수보다 크면 가능한 만큼만 생성
  4. 각 아이템에 대해 CreateItemEntity 호출
  5. 생성된 아이템들을 세로 물결 배치로 정렬 (ArrangeItems 호출)

#### CreateItemEntity (ClientOnly)
- **파라미터**: itemId (integer), index (integer)
- **반환**: Entity
- **동작**:
  1. itemTemplatePath의 엔티티를 복제 (Entity:Clone 또는 _SpawnService 사용)
  2. 복제된 엔티티를 self.Entity의 자식으로 추가
  3. Item 컴포넌트의 itemId 설정
  4. Item 컴포넌트의 inventoryUIPath 설정
  5. spawnedItems에 추가
  6. 반환

#### ArrangeItems (ClientOnly)
- **동작**: spawnedItems의 각 아이템을 세로 물결 배치로 정렬
- **배치 로직**:
  - 전체 높이 = (아이템 수 - 1) × verticalSpacing
  - 시작 Y = 전체 높이 / 2 (위에서부터)
  - i번째 아이템의 Y = 시작Y - i × verticalSpacing
  - i번째 아이템의 X = 홀수(i=0,2,4...)이면 -horizontalOffset, 짝수(i=1,3,5...)이면 +horizontalOffset
  - 각 아이템의 UITransformComponent.anchoredPosition에 적용

#### RemoveItem (ClientOnly)
- **파라미터**: itemEntity (Entity)
- **동작**: spawnedItems에서 해당 아이템 제거 (Destroy는 호출하지 않음 — 인벤토리에 배치되었을 수 있으므로)

---

## 3. 기존 파일 변경 없음

- Item.mlua: 변경 없음 (이미 inventoryUIPath, spawnPosition, UITouchDownEvent 처리 구현됨)
- InventoryUI.mlua: 변경 없음
- Inventory.mlua: 변경 없음

## 4. ItemTable.csv

변경 없음. 기존 아이템(id 1~3)에서 랜덤 선택.
expand 타입(id=10)은 보상에서 제외.

## 5. Maker 작업 (PD 담당)

| 작업 | 설명 |
|------|------|
| RewardChest 엔티티 | ButtonComponent + SpriteGUIRendererComponent + RewardChest 컴포넌트. 화면 우측이나 원하는 위치에 배치 |
| ItemDisplayArea 엔티티 | 인벤토리 좌측에 세로로 긴 영역. ItemDisplayArea 컴포넌트 추가. UITransformComponent 설정 |
| ItemTemplate 엔티티 | 복제용 아이템 원본. Item + SpriteGUIRendererComponent + UITransformComponent + UITouchReceiveComponent. **비활성(SetEnable false)** 상태로 배치 |

## 6. 엔티티 계층 구조 (예상)

```
/ui/DefaultGroup/
  ├─ InventoryPanel        [Inventory, InventoryUI]
  │   ├─ GridContainer
  │   └─ ...
  ├─ ItemDisplayArea       [ItemDisplayArea]
  │   └─ (런타임에 아이템 엔티티 생성됨)
  ├─ ItemTemplate          [Item, SpriteGUIRenderer, UITransform, UITouchReceive] (비활성)
  └─ RewardChest           [ButtonComponent, RewardChest]
```

## 7. 동작 흐름

1. PD가 Maker에서 RewardChest, ItemDisplayArea, ItemTemplate 엔티티 생성
2. 게임 시작 → 보상 상자가 화면에 표시
3. 보상 상자 클릭 → RewardChest.SpawnItems 호출
4. ItemDisplayArea.GenerateRandomItems(5) 실행
5. ItemTable에서 랜덤 5개 선택 → 엔티티 복제 → 세로 물결 배치
6. 플레이어가 진열된 아이템을 드래그 → 인벤토리에 배치

## 8. 검증 방법

1. 보상 상자 클릭 → 좌측에 아이템 5개 세로 물결 배치 확인
2. 각 아이템에 스프라이트 이미지 표시 확인
3. 진열된 아이템 드래그 → 인벤토리 배치 가능 확인
4. 배치 실패 시 진열 영역 원래 자리로 **정확히** 복귀 확인
5. 배치 실패 후 그리드 셀 색상이 원래대로 복원 확인

---

## 9. 버그 수정 (v2)

### 🐛 버그 1: 배치 실패 시 아이템이 엉뚱한 곳으로 돌아감

**원인**: Item.OnBeginPlay에서 spawnPosition을 저장하는 시점이 템플릿 복제 직후임. ArrangeItems가 나중에 위치를 물결 배치로 변경하지만, spawnPosition은 갱신되지 않아 복귀 시 잘못된 좌표로 이동.

**수정 대상**: ItemDisplayArea.mlua → ArrangeItems 메서드

**수정 내용**: 각 아이템의 anchoredPosition 설정 직후, 해당 아이템의 Item 컴포넌트의 spawnPosition도 동일한 좌표({x, y})로 갱신

### 🐛 버그 2: 드래그 실패 후 셀 색상이 달라짐

**원인**: HighlightPlacement에서 변경된 셀 색상이 EndDrag 시 RenderGrid로 완전히 복원되지 않는 경우 발생 가능.

**수정 대상**: InventoryUI.mlua → EndDrag, ReturnToOrigin

**수정 내용**: 
- ReturnToOrigin 호출 후 반드시 RenderGrid 호출하여 모든 셀 색상 초기화
- EndDrag에서 dragState.itemEntity를 nil로 초기화하기 전에 RenderGrid 호출 확인

### 🐛 버그 3: 배치 후 다시 드래그하면 원래 자리를 못 찾음

**원인**: 좌표계 불일치 (ItemDisplayArea vs InventoryPanel 부모 차이)

**설계 변경**: ItemDisplayArea를 **아이템 대기실**로 정의

- 아이템은 항상 ItemDisplayArea에서 시작
- 배치 실패 시 항상 **ItemDisplayArea의 spawnPosition으로 복귀** (그리드 위치가 아님)
- 배치 성공 후 다시 뺐는데 다른 곳에 배치 실패해도 → **ItemDisplayArea로 복귀**
- 인벤토리가 꽉 찼을 때 기존 아이템을 빼면 → **ItemDisplayArea로 이동 (교체 대기)**

| 상황 | 복귀 대상 |
|------|----------|
| 미배치 아이템 배치 실패 | ItemDisplayArea + spawnPosition |
| 배치됐던 아이템 재배치 실패 | ItemDisplayArea + spawnPosition |
| 그리드에서 빼서 밖에 놓기 | ItemDisplayArea + spawnPosition |

**수정 대상 및 내용**:

#### InventoryUI.StartDrag 수정
- dragState에 **originParent** 저장 (드래그 시작 시 아이템의 현재 부모 엔티티)
- 아이템의 부모가 InventoryPanel이 아니면 **InventoryPanel로 reparent**
- reparent 시 화면 위치 유지를 위해 anchoredPosition 재계산

#### InventoryUI.ReturnToOrigin 수정
- **항상** 아이템을 originParent(ItemDisplayArea)로 reparent
- Item.spawnPosition(ItemDisplayArea 기준 좌표)으로 복귀
- 그리드 배치 정보 초기화 (ClearGridPosition)

#### InventoryUI.SnapItemToGrid 수정
- 배치 성공 시, 아이템이 InventoryPanel 자식이 아니면 reparent

#### ItemDisplayArea에 displayAreaPath 활용
- InventoryUI의 dragState에 **displayAreaPath** 또는 **originParent** 참조를 저장하여 복귀 시 사용




