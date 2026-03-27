import axios from 'axios';

const BASE = 'https://client.work-zilla.com';
const REFERRAL = process.env.WORKZILLA_REFERRAL || '';

export async function parseWorkzilla() {
  const cookie = process.env.WORKZILLA_COOKIE;
  if (!cookie) {
    console.log('[Workzilla] WORKZILLA_COOKIE не задан — пропускаем');
    return [];
  }

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'ru,en;q=0.9',
    'Cookie': cookie,
    'agentid': 'fp21-2a1f4d71a8041227730ae123773c50c3',
    'Referer': 'https://client.work-zilla.com/freelancer',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  const results = [];
  const now = new Date().toISOString();

  // Пробуем несколько эндпоинтов — ищем самые свежие задания
  const endpoints = [
    // Новые задания (появились недавно)
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false&sort=new`,
    `${BASE}/api/order/v6/list/new?hideInsolvoOrders=false`,
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false`,
  ];

  const seen = new Set();

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint, { headers: HEADERS, timeout: 20000 });

      const orders = [
        ...(res.data?.data?.interesting || []),
        ...(res.data?.data?.other || []),
        ...(res.data?.data?.new || []),
        ...(Array.isArray(res.data?.data) ? res.data.data : []),
      ];

      for (const order of orders) {
        if (!order.id || !order.subject || seen.has(order.id)) continue;
        seen.add(order.id);

        const url = `https://work-zilla.com/tasks/${order.id}`;

        // Используем текущее время как published_at —
        // у Workzilla modified одинаковый для всех (isStaticOrders: true)
        // поэтому показываем когда мы это спарсили
        results.push({
          external_id: String(order.id),
          source: 'workzilla',
          title: order.subject.trim(),
          description: (order.description || '').slice(0, 500),
          budget_min: order.price || null,
          budget_max: null,
          currency: 'RUB',
          category: detectCategory(order.subject + ' ' + (order.description || '')),
          tags: [],
          url,
          referral_url: url,
          // Не доверяем order.modified — у всех одинаковый кэшированный timestamp
          // Используем текущее время парсинга
          published_at: now,
        });
      }

      console.log(`[Workzilla] ${endpoint.split('/').pop()}: ${orders.length} заданий`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('[Workzilla] ⚠️  Куки истекли — обнови WORKZILLA_COOKIE в .env.local');
        break;
      }
      // 404 — эндпоинт не существует, просто пропускаем
      if (err.response?.status !== 404) {
        console.error(`[Workzilla] Ошибка ${endpoint}:`, err.message);
      }
    }
  }

  console.log(`[Workzilla] Итого собрано: ${results.length}`);
  return results;
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|html|css|javascript|php|wordpress|bitrix|tilda/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|логотип|баннер|ui|ux|figma|фотошоп|photoshop|иллюстра|презентац/i,
    'Writing': /текст|копирайт|статья|перевод|контент|редактур|рерайт|транскриб|расшифр/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен|таргет|контекст|инстаграм|телеграм/i,
    'Data': /данные|python|аналитик|1с|excel|таблиц|база данных|парс/i,
    'Backend': /backend|api|сервер|sql|программист|разработ/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
