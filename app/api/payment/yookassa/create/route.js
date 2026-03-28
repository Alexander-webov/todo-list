import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const runtime = 'nodejs';

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const AMOUNT = '299.00';
const CURRENCY = 'RUB';

export async function POST() {
  const { user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  const idempotenceKey = uuidv4();

  try {
    const credentials = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: { value: AMOUNT, currency: CURRENCY },
        confirmation: {
          type: 'redirect',
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
        },
        capture: true,
        description: 'allFreelancersHere — Премиум подписка 30 дней',
        metadata: { user_id: user.id },
      }),
    });

    const payment = await response.json();

    if (!payment.id) {
      console.error('[YooKassa] Ошибка:', payment);
      return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 });
    }

    // Сохраняем платёж в БД
    const db = supabaseAdmin();
    await db.from('payments').insert({
      user_id: user.id,
      provider: 'yookassa',
      provider_id: payment.id,
      amount: parseFloat(AMOUNT),
      currency: CURRENCY,
      status: 'pending',
      days_granted: 30,
    });

    return NextResponse.json({ url: payment.confirmation.confirmation_url });
  } catch (err) {
    console.error('[YooKassa] Критическая ошибка:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
