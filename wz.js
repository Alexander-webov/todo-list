const https = require('https');
const zlib = require('zlib');

const SITE_URL = 'www.allfreelancershere.ru';
const CRON_SECRET = 'mysecret123';

const COOKIE = '_ym_uid=1741436381598801764; _ym_d=1774178992; .AspNetCore.Session=CfDJ8GXnG5FKXyFAiCIA2uzB089sqhCDpDgwyKdSU5Aef6aHnL4DNvmyKi3MBHiA0FCeFNOET3s3kw5t1q35lZpOGIvYHGzNE%2Bx6190g%2Br0%2FF48h559qcIvrT4yZm7EIqqI17ONm45EQZD9WA1wvoFugI7K20NCjBdMQvQei59w%2FRqRi; __stripe_mid=a69e991b-483a-4cd6-b91f-19e28c463ef4933bb8; CookieUsage=Allowed; BrowserId=eda2f685-305d-4e83-bd12-72102081cce1; adrdel=1774213471761; adrcid=At5rQSmCF_bdLcJguf295Pg; acs_3=%7B%22hash%22%3A%221aa3f9523ee6c2690cb34fc702d4143056487c0d%22%2C%22nst%22%3A1774299871771%2C%22sl%22%3A%7B%22224%22%3A1774213471771%2C%221228%22%3A1774213471771%7D%7D; __ai_fp_uuid=b5e51eacbb9201de%3A1; __upin=eEsdfoBMoKvVDC69C86wSw; ma_id_api=Hi1xSzr06r1UdCMc5E5FP72ZRa9NkaiJ3GzFv5tFJTNsC2+/FLhu5wiH7z66M9vwwvVRqIlYmH/YDEOEWUTCSOMG2Q+Gl9GW1vLE31w9ucABwBQYr9JyivL/4pHOVBwyT0JGwdkdHQrvMFyEILzM9FXe5E1elJ5zk0HdDghtSWg/qFipHYzBNXF7XkZex/WVw/RYfCSng8MCq/frfBQF/1hXN4WTAsFoNO0d9F/KlmxxpS/NVbEj370tBfL7B4CNeePIotJMmykxFt4nD3Fr539c3QvxRRZm5OB/8eWZ8Zlys7M9Jm8zOOKTkdeiVhZTp531Sb0jsTmR2Dawy7hylQ==; ma_id=9066360831774213479620; _buzz_aidata=JTdCJTIydWZwJTIyJTNBJTIyZUVzZGZvQk1vS3ZWREM2OUM4NndTdyUyMiUyQyUyMmJyb3dzZXJWZXJzaW9uJTIyJTNBJTIyMjUuMTIlMjIlMkMlMjJ0c0NyZWF0ZWQlMjIlM0ExNzc0MjEzNDgwNjM4JTdE; _buzz_mtsa=JTdCJTIydWZwJTIyJTNBJTIyNTRiOGIwMDQxZTE5ODMwZmMxYjI2MTFlMTFiOGE2NTglMjIlMkMlMjJicm93c2VyVmVyc2lvbiUyMiUzQSUyMjI1LjEyJTIyJTJDJTIydHNDcmVhdGVkJTIyJTNBMTc3NDIxMzQ4MTI1OSU3RA==; lang=ru; _ym_isad=2; tempDataId=0Sf0UX5k9A; _ym_visorc=w; __stripe_sid=55f3471c-b57e-47c8-b363-ee8cbe0ee9719d22b2; Bearer=CfDJ8DXTkTGM9KxPmms_uf9OtUVthydKirazOpieEFvAflrBDkrnTEkv2kyHlXDJKiUKee3dql-sM4jsqpK3hg-a2e2TrhDWk1w4bQeaxSc0KKL5RmhH_D_DWMU3HYxKooJ2w9TnAM1NG4v9foqNkPPecTf4CYR4p_rcjHAs658KZxEhLmtJwe1jWO0MMG9_OjSNA6OBLR7ENjPUxcgLwu55dksojDmm-o8FzNpvsZaN2LoF_-XdXiVy4giYcPDgrj6dBjfjcIPqveLu46P-bhEPf7c4moEVGickeYabT2q0kRHnDjJl1-ArDir6FOpkhL7AJmekBMw_ASpan7_KLUEckYAWPD58-5645SSfffjcXShwuGpuTljb956JmpAF7VF7JMuOzl9vn0Eew-o668f6QqmCV15UOHRvV-6s1010C0PqTexjLnne-lO_8LsaYlfhZUUMu6CGluOT_zZQNc_wg7OrzicyKariwO4ouLiALhYlRMGIZwm0WFaqXtxm2T_jM_hj3EKMjcReo9pEFKlNXy-rTuySd21TXTM7LCC2JNeFJ0iSYoEzsbCcf1uR4CBNe5TUXv2XSMahfhuu0Syn-BRz7TwcB5Q8Vgrv-busj3CpWOoDV2--f4w2lM3hNR2lKq0LdA0bRyqcxHMwMkpHSF_KLcpjDVFs853j4cXDUj-ze5pJWREFa7UQuiw09gY_dtRNOioqnLuZf2gXOGFzZr2DsTV2sU0F4ltqtTh_SpUYK15e830OoeK6B12GVmE4nLvLUr5WbTA4fpWbJG8co8dnt9Pz80GTs_cGUiNYOjh47DH5Q2sx5EQHthMp51RRJsWkRpgrcLivePCjPhWD0kE';

