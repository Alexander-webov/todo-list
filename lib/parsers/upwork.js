import { detectCategory } from '../categories.js';
import { supabaseAdmin } from '../supabase.js';

const APIFY_TOKEN = process.env.APIFY_TOKEN;
// Можно менять на другой актор: sentry~upwork-jobs-finder, upwork-vibe~upwork-scraper, и т.д.
const APIFY_ACTOR = process.env.APIFY_UPWORK_ACTOR || 'sentry~upwork-jobs-finder';
const MIN_INTERVAL_MS = 30 * 60 * 1000; // 30 минут между запусками

/**
 * Проверяет: прошло ли достаточно времени с последнего запуска?
 * Upwork через Apify стоит денег — запускаем НЕ каждый cron, а раз в 30 мин.
 */
async function shouldRun() {
  const db = supabaseAdmin();
  const { data } = await db
    .from('site_stats')
    .select('value, updated_at')
    .eq('key', 'upwork_last_scrape')
    .single();

  if (!data) {
    // Первый запуск — создаём запись
    await db.from('site_stats').upsert({
      key: 'upwork_last_scrape',
      value: 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    return true;
  }

  const lastRun = new Date(data.updated_at).getTime();
  const now = Date.now();
  const elapsed = now - lastRun;

  if (elapsed < MIN_INTERVAL_MS) {
    const remaining = Math.round((MIN_INTERVAL_MS - elapsed) / 60000);
    console.log(`[Upwork] Пропуск — следующий запуск через ${remaining} мин`);
    return false;
  }

  return true;
}

async function markAsRun(count) {
  const db = supabaseAdmin();
  await db.from('site_stats').upsert({
    key: 'upwork_last_scrape',
    value: count,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });
}

/**
 * Вызывает Apify актор и получает результаты синхронно.
 */
async function callApify(searchQuery, maxItems = 30) {
  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Стандартные поля для большинства Upwork-акторов
      searchQuery,
      query: searchQuery,
      queries: [searchQuery],
      keywords: searchQuery,
      maxItems,
      maxResults: maxItems,
      limit: maxItems,
      sort: 'recency',
    }),
    signal: AbortSignal.timeout(120000), // 2 мин таймаут
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apify ${res.status}: ${text.slice(0, 200)}`);
  }

  return await res.json();
}

/**
 * Преобразует результат Apify в наш формат проекта.
 * Обрабатывает разные форматы разных акторов.
 */
function normalizeJob(raw) {
  // ID
  const id = raw.job_id || raw.id || raw.ciphertext || raw.uid ||
    (raw.url || raw.job_url || '').match(/~(\w+)/)?.[1] ||
    String(Date.now() + Math.random());

  // URL
  const url = raw.url || raw.job_url || raw.link ||
    (raw.ciphertext ? `https://www.upwork.com/jobs/${raw.ciphertext}` : '');

  // Заголовок
  const title = raw.title || raw.job_title || raw.name || '';
  if (!title || title.length < 5) return null;

  // Описание
  const description = (raw.description || raw.job_description || raw.snippet || raw.shortDescription || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);

  // Бюджет
  let budget = null;
  let currency = 'USD';
  if (raw.fixed_budget_amount || raw.fixedPrice || raw.budget) {
    budget = parseFloat(raw.fixed_budget_amount || raw.fixedPrice || raw.budget) || null;
  } else if (raw.hourly_max || raw.hourlyRange) {
    budget = parseFloat(raw.hourly_max || raw.hourlyRange?.max) || null;
  } else if (raw.amount?.amount) {
    budget = parseFloat(raw.amount.amount) || null;
  }
  if (raw.currency) currency = raw.currency;

  // Навыки
  const skills = raw.skills || raw.attrs || raw.requiredSkills || [];
  const skillNames = Array.isArray(skills)
    ? skills.map(s => typeof s === 'string' ? s : (s.name || s.prettyName || '')).filter(Boolean)
    : [];

  // Категория — определяем по title + description + skills
  const textForCategory = [title, description, ...skillNames].join(' ');
  const category = detectCategory(textForCategory);

  // Время публикации
  const publishedAt = raw.ts_publish || raw.ts_create || raw.publishedOn ||
    raw.createdOn || raw.created_at || raw.postedOn || new Date().toISOString();

  return {
    external_id: String(id),
    source: 'upwork',
    title: title.slice(0, 255),
    description,
    budget_min: budget,
    budget_max: null,
    currency,
    category,
    tags: skillNames.slice(0, 10),
    url: url || `https://www.upwork.com/search/jobs/?q=${encodeURIComponent(title.slice(0, 50))}`,
    referral_url: url,
    published_at: new Date(publishedAt).toISOString(),
  };
}

/**
 * Основная функция парсера.
 */
export async function parseUpwork() {
  if (!APIFY_TOKEN) {
    console.log('[Upwork] APIFY_TOKEN не задан — пропуск');
    return [];
  }

  // Проверяем интервал
  const ready = await shouldRun();
  if (!ready) return [];

  console.log(`[Upwork] Запуск через Apify (${APIFY_ACTOR})...`);

  const QUERIES = [
    'web development',
    'javascript react',
    'python',
    'design',
    'wordpress',
    'mobile app',
  ];

  const results = [];
  const seen = new Set();

  for (const query of QUERIES) {
    try {
      console.log(`[Upwork] Запрос: "${query}"...`);
      const items = await callApify(query, 20);

      if (!Array.isArray(items)) {
        console.error(`[Upwork] Неожиданный формат от Apify для "${query}"`);
        continue;
      }

      for (const raw of items) {
        const project = normalizeJob(raw);
        if (!project) continue;
        if (seen.has(project.external_id)) continue;
        seen.add(project.external_id);
        results.push(project);
      }

      console.log(`[Upwork] "${query}": +${items.length} (всего ${results.length})`);

      // Пауза между запросами чтобы не перегружать Apify
      await new Promise(r => setTimeout(r, 2000));

    } catch (err) {
      console.error(`[Upwork] Ошибка "${query}":`, err.message);
      // Если ошибка авторизации или лимит — прекращаем
      if (err.message.includes('402') || err.message.includes('429') || err.message.includes('401')) {
        console.error('[Upwork] Лимит Apify исчерпан или токен невалидный — стоп');
        break;
      }
    }
  }

  // Отмечаем время запуска
  await markAsRun(results.length);

  console.log(`[Upwork] Собрано: ${results.length}`);
  return results;
}
