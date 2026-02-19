# 백팩히어로 인벤토리 & 아이템 시스템 구현 계획

메이플스토리 월드(mLua)에서 백팩 히어로 스타일의 인벤토리 & 아이템 시스템을 구현합니다.

> [!IMPORTANT]
> mLua는 `require()`를 사용하지 않습니다. 코드는 **컴포넌트 스크립트** 형태로 작성하며, 엔티티에 추가하여 동작합니다. Property 선언 + Method(이벤트 함수) 구조를 따릅니다.

> [!IMPORTANT]
> 기존 `BackPackHero/` 디렉토리는 삭제되었습니다. 모든 코드는 `BackPack/src/`에 새로 작성합니다. 실제 메이커에서 사용할 때는 각 `.lua` 파일의 내용을 컴포넌트 스크립트 에디터에 복사합니다.

---

## Proposed Changes

### 1. 아이템 데이터 정의

#### [NEW] [item_data.lua](file:///c:/Users/Hong/Desktop/Antigravity/BackPack/src/item_data.lua)

아이템의 순수 데이터 테이블을 정의합니다. mLua에서는 컴포넌트의 `OnBeginPlay`에서 이 데이터를 `self._T`에 로드하여 사용합니다.

- **형태(Shape)**: 셀 오프셋 배열 `{{dx, dy}, ...}` — 비정형 형태 지원
- **타입**: `weapon`, `armor`, `consumable`, `passive`, `special`
- **등급**: `common`, `uncommon`, `rare`, `epic`
- 예시 아이템: 철검(1×2), 단검(1×1), 도끼(ㄱ자형), 방패(1×2), 갑옷(2×2), 포션(1×1), 확장권(special)

---

### 2. 인벤토리 매니저 컴포넌트

#### [NEW] [InventoryManager.lua](file:///c:/Users/Hong/Desktop/Antigravity/BackPack/src/InventoryManager.lua)

mLua 컴포넌트 스크립트 형식으로 작성합니다. 메이커에서 `InventoryManager` 컴포넌트를 생성하고 내용을 복사하여 사용합니다.

**Property 선언:**
```
[None] table Grid = {}          -- 6×6 그리드 (셀 상태: nil=잠금, 0=활성빈칸, itemId=아이템)
[None] table Items = {}         -- 배치된 아이템 {[id] = itemData}
[None] integer NextItemId = 1   -- 다음 아이템 ID
[None] integer ActiveCount = 0  -- 활성 칸 수
```

**핵심 Method:**

| 함수 | 설명 |
|------|------|
| `OnBeginPlay()` | 6×6 그리드 초기화, 중앙 3×3 활성화 |
| `CanPlace(shape, x, y)` | 비정형 형태 배치 가능 여부 |
| `PlaceItem(itemData, x, y)` | 아이템 배치 → ID 반환 |
| `RemoveItem(itemId)` | 아이템 제거 |
| `MoveItem(itemId, newX, newY)` | 아이템 이동 (제거→재배치) |
| `CanExpand(x, y)` | 잠금 칸 확장 가능 여부 (인접 활성 칸 확인) |
| `ExpandCell(x, y)` | 잠금 칸 1개 활성화 |
| `GetItemAt(x, y)` | 해당 좌표 아이템 조회 |
| `GetAllItems()` | 전체 아이템 목록 |
| `FindEmptySpace(shape)` | 빈 공간 자동 탐색 |
| `DebugPrint()` | 그리드 상태 `log()` 출력 |

**그리드 내부 규칙:**
```
grid[y][x] 값:
  nil  → 잠금 칸 (비활성)
  0    → 활성 칸 (비어있음)
  N>0  → 활성 칸 (아이템 ID=N이 차지)
```

---

### 3. 통합 테스트 스크립트

#### [NEW] [TestRunner.lua](file:///c:/Users/Hong/Desktop/Antigravity/BackPack/src/TestRunner.lua)

mLua 컴포넌트로 작성하되, 로컬 실행도 가능하게 순수 Lua 호환으로 작성합니다.

- 인벤토리 초기화 (3×3 활성 확인)
- 1×1, 1×2 아이템 배치/제거
- 비정형(ㄱ자, L자) 아이템 배치
- 잠금 칸 배치 실패 확인
- 확장 (인접 칸 활성화)
- 아이템 이동 / 겹침 방지
- 디버그 출력으로 결과 확인

> 순수 Lua 호환을 위해 `log()`가 없으면 `print()`로 폴백하는 래퍼를 사용합니다.

---

## Verification Plan

### Automated Tests

```powershell
# 로컬 Lua로 테스트 (Lua 5.3+ 설치 시)
lua c:\Users\Hong\Desktop\Antigravity\BackPack\src\TestRunner.lua
```

- 모든 테스트의 PASS/FAIL 결과를 콘솔에 출력

### Manual Verification

- 메이플스토리 월드 메이커에서 `InventoryManager` 컴포넌트 생성 후 코드 복사
- `OnBeginPlay`에서 초기화 확인 (콘솔 로그)
- 디버그 출력으로 3×3 → 6×6 확장 시나리오 확인
