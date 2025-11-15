# 보안 가이드

## API 키 관리

### ✅ 권장 방법 (서버 사이드)

**1. 환경 변수 사용 (가장 안전)**

`.env.local` 파일에 API 키 추가:
```env
GOOGLE_GEMINI_API_KEY=your_api_key_1
GOOGLE_GEMINI_API_KEY_2=your_api_key_2
GOOGLE_GEMINI_API_KEY_3=your_api_key_3
```

**Vercel 배포 시:**
- Vercel 대시보드 → Settings → Environment Variables
- 각 API 키를 환경 변수로 추가

**장점:**
- ✅ 코드에 API 키가 노출되지 않음
- ✅ Git에 커밋되지 않음 (.gitignore에 포함)
- ✅ 서버 사이드에서만 접근 가능

### ⚠️ 주의사항 (클라이언트 사이드)

**현재 구현:**
- 클라이언트에서 localStorage에 API 키 저장
- 설정 UI에서 API 키 추가/관리 가능

**보안 위험:**
- ❌ 브라우저 DevTools로 누구나 API 키 확인 가능
- ❌ XSS 공격 시 API 키 유출 가능
- ❌ GitHub에 푸시 시 코드에 포함되면 노출

**권장사항:**
- 개인 프로젝트라도 가능하면 서버 사이드에서만 관리
- 클라이언트 저장은 개발/테스트 목적으로만 사용
- 프로덕션에서는 환경 변수 사용

## 보안 체크리스트

- [x] `.env.local` 파일이 `.gitignore`에 포함됨
- [x] API 키가 코드에 하드코딩되지 않음
- [ ] 환경 변수로 API 키 관리 (권장)
- [ ] Vercel 환경 변수 설정 완료
- [ ] API 키를 GitHub에 커밋하지 않음

## API 키 추가 방법

### 방법 1: 환경 변수 (권장)

1. `.env.local` 파일 생성/수정
2. `GOOGLE_GEMINI_API_KEY=your_key` 추가
3. 여러 키는 `GOOGLE_GEMINI_API_KEY_2`, `GOOGLE_GEMINI_API_KEY_3` 등으로 추가

### 방법 2: 설정 UI (개발용)

1. 설정 사이드바 → API 키 관리
2. "+" 버튼으로 API 키 추가
3. **주의**: 이 방법은 클라이언트에 저장되므로 보안 위험 있음

## 할당량 초과 시 자동 전환

- 환경 변수에 여러 키가 있으면 자동으로 다음 키로 전환
- 클라이언트에 저장된 키도 자동 전환 지원

