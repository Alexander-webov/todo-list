import axios from 'axios';

const BASE_URL = 'https://www.freelancer.com/api/projects/0.1/projects/active/';

export async function parseFreelancer() {
  const results = [];
  const seen = new Set();

  const requests = [
    { limit: 50, sort_field: 'time_updated' },
    { limit: 50, sort_field: 'time_updated', offset: 50 },
    { limit: 50, sort_field: 'time_updated', jobs: [3] },
    { limit: 50, sort_field: 'time_updated', jobs: [7] },
    { limit: 50, sort_field: 'time_updated', jobs: [2] },
  ];

  for (const params of requests) {
    try {
      const response = await axios.get(BASE_URL, {
        params: { ...params, full_description: 1, job_details: 1, user_details: 0 },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 15000,
      });

      const projects = response.data?.result?.projects || [];

      for (const p of projects) {
        if (!p.id || !p.title || seen.has(p.id)) continue;
        seen.add(p.id);

        const projectUrl = `https://www.freelancer.com/projects/${p.seo_url || p.id}`;
        results.push({
          external_id: String(p.id),
          source: 'freelancer',
          title: p.title.trim(),
          description: (p.preview_description || p.description || '').slice(0, 500),
          budget_min: p.budget?.minimum ?? null,
          budget_max: p.budget?.maximum ?? null,
          currency: p.currency?.sign || p.currency?.code || 'USD',
          category: p.jobs?.[0]?.name || 'Другое',
          tags: (p.jobs || []).map(j => j.name).filter(Boolean),
          url: projectUrl,
          referral_url: projectUrl,
          published_at: p.time_submitted
            ? new Date(p.time_submitted * 1000).toISOString()
            : new Date().toISOString(),
        });
      }

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error('[Freelancer] Ошибка:', err.message);
    }
  }

  console.log(`[Freelancer] Собрано: ${results.length}`);
  return results;
}
