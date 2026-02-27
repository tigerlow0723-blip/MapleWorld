# 스테이지 연출 명세서 (Stage Cinematic Spec)

> **역작성**: Codex가 구현한 코드를 분석하여 TD가 역으로 작성한 명세서

---

## 목적

스테이지 전환 시 페이드 인/아웃 연출, 캐릭터 걸어 나오는 연출, 인트로 영상, 배경 변경 등 시각적 연출을 담당한다.

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `GameManager.mlua` | 연출 트리거 및 시퀀스 제어 |
| `UIMain.mlua` | 인트로 스크린, 메인 메뉴 UI 전환 |
| `MonsterManager.mlua` | 몬스터 입장 연출 (SpawnVisual) |

---

## 인트로 시스템

### 관련 프로퍼티 (GameManager)

| 프로퍼티 | 타입 | 설명 |
|----------|------|------|
| introDuration | number | 인트로 영상 재생 시간 |
| introStartDelay | number | 인트로 시작 전 지연 |
| introAutoCloseEnabled | boolean | 자동 닫힘 여부 |
| playIntroBeforeMainMenu | boolean | 메인 메뉴 전 인트로 재생 여부 |
| introTimerId | integer | 자동 닫힘 타이머 ID |
| introStartTimerId | integer | 시작 지연 타이머 ID |
| introGroupPath | string | IntroGroup 엔티티 경로 |
| introSkipButtonPath | string | 스킵 버튼 경로 |
| introVideoPlayerPath | string | YouTube 플레이어 경로 |

### 흐름

1. **ShowIntroThenMainMenu** — 게임 시작 시 호출
   - playIntroBeforeMainMenu가 false면 바로 메인 메뉴
   - IntroGroup 엔티티를 활성화하고 스킵 버튼 바인딩
   - introStartDelay 후 영상 재생 시작
   - introDuration 후 자동 닫힘 (introAutoCloseEnabled 시)
2. **EndIntroAndShowMainMenu** — 스킵 또는 자동 종료 시
   - 타이머 정리, IntroGroup 비활성화
   - ShowMainMenuTitle 호출
3. **PlayIntroVideo / StopIntroVideo**
   - `YoutubePlayerGUIComponent`를 통한 영상 재생/정지

---

## 스테이지 전환 연출

### 관련 프로퍼티 (GameManager)

| 프로퍼티 | 타입 | 설명 |
|----------|------|------|
| stageFadeEntity | Entity | 페이드 효과 엔티티 |
| stagePlayerEntity | Entity | 플레이어 캐릭터 엔티티 |
| stagePlayerAnchorX / Y | number | 플레이어 고정 위치 |
| stageCinematicMoveWasEnabled | boolean | 이동 가능 상태 백업 |
| stageCinematicRigidWasEnabled | boolean | 물리 상태 백업 |
| pendingStageAdvance | boolean | 연출 완료 대기 플래그 |

### QueueStageEntryCinematic 흐름

1. 플레이어 이동/물리 비활성화 (연출 중 조작 방지)
2. 페이드 아웃 (검은 화면)
3. 배경 변경 (UpdateBackground)
4. 몬스터 스폰 (SpawnVisual + 입장 연출)
5. 페이드 인 (화면 복귀)
6. 플레이어 이동/물리 복원
7. pendingStageAdvance = false

---

## 배경 시스템

### UpdateBackground

- DataManager.MapTable에서 현재 스테이지에 해당하는 배경 정보 조회
- 배경 엔티티의 `SpriteGUIRendererComponent.ImageRUID` 변경
- 스테이지 범위별 다른 맵 배경 적용

---

## 몬스터 입장 연출

### MonsterManager.SpawnVisual

- 몬스터 엔티티 생성 후 WALK 상태 재생
- `pendingSpawnEntranceCount`로 입장 중인 몬스터 수 추적
- `IsSpawnEntranceFinished()`로 모든 몬스터 입장 완료 확인
- 입장 완료 전까지 플레이어 공격 불가 (BattleManager에서 체크)

---

## 주의사항

- 페이드 엔티티는 Inspector에서 직접 바인딩
- isPhaseTransitioning / isDyingAnimating 중에는 연출 중복 방지
- **스크립트 내부 문자는 100% 영어 작성 원칙 준수**
