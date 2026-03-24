import { supabaseAdmin } from './supabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const SOURCE_NAMES = {
  upwork: 'Upwork 🌍',
  freelancer: 'Freelancer.com 🌐',
  fl: 'FL.ru 🇷🇺',
  habr: 'Habr Freelance 🇷🇺',
  kwork: 'Kwork 🇷🇺',
};

/**
 * Отправляет сообщение пользователю Telegram
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!BOT_TOKEN) return;

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
    console.error('[Telegram] sendMessage error:', err);
  }
}

/**
 * Форматирует карточку проекта для Telegram
 */
function formatProjectMessage(project) {
  const source = SOURCE_NAMES[project.source] || project.source;
  const budget = project.budget_min
    ? `💰 <b>${project.budget_min.toLocaleString()} ${project.currency}</b>`
    : '💰 Бюджет не указан';

  const category = project.category ? `📂 ${project.category}` : '';
  const title = project.title.slice(0, 100);
  const url = project.referral_url || project.url;

  return (
    `🆕 <b>Новый проект — ${source}</b>\n\n` +
    `📌 <b>${title}</b>\n\n` +
    `${budget}\n` +
    `${category}\n\n` +
    `<a href="${url}">👉 Открыть проект</a>`
  );
}

/**
 * Отправляет уведомления о новых проектах всем премиум-пользователям.
 * Учитывает их фильтры (категории, источники, ключевые слова).
 */
export async function sendNewProjectNotifications(newProjects) {
  if (!BOT_TOKEN || newProjects.length === 0) return;

  const db = supabaseAdmin();
  const { data: users } = await db
    .from('users')
    .select('telegram_chat_id, filter_sources, filter_keywords, filter_categories')
    .eq('is_premium', true)
    .not('telegram_chat_id', 'is', null);

  if (!users || users.length === 0) return;

  for (const user of users) {
    const filteredProjects = newProjects.filter((p) => {
      // Фильтр по источнику
      if (user.filter_sources?.length > 0 && !user.filter_sources.includes(p.source)) {
        return false;
      }
      // Фильтр по категории
      if (user.filter_categories?.length > 0 && !user.filter_categories.includes(p.category)) {
        return false;
      }
      // Фильтр по ключевым словам
      if (user.filter_keywords?.length > 0) {
        const haystack = `${p.title} ${p.description}`.toLowerCase();
        return user.filter_keywords.some((kw) => haystack.includes(kw.toLowerCase()));
      }
      return true;
    });

    // Отправляем максимум 5 уведомлений за раз, чтобы не спамить
    for (const project of filteredProjects.slice(0, 5)) {
      await sendTelegramMessage(user.telegram_chat_id, formatProjectMessage(project), {
        reply_markup: {
          inline_keyboard: [
            [{ text: '👉 Открыть проект', url: project.referral_url || project.url }],
          ],
        },
      });
      // Небольшая задержка между сообщениями
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}

/**
 * Регистрирует Telegram-бота (нужно вызвать один раз при настройке)
 * Указываем webhook URL для Vercel
 */
export async function registerWebhook(webhookUrl) {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN не задан');

  const res = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });

  return res.json();
}
