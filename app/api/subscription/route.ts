import { NextRequest, NextResponse } from 'next/server';
import { requireStripe } from '@/lib/stripe/client';

// 구독 생성 (Checkout Session 생성)
export async function POST(request: NextRequest) {
  try {
    const stripe = requireStripe();
    
    const body = await request.json();
    const { userId, plan, priceId } = body;

    if (!userId || !plan || !priceId) {
      return NextResponse.json(
        { error: 'userId, plan, and priceId are required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscription/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    if (error instanceof Error && error.message.includes('Stripe is not configured')) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// 웹훅 처리 (나중에 구현)
export async function GET() {
  return NextResponse.json({
    message: 'Subscription API',
    endpoints: {
      POST: '/api/subscription - Create checkout session',
    },
  });
}

