# 인벤토리 확장 기능 명세서

> **상태**: 📝 작성 완료 → Codex 구현 대기
> **작성자**: TD (Antigravity)
> **최종 수정**: 2026-02-18 (v2 — PD 피드백 반영)

---

## 1. 개요

인벤토리 그리드를 확장할 수 있는 "확장 아이템" 시스템.
확장 아이템을 드래그할 때만 확장 가능한 셀이 표시되고,
해당 셀에 놓으면 그 셀이 활성화된다.

**핵심 규칙: 확장 가능 셀은 평소에는 비활성(0)과 동일하게 보이고, 확장 아이템 드래그 중에만 표시된다.**

## 2. 셀 상태 정의

| 값 | 상태 | 평소 색상 | 확장 아이템 드래그 중 색상 |
|----|------|----------|------------------------|
| `-1` | 확장 가능 | 비활성과 동일 (숨김) | 반투명 연회색 (a=0.4) |
| `0` | 비활성 | 어두운 회색 | 어두운 회색 (변화 없음) |
| `1` | 빈칸 (활성) | 파란색 | 파란색 (변화 없음) |
| `2+` | 점유 | 보라색 | 보라색 (변화 없음) |

## 3. 변경 사항

### 3.1 Inventory.mlua

#### InitGrid 수정
기존 동작 끝에 UpdateExpandableCells 호출 추가.

#### 새 메서드: UpdateExpandableCells
- **파라미터**: 없음
- **반환**: 없음
- **동작**: 전체 그리드 순회. 비활성(0)인 셀 중 상하좌우에 활성(1 이상) 셀이 있으면 -1로 변경
- **호출 시점**: InitGrid 마지막, ActivateCell 후

#### 새 메서드: HasAdjacentActiveCell
- **파라미터**: row(integer), col(integer)
- **반환**: boolean
- **동작**: 상하좌우 4방향 중 하나라도 값이 1 이상이면 true

#### 새 메서드: ActivateCell
- **파라미터**: row(integer), col(integer)
- **반환**: boolean
- **동작**: 해당 셀이 -1이면 → 1로 변경 → UpdateExpandableCells → gridVersion++ → true 반환. 아니면 false.

---

### 3.2 InventoryUI.mlua

#### 색상 추가
- `colorExpandable` 속성: {r=0.6, g=0.6, b=0.6, a=0.4}

#### RenderGrid 수정
- 셀 값 -1일 때: **colorInactive 적용** (평소에는 비활성과 동일하게 숨김)
- 나머지는 기존과 동일

#### StartDrag 수정
- 드래그 시작 시, 아이템의 itemType이 "expand"이면 확장 가능 셀(-1)을 colorExpandable 색상으로 표시
- 일반 아이템이면 기존대로 RenderGrid만 호출

#### EndDrag 수정
- 드래그 종료 시, RenderGrid 호출하여 확장 가능 셀을 다시 숨김

#### HighlightPlacement 수정
- 드래그 중인 아이템이 "expand" 타입이면:
  - 대상 셀이 -1인 경우 → 초록색 하이라이트 (배치 가능)
  - 대상 셀이 -1이 아닌 경우 → 빨간색 하이라이트 (배치 불가)
- 일반 아이템이면 기존 CanPlace 로직 유지

#### TryDropItem 수정
- 아이템의 itemType이 "expand"인 경우:
  - ActivateCell(row, col) 호출
  - 성공 시: 아이템 엔티티 Destroy (소비) → EndDrag
  - 실패 시: ReturnToOrigin → EndDrag
- 일반 아이템: 기존 로직 유지

---

### 3.3 ItemTable.csv

아래 행 추가:

| id | name | type | width | height | atk | def | hp | desc | spriteRUID |
|----|------|------|-------|--------|-----|-----|----|------|-----------|
| 10 | 인벤토리 확장 | expand | 1 | 1 | 0 | 0 | 0 | 인벤토리 칸 1개를 활성화 | NONE |

---

## 4. 동작 흐름

### 평소 (드래그 안 할 때)
- 3×3 활성(파란색) + 나머지 전부 비활성(회색)으로 보임
- 확장 가능 셀(-1)은 비활성(0)과 구분 안 됨

### 확장 아이템 드래그 시
1. 확장 아이템 터치 → StartDrag
2. 확장 가능 셀(-1)들이 반투명 연회색으로 표시됨
3. 확장 가능 셀 위에서 하이라이트 (초록)
4. 드롭 → ActivateCell → 셀 활성화 + 아이템 소비
5. EndDrag → RenderGrid → 확장 가능 셀 다시 숨김

### 일반 아이템 드래그 시
- 기존과 동일. 확장 가능 셀은 보이지 않음

## 5. Maker 작업 (PD 담당)

| 작업 | 설명 |
|------|------|
| ExpandItem 엔티티 생성 | TestItem1과 같은 구조 (Item, SpriteGUIRendererComponent, UITransformComponent, UITouchReceiveComponent) |
| Item 속성 설정 | itemId=10, inventoryUIPath 설정 |
| UITransformComponent | RectSize=60×60, InventoryPanel 밖에 배치 |

## 6. 검증 방법

1. 게임 시작 → 3×3만 파란색, 나머지 전부 회색 (확장 가능 셀 안 보임)
2. 일반 아이템 드래그 → 확장 가능 셀 안 보임 확인
3. 확장 아이템 드래그 시작 → 3×3 주변에 반투명 셀 표시
4. 반투명 셀 위에서 초록 하이라이트
5. 드롭 → 셀 활성화(파란색) + 확장 아이템 사라짐
6. 다시 확장 아이템 드래그 → 새로 활성화된 셀 주변에 새 반투명 셀 표시
