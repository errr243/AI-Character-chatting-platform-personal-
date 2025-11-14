import { NextRequest, NextResponse } from 'next/server';
import { requireStripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/db/prisma';

// Stripe 웹훅 처리
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  let event;

  try {
    const stripe = requireStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const plan = session.metadata?.plan;

        if (userId && plan) {
          // 구독 정보 업데이트
          await prisma.subscription.upsert({
            where: { userId },
            update: {
              stripeId: session.subscription,
              status: 'active',
              plan,
              currentPeriodEnd: new Date(session.subscription_details?.current_period_end * 1000),
            },
            create: {
              userId,
              stripeId: session.subscription,
              status: 'active',
              plan,
              currentPeriodEnd: new Date(session.subscription_details?.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const stripeId = subscription.id;

        await prisma.subscription.updateMany({
          where: { stripeId },
          data: {
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodEnd: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null,
          },
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

