import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'ru-RU,ru;q=0.9',
  },
});

// Актуальные RSS-ленты Habr Freelance (проверено 2024-2025)
const HABR_FEEDS = [
  'https://freelance.habr.com/tasks.rss',
  'https://freelance.habr.com/tasks.rss?q=&categories=develop',
  'https://freelance.habr.com/tasks.rss?q=&categories=design',
  'https://freelance.habr.com/tasks.rss?q=&categories=testing',
  'https://freelance.habr.com/tasks.rss?q=&categories=admin',
  'https://freelance.habr.com/tasks.rss?q=javascript',
  'https://freelance.habr.com/tasks.rss?q=python',
  'https://freelance.habr.com/tasks.rss?q=react',
];

export async function parseHabr() {
  const results = [];
  const seen = new Set();

  for (const feedUrl of HABR_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items || []) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);

        const content = item.contentSnippet || item.content || item['content:encoded'] || '';

        // Ищем бюджет в тексте
        const budgetMatch = content.match(/([\d\s]+)\s*(руб|₽|\$|USD|EUR)/i);
        let budget = null;
        let currency = 'RUB';
        if (budgetMatch) {
          budget = parseFloat(budgetMatch[1].replace(/\s/g, ''));
          if (/\$|USD/i.test(budgetMatch[2])) currency = 'USD';
          if (/EUR/i.test(budgetMatch[2])) currency = 'EUR';
        }

        const externalId =
          item.link.match(/\/tasks\/(\d+)/)?.[1] ||
          item.link.match(/\/(\d+)\/?(?:\?|$)/)?.[1] ||
          item.guid || item.link;

        results.push({
          external_id: externalId,
          source: 'habr',
          title: item.title?.trim() || 'Без названия',
          description: cleanText(content).slice(0, 500),
          budget_min: budget,
          budget_max: null,
          currency,
          category: detectCategory(item.title + ' ' + content),
          tags: Array.isArray(item.categories) ? item.categories : [],
          url: item.link,
          referral_url: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[Habr] Ошибка ${feedUrl}:`, err.message);
    }
  }

  console.log(`[Habr] Собрано: ${results.length}`);
  return results;
}

function cleanText(str) {
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|angular|next|node|html|css|javascript|typescript|php|wordpress|bitrix/i,
    'Mobile': /мобильн|ios|android|flutter|react native|swift|kotlin/i,
    'Design': /дизайн|figma|логотип|ui|ux|баннер|иллюстра|photoshop/i,
    'Writing': /текст|копирайт|статья|контент|перевод|редактур/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен|таргет/i,
    'Data': /данные|python|аналитик|1с|ml|машинн|нейросет/i,
    'Backend': /backend|api|сервер|база данных|sql|postgresql|mongodb/i,
    'DevOps': /devops|docker|kubernetes|aws|nginx|linux|сервер/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
