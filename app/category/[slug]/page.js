import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import styles from './category.module.css';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const CATEGORIES = {
  'web-development': {
    name: 'Веб-разработка',
    emoji: '🌐',
    description: 'Заказы на разработку сайтов, лендингов, интернет-магазинов, веб-приложений. Актуальные проекты с FL.ru, Kwork, Freelancer.com и других бирж.',
    keywords: 'веб разработка фриланс, заказы сайт, удалённая работа программист',
  },
  'design': {
    name: 'Дизайн',
    emoji: '🎨',
    description: 'Заказы на дизайн логотипов, баннеров, UI/UX, брендинг. Все актуальные проекты для дизайнеров в одном месте.',
    keywords: 'дизайн фриланс заказы, логотип удалённо, UI UX дизайнер',
  },
  'mobile': {
    name: 'Мобильная разработка',
    emoji: '📱',
    description: 'Заказы на разработку мобильных приложений iOS и Android, Flutter, React Native. Актуальные проекты для мобильных разработчиков.',
    keywords: 'мобильная разработка заказы, iOS Android фриланс, приложение удалённо',
  },
  'writing': {
    name: 'Копирайтинг и тексты',
    emoji: '✍️',
    description: 'Заказы на написание текстов, статей, копирайтинг, переводы. Все проекты для копирайтеров и авторов.',
    keywords: 'копирайтинг заказы, написание текстов удалённо, статьи фриланс',
  },
  'marketing': {
    name: 'Маркетинг и реклама',
    emoji: '📣',
    description: 'Заказы на SEO, SMM, контекстную рекламу, таргет. Актуальные проекты для маркетологов.',
    keywords: 'маркетинг фриланс заказы, SMM удалённо, SEO реклама',
  },
  'backend': {
    name: 'Backend разработка',
    emoji: '⚙️',
    description: 'Заказы на серверную разработку, API, базы данных, Python, PHP, Node.js. Проекты для backend-разработчиков.',
    keywords: 'backend разработка заказы, API фриланс, Python PHP удалённо',
  },
  'data': {
    name: 'Данные и аналитика',
    emoji: '📊',
    description: 'Заказы на анализ данных, парсинг, Excel, 1С, Python. Актуальные проекты для аналитиков.',
    keywords: 'аналитика данные фриланс, парсинг заказы, Excel 1С удалённо',
  },
};

const SLUG_TO_CATEGORY = {
  'web-development': 'Web Development',
  'design': 'Design',
  'mobile': 'Mobile',
  'writing': 'Writing',
  'marketing': 'Marketing',
  'backend': 'Backend',
  'data': 'Data',
};

export async function generateMetadata({ params }) {
  const cat = CATEGORIES[params.slug];
  if (!cat) return { title: 'Не найдено' };
  return {
    title: `${cat.name} — фриланс заказы | FreelanceHere`,
    description: cat.description,
    keywords: cat.keywords,
  };
}

export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map(slug => ({ slug }));
}

export default async function CategoryPage({ params }) {
  const cat = CATEGORIES[params.slug];
  if (!cat) notFound();

  const dbCategory = SLUG_TO_CATEGORY[params.slug];
  const db = supabaseAdmin();

  const { data: projects, count } = await db
    .from('projects')
    .select('*', { count: 'exact' })
    .eq('category', dbCategory)
    .order('created_at', { ascending: false })
    .limit(50);

  const SOURCE_NAMES = {
    freelancer: 'Freelancer.com', fl: 'FL.ru',
    kwork: 'Kwork', workzilla: 'Workzilla', freelanceru: 'Freelance.ru',
  };

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.hero}>
          <span className={styles.emoji}>{cat.emoji}</span>
          <h1 className={styles.title}>{cat.name}</h1>
          <p className={styles.desc}>{cat.description}</p>
          <div className={styles.stats}>
            <span>📋 {count || 0} актуальных заказов</span>
            <span>⚡ Обновляется каждую минуту</span>
          </div>
        </div>

        {/* Навигация по категориям */}
        <div className={styles.catNav}>
          {Object.entries(CATEGORIES).map(([slug, c]) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className={`${styles.catLink} ${slug === params.slug ? styles.catLinkActive : ''}`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>

        {/* Список проектов */}
        <div className={styles.list}>
          {(projects || []).map(p => (
            <Link key={p.id} href={`/projects/${p.id}`} className={styles.item}>
              <div className={styles.itemTop}>
                <span className={styles.source}>{SOURCE_NAMES[p.source] || p.source}</span>
                <span className={styles.date}>
                  {p.published_at
                    ? format(new Date(p.published_at), 'd MMM', { locale: ru })
                    : format(new Date(p.created_at), 'd MMM', { locale: ru })}
                </span>
              </div>
              <h2 className={styles.itemTitle}>{p.title}</h2>
              {p.description && (
                <p className={styles.itemDesc}>{p.description.slice(0, 120)}...</p>
              )}
              {p.budget_min && (
                <span className={styles.budget}>
                  от {p.budget_min.toLocaleString('ru')} {p.currency === 'USD' ? '$' : '₽'}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* CTA для незарегиненных */}
        <div className={styles.cta}>
          <h2>Хочешь видеть все заказы первым?</h2>
          <p>Подключи уведомления в Telegram — новые проекты по {cat.name.toLowerCase()} приходят сразу как появляются</p>
          <a href="/register" className={styles.ctaBtn}>
            Попробовать 7 дней бесплатно
          </a>
        </div>
      </div>
    </div>
  );
}
