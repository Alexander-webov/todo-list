import { supabaseAdmin } from './supabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

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

  const { data: allProfiles } = await db
    .from('profiles')
    .select('telegram_chat_id, filter_categories, filter_sources, filter_keywords')
    .not('telegram_chat_id', 'is', null);

  if (!allProfiles?.length) return;

  const activeUsers = allProfiles;

  console.log(`[Telegram] Пользователей: ${activeUsers.length}, проектов: ${newProjects.length}`);

  for (const user of activeUsers) {
    // Нормализуем фильтры — убираем null и пустые значения
    const filterCategories = (user.filter_categories || []).filter(Boolean);
    const filterSources = (user.filter_sources || []).filter(Boolean);
    const filterKeywords = (user.filter_keywords || []).filter(Boolean);

    console.log(`[Telegram] Пользователь ${user.telegram_chat_id}: категории=${JSON.stringify(filterCategories)}`);

    const filtered = newProjects.filter(p => {
      // Фильтр по источнику
      if (filterSources.length > 0 && !filterSources.includes(p.source)) {
        return false;
      }

      // Фильтр по категории — только если выбраны конкретные категории
      if (filterCategories.length > 0) {
        const projectCategory = p.category || 'Другое';
        if (!filterCategories.includes(projectCategory)) {
          return false;
        }
      }

      // Фильтр по ключевым словам
      if (filterKeywords.length > 0) {
        const hay = `${p.title} ${p.description || ''}`.toLowerCase();
        return filterKeywords.some(kw => hay.includes(kw.toLowerCase()));
      }

      return true;
    });

    console.log(`[Telegram] После фильтрации: ${filtered.length} проектов`);

    // Максимум 3 уведомления за раз
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
