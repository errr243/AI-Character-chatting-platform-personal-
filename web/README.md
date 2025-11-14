## 개인용 AI 캐릭터 채팅 플랫폼

Google Gemini 2.5 Pro 모델을 사용해 캐릭터별 대화를 즐길 수 있는 개인용 웹 애플리케이션입니다. 캐릭터 설정(시스템 프롬프트), 대화 히스토리, 메시지를 로컬 SQLite 데이터베이스에 저장합니다.

---

## 준비 사항

- Node.js 20 이상
- Google AI Studio 또는 Generative Language API에서 발급한 Gemini API Key
- (선택) 사용할 Gemini 모델명. 기본값은 `gemini-2.5-pro`

### 환경 변수

프로젝트 루트(`web/`)에 `.env.local` 파일을 만들고 아래 항목을 입력합니다.

```env
GEMINI_API_KEY=여기에_발급받은_API_키
# 필요 시 모델명을 변경합니다. 기본값은 gemini-2.5-pro 입니다.
# GEMINI_MODEL=gemini-2.5-pro
```

Gemini 호출에 실패하면 500 오류를 반환하므로 실제 키를 반드시 설정하세요.

---

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 애플리케이션을 사용할 수 있습니다.

SQLite 데이터베이스 파일은 `data/chat.db` 로 생성되며, 캐릭터/대화/메시지 정보가 저장됩니다. 백업이 필요하다면 해당 파일을 복사하세요.

---

## 주요 스크립트

| 명령어        | 설명                                |
| ------------- | ----------------------------------- |
| `npm run dev` | 개발 서버 실행 (포트 3000)          |
| `npm run lint`| ESLint로 코드 규칙 검사             |

빌드/배포는 일반적인 Next.js App Router 프로젝트와 동일합니다. (예: `npm run build`, `npm run start`)

---

## API 개요

| 메서드 | 경로                 | 설명                                   |
| ------ | -------------------- | -------------------------------------- |
| GET    | `/api/characters`    | 저장된 캐릭터 목록 조회               |
| POST   | `/api/characters`    | 새 캐릭터 생성                        |
| GET    | `/api/characters/:id`| 캐릭터 상세 조회                      |
| PUT    | `/api/characters/:id`| 캐릭터 정보 수정                      |
| DELETE | `/api/characters/:id`| 캐릭터 삭제 (연관 대화/메시지 포함)  |
| GET    | `/api/conversations?characterId=` | 캐릭터별 대화 목록 조회 |
| POST   | `/api/conversations` | 새 대화 생성                          |
| GET    | `/api/messages?conversationId=` | 대화 메시지 조회           |
| POST   | `/api/messages`      | 사용자 메시지 전송 및 Gemini 응답 생성 |

모든 엔드포인트는 Next.js API Route(App Router)를 통해 제공되며, 캐시 방지를 위해 `dynamic = 'force-dynamic'` 설정을 사용합니다.

---

## 구조 요약

```
src/
  app/
    api/           # 캐릭터/대화/메시지 REST API
    page.tsx       # 단일 페이지형 UI
    globals.css    # Tailwind 스타일
  lib/
    db.ts          # better-sqlite3 연결 및 스키마
    repository.ts  # 데이터 액세스 레이어
    gemini.ts      # Gemini 호출 유틸리티
data/chat.db       # 런타임에 생성되는 SQLite 파일
```

---

## 참고 사항

- 모든 데이터는 로컬 파일 시스템(`data/chat.db`)에 저장됩니다. 다중 사용자나 클라우드 환경에서는 적절한 데이터베이스로 교체하세요.
- Gemini 호출 시 시스템 프롬프트는 캐릭터 정보에 입력한 내용이 그대로 사용됩니다. 민감한 정보를 주지 않도록 주의하세요.
- 간단한 alert/confirm UI를 사용하고 있으므로 필요에 따라 토스트 라이브러리나 상태 관리로 개선할 수 있습니다.
