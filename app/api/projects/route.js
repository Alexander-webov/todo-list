import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { RU_SOURCES, INT_SOURCES } from '@/lib/parsers/index';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const page     = parseInt(searchParams.get('page')  || '1', 10);
  const limit    = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const source   = searchParams.get('source');
  const category = searchParams.get('category');
  const search   = searchParams.get('search');
  const since    = searchParams.get('since');
  const region   = searchParams.get('region'); // 'ru' | 'int'

  const db   = supabaseAdmin();
  const from = (page - 1) * limit;

  let query = db
    .from('projects')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  // Фильтр по региону (приоритет у source — если указан конкретный source, region игнорируется)
  if (source) {
    query = query.eq('source', source);
  } else if (region === 'ru') {
    query = query.in('source', RU_SOURCES);
  } else if (region === 'int') {
    query = query.in('source', INT_SOURCES);
  }

  if (category) query = query.eq('category', category);
  if (search)   query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  if (since)    query = query.gt('created_at', since);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    projects: data || [],
    total:    count || 0,
    page,
    limit,
    pages:    Math.ceil((count || 0) / limit),
  });
}
