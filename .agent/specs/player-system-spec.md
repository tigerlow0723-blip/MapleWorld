# 플레이어 시스템 명세서 (Player System Spec)

> **역작성**: PlayerManager의 현재 구현 상태를 역분석한 플레이어 시스템 명세

---

## 목적

플레이어 스탯 관리, HP/Cost/Gold 증감, 레벨업, 버프 시스템, 인벤토리 연동 등 PlayerManager 전체를 문서화한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `PlayerManager.mlua` | 플레이어 스탯 및 전투 계산 전담 |
| `PlayerStatChangedEvent.mlua` | 스탯 변경 이벤트 객체 |
| `InventoryChangedEvent.mlua` | 인벤토리 변경 이벤트 객체 |

---

## 기본 프로퍼티

| 프로퍼티 | 타입 | 설명 |
|----------|------|------|
| classId | string | 직업 ID (기본: "War") |
| level | integer | 현재 레벨 |
| currentHP / maxHP | number | 현재/최대 체력 |
| currentCost / maxCost | number | 현재/최대 행동력 |
| baseATK / baseACC | number | 기본 공격력/명중 |
| gold | integer | 보유 골드 |
| normalScrollCount | integer | 일반 주문서 보유량 |
| guaranteedScrollCount | integer | 확정 주문서 보유량 |

---

## 주요 메서드

### 스탯 관련

| 메서드 | 설명 |
|--------|------|
| RestoreCost() | 행동력을 최대치로 복원 |
| UseCost(amount) → boolean | 행동력 소모 (부족 시 false) |
| TakeDamage(amount) | HP 감소 (0 이하 시 사망 판정) |
| Heal(amount) | HP 회복 (maxHP 초과 방지) |
| LevelUp() | 레벨업 + LevelStatTable 기반 스탯 상승 |
| AddGold(amount) | 골드 획득 |
| SpendGold(amount) → boolean | 골드 소모 |
| AddScroll(type, count) | 주문서 스택 증가 |
| UseScroll(type) → boolean | 주문서 1개 소모 |

### 이벤트 발신

| 메서드 | 설명 |
|--------|------|
| EmitPlayerStatChangedEvent() | EventBroadcaster를 통해 스탯 변경 이벤트 발송 |
| EmitInventoryChangedEvent() | 인벤토리 변경 이벤트 발송 (선택적) |
| ResolveEventBroadcasterEntity() | GameSystem 엔티티 참조 획득 |

### 인벤토리 연동

| 메서드 | 설명 |
|--------|------|
| ResolveInventoryComp() | InventoryPanel의 Inventory 컴포넌트 참조 |
| GetItemComponentById(itemId) | 인벤토리에서 특정 아이템 컴포넌트 검색 |
| GetItemComponentAtGridCell(row, col) | 그리드 좌표의 아이템 검색 |
| DoesItemOccupyCell(itemComp, row, col) | 아이템이 특정 셀을 차지하는지 확인 |

### 시너지 계산

| 메서드 | 설명 |
|--------|------|
| CalcWeaponSynergyAtk() | 무기-주문서 인접 시너지 공격력 합산 |
| GetSynergyScrollAtkRange(itemId) | 시너지 주문서의 공격력 범위 조회 |
| IsSynergyScrollId(itemId) | 시너지 주문서 여부 판별 |
| RollSynergyAtkByScrollId(itemId) | 시너지 공격력 랜덤 롤링 |
| BuildSynergyScrollKey(scrollComp, ...) | 중복 방지 키 생성 |
| ResolveSynergyBonusAtk(itemId) | 확정된 시너지 보너스 조회 |
| ResolveSynergyBonusAtkFromComponent(scrollComp, itemId) | 컴포넌트 기반 조회 |

---

## 방어구 HP 연동

- 방어구 배치/해제 시 MaxHP 재계산
- 배치: maxHP += armorHP, currentHP += armorHP
- 해제: maxHP -= armorHP, currentHP -= armorHP (최소 1 보장)

---

## 이벤트 기반 UI 갱신 (Pub-Sub)

```
PlayerManager 스탯 변경
    → EmitPlayerStatChangedEvent()
    → GameSystem 엔티티를 통해 브로드캐스트
    → UIMain.OnPlayerStatChangedEvent() 수신
    → UpdateUI() 호출
```

---

## 주의사항

- DataManager 참조는 ResolveDataManager()로 lazy 초기화
- Inventory 참조는 ResolveInventoryComp()로 lazy 초기화
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
