import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';

// Серверный клиент с куками (для Server Components и Route Handlers)
export function createSupabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }); } catch (_) {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }); } catch (_) {}
        },
      },
    }
  );
}

// Получить текущего пользователя + профиль
export async function getCurrentUser() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const db = supabaseAdmin();
  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Проверяем не истёк ли премиум
  if (profile?.is_premium && profile?.premium_until) {
    if (new Date(profile.premium_until) < new Date()) {
      await db.from('profiles').update({ is_premium: false }).eq('id', user.id);
      profile.is_premium = false;
    }
  }

  return { user, profile };
}

// Активировать премиум через функцию БД
export async function activatePremium(userId, days = 30) {
  const db = supabaseAdmin();
  await db.rpc('activate_premium', { p_user_id: userId, p_days: days });
}
