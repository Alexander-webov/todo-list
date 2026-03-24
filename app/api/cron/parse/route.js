import { NextResponse } from 'next/server';
import { runAllParsers } from '@/lib/parsers/index';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Удаляем проекты старше KEEP_DAYS дней
const KEEP_DAYS = 7;

async function cleanupOldProjects() {
  const db = supabaseAdmin();
  const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await db
    .from('projects')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);

  if (error) {
    console.error('[Cleanup] Ошибка:', error.message);
    return 0;
  }

  console.log(`[Cleanup] Удалено старых проектов: ${count}`);
  return count || 0;
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Сначала чистим старые, потом добавляем новые
    const deleted = await cleanupOldProjects();
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
