import { supabaseAdmin } from './supabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const SOURCE_NAMES = {
  freelancer:  'Freelancer.com 🌐',
  fl:          'FL.ru 🇷🇺',
  kwork:       'Kwork 🇷🇺',
  workzilla:   'Workzilla 🇷🇺',
  freelanceru: 'Freelance.ru 🇷🇺',
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
      // Если пользователь заблокировал бота — тихо игнорируем
      if (err.error_code !== 403) {
        console.error('[Telegram] sendMessage error:', err);
      }
    }
  } catch (err) {
    console.error('[Telegram] fetch error:', err.message);
  }
}

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

export async function sendNewProjectNotifications(newProjects) {
  if (!BOT_TOKEN || !newProjects?.length) return;

  const db = supabaseAdmin();

  // Берём только премиум-пользователей у которых есть telegram_chat_id
  const { data: users } = await db
    .from('profiles')
    .select('telegram_chat_id, filter_sources, filter_keywords, filter_categories')
    .eq('is_premium', true)
    .not('telegram_chat_id', 'is', null)
    .gt('premium_until', new Date().toISOString());

  if (!users?.length) return;

  for (const user of users) {
    const filtered = newProjects.filter(p => {
      if (user.filter_sources?.length > 0 && !user.filter_sources.includes(p.source)) return false;
      if (user.filter_categories?.length > 0 && !user.filter_categories.includes(p.category)) return false;
      if (user.filter_keywords?.length > 0) {
        const hay = `${p.title} ${p.description}`.toLowerCase();
        return user.filter_keywords.some(kw => hay.includes(kw.toLowerCase()));
      }
      return true;
    });

    // Максимум 3 уведомления за раз чтобы не спамить
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

export async function registerWebhook(webhookUrl) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN не задан');
  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
  return res.json();
}
