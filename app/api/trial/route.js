import { NextResponse } from 'next/server';
import { getCurrentUser, activatePremium } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST() {
  const { user, profile } = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });

  if (profile?.trial_used) {
    return NextResponse.json({ error: 'Пробный период уже был использован' }, { status: 400 });
  }

  if (profile?.is_premium) {
    return NextResponse.json({ error: 'У вас уже есть премиум' }, { status: 400 });
  }

  // Активируем 3 дня
  await activatePremium(user.id, 3);

  const db = supabaseAdmin();
  await db.from('profiles').update({ trial_used: true }).eq('id', user.id);

  return NextResponse.json({ success: true, days: 3 });
}
