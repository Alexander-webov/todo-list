import axios from 'axios';
import * as cheerio from 'cheerio';
import { detectCategory } from '../categories.js';

const BASE = 'https://www.guru.com';

// Only use working URLs — /d/jobs/ with pagination
const PAGES = [
  '/d/jobs/',
  '/d/jobs/pg/2/',
  '/d/jobs/pg/3/',
];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function parseGuru() {
  const results = [];
  const seen = new Set();

  for (const path of PAGES) {
    try {
      const { data: html } = await axios.get(`${BASE}${path}`, {
        headers: HEADERS,
        timeout: 15000,
      });

      const $ = cheerio.load(html);

      // Guru job links: /d/jobs/detail/{slug}-{id} or similar patterns
      $('a[href*="/d/jobs/"]').each((_, el) => {
        const $a = $(el);
        const href = $a.attr('href') || '';
        const title = $a.text().trim();

        // Skip pagination and category links — real job links have /detail/ or long slug
        if (!title || title.length < 10) return;
        if (href === '/d/jobs/' || href.match(/\/d\/jobs\/pg\//)) return;
        if (href.match(/\/d\/jobs\/q\//)) return;
        if (href.match(/\/d\/jobs\/skill\//)) return;
        if (href.match(/\/d\/jobs\/c\//)) return;

        const externalId = href.split('/').filter(Boolean).pop() || '';
        if (!externalId || seen.has(externalId)) return;
        seen.add(externalId);

        const url = href.startsWith('http') ? href : `${BASE}${href}`;

        const $parent = $a.closest('div, li, tr, article');
        const parentText = $parent.text() || '';
        const descText = parentText.replace(title, '').replace(/\s+/g, ' ').trim();
        const description = descText.slice(0, 500);

        const budgetMatch = parentText.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
        const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, '')) : null;

        results.push({
          external_id: String(externalId),
          source: 'guru',
          title,
          description,
          budget_min: budget,
          budget_max: null,
          currency: 'USD',
          category: detectCategory(title + ' ' + description),
          tags: [],
          url,
          referral_url: url,
          published_at: new Date().toISOString(),
        });
      });

      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.error(`[Guru] Ошибка ${path}:`, err.message);
    }
  }

  console.log(`[Guru] Собрано: ${results.length}`);
  return results;
}
