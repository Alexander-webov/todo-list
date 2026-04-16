import { supabaseAdmin } from './supabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // @yourchannelname or -100xxxxx
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allfreelancershere.ru';

// Каждый N-й пост в канале — реклама
const AD_EVERY_N_POSTS = 20;

const SOURCE_NAMES = {
  freelancer:    'Freelancer.com 🌐',
  fl:            'FL.ru 🇷🇺',
  kwork:         'Kwork 🇷🇺',
  workzilla:     'Workzilla 🇷🇺',
  freelanceru:   'Freelance.ru 🇷🇺',
  upwork:        'Upwork 🌐',
  peopleperhour: 'PeoplePerHour 🌐',
  guru:          'Guru.com 🌐',
};

const CATEGORY_HASHTAGS = {
  'WordPress / Tilda / CMS': '#WordPress #Tilda #CMS',
  'Видеомонтаж': '#Видеомонтаж #Видео',
  'Графический дизайн': '#Дизайн #ГрафическийДизайн',
  'Web дизайн': '#WebДизайн #UIDesign',
  'SMM': '#SMM #Маркетинг',
  'Парсинг': '#Парсинг #Боты #Автоматизация',
  'Вёрстка': '#Вёрстка #HTML #CSS',
  'FrontEnd': '#FrontEnd #React #JavaScript',
  'BackEnd': '#BackEnd #PHP #Python',
  'Другое': '#Фриланс',
};

export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) return;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...options,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.error_code !== 403) {
        console.error('[Telegram] error:', err);
      }
    }
  } catch (err) {
    console.error('[Telegram] fetch error:', err.message);
  }
}

// ─── Форматирование для личных уведомлений (приватный бот) ───

function formatProject(project) {
  const source = SOURCE_NAMES[project.source] || project.source;
  const budget = project.budget_min
    ? `💰 <b>${project.budget_min.toLocaleString('ru')} ${project.currency === 'USD' ? '$' : '₽'}</b>`
    : '💰 Бюджет не указан';

  return (
    `🆕 <b>${source}</b>\n\n` +
    `📌 <b>${project.title.slice(0, 100)}</b>\n\n` +
    `${budget}\n` +
    (project.category ? `📂 ${project.category}\n\n` : '\n') +
    `<a href="${project.referral_url || project.url}">👉 Открыть проект</a>`
  );
}

// ─── Форматирование для публичного канала ───

function formatChannelPost(project) {
  const source = SOURCE_NAMES[project.source] || project.source;
  const hashtags = CATEGORY_HASHTAGS[project.category] || '#Фриланс';
  const budget = project.budget_min
    ? `💰 от ${project.budget_min.toLocaleString('ru')} ${project.currency === 'USD' ? '$' : '₽'}`
    : '';

  const desc = (project.description || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);

  const projectUrl = project.id
    ? `${SITE_URL}/projects/${project.id}`
    : (project.referral_url || project.url);
  const directUrl = project.referral_url || project.url;

  let text = `🆕 ${source}\n\n`;
  text += `📌 <b>${project.title.slice(0, 120)}</b>\n\n`;
  if (desc) text += `${desc}${desc.length >= 200 ? '...' : ''}\n\n`;
  if (budget) text += `${budget}\n`;
  text += `📂 ${project.category || 'Другое'}\n\n`;
  text += `🔗 <a href="${projectUrl}">Подробнее на сайте</a>`;
  text += ` | <a href="${directUrl}">На биржу →</a>\n\n`;
  text += `━━━━━━━━━━━━━━━━\n`;
  text += `${hashtags}\n`;
  text += `⚡ <a href="${SITE_URL}">allFreelancersHere</a> — все заказы в одном месте`;

  return text;
}

// ─── Публикация в канал ───

async function postToChannel(text) {
  if (!BOT_TOKEN || !CHANNEL_ID) return;
  await sendTelegramMessage(CHANNEL_ID, text);
}

