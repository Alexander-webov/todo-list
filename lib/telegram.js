import { supabaseAdmin } from './supabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const CHANNEL_RU = process.env.TELEGRAM_CHANNEL_RU;
const CHANNEL_INT = process.env.TELEGRAM_CHANNEL_INT;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allfreelancershere.ru';

const RU_SOURCE_KEYS = ['fl', 'kwork', 'freelanceru', 'youdo'];
const AD_EVERY_N_POSTS = 20;

const SOURCE_NAMES = {
  freelancer:    'Freelancer.com 🌐',
  fl:            'FL.ru 🇷🇺',
  kwork:         'Kwork 🇷🇺',
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

function getChannelForProject(project) {
  return RU_SOURCE_KEYS.includes(project.source) ? CHANNEL_RU : CHANNEL_INT;
}

// ─── Базовая отправка ───

export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId, text, parse_mode: 'HTML',
        disable_web_page_preview: true, ...options,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      if (err.error_code !== 403) console.error('[Telegram] error:', err);
      return null;
    }
    return (await res.json()).result;
  } catch (err) {
    console.error('[Telegram] fetch error:', err.message);
    return null;
  }
}

async function deleteTelegramMessage(chatId, messageId) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`${TELEGRAM_API}/deleteMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
    });
  } catch (err) {
    console.error('[Telegram] delete error:', err.message);
  }
}

// ─── Форматирование для личных уведомлений ───

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
  const desc = (project.description || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const projectUrl = project.id ? `${SITE_URL}/projects/${project.id}` : (project.referral_url || project.url);
  const directUrl = project.referral_url || project.url;

  let text = `🆕 ${source}\n\n`;
  text += `📌 <b>${project.title.slice(0, 120)}</b>\n\n`;
  if (desc) text += `${desc}${desc.length >= 200 ? '...' : ''}\n\n`;
  if (budget) text += `${budget}\n`;
  text += `📂 ${project.category || 'Другое'}\n\n`;
  text += `🔗 <a href="${projectUrl}">Подробнее на сайте</a> | <a href="${directUrl}">На биржу →</a>\n\n`;
  text += `━━━━━━━━━━━━━━━━\n${hashtags}\n`;
  text += `⚡ <a href="${SITE_URL}">allFreelancersHere</a> — все заказы в одном месте`;
  return text;
}

// ─── Платная реклама: тишина и автоудаление ───

async function isPinnedAdActive() {
  const db = supabaseAdmin();
  const { data: ads } = await db
    .from('ads').select('id, tg_posted_at, tg_pin_hours')
    .not('tg_posted_at', 'is', null)
    .or('position.eq.telegram,position.eq.all')
    .eq('is_active', true);
  if (!ads?.length) return false;
  const now = Date.now();
  for (const ad of ads) {
    const pinMs = (ad.tg_pin_hours || 2) * 60 * 60 * 1000;
    if (now - new Date(ad.tg_posted_at).getTime() < pinMs) {
      console.log(`[Telegram] Каналы на паузе — платная реклама`);
      return true;
    }
  }
  return false;
}

async function cleanupExpiredAds() {
  const db = supabaseAdmin();
  const { data: ads } = await db
    .from('ads').select('id, tg_posted_at, tg_keep_hours, tg_message_id')
    .not('tg_posted_at', 'is', null).not('tg_message_id', 'is', null);
  if (!ads?.length) return;
  const now = Date.now();
  for (const ad of ads) {
    const keepMs = (ad.tg_keep_hours || 48) * 60 * 60 * 1000;
    if (now - new Date(ad.tg_posted_at).getTime() > keepMs) {
      console.log(`[Telegram] Удаляю рекламный пост (${ad.tg_keep_hours}ч истекли)`);
      // Удаляем из обоих каналов (message_id одинаковый не будет, но попробуем оба)
      if (CHANNEL_RU) await deleteTelegramMessage(CHANNEL_RU, ad.tg_message_id);
      if (CHANNEL_INT) await deleteTelegramMessage(CHANNEL_INT, ad.tg_message_id);
      await db.from('ads').update({ tg_posted_at: null, tg_message_id: null }).eq('id', ad.id);
    }
  }
}

export async function postPaidAdToChannel(adId) {
  if (!BOT_TOKEN || (!CHANNEL_RU && !CHANNEL_INT)) return { ok: false, error: 'Каналы не настроены' };
  const db = supabaseAdmin();
  const { data: ad } = await db.from('ads').select('*').eq('id', adId).single();
  if (!ad) return { ok: false, error: 'Объявление не найдено' };

  let text = `📣 <b>Реклама</b>\n\n<b>${ad.title}</b>\n\n`;
  if (ad.description) text += `${ad.description}\n\n`;
  text += `🔗 <a href="${ad.link}">Подробнее →</a>\n\n`;
  text += `━━━━━━━━━━━━━━━━\n⚡ <a href="${SITE_URL}">allFreelancersHere</a> — все заказы в одном месте`;

  // Постим в оба канала
  let msgId = null;
  if (CHANNEL_RU) { const r = await sendTelegramMessage(CHANNEL_RU, text); if (r) msgId = r.message_id; }
  if (CHANNEL_INT) { await sendTelegramMessage(CHANNEL_INT, text); }

  if (!msgId) return { ok: false, error: 'Ошибка отправки' };

  await db.from('ads').update({
    tg_posted_at: new Date().toISOString(),
    tg_message_id: msgId,
    views: (ad.views || 0) + 1,
  }).eq('id', ad.id);

  console.log(`[Telegram] Платная реклама: "${ad.title}", тишина ${ad.tg_pin_hours || 2}ч`);
  return { ok: true, message_id: msgId };
}

async function postFreeAdToChannel(channelId) {
  const db = supabaseAdmin();
  const { data: ads } = await db.from('ads').select('*')
    .eq('is_active', true).or('position.eq.telegram,position.eq.all')
    .is('tg_posted_at', null).order('priority', { ascending: false }).limit(1);
  if (!ads?.length) return;
  const ad = ads[0];
  let text = `📣 <b>${ad.title}</b>\n\n`;
  if (ad.description) text += `${ad.description}\n\n`;
  text += `🔗 <a href="${ad.link}">Подробнее →</a>\n\n`;
  text += `━━━━━━━━━━━━━━━━\n⚡ <a href="${SITE_URL}">allFreelancersHere</a>`;
  await sendTelegramMessage(channelId, text);
  await db.from('ads').update({ views: (ad.views || 0) + 1 }).eq('id', ad.id);
}

async function getAndIncrementPostCount() {
  const db = supabaseAdmin();
  const { data } = await db.from('site_stats').select('value').eq('key', 'telegram_channel_post_count').single();
  const count = (data?.value || 0) + 1;
  await db.from('site_stats').update({ value: count, updated_at: new Date().toISOString() }).eq('key', 'telegram_channel_post_count');
  return count;
}

// ─── Основная функция ───

export async function sendNewProjectNotifications(newProjects) {
  if (!BOT_TOKEN || !newProjects?.length) return;
  const db = supabaseAdmin();

  await cleanupExpiredAds();

  // === 1. Публичные каналы (РУ + INT) ===
  const hasChannels = CHANNEL_RU || CHANNEL_INT;
  if (hasChannels) {
    const paused = await isPinnedAdActive();

    if (!paused) {
      // Разделяем проекты по регионам
      const ruProjects = newProjects.filter(p => RU_SOURCE_KEYS.includes(p.source)).slice(0, 10);
      const intProjects = newProjects.filter(p => !RU_SOURCE_KEYS.includes(p.source)).slice(0, 10);

      // Публикуем в РУ канал
      if (CHANNEL_RU && ruProjects.length > 0) {
        for (const project of ruProjects) {
          const count = await getAndIncrementPostCount();
          if (count % AD_EVERY_N_POSTS === 0) {
            await postFreeAdToChannel(CHANNEL_RU);
            await new Promise(r => setTimeout(r, 500));
          }
          await sendTelegramMessage(CHANNEL_RU, formatChannelPost(project));
          await new Promise(r => setTimeout(r, 500));
        }
        console.log(`[Telegram RU] Опубликовано: ${ruProjects.length}`);
      }

      // Публикуем в INT канал
      if (CHANNEL_INT && intProjects.length > 0) {
        for (const project of intProjects) {
          const count = await getAndIncrementPostCount();
          if (count % AD_EVERY_N_POSTS === 0) {
            await postFreeAdToChannel(CHANNEL_INT);
            await new Promise(r => setTimeout(r, 500));
          }
          await sendTelegramMessage(CHANNEL_INT, formatChannelPost(project));
          await new Promise(r => setTimeout(r, 500));
        }
        console.log(`[Telegram INT] Опубликовано: ${intProjects.length}`);
      }
    }
  }

  // === 2. Личные уведомления ===
  const { data: allProfiles } = await db
    .from('profiles')
    .select('telegram_chat_id, filter_categories, filter_sources, filter_keywords')
    .not('telegram_chat_id', 'is', null);
  if (!allProfiles?.length) return;

  for (const user of allProfiles) {
    const filterCategories = (user.filter_categories || []).filter(Boolean);
    const filterSources = (user.filter_sources || []).filter(Boolean);
    const filterKeywords = (user.filter_keywords || []).filter(Boolean);

    const filtered = newProjects.filter(p => {
      if (filterSources.length > 0 && !filterSources.includes(p.source)) return false;
      if (filterCategories.length > 0 && !filterCategories.includes(p.category || 'Другое')) return false;
      if (filterKeywords.length > 0) {
        const hay = `${p.title} ${p.description || ''}`.toLowerCase();
        return filterKeywords.some(kw => hay.includes(kw.toLowerCase()));
      }
      return true;
    });

    for (const project of filtered.slice(0, 3)) {
      await sendTelegramMessage(user.telegram_chat_id, formatProject(project), {
        reply_markup: { inline_keyboard: [[ { text: '👉 Открыть проект', url: project.referral_url || project.url } ]] },
      });
      await new Promise(r => setTimeout(r, 300));
    }
  }
}
