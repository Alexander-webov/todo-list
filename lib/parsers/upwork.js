import Parser from 'rss-parser';
import { detectCategory } from '../categories.js';const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
  },
});

const UPWORK_RSS_FEEDS = [
  'https://www.upwork.com/ab/feed/jobs/rss?q=web+developer&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=javascript&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=react&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=python&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=design&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=mobile+app&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=wordpress&sort=recency&paging=0%3B10',
  'https://www.upwork.com/ab/feed/jobs/rss?q=backend+developer&sort=recency&paging=0%3B10',
];

const REFERRAL = process.env.UPWORK_REFERRAL || '';

export async function parseUpwork() {
  const results = [];
  const seen = new Set();

  for (const feedUrl of UPWORK_RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items || []) {
        if (!item.link || seen.has(item.link)) continue;
        seen.add(item.link);

        const content = item.content || item.contentSnippet || item['content:encoded'] || '';

        let budgetMin = null, budgetMax = null;
        const fixedMatch = content.match(/Budget:\s*\$?([\d,]+)/i);
        const hourlyMatch = content.match(/Hourly Range:\s*\$?([\d.]+)[-–]\$?([\d.]+)/i);
        if (fixedMatch) {
          budgetMin = parseFloat(fixedMatch[1].replace(/,/g, ''));
        } else if (hourlyMatch) {
          budgetMin = parseFloat(hourlyMatch[1]);
          budgetMax = parseFloat(hourlyMatch[2]);
        }

        const category = detectCategory(item.title + ' ' + content + ' ' + (item.categories || []).join(' '));
        const externalId = item.link.match(/\/jobs\/~([a-z0-9]+)/i)?.[1]
          || item.link.split('/').filter(Boolean).pop()
          || item.guid;

        results.push({
          external_id: externalId,
          source: 'upwork',
          title: item.title?.trim() || 'Без названия',
          description: cleanText(content).slice(0, 500),
          budget_min: budgetMin,
          budget_max: budgetMax,
          currency: 'USD',
          category,
          tags: item.categories || [],
          url: item.link,
          referral_url: REFERRAL ? `${item.link}?ref=${REFERRAL}` : item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        });
      }

      await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error(`[Upwork] Ошибка ${feedUrl}:`, err.message);
    }
  }

  console.log(`[Upwork] Собрано: ${results.length}`);
  return results;
}

function cleanText(str) {
  return str
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}


