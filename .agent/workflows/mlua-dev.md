---
description: mLua 스크립트 개발 워크플로우 및 규칙
---

# mLua 개발 규칙

## 작업 경로
- **기본 경로**: `Test_BackPack/RootDesk/MyDesk`
- 생성하는 모든 mLua 파일은 위 경로 하위에 생성할 것

## 스크립트 파일 관리
- **새 `.mlua` 스크립트 파일을 임의로 생성하지 않는다**
  - `.mlua` 파일은 반드시 **MSW Maker** 안에서 생성해야 함
  - Maker가 `.codeblock` 메타데이터(고유 UUID)를 자동 생성하므로, 외부에서 직접 만들면 로드 에러 발생
  - `.codeblock` 파일은 절대 수정하지 않는다
- **기존 스크립트의 코드 내용 수정은 허용**
  - Maker에서 이미 생성된 `.mlua` 파일의 코드 내용은 VS Code에서 수정 가능

## MCP 도구 사용
- mLua 확장자(`.mlua`) 파일을 작성하거나 수정할 때는 반드시 **MCP 도구**를 활용할 것
- 스크립트 작성 전 아래 도구를 순서대로 호출:
  1. `mlua_grammer` — mlua 문법 확인
  2. `mlua_guideline` — MSW 개발 가이드라인 확인
- 필요 시 참고 도구:
  - `msw_helper` — 카테고리별 API 레퍼런스
  - `mlua_Document_Retriever` — 자연어 문서 검색
  - `mlua_API_Retriever` — API 키워드 검색