const HEADERS = {
  'accept': '*/*',
  'accept-encoding': 'gzip, deflate',
  'accept-language': 'ru,en;q=0.9',
  'agentid': 'fp21-80a15a2039080e8f0283a9b4fb6c8d09',
  'cache-control': 'no-cache',
  'cookie': COOKIE,
  'pragma': 'no-cache',
  'referer': 'https://client.work-zilla.com/freelancer',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 YaBrowser/26.3.0.0 Safari/537.36',
};

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'client.work-zilla.com',
      port: 443,
      path: path,
      method: 'GET',
      headers: HEADERS,
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        const parse = (b) => {
          try { return JSON.parse(b.toString('utf8')); }
          catch (e) { return b.toString('utf8'); }
        };
        if (encoding === 'gzip') {
          zlib.gunzip(buf, (err, d) => err ? reject(err) : resolve(parse(d)));
        } else if (encoding === 'br') {
          zlib.brotliDecompress(buf, (err, d) => err ? reject(err) : resolve(parse(d)));
        } else if (encoding === 'deflate') {
          zlib.inflate(buf, (err, d) => err ? reject(err) : resolve(parse(d)));
        } else {
          resolve(parse(buf));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: SITE_URL,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': 'Bearer ' + CRON_SECRET,
      },
    };
    const req = https.request(options, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(resp)); }
        catch (e) { resolve(resp); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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

async function main() {
  console.log('[' + new Date().toLocaleTimeString() + '] Запрос к Workzilla...');

  const data = await httpGet('/api/order/v6/list/open?hideInsolvoOrders=false');

  if (typeof data === 'string') {
    console.log('Ошибка:', data.slice(0, 300));
    return;
  }

  console.log('result:', data.result);

  if (data.result === 102) {
    console.log('Сессия истекла — обнови куки');
    return;
  }

  const orders = [
    ...((data.data && data.data.interesting) || []),
    ...((data.data && data.data.other) || []),
    ...((data.data && data.data.new) || []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  console.log('Заданий найдено:', orders.length);

  if (orders.length === 0) {
    console.log('Нет новых заданий');
    return;
  }

  const now = new Date().toISOString();
  const projects = orders.map(o => ({
    external_id: String(o.id),
    source: 'workzilla',
    title: (o.subject || '').trim(),
    description: (o.description || '').slice(0, 500),
    budget_min: o.price || null,
    budget_max: null,
    currency: 'RUB',
    category: detectCategory((o.subject || '') + ' ' + (o.description || '')),
    tags: [],
    url: 'https://work-zilla.com/tasks/' + o.id,
    referral_url: 'https://work-zilla.com/tasks/' + o.id,
    published_at: now,
  }));

  console.log('Отправляем ' + projects.length + ' проектов на сервер...');
  const result = await httpPost('/api/cron/workzilla', { projects });
  console.log('Ответ сервера:', JSON.stringify(result));
  if (result && result.added !== undefined) {
    console.log('Добавлено новых:', result.added);
  }
}

main().catch(console.error);
