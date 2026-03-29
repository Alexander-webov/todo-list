/**
 * Локальный парсер Workzilla
 * Запускай на своём компьютере каждые 5 минут через Task Scheduler
 * 
 * Установка:
 * npm install axios
 * 
 * Запуск:
 * node workzilla-local.js
 */

const axios = require('axios');

// ===== НАСТРОЙКИ =====
const SITE_URL = 'https://allfreelancershere.ru';
const CRON_SECRET = 'mysecret123'; // твой CRON_SECRET из .env
const COOKIE = process.env.WORKZILLA_COOKIE || `_ym_uid=1741436381598801764; _ym_d=1774178992; .AspNetCore.Session=CfDJ8GXnG5FKXyFAiCIA2uzB089sqhCDpDgwyKdSU5Aef6aHnL4DNvmyKi3MBHiA0FCeFNOET3s3kw5t1q35lZpOGIvYHGzNE%2Bx6190g%2Br0%2FF48h559qcIvrT4yZm7EIqqI17ONm45EQZD9WA1wvoFugI7K20NCjBdMQvQei59w%2FRqRi; __stripe_mid=a69e991b-483a-4cd6-b91f-19e28c463ef4933bb8; CookieUsage=Allowed; BrowserId=eda2f685-305d-4e83-bd12-72102081cce1; adrdel=1774213471761; adrcid=At5rQSmCF_bdLcJguf295Pg; acs_3=%7B%22hash%22%3A%221aa3f9523ee6c2690cb34fc702d4143056487c0d%22%2C%22nst%22%3A1774299871771%2C%22sl%22%3A%7B%22224%22%3A1774213471771%2C%221228%22%3A1774213471771%7D%7D; __ai_fp_uuid=b5e51eacbb9201de%3A1; __upin=eEsdfoBMoKvVDC69C86wSw; ma_id_api=Hi1xSzr06r1UdCMc5E5FP72ZRa9NkaiJ3GzFv5tFJTNsC2+/FLhu5wiH7z66M9vwwvVRqIlYmH/YDEOEWUTCSOMG2Q+Gl9GW1vLE31w9ucABwBQYr9JyivL/4pHOVBwyT0JGwdkdHQrvMFyEILzM9FXe5E1elJ5zk0HdDghtSWg/qFipHYzBNXF7XkZex/WVw/RYfCSng8MCq/frfBQF/1hXN4WTAsFoNO0d9F/KlmxxpS/NVbEj370tBfL7B4CNeePIotJMmykxFt4nD3Fr539c3QvxRRZm5OB/8eWZ8Zlys7M9Jm8zOOKTkdeiVhZTp531Sb0jsTmR2Dawy7hylQ==; ma_id=9066360831774213479620; _buzz_aidata=JTdCJTIydWZwJTIyJTNBJTIyZUVzZGZvQk1vS3ZWREM2OUM4NndTdyUyMiUyQyUyMmJyb3dzZXJWZXJzaW9uJTIyJTNBJTIyMjUuMTIlMjIlMkMlMjJ0c0NyZWF0ZWQlMjIlM0ExNzc0MjEzNDgwNjM4JTdE; _buzz_mtsa=JTdCJTIydWZwJTIyJTNBJTIyNTRiOGIwMDQxZTE5ODMwZmMxYjI2MTFlMTFiOGE2NTglMjIlMkMlMjJicm93c2VyVmVyc2lvbiUyMiUzQSUyMjI1LjEyJTIyJTJDJTIydHNDcmVhdGVkJTIyJTNBMTc3NDIxMzQ4MTI1OSU3RA==; lang=ru; _ym_isad=2; tempDataId=0Sf0UX5k9A; _ym_visorc=w; __stripe_sid=55f3471c-b57e-47c8-b363-ee8cbe0ee9719d22b2; Bearer=CfDJ8DXTkTGM9KxPmms_uf9OtUVthydKirazOpieEFvAflrBDkrnTEkv2kyHlXDJKiUKee3dql-sM4jsqpK3hg-a2e2TrhDWk1w4bQeaxSc0KKL5RmhH_D_DWMU3HYxKooJ2w9TnAM1NG4v9foqNkPPecTf4CYR4p_rcjHAs658KZxEhLmtJwe1jWO0MMG9_OjSNA6OBLR7ENjPUxcgLwu55dksojDmm-o8FzNpvsZaN2LoF_-XdXiVy4giYcPDgrj6dBjfjcIPqveLu46P-bhEPf7c4moEVGickeYabT2q0kRHnDjJl1-ArDir6FOpkhL7AJmekBMw_ASpan7_KLUEckYAWPD58-5645SSfffjcXShwuGpuTljb956JmpAF7VF7JMuOzl9vn0Eew-o668f6QqmCV15UOHRvV-6s1010C0PqTexjLnne-lO_8LsaYlfhZUUMu6CGluOT_zZQNc_wg7OrzicyKariwO4ouLiALhYlRMGIZwm0WFaqXtxm2T_jM_hj3EKMjcReo9pEFKlNXy-rTuySd21TXTM7LCC2JNeFJ0iSYoEzsbCcf1uR4CBNe5TUXv2XSMahfhuu0Syn-BRz7TwcB5Q8Vgrv-busj3CpWOoDV2--f4w2lM3hNR2lKq0LdA0bRyqcxHMwMkpHSF_KLcpjDVFs853j4cXDUj-ze5pJWREFa7UQuiw09gY_dtRNOioqnLuZf2gXOGFzZr2DsTV2sU0F4ltqtTh_SpUYK15e830OoeK6B12GVmE4nLvLUr5WbTA4fpWbJG8co8dnt9Pz80GTs_cGUiNYOjh47DH5Q2sx5EQHthMp51RRJsWkRpgrcLivePCjPhWD0kE`;
// ======================

