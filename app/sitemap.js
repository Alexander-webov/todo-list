import { supabaseAdmin } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://allfreelancershere.ru';

const CATEGORY_SLUGS = ['web-development','design','mobile','writing','marketing','backend','data'];
const SOURCE_SLUGS = ['fl-ru','kwork','freelancer','workzilla','freelanceru'];
const BLOG_SLUGS = [
  'kak-najti-zakazy-na-freelanse',
  'kak-napisat-otklik-na-freelanse',
  'luchshie-frilansy-birzhi-rossii',
  'skolko-zarabatyvaet-frilanser',
  'kak-nachat-frilansat-s-nulya',
  'pochemu-frilanser-ne-nahodit-zakazov',
];

export default async function sitemap() {
  const db = supabaseAdmin();
  const { data: projects } = await db
    .from('projects').select('id, created_at')
    .order('created_at', { ascending: false }).limit(1000);

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/partners`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    ...CATEGORY_SLUGS.map(slug => ({ url: `${SITE_URL}/category/${slug}`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 })),
    ...SOURCE_SLUGS.map(slug => ({ url: `${SITE_URL}/source/${slug}`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 })),
    ...BLOG_SLUGS.map(slug => ({ url: `${SITE_URL}/blog/${slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 })),
    ...(projects || []).map(p => ({ url: `${SITE_URL}/projects/${p.id}`, lastModified: new Date(p.created_at), changeFrequency: 'daily', priority: 0.6 })),
  ];
}
