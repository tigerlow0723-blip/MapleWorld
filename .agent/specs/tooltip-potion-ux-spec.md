# Tooltip UX & Potion Effect Specification

## 1. 목적 (Objective)
아이템 툴팁(`TooltipPanel`)의 텍스트 위치, 크기, 색상, 내용 배치를 전반적으로 개선하고, 소모형 아이템(포션 등)의 경우 소모 시 발생하는 효과를 툴팁에 명시적으로 추가합니다.

## 2. 대상 파일 (Files to Modify)
- `/Scripts/ItemTooltipUI.mlua`

## 3. 요구사항 및 상세 로직 (Requirements & Logic)

### 3.1. Tooltip UI/UX 디자인 보완
1. **텍스트 폰트/위치/크기 조정**:
   - `AdjustTooltipPanelToContent`: 동적으로 크기를 조절할 때, 텍스트가 패널 바깥으로 넘치지 않도록 Width/Height의 최소여백(Padding)을 넉넉하게 재설정합니다 (예: 하단 여백 +20, 우측 여백 +20 추가).
   - `NameText`: 아이템 이름을 눈에 띄게 큰 폰트로 설정합니다 (기존 구조 내에서 가능할 경우 폰트 사이즈 프로퍼티 조정 또는 코드 상 적용 유도).
2. **등급(Grade) 색상 개선**: `GetGradeColor`가 반환하는 색상을 더 선명하고 고급스러운 색상으로 미세 조정합니다 (예: Rare는 뚜렷한 파란색, Legendary는 강렬한 초록/금색 계열 등).
3. **간격 조정**: `Divider` 아래에 나타나는 `StatsText`(능력치)와 `TxtAtkCount / TxtSynergy` 텍스트 간의 줄 간격 조절 로직(`currentY` 계산)에 간격을 약간 늘려 통풍을 줍니다 (예: `gap = 8` 증가).

### 3.2. 다양한 소비형 아이템 효과 설명 추가 (Potion / Scroll / etc)
1. **타입 기반 텍스트 출력 (`TypeText`)**:
   - `expand`: "Inventory Expansion"
   - `potion`: "Potion"
   - `scroll`: "Scroll"
   - `consumable`: "Consumable"
   - `goods`: "Goods/Material"
2. **소모/회복 효과 텍스트 추가**:
   - `SetStatsText(itemId, itemData, screenPos)` 내부에서 `itemType == "potion"`인 경우를 처리합니다. (기존 `consumable` 검사에서 `potion` 검사로 변경됨)
   - `itemData.hp` 값이 0보다 크다면, "Used to restore {value} HP"와 같은 텍스트를 `StatsText`에 추가합니다.
   - 포션이나 재화 같은 아이템은 ShapeGrid를 필요로 하지 않을 수도 있으나, 기존 체계를 유지하되 텍스트 설명만큼은 확실하게 `StatsText` 영역 최상단에 추가합니다.

## 4. 코딩 규칙 (Coding Guidelines for Codex)
- **100% English Rule**: UI에 출력되는 문자열 리터럴, 로그 메시지, 코드 주석 등 모든 문자열은 반드시 **100% 영어**로 작성해야 합니다. (EUC-KR 인코딩 에러 방지용)
- 예시: "HP 회복" -> "Restores HP" / "공격력" -> "ATK"
- `TextComponent.FontColor` 및 Transform의 `RectSize` 수치를 설정 시 nil 체크를 반드시 수행합니다.
