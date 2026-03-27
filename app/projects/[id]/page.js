import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import styles from './project.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export async function generateMetadata({ params }) {
  const db = supabaseAdmin();
  const { data } = await db.from('projects').select('title, description').eq('id', params.id).single();
  if (!data) return { title: 'Проект не найден' };
  return {
    title: `${data.title} — FreelanceHub`,
    description: data.description?.slice(0, 160),
  };
}

const SOURCE_NAMES = {
  freelancer: 'Freelancer.com', fl: 'FL.ru',
  kwork: 'Kwork', workzilla: 'Workzilla', freelanceru: 'Freelance.ru',
};

export default async function ProjectPage({ params }) {
  const db = supabaseAdmin();
  const { data: project } = await db
    .from('projects').select('*').eq('id', params.id).single();

  if (!project) notFound();

  const url = project.referral_url || project.url;
  const source = SOURCE_NAMES[project.source] || project.source;

  return (
    <div className={styles.page}>
      <a href="/" className={styles.back}>← Все проекты</a>

      <div className={styles.card}>
        <div className={styles.meta}>
          <span className={styles.source}>{source}</span>
          {project.category && <span className={styles.category}>{project.category}</span>}
          {project.published_at && (
            <span className={styles.date}>
              {format(new Date(project.published_at), 'd MMMM yyyy', { locale: ru })}
            </span>
          )}
        </div>

        <h1 className={styles.title}>{project.title}</h1>

        {project.budget_min && (
          <div className={styles.budget}>
            💰 {project.budget_min.toLocaleString('ru')} {project.currency === 'USD' ? '$' : '₽'}
            {project.budget_max && ` — ${project.budget_max.toLocaleString('ru')} ${project.currency === 'USD' ? '$' : '₽'}`}
          </div>
        )}

        {project.description && (
          <div className={styles.description}>
            <h2 className={styles.descTitle}>Описание</h2>
            <p>{project.description}</p>
          </div>
        )}

        {project.tags?.length > 0 && (
          <div className={styles.tags}>
            {project.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        <a href={url} target="_blank" rel="noopener noreferrer" className={styles.cta}>
          Перейти к проекту на {source} →
        </a>
      </div>

      {/* Блок для незарегиненных */}
      <div className={styles.promo}>
        <p>📬 Хочешь получать такие проекты первым?</p>
        <a href="/register" className={styles.promoBtn}>Попробовать 3 дня бесплатно</a>
      </div>
    </div>
  );
}
