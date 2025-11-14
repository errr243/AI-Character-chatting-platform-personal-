import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis 클라이언트 초기화 (환경 변수가 없으면 더미 클라이언트 사용)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null;

// Rate Limiter 생성 (Redis가 없으면 더미 limiter 사용)
const createRateLimiter = (window: string, limit: number, prefix: string) => {
  if (!redis) {
    // Redis가 없으면 항상 허용하는 더미 limiter 반환
    return {
      limit: async () => ({
        success: true,
        limit: limit,
        remaining: limit,
        reset: Date.now() + 60000, // 1분 후
      }),
    };
  }
  
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as any),
    analytics: true,
    prefix,
  });
};

export const rateLimiter = createRateLimiter('10 s', 10, '@upstash/ratelimit') as Ratelimit;

// 구독 플랜별 Rate Limiter
export const planRateLimiters = {
  free: createRateLimiter('1 m', 10, '@upstash/ratelimit/free') as Ratelimit,
  pro: createRateLimiter('1 m', 100, '@upstash/ratelimit/pro') as Ratelimit,
  enterprise: createRateLimiter('1 m', 1000, '@upstash/ratelimit/enterprise') as Ratelimit,
};

// Rate Limit 체크 함수
export async function checkRateLimit(
  identifier: string,
  plan: 'free' | 'pro' | 'enterprise' = 'free'
) {
  const limiter = planRateLimiters[plan];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

