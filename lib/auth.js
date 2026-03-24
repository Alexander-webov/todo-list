import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase.js';

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();

    // Ищем куку Supabase — sb-<project_ref>-auth-token
    const authCookie = allCookies.find(c => 
      c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    );

    if (!authCookie?.value) {
      return { user: null, profile: null };
    }

    // Парсим токен
    let accessToken;
    try {
      const parsed = JSON.parse(authCookie.value);
      accessToken = parsed.access_token;
    } catch {
      return { user: null, profile: null };
    }

    if (!accessToken) return { user: null, profile: null };

    // Верифицируем через admin API
    const db = supabaseAdmin();
    const { data: { user }, error } = await db.auth.getUser(accessToken);

    if (error || !user) return { user: null, profile: null };

    const { data: profile } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    return { user, profile: profile || null };
  } catch (err) {
    console.error('[getCurrentUser] error:', err.message);
    return { user: null, profile: null };
  }
}

export async function activatePremium(userId, days = 30) {
  const db = supabaseAdmin();
  await db.rpc('activate_premium', { p_user_id: userId, p_days: days });
}
