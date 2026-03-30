const https = require('https');
const zlib = require('zlib');

const SITE_URL = 'www.allfreelancershere.ru';
const CRON_SECRET = 'mysecret123';

const COOKIE = 'spid=1774214054094_7a5b3acbba9b96361d848f06c60b1019_7ai6jp9rn4wrikqn; yd_visitor_id=474e481a-daba-4ae4-aa57-715b450f07ba; _utm_ydmd=9866429773; ydo_uid=H6yABWnAW6YAtP/eQpkvAg==; _ym_uid=1774214057825591705; _ym_d=1774214057; mindboxDeviceUUID=3a235aa8-f14e-4649-90de-1448a02e02f7; directCrm-session=%7B%22deviceGuid%22%3A%223a235aa8-f14e-4649-90de-1448a02e02f7%22%7D; accessCookies=true; tmr_lvid=4c7180b15d7a55a7350475b38fed9e8a; tmr_lvidTS=1774264373624';

const REQUEST_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate',
  'Accept-Language': 'ru,en;q=0.9',
  'Content-Type': 'application/json',
  'Cookie': COOKIE,
  'Origin': 'https://youdo.com',
  'Referer': 'https://youdo.com/tasks-all-opened-all',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest',
  'x-featuresetid': '788',
};

const BODY = JSON.stringify({
  q: '', list: 'all', status: 'opened',
  radius: 50, lat: 55.755864, lng: 37.617698,
  page: 1, noOffers: false, onlyB2B: false,
  onlySbr: false, onlyVacancies: false, onlyVirtual: true,
  priceMin: '', sortType: 1,
  sub: [149, 152, 150, 61, 151, 153, 155, 154, 158, 255, 101, 148, 146, 62, 63, 244, 245, 147, 246, 108],
});

function request(method, hostname, path, body, headers) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname, port: 443, path, method,
      headers: body ? { ...headers, 'Content-Length': Buffer.byteLength(body) } : headers,
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const enc = res.headers['content-encoding'];
        const location = res.headers['location'];
        const cookies = res.headers['set-cookie'];
        const parse = b => { try { return JSON.parse(b.toString('utf8')); } catch { return b.toString('utf8'); } };

        if (enc === 'gzip') {
          zlib.gunzip(buf, (e, d) => e ? reject(e) : resolve({ status: res.statusCode, data: parse(d), location, cookies }));
        } else {
          resolve({ status: res.statusCode, data: parse(buf), location, cookies });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sendToServer(projects) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ projects });
    const opts = {
      hostname: SITE_URL, port: 443,
      path: '/api/cron/workzilla',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + CRON_SECRET,
      },
    };
    const req = https.request(opts, res => {
      let resp = '';
      res.on('data', c => resp += c);
      res.on('end', () => { try { resolve(JSON.parse(resp)); } catch { resolve(resp); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function detectCategory(text) {
  text = text || '';
  if (/сайт|верстк|react|vue|html|css|javascript|php|wordpress|битрикс/i.test(text)) return 'Web Development';
  if (/мобильн|ios|android|flutter/i.test(text)) return 'Mobile';
  if (/дизайн|логотип|баннер|ui|ux|figma/i.test(text)) return 'Design';
  if (/текст|копирайт|статья|перевод/i.test(text)) return 'Writing';
  if (/маркетинг|seo|реклам|smm/i.test(text)) return 'Marketing';
  if (/данные|python|аналитик|1с|excel/i.test(text)) return 'Data';
  if (/backend|api|сервер|sql/i.test(text)) return 'Backend';
  return 'Другое';
}

async function main() {
  console.log('[' + new Date().toLocaleTimeString() + '] Запрос к Youdo...');

  // Шаг 1 — POST запрос
  let res = await request('POST', 'youdo.com', '/api/tasks/tasks/', BODY, REQUEST_HEADERS);
  console.log('Шаг 1 status:', res.status, 'location:', res.location || '-');

  // Шаг 2 — если редирект, следуем
  if ((res.status === 307 || res.status === 302 || res.status === 301) && res.location) {
    const url = new URL(res.location, 'https://youdo.com');
    // Обновляем куки если есть новые
    let cookie = COOKIE;
    if (res.cookies) {
      const newCookies = res.cookies.map(c => c.split(';')[0]).join('; ');
      cookie = COOKIE + '; ' + newCookies;
    }
    const headers = { ...REQUEST_HEADERS, Cookie: cookie };
    console.log('Следуем редиректу:', url.pathname);
    res = await request('POST', url.hostname, url.pathname + url.search, BODY, headers);
    console.log('Шаг 2 status:', res.status);
  }

  if (typeof res.data === 'string') {
    console.log('Ответ (строка):', res.data.slice(0, 300));
    return;
  }

  const tasks = res.data?.ResultObject?.Items || res.data?.tasks || res.data?.items || [];
  console.log('Заданий:', tasks.length);
  if (tasks.length === 0) {
    console.log('Полный ответ:', JSON.stringify(res.data).slice(0, 400));
    return;
  }

  const now = new Date().toISOString();
  const projects = tasks.map(t => ({
    external_id: String(t.Id || t.id),
    source: 'youdo',
    title: (t.Name || t.title || '').trim(),
    description: (t.Description || t.description || '').slice(0, 500),
    budget_min: t.PriceAmount || t.price || null,
    budget_max: null,
    currency: 'RUB',
    category: detectCategory((t.Name || '') + ' ' + (t.Description || '')),
    tags: [],
    url: t.Url ? 'https://youdo.com' + t.Url : 'https://youdo.com/t' + (t.Id || t.id),
    referral_url: t.Url ? 'https://youdo.com' + t.Url : 'https://youdo.com/t' + (t.Id || t.id),
    published_at: now,
  }));

  console.log('Отправляем', projects.length, 'проектов...');
  const result = await sendToServer(projects);
  console.log('Ответ:', JSON.stringify(result));
}

main().catch(console.error);
