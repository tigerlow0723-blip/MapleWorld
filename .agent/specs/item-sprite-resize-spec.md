# 목표 (Objective)

아이템 스프라이트(ImageComponent 또는 SpriteGUIRendererComponent)의 크기를 ShapeMask(아이템의 2D 형태를 정의한 데이터)가 차지하는 실제 그리드 셀의 크기(`cellSize`)에 완벽히 맞추도록 리사이징합니다. 예를 들어 형태 마스크가 2x3 형태라면 스프라이트의 렌더링 영역(`RectSize`)이 넓이 `2 * cellSize`, 높이 `3 * cellSize`가 되도록 동적으로 크기를 계산해 조정합니다.

# 구현 상세 목록 (Implementation Details)

### 1. ItemDisplayArea.mlua 파일 (CreateEntity / BuildShapeHitCells 관련)
**목적:** 전시 영역 혹은 보상 영역에서 아이템이 생성될 때 기본 스프라이트 크기를 ShapeMask 기반으로 조정
- **로직 추가 흐름:**
  1. ShapeMask의 최대 열(maxCol)과 최소 열(minCol)을 이용해 너비 방향 셀 갯수를 구하고 `cellSize`를 곱해 `boundsW`를 계산합니다.
  2. 최대 행(maxRow)과 최소 행(minRow)을 이용해 높이 방향 셀 갯수를 구하고 `cellSize`를 곱해 `boundsH`를 계산합니다.
  3. 타겟 아이템 엔티티(`itemEntity`)의 `UITransformComponent`를 가져옵니다.
  4. 해당 컴포넌트의 `RectSize` 값을 `Vector2(math.max(2, boundsW), math.max(2, boundsH))`로 설정합니다.

### 2. InventoryUI.mlua 파일 (Grid 내 초기 스폰 로직)
**목적:** 인벤토리 배열 내에서 로드되거나 이동되는 아이템들 역시 정확한 크기를 가지도록 설정
- **로직 추가 흐름:**
  1. 인벤토리 내부에 아이템이 스폰될 때(`SpawnItemInGrid` 등), 보유한 ShapeMask의 행렬 데이터를 바탕으로 위와 동일하게 `boundsW`, `boundsH` 길이를 산출합니다.
  2. 아이템 엔티티의 `UITransformComponent.RectSize`에 그 값을 반영하여 스프라이트 렌더 영역이 셀 영역 안에 딱 맞게 갇히도록 스케일 적용을 추가합니다.

# 코딩 가이드라인 (Coding Guidelines)

- 좌표와 크기를 계산하는 로직은 최대한 직관적으로 작성합니다.
- 계산 중 nil 에러가 발생할 수 있는 지점에서는 MSW의 pcall 등 방어적인 코드를 유지합니다.
- 작성되는 스크립트의 주석, `log()` 메시지 등 시스템 내부 문자는 인코딩 충돌 방지를 위해 반드시 100% 영어로 작성합니다.
- 0 혹은 음수 크기로 리사이징 되는 것을 방지하기 위해 Math.max 처리 등을 권장합니다.

