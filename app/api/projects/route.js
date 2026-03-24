import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const page     = parseInt(searchParams.get('page')  || '1', 10);
  const limit    = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const source   = searchParams.get('source');
  const category = searchParams.get('category');
  const search   = searchParams.get('search');
  const since    = searchParams.get('since');

  const db   = supabaseAdmin();
  const from = (page - 1) * limit;

  let query = db
    .from('projects')
    .select('*', { count: 'exact' })
    // Сортируем по published_at (реальное время публикации на бирже)
    // Если нет — по created_at (время добавления в нашу БД)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (source)   query = query.eq('source', source);
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
