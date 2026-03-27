import { supabaseAdmin } from '@/lib/supabase';

export default async function sitemap() {
  const db = supabaseAdmin();

  const { data: projects } = await db
    .from('projects')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000); // Google лучше переваривает порциями

  const projectUrls = (projects || []).map(p => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/projects/${p.id}`,
    lastModified: new Date(p.created_at),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  return [
    {
      url: process.env.NEXT_PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/partners`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...projectUrls,
  ];
}
