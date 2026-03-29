const axios = require('axios');

const SITE_URL = 'https://allfreelancershere.ru';
const CRON_SECRET = 'mysecret123';

const COOKIE = '_ym_uid=1741436381598801764; _ym_d=1774178992; .AspNetCore.Session=CfDJ8GXnG5FKXyFAiCIA2uzB089sqhCDpDgwyKdSU5Aef6aHnL4DNvmyKi3MBHiA0FCeFNOET3s3kw5t1q35lZpOGIvYHGzNE%2Bx6190g%2Br0%2FF48h559qcIvrT4yZm7EIqqI17ONm45EQZD9WA1wvoFugI7K20NCjBdMQvQei59w%2FRqRi; CookieUsage=Allowed; BrowserId=eda2f685-305d-4e83-bd12-72102081cce1; lang=ru; _ym_isad=2; Bearer=CfDJ8DXTkTGM9KxPmms_uf9OtUVCxuOxnEWSzAqkDGJADk2t3rHQaJpYGoo3cqFCIBZnTuwvAekhNmoCezJwDUU-YKxWuWzdW9muvrIPXR1TaTRkgD7cTvQzrlrq4NF4kYwucLtuhgeSZlHS-PyC5dy-On_WK4VODxGb-lOjawR47FnTug22pRFy6T8n64_e3kK-FtSkyn5iwRstxZUgFW4q3h1R1amkpfZV2Nf754oK1opGMhs0-MrMTAu6lxwisd9lchzEMXmDBw1xaUz96mWd_r7P4-vC_hi5vl2a2p3xl1dKrD6wWwNK2u2JNzcY-EztBazMofETZTJhFNBXVeg-9aU7uIni1XMDoqc7BKMpDrWpN_885S12tHc9uiliFEkGpDWobPVRYfCbBz8r_Xx5IZijMTVRPzkBwLPGzIdYPcv36J3cNFM1hAGr01tk6H-qgtvOy-gq8Zw-L5Uz7FrRwjesAwhtDBmNH6FOnyEgkWaDmrtyNZG_JbRWPv_co62pfQtdGYHknpl8quU3Fc27EpYT5MzKoMHQ3iqoHP5Mcm6EI45LRq5VCLq5GYhcsJ2sKiwF89lxniSZOEM2tQmRnDwJJS2ixixWpX1_fVe1i5TiYHXFYc2pGSgRpJq71Oy9UESc-cj6alpUHMpULIL6xSVg8BzOV9OJi7aQWdsEA4oAZgN9CWA6Kdk810mlYfV2w_kiZmltZC5rh-SihEgPaeL_n-b1XWVTjZz8jUvIH7PFtYLJbINx2hRWagFWfj9D4gityW9O8J8ahoDAAnWvNo_XBKmqsJbNxkq0Ck0k1FOh0SmwGY1KfBwoTULCAUwiNgsoc8UIsoz_C3IDqxJqg0M';

const BASE = 'https://client.work-zilla.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Accept': 'application/json, */*',
  'Accept-Language': 'ru,en;q=0.9',
  'Cookie': COOKIE,
  'Referer': 'https://client.work-zilla.com/freelancer',
};

function detectCategory(text) {
  text = text || '';
  if (/сайт|верстк|react|vue|html|css|javascript|php|wordpress/i.test(text)) return 'Web Development';
  if (/мобильн|ios|android|flutter/i.test(text)) return 'Mobile';
  if (/дизайн|логотип|баннер|ui|ux|figma/i.test(text)) return 'Design';
  if (/текст|копирайт|статья|перевод/i.test(text)) return 'Writing';
  if (/маркетинг|seo|реклам|smm/i.test(text)) return 'Marketing';
  if (/данные|python|аналитик|1с|excel/i.test(text)) return 'Data';
  if (/backend|api|сервер|sql/i.test(text)) return 'Backend';
  return 'Другое';
}

async function parseWorkzilla() {
  const results = [];
  const seen = new Set();
  const now = new Date().toISOString();
  const endpoints = [
    BASE + '/api/order/v6/list/open?hideInsolvoOrders=false&sort=new',
    BASE + '/api/order/v6/list/open?hideInsolvoOrders=false',
  ];
  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint, { headers: HEADERS, timeout: 20000 });
      const data = res.data;
      if (data && data.result === 102) {
        console.error('Куки истекли! Обнови Cookie в скрипте.');
        process.exit(1);
      }
      const orders = [
        ...((data && data.data && data.data.interesting) || []),
        ...((data && data.data && data.data.other) || []),
        ...((data && data.data && data.data.new) || []),
        ...(Array.isArray(data && data.data) ? data.data : []),
      ];
      console.log('Получено заданий: ' + orders.length);
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
          url: 'https://work-zilla.com/tasks/' + order.id,
          referral_url: 'https://work-zilla.com/tasks/' + order.id,
          published_at: now,
        });
      }
      await new Promise(function(r) { setTimeout(r, 500); });
    } catch (err) {
      console.error('Ошибка: ' + err.message);
    }
  }
  return results;
}

async function sendToServer(projects) {
  const res = await axios.post(
    SITE_URL + '/api/cron/workzilla',
    { projects: projects },
    {
      headers: {
        'Authorization': 'Bearer ' + CRON_SECRET,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return res.data;
}

async function main() {
  console.log('[' + new Date().toLocaleTimeString() + '] Запуск парсера Workzilla...');
  const projects = await parseWorkzilla();
  console.log('Собрано: ' + projects.length + ' проектов');
  if (projects.length > 0) {
    const result = await sendToServer(projects);
    console.log('Добавлено новых: ' + result.added);
  }
}

main().catch(console.error);
