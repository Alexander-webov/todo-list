import axios from 'axios';
import FormData from 'form-data';

const KWORK_BASE = 'https://kwork.ru';
const REFERRAL = process.env.KWORK_REFERRAL || '';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
  'X-Requested-With': 'XMLHttpRequest',
  'Origin': KWORK_BASE,
  'Referer': `${KWORK_BASE}/projects`,
};

const CATEGORY_NAMES = {
  '1': 'Web Development', '2': 'Web Development', '3': 'Mobile',
  '4': 'Design', '5': 'Design', '6': 'Writing', '7': 'Marketing',
  '8': 'Marketing', '9': 'Data', '10': 'Backend', '11': 'Web Development',
  '12': 'Web Development', '13': 'Backend', '14': 'Design', '15': 'Writing',
  '16': 'Marketing', '17': 'Data', '18': 'Mobile', '19': 'Mobile',
  '20': 'Design', '21': 'Writing', '22': 'Marketing', '23': 'Data',
  '24': 'Backend', '25': 'Web Development', '26': 'Design', '27': 'Writing',
  '28': 'Design', '29': 'Marketing', '30': 'Data',
};

async function fetchPage(page) {
  const form = new FormData();
  form.append('a', '1');
  form.append('page', String(page));

  const res = await axios.post(`${KWORK_BASE}/projects`, form, {
    headers: { ...HEADERS, ...form.getHeaders() },
    timeout: 20000,
  });
  return res.data;
}

export async function parseKwork() {
  const results = [];
  const seen = new Set();

  for (let page = 1; page <= 5; page++) {
    try {
      const json = await fetchPage(page);

      if (!json?.success || !json?.data?.pagination?.data) {
        console.log(`[Kwork] Страница ${page}: неожиданная структура`, Object.keys(json?.data || {}));
        break;
      }

      const items = json.data.pagination.data;
      if (items.length === 0) {
        console.log(`[Kwork] Страница ${page} пустая — стоп`);
        break;
      }

      for (const item of items) {
        if (!item.id || seen.has(item.id)) continue;
        seen.add(item.id);

        // Заголовок: берём первые 100 символов описания как заголовок
        // (в Kwork "want" нет отдельного поля title — только description)
        const description = item.description || '';
        const title = item.name || item.title ||
          description.replace(/\n/g, ' ').slice(0, 100) +
          (description.length > 100 ? '...' : '');

        const url = `${KWORK_BASE}/projects/${item.id}`;
        const budget = item.possiblePriceLimit
          ? parseFloat(item.possiblePriceLimit)
          : null;
        const category = CATEGORY_NAMES[String(item.category_id)] ||
          detectCategory(description);

        results.push({
          external_id: String(item.id),
          source: 'kwork',
          title: title || 'Проект на Kwork',
          description: description.slice(0, 500),
          budget_min: budget,
          budget_max: null,
          currency: 'RUB',
          category,
          tags: [],
          url,
          referral_url: REFERRAL ? `${url}?ref=${REFERRAL}` : url,
          published_at: item.wantDates?.dateCreate
            ? new Date().toISOString() // Kwork даёт дату как "22 марта" без года
            : new Date().toISOString(),
        });
      }

      console.log(`[Kwork] Страница ${page}: ${items.length} проектов`);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`[Kwork] Ошибка страницы ${page}:`, err.message);
      break;
    }
  }

  console.log(`[Kwork] Итого: ${results.length}`);
  return results;
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|html|css|javascript|php|wordpress|bitrix/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|логотип|баннер|ui|ux|figma|svg|иллюстра/i,
    'Writing': /текст|копирайт|статья|перевод|контент/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен/i,
    'Data': /данные|python|аналитик|1с|excel|таблиц/i,
    'Backend': /backend|api|сервер|sql|база данных/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
