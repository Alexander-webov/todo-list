import { supabaseAdmin } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { ProjectsFeed } from '@/components/ProjectsFeed';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { StatsBar } from '@/components/StatsBar';
import { RU_SOURCES } from '@/lib/parsers/index';

export const revalidate = 0;

export const metadata = {
  alternates: {
    canonical: 'https://www.allfreelancershere.ru',
  },
};

async function getInitialProjects() {
  const db = supabaseAdmin();
  const { data, count } = await db
    .from('projects')
    .select('*', { count: 'exact' })
    .in('source', RU_SOURCES)
    .order('created_at', { ascending: false })
    .limit(20);
  return { projects: data || [], total: count || 0 };
}

async function getStats() {
  const db = supabaseAdmin();
  const { count: total } = await db
    .from('projects').select('*', { count: 'exact', head: true });

  const sources = ['fl', 'kwork', 'freelanceru', 'youdo', 'upwork', 'freelancer', 'peopleperhour', 'guru'];
  const stats = {};
  await Promise.all(sources.map(async (source) => {
    const { count } = await db
      .from('projects').select('*', { count: 'exact', head: true }).eq('source', source);
    stats[source] = count || 0;
  }));
  return { stats, total: total || 0 };
}

export default async function HomePage() {
  const [{ projects, total: feedTotal }, { stats, total }, { profile }] = await Promise.all([
    getInitialProjects(),
    getStats(),
    getCurrentUser(),
  ]);

  return (
    <div className="app-shell">
      <Header />
      <StatsBar stats={stats} total={total} />
      <main className="main-layout">
        <Sidebar />
        <ProjectsFeed
          initialProjects={projects}
          total={feedTotal}
          isLoggedIn={!!profile}
          profile={profile}
        />
      </main>
    </div>
  );
}
