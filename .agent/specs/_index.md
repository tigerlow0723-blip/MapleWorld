# 📋 작업 명세서 인덱스

> TD(Antigravity)가 작성하고, Codex가 구현하는 명세서 목록

## 핵심 시스템 명세서 (TD 작성)

| # | 명세서 | 상태 | 최종 수정 |
|---|--------|------|-----------| 
| 1 | [inventory-spec.md](./inventory-spec.md) | ✅ 구현 완료 | 2026-02-18 |
| 2 | [inventory-expansion-spec.md](./inventory-expansion-spec.md) | ✅ 구현 완료 | 2026-02-18 |
| 3 | [item-display-spec.md](./item-display-spec.md) | ✅ 구현 완료 | 2026-02-19 |
| 4 | [complex-shape-spec.md](./complex-shape-spec.md) | ✅ 구현 완료 | 2026-02-19 |
| 5 | [shop-spec.md](./shop-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 6 | [battle-interaction-spec.md](./battle-interaction-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 7 | [reward-panel-spec.md](./reward-panel-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 8 | [reward-probability-spec.md](./reward-probability-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 9 | [item-tooltip-spec.md](./item-tooltip-spec.md) | ✅ 구현 완료 | 2026-02-22 |
| 10 | [weapon-upgrade-spec.md](./weapon-upgrade-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 11 | [armor-synergy-spec.md](./armor-synergy-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 12 | [weapon-synergy-scroll-spec.md](./weapon-synergy-scroll-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 13 | [weapon-atkcount-spec.md](./weapon-atkcount-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 14 | [event-driven-spec.md](./event-driven-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 15 | [permanent-scroll-ui-spec.md](./permanent-scroll-ui-spec.md) | ✅ 구현 완료 | 2026-02-22 |
| 16 | [game-loop-spec.md](./game-loop-spec.md) | ✅ 구현 완료 | 2026-02-20 |
| 17 | [tutorial-spec.md](./tutorial-spec.md) | ✅ 구현 완료 | 2026-02-20 |

## 역작성 명세서 — 신규 시스템 (2026-02-27)

> Codex가 TD 부재 기간(02-24~02-27)에 명세서 없이 구현한 **완전 새로운 기능**들

| # | 명세서 | 설명 |
|---|--------|------|
| 18 | [sound-system-spec.md](./sound-system-spec.md) | SFX/BGM 재생, 스테이지별 BGM 매핑 |
| 19 | [minigame-spec.md](./minigame-spec.md) | 5스테이지 홀짝 주사위, 상태 흐름, 특수 결과 |
| 20 | [boss-battle-spec.md](./boss-battle-spec.md) | 3페이즈 보스, 패턴 시스템, 쉴드/힐/DoT |
| 21 | [stage-cinematic-spec.md](./stage-cinematic-spec.md) | 인트로 영상, 페이드 연출, 배경 전환 |
| 22 | [game-result-spec.md](./game-result-spec.md) | 클리어/실패 UI, 재시작, 로비 복귀 |
| 23 | [monster-spawn-spec.md](./monster-spawn-spec.md) | 풀 기반 소환, 입장 연출, 타겟팅 시스템 |
| 24 | [player-system-spec.md](./player-system-spec.md) | 전체 플레이어 스탯, HP/Cost/Gold, 시너지 계산 |
| 25 | [data-table-current-spec.md](./data-table-current-spec.md) | 전체 데이터 테이블 현행 스키마, 시작 아이템 |

## 역작성 명세서 — 기존 시스템 현행화 추록 (2026-02-27)

> 기존 명세서에 반영되지 않은 Codex의 변경/추가 사항 보충

| # | 명세서 | 보충 대상 |
|---|--------|-----------|
| 26 | [shop-addendum-spec.md](./shop-addendum-spec.md) | `shop-spec.md` → 티어UI, NPC, 구매제한, 무제한구매 |
| 27 | [battle-addendum-spec.md](./battle-addendum-spec.md) | `battle-interaction-spec.md` + `game-loop-spec.md` → 소모품/포션/방어구액티브/DoT/RNG |
| 28 | [reward-addendum-spec.md](./reward-addendum-spec.md) | `reward-probability-spec.md` → 확장아이템 1~3개, 주문서 type 변경, spawn_rate |
| 29 | [bugfix-changelog-spec.md](./bugfix-changelog-spec.md) | 전체 → RNG 패치, 셀 복사, 보스모션 등 10+ 버그 수정 이력 |

## 보조 명세서

| 명세서 | 설명 |
|--------|------|
| [hierarchy-spec.md](./hierarchy-spec.md) | Maker 엔티티 계층 구조 |
| [integration-spec.md](./integration-spec.md) | 시스템 간 통합 |
| [codex-patch-spec.md](./codex-patch-spec.md) | Codex 패치 내역 (이벤트 아키텍처) |
| [architecture-integrity-spec.md](./architecture-integrity-spec.md) | 아키텍처 무결성 |
| [refactoring-plan-spec.md](./refactoring-plan-spec.md) | 리팩토링 계획 |
| [inventory-system-spec.md](./inventory-system-spec.md) | 인벤토리 시스템 상세 |
| [weapon-stats-isolation-spec.md](./weapon-stats-isolation-spec.md) | 무기 스탯 격리 |
| [tooltip-potion-ux-spec.md](./tooltip-potion-ux-spec.md) | 포션 UX |
| [item-sprite-resize-spec.md](./item-sprite-resize-spec.md) | 아이템 스프라이트 리사이즈 |
| [reward-panel-codex-patch-spec.md](./reward-panel-codex-patch-spec.md) | 보상 패널 패치 |
| [codex-integration-tasks.md](./codex-integration-tasks.md) | Codex 통합 작업 목록 |
| [monster-ui-refactor-task.md](./monster-ui-refactor-task.md) | 몬스터 UI 리팩토링 |

## 상태 범례
- 📝 작성 중
- 🔍 PD 검토 대기
- ✅ 구현 완료
- 🔧 수정 필요
- 📜 역작성 (코드 → 명세서)
