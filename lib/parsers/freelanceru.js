import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE = 'https://freelance.ru';
const REFERRAL = process.env.FREELANCERU_REFERRAL || '';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  'Referer': BASE,
};

async function fetchPage(page) {
  const url = `${BASE}/project/search?order=date&type=project&page=${page}`;
  const res = await axios.get(url, { headers: HEADERS, timeout: 20000 });
  return res.data;
}

function parseProjects(html) {
  const $ = cheerio.load(html);
  const results = [];

  $('.project-item-default-card').each((_, el) => {
    const $el = $(el);

    // Заголовок и ссылка
    const titleEl = $el.find('h2.title a').first();
    const title = titleEl.text().trim();
    if (!title) return;

    const relUrl = titleEl.attr('href') || '';
    const url = relUrl.startsWith('http') ? relUrl : `${BASE}${relUrl}`;

    // ID из URL: /projects/slug-1663953.html
    const externalId = relUrl.match(/-(\d+)\.html/)?.[1] || relUrl;

    // Описание
    const description = $el.find('a.description').text().trim().slice(0, 500);

    // Бюджет
    const budgetText = $el.find('.price, .budget, [class*="price"], [class*="budget"]').first().text().trim();
    const budgetMatch = budgetText.match(/([\d\s]+)/);
    const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/\s/g, '')) : null;

    // Категория
    const category = $el.find('.category, [class*="category"], .tags a').first().text().trim();

    // Теги
    const tags = [];
    $el.find('.tags a, .skills a, [class*="tag"] a').each((_, t) => {
      tags.push($(t).text().trim());
    });

    // Дата
    const dateEl = $el.find('time, .timeago, [class*="date"], [class*="time"]').first();
    const dateStr = dateEl.attr('datetime') || dateEl.text().trim();

    results.push({
      external_id: String(externalId),
      source: 'freelanceru',
      title,
      description,
      budget_min: budget,
      budget_max: null,
      currency: 'RUB',
      category: category || detectCategory(title + ' ' + description),
      tags: tags.slice(0, 8),
      url,
      referral_url: REFERRAL ? `${url}?ref=${REFERRAL}` : url,
      published_at: dateStr ? parseDate(dateStr) : new Date().toISOString(),
    });
  });

  return results;
}

function parseDate(str) {
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch (_) {}
  return new Date().toISOString();
}

export async function parseFreelanceRu() {
  const results = [];
  const seen = new Set();

  for (let page = 1; page <= 5; page++) {
    try {
      const html = await fetchPage(page);
      const items = parseProjects(html);

      if (items.length === 0) {
        console.log(`[Freelance.ru] Страница ${page} пустая — стоп`);
        break;
      }

      for (const p of items) {
        if (!seen.has(p.external_id)) {
          seen.add(p.external_id);
          results.push(p);
        }
      }

      console.log(`[Freelance.ru] Страница ${page}: ${items.length} проектов`);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`[Freelance.ru] Ошибка страницы ${page}:`, err.message);
      break;
    }
  }

  console.log(`[Freelance.ru] Итого: ${results.length}`);
  return results;
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|html|css|javascript|php|wordpress|bitrix|frontend|backend/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|логотип|баннер|ui|ux|figma|иллюстра|презентац/i,
    'Writing': /текст|копирайт|статья|перевод|контент|редактур|рерайт|копирайтер/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен|таргет|менеджер по|рассылк/i,
    'Data': /данные|python|аналитик|1с|excel|таблиц|парс/i,
    'Backend': /backend|api|сервер|sql|программист|разработ/i,
    'DevOps': /devops|docker|linux|администратор/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
