import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: 500, // $5.00 в центах
          product_data: {
            name: 'FreelanceHub Premium',
            description: 'Доступ ко всем проектам на 30 дней',
          },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: { user_id: user.id },
      customer_email: user.email,
    });

    // Сохраняем сессию в БД
    const db = supabaseAdmin();
    await db.from('payments').insert({
      user_id: user.id,
      provider: 'stripe',
      provider_id: session.id,
      amount: 5,
      currency: 'USD',
      status: 'pending',
      days_granted: 30,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[Stripe] Ошибка:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
