import { supabaseAdmin } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allfreelancershere.ru';

const CATEGORY_SLUGS = [
  'web-development', 'design', 'mobile',
  'writing', 'marketing', 'backend', 'data'
];

export default async function sitemap() {
  const db = supabaseAdmin();

  const { data: projects } = await db
    .from('projects')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  const projectUrls = (projects || []).map(p => ({
    url: `${SITE_URL}/projects/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const categoryUrls = CATEGORY_SLUGS.map(slug => ({
    url: `${SITE_URL}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...categoryUrls,
    ...projectUrls,
  ];
}
