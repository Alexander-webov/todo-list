import axios from 'axios';
import zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);
const BASE = 'https://client.work-zilla.com';

export async function parseWorkzilla() {
  const cookie = process.env.WORKZILLA_COOKIE;
  if (!cookie) {
    console.log('[Workzilla] WORKZILLA_COOKIE не задан — пропускаем');
    return [];
  }

  const HEADERS = {
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate',
    'accept-language': 'ru,en;q=0.9',
    'agentid': process.env.WORKZILLA_AGENTID || 'fp21-80a15a2039080e8f0283a9b4fb6c8d09',
    'cache-control': 'no-cache',
    'cookie': cookie,
    'pragma': 'no-cache',
    'referer': 'https://client.work-zilla.com/freelancer',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36',
  };

  const results = [];
  const seen = new Set();
  const now = new Date().toISOString();

  const endpoints = [
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false&sort=new`,
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint, {
        headers: HEADERS,
        timeout: 20000,
        responseType: 'arraybuffer',
        decompress: true,
      });

      let data;
      try {
        const buf = Buffer.from(res.data);
        const text = buf.toString('utf8');
        data = JSON.parse(text);
      } catch(e) {
        try {
          const decompressed = await gunzip(res.data);
          data = JSON.parse(decompressed.toString('utf8'));
        } catch(e2) {
          console.error('[Workzilla] Ошибка парсинга:', e2.message);
          continue;
        }
      }

      if (data?.result === 102) {
        console.error('[Workzilla] Сессия истекла (result: 102) — обнови WORKZILLA_COOKIE');
        break;
      }

      const orders = [
        ...(data?.data?.interesting || []),
        ...(data?.data?.other || []),
        ...(data?.data?.new || []),
        ...(Array.isArray(data?.data) ? data.data : []),
      ];

      console.log(`[Workzilla] ${endpoint.split('?')[1]}: ${orders.length} заданий`);

      for (const order of orders) {
        if (!order.id || !order.subject || seen.has(order.id)) continue;
        seen.add(order.id);
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
          url: `https://work-zilla.com/tasks/${order.id}`,
          referral_url: `https://work-zilla.com/tasks/${order.id}`,
          published_at: now,
        });
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`[Workzilla] Ошибка: ${err.message}`);
    }
  }

  console.log(`[Workzilla] Итого: ${results.length}`);
  return results;
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|html|css|javascript|php|wordpress|bitrix|tilda/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|логотип|баннер|ui|ux|figma|иллюстра|презентац/i,
    'Writing': /текст|копирайт|статья|перевод|контент|рерайт/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен|таргет/i,
    'Data': /данные|python|аналитик|1с|excel|таблиц|парс/i,
    'Backend': /backend|api|сервер|sql|программист|разработ/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
