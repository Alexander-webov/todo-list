import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; FreelanceAggregator/1.0)',
    'Accept-Language': 'ru-RU,ru;q=0.9',
  },
});

const FL_RSS_FEEDS = [
  'https://www.fl.ru/rss/all.xml',
  'https://www.fl.ru/rss/all.xml?category=1',  // Web разработка
  'https://www.fl.ru/rss/all.xml?category=2',  // Дизайн
  'https://www.fl.ru/rss/all.xml?category=12', // Мобильные приложения
];

/**
 * Парсит FL.ru через RSS
 */
export async function parseFL() {
  const results = [];
  const seen = new Set();

  for (const feedUrl of FL_RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items || []) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);

        // FL.ru указывает бюджет в описании: "Бюджет: 5000 руб."
        const budgetMatch = item.contentSnippet?.match(/[Бб]юджет[:\s]+([0-9\s]+)\s*(руб|₽|\$|USD|EUR)?/);
        const budget = budgetMatch
          ? parseFloat(budgetMatch[1].replace(/\s/g, ''))
          : null;
        const currency = budgetMatch?.[2]?.includes('$') || budgetMatch?.[2]?.includes('USD')
          ? 'USD'
          : 'RUB';

        const externalId = item.link.match(/\/([^/]+)\/?$/)?.[1] || item.guid || item.link;

        results.push({
          external_id: externalId,
          source: 'fl',
          title: item.title?.trim() || 'Без названия',
          description: cleanText(item.contentSnippet || ''),
          budget_min: budget,
          budget_max: null,
          currency,
          category: detectCategory(item.title + ' ' + (item.contentSnippet || '')),
          tags: [],
          url: item.link,
          referral_url: item.link,
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[FL.ru] Ошибка парсинга ${feedUrl}:`, err.message);
    }
  }

  return results;
}

function cleanText(str) {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function detectCategory(text = '') {
  const categories = {
    'Web Development': /сайт|верстк|react|vue|angular|next|node|html|css|javascript|php|wordpress/i,
    'Mobile': /мобильн|ios|android|flutter|приложени/i,
    'Design': /дизайн|figma|логотип|ui|ux|баннер|иллюстра/i,
    'Writing': /текст|копирайт|статья|контент|перевод|seo-текст/i,
    'Marketing': /маркетинг|seo|реклам|smm|продвижен/i,
    'Data': /данные|python|аналитик|1с|бухгалтер/i,
    'Backend': /backend|api|сервер|база данных|sql|bitrix/i,
  };

  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'Другое';
}
