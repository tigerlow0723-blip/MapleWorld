---
description: MSW Maker에서 mLua 스크립트 파일 작업 워크플로우
---

# mLua 스크립트 작업 워크플로우

## 새 스크립트 생성
1. **반드시 Maker 안에서** 스크립트를 생성한다 (외부에서 생성 금지)
2. Maker에서 생성하면 `.mlua` 파일과 `.codeblock` 파일이 자동으로 생성됨
3. VS Code에서 코드 내용 수정은 가능하지만 **인코딩(CRLF)을 유지**해야 함

## 스크립트 수정
1. VS Code에서 `.mlua` 파일을 열어 코드 수정
2. PowerShell 등으로 직접 파일을 덮어쓰지 않는다 (인코딩 깨짐 위험)
3. Maker에서 문법 오류 확인

## Git 커밋 & 푸시
1. Source Control 패널에서 변경된 파일 Stage (+)
2. 커밋 메시지 입력
3. Commit → Sync Changes (Push)

## 브랜치 작업
1. 작업 전: main의 최신 내용을 내 브랜치에 merge
2. 작업 후: commit → push → GitHub에서 PR → main에 merge
3. merge 후: 다시 main을 내 브랜치에 merge하여 동기화
