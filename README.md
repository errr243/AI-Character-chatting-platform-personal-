# Translator 프로젝트

Gemini 기반 전문 번역 워크플로우 도구

## 시작하기

1. 환경 변수 설정
   - `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:
   ```env
   # Gemini API
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key

   # Database
   DATABASE_URL=your_postgresql_connection_string

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Stripe (선택적)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

   # Redis (Upstash, 선택적)
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   ```

2. 의존성 설치
```bash
npm install
```

3. Prisma 클라이언트 생성 및 데이터베이스 마이그레이션
```bash
npx prisma generate
npx prisma migrate dev
```

4. 개발 서버 실행
```bash
npm run dev
```

## 기술 스택

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Google Gemini API
- Prisma (PostgreSQL)
- NextAuth.js
- Stripe (결제)
- Upstash Redis (Rate Limiting)

## 주요 기능

- 텍스트 번역 (Gemini Flash/Pro)
- 번역 기록 저장 및 조회
- Rate Limiting
- 사용자 인증 (Google OAuth)
- 구독 관리 (Stripe)

## 프로젝트 구조

```
translator/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── translate/         # 번역 페이지
│   └── history/           # 기록 페이지
├── components/            # React 컴포넌트
├── lib/                  # 유틸리티 & 라이브러리
│   ├── gemini/           # Gemini API 클라이언트
│   ├── db/               # Prisma 설정
│   ├── auth/             # NextAuth 설정
│   └── stripe/           # Stripe 설정
└── prisma/               # Prisma 스키마
```