const BASE = 'https://client.work-zilla.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 YaBrowser/25.12.0.0 Safari/537.36',
  'Accept': 'application/json, */*',
  'Accept-Language': 'ru,en;q=0.9',
  'Cookie': COOKIE,
  'Referer': 'https://client.work-zilla.com/freelancer',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
};

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|html|css|javascript|php|wordpress|bitrix|tilda/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|логотип|баннер|ui|ux|figma|фотошоп|иллюстра|презентац/i,
    'Writing': /текст|копирайт|статья|перевод|контент|редактур|рерайт/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен|таргет/i,
    'Data': /данные|python|аналитик|1с|excel|таблиц|парс/i,
    'Backend': /backend|api|сервер|sql|программист|разработ/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}

async function parseWorkzilla() {
  const results = [];
  const seen = new Set();
  const now = new Date().toISOString();

  const endpoints = [
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false&sort=new`,
    `${BASE}/api/order/v6/list/open?hideInsolvoOrders=false`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await axios.get(endpoint, { headers: HEADERS, timeout: 20000 });
      const data = res.data;

      if (data?.result === 102) {
        console.error('❌ Куки истекли! Обнови WORKZILLA_COOKIE');
        process.exit(1);
      }

      const orders = [
        ...(data?.data?.interesting || []),
        ...(data?.data?.other || []),
        ...(data?.data?.new || []),
        ...(Array.isArray(data?.data) ? data.data : []),
      ];

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

      console.log(`✓ ${endpoint.split('?')[0].split('/').pop()}: ${orders.length} заданий`);
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`✗ Ошибка: ${err.message}`);
    }
  }

  return results;
}

async function sendToServer(projects) {
  const res = await axios.post(
    `${SITE_URL}/api/cron/workzilla`,
    { projects },
    {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return res.data;
}

async function main() {
  console.log(`[${new Date().toLocaleTimeString()}] Запуск парсера Workzilla...`);

  const projects = await parseWorkzilla();
  console.log(`Собрано: ${projects.length} проектов`);

  if (projects.length > 0) {
    const result = await sendToServer(projects);
    console.log(`✅ Отправлено на сервер. Добавлено новых: ${result.added}`);
  } else {
    console.log('Новых проектов нет');
  }
}

main().catch(console.error);
