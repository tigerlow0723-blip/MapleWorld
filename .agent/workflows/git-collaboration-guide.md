---
description: 동업자와 GitHub 협업하는 전체 과정 정리 (실제 테스트 기반)
---

# GitHub 협업 가이드 (처음부터 병합까지)

> 2026-02-19 동업자(KHG, KHW)와 실제 테스트하며 정리한 과정

---

## 1단계: 저장소 생성 & 초기 Push

1. **GitHub에서 새 저장소 생성** (`MapleWorld`)
2. **로컬 폴더에 Git 초기화** (이미 되어있으면 생략)
3. **원격 저장소 연결**
   - VS Code Source Control > `...` > Remote > Add Remote
   - 또는: `git remote add origin https://github.com/계정/MapleWorld.git`
4. **첫 커밋 & push**
   - Source Control에서 파일 Stage(+) → 커밋 메시지 입력 → Commit → Sync Changes

---

## 2단계: 동업자 초대 & Clone

1. **GitHub 저장소** > Settings > Collaborators > 동업자 초대
2. **동업자가 Clone**
   - GitHub Desktop: File > Clone Repository > URL 입력
   - 또는: `git clone https://github.com/계정/MapleWorld.git`

---

## 3단계: 브랜치 생성

각자 작업할 브랜치를 만든다.

1. **GitHub 웹**에서 브랜치 생성:
   - 저장소 > 브랜치 드롭다운 > 이름 입력 > Create branch
2. **또는 VS Code**에서:
   - 왼쪽 아래 브랜치 이름 클릭 > Create new branch

| 브랜치 | 사용자 | 용도 |
|--------|--------|------|
| `main` | 공용 | 최종 합쳐진 코드 |
| `HeungGyu` | KHG | KHG 개인 작업용 |
| `HyunWoo` | KHW | KHW 개인 작업용 |

---

## 4단계: 브랜치 전환 & 최신 main 동기화

### 내 브랜치로 전환
- VS Code 왼쪽 아래 브랜치 이름 클릭 → 내 브랜치 선택

### main 내용을 내 브랜치에 합치기 (동기화)
- VS Code: `...` > Branch > **Merge Branch** > `main` 선택
- 이렇게 하면 **내 브랜치가 main의 최신 상태에서 시작**하게 됨

> ⚠️ main이 업데이트될 때마다 이 작업을 하면 충돌이 줄어든다

---

## 5단계: 각자 작업 → Commit → Push

### 작업
- 각자 본인 브랜치에서 파일 수정/추가
- **다른 브랜치끼리는 동시에 push해도 문제 없음** ✅

### VS Code에서 Commit & Push
1. Source Control 패널 열기
2. 변경된 파일 옆 **+** 버튼 (Stage)
3. 커밋 메시지 입력 (예: `"인벤토리 UI 추가"`)
4. **✓ Commit** 클릭
5. **Sync Changes** 클릭 (= Push)

---

## 6단계: Pull Request (PR) → main에 Merge

### GitHub 웹에서 PR 생성
1. GitHub 저장소 접속
2. **"Compare & pull request"** 버튼 클릭 (또는 Pull requests > New pull request)
3. 설정:
   - **base**: `main` ← **compare**: `HeungGyu` (또는 `HyunWoo`)
4. PR 제목과 설명 입력
5. **Create pull request** 클릭

### Merge 실행
1. 충돌이 없으면 초록색 **"Merge pull request"** 버튼 표시
2. **Merge pull request** → **Confirm merge** 클릭
3. ✅ 내 브랜치 → main 합쳐짐!

### ⚠️ 충돌(Conflict) 발생 시
- 같은 파일을 둘 다 수정하면 두 번째 PR에서 충돌 발생
- **"Resolve conflicts"** 버튼 클릭 → 어떤 코드를 쓸지 직접 선택 → Mark as resolved → Merge

---

## 7단계: Merge 후 내 브랜치 업데이트

merge가 끝나면 main이 업데이트되었으므로, 내 브랜치도 다시 동기화해야 한다.

1. VS Code에서 `main` 브랜치로 전환
2. **Sync Changes** (pull 받기)
3. 내 브랜치(`HeungGyu`)로 다시 전환
4. `...` > Branch > **Merge Branch** > `main` 선택
5. **Sync Changes** (push)

---

## 전체 사이클 요약

```
┌─────────────────────────────────────────────┐
│  ① 내 브랜치에서 작업                        │
│  ② commit → push                           │
│  ③ GitHub에서 PR 생성 → main에 merge        │
│  ④ main을 내 브랜치에 merge (동기화)         │
│  ⑤ ①부터 반복                               │
└─────────────────────────────────────────────┘
```

---

## 주의사항

| 상황 | 같은 브랜치 | 다른 브랜치 |
|------|:---------:|:---------:|
| 동시 push | ❌ 나중 사람이 pull 먼저 | ✅ 문제 없음 |
| 같은 파일 수정 | ⚠️ 충돌 발생 | ✅ push는 OK, merge 시 충돌 |

- **Maker에서 만든 스크립트**는 Maker에서 생성 후 VS Code에서 내용만 수정
- **PowerShell로 직접 파일 덮어쓰기 금지** (인코딩 깨짐 위험)
- 작업 시작 전에 항상 **main을 내 브랜치에 merge**하는 습관!

### ⚠️ Maker와 Git 동시 사용 주의

Maker는 로컬 폴더(`Lucky_Backpack/`)를 직접 읽고 쓰기 때문에, **Maker가 켜진 상태에서 Git 브랜치 전환/pull/merge를 하면 파일 충돌이나 데이터 손실 위험**이 있다.

**안전한 순서:**
1. Maker에서 **저장 후 종료**
2. Git에서 **commit → push**
3. **브랜치 전환** 또는 **pull/merge**
4. Maker **다시 열기**

> 💡 **한 줄 요약: Maker 끄고 → Git 작업 → Maker 켜기**
