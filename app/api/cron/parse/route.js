import { NextResponse } from 'next/server';
import { runAllParsers } from '@/lib/parsers/index';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_PROJECTS = 4500; // при достижении — чистим
const KEEP_PROJECTS = 2500; // сколько оставляем после чистки

async function cleanupIfNeeded() {
  const db = supabaseAdmin();

  // Считаем сколько записей
  const { count } = await db
    .from('projects')
    .select('*', { count: 'exact', head: true });

  console.log(`[Cleanup] Проектов в БД: ${count}`);

  if (count < MAX_PROJECTS) return 0;

  console.log(`[Cleanup] Достигнут лимит ${MAX_PROJECTS}, чистим до ${KEEP_PROJECTS}...`);

  // Находим дату N-й записи с конца (самые новые сохраняем)
  const { data: cutoffRow } = await db
    .from('projects')
    .select('created_at')
    .order('created_at', { ascending: false })
    .range(KEEP_PROJECTS - 1, KEEP_PROJECTS - 1)
    .single();

  if (!cutoffRow) return 0;

  // Удаляем всё что старше этой даты
  const { error, count: deleted } = await db
    .from('projects')
    .delete({ count: 'exact' })
    .lt('created_at', cutoffRow.created_at);

  if (error) {
    console.error('[Cleanup] Ошибка:', error.message);
    return 0;
  }

  console.log(`[Cleanup] Удалено: ${deleted}, осталось: ~${KEEP_PROJECTS}`);
  return deleted || 0;
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deleted = await cleanupIfNeeded();
    const added = await runAllParsers();

    return NextResponse.json({
      success: true,
      added,
      deleted,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Ошибка:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