async function postAdToChannel() {
  const db = supabaseAdmin();
  const { data: ads } = await db
    .from('ads')
    .select('*')
    .eq('is_active', true)
    .or('position.eq.telegram,position.eq.all')
    .order('priority', { ascending: false })
    .limit(1);

  if (!ads?.length) return;
  const ad = ads[0];

  let text = `📣 <b>Реклама</b>\n\n`;
  text += `<b>${ad.title}</b>\n\n`;
  if (ad.description) text += `${ad.description}\n\n`;
  text += `🔗 <a href="${ad.link}">Подробнее →</a>\n\n`;
  text += `━━━━━━━━━━━━━━━━\n`;
  text += `⚡ <a href="${SITE_URL}">allFreelancersHere</a> — все заказы в одном месте`;

  await postToChannel(text);

  // Считаем показы
  await db.from('ads').update({ views: (ad.views || 0) + 1 }).eq('id', ad.id);
}

async function getAndIncrementPostCount() {
  const db = supabaseAdmin();
  const { data } = await db
    .from('site_stats')
    .select('value')
    .eq('key', 'telegram_channel_post_count')
    .single();

  const count = (data?.value || 0) + 1;
  await db.from('site_stats')
    .update({ value: count, updated_at: new Date().toISOString() })
    .eq('key', 'telegram_channel_post_count');

  return count;
}

// ─── Основная функция: уведомления + канал ───

export async function sendNewProjectNotifications(newProjects) {
  if (!BOT_TOKEN || !newProjects?.length) return;

  const db = supabaseAdmin();

  // === 1. Публичный канал — все новые проекты ===
  if (CHANNEL_ID) {
    // Ограничиваем до 10 постов за раз (защита от спама при первом запуске)
    const channelProjects = newProjects.slice(0, 10);

    for (const project of channelProjects) {
      const count = await getAndIncrementPostCount();

      // Каждый N-й пост — реклама
      if (count % AD_EVERY_N_POSTS === 0) {
        await postAdToChannel();
        await new Promise(r => setTimeout(r, 500));
      }

      await postToChannel(formatChannelPost(project));
      await new Promise(r => setTimeout(r, 500)); // Telegram rate limit: ~20 msgs/min
    }

    console.log(`[Telegram Channel] Опубликовано: ${channelProjects.length} проектов`);
  }

  // === 2. Личные уведомления (приватный бот) ===
  const { data: allProfiles } = await db
    .from('profiles')
    .select('telegram_chat_id, filter_categories, filter_sources, filter_keywords')
    .not('telegram_chat_id', 'is', null);

  if (!allProfiles?.length) return;

  const activeUsers = allProfiles;

  console.log(`[Telegram] Пользователей: ${activeUsers.length}, проектов: ${newProjects.length}`);

  for (const user of activeUsers) {
    const filterCategories = (user.filter_categories || []).filter(Boolean);
    const filterSources = (user.filter_sources || []).filter(Boolean);
    const filterKeywords = (user.filter_keywords || []).filter(Boolean);

    const filtered = newProjects.filter(p => {
      if (filterSources.length > 0 && !filterSources.includes(p.source)) return false;
      if (filterCategories.length > 0) {
        const projectCategory = p.category || 'Другое';
        if (!filterCategories.includes(projectCategory)) return false;
      }
      if (filterKeywords.length > 0) {
        const hay = `${p.title} ${p.description || ''}`.toLowerCase();
        return filterKeywords.some(kw => hay.includes(kw.toLowerCase()));
      }
      return true;
    });

    for (const project of filtered.slice(0, 3)) {
      await sendTelegramMessage(
        user.telegram_chat_id,
        formatProject(project),
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '👉 Открыть проект', url: project.referral_url || project.url }
            ]],
          },
        }
      );
      await new Promise(r => setTimeout(r, 300));
    }
  }
}
