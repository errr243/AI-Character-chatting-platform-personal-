import Stripe from 'stripe';

// Stripe 클라이언트 생성 (환경 변수가 없으면 null 반환)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null;

// Stripe 사용 전 체크 헬퍼 함수
export function requireStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
}

