'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Sidebar.module.css';
import { ArticleOfDay } from './ArticleOfDay';

const RU_SOURCES = [
  { key: 'fl',          label: 'FL.ru',          color: '#ff6600' },
  { key: 'kwork',       label: 'Kwork',          color: '#ff4d00' },
  { key: 'freelanceru', label: 'Freelance.ru',   color: '#2ecc71' },
  { key: 'workzilla',   label: 'Workzilla',      color: '#1a7ae0' },
  { key: 'youdo',       label: 'Youdo',          color: '#f5a623' },
];

const INT_SOURCES = [
  { key: 'upwork',        label: 'Upwork',          color: '#14a800' },
  { key: 'freelancer',    label: 'Freelancer.com',  color: '#29b2fe' },
  { key: 'peopleperhour', label: 'PeoplePerHour',   color: '#f7931a' },
  { key: 'guru',          label: 'Guru.com',        color: '#5b3cc4' },
];

const CATEGORIES = [
  'WordPress / Tilda / CMS', 'Видеомонтаж', 'Графический дизайн',
  'Web дизайн', 'SMM', 'Парсинг', 'Вёрстка',
  'FrontEnd', 'BackEnd', 'Другое',
];

export function Sidebar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSource   = params.get('source')   || '';
  const activeCategory = params.get('category') || '';
  const region         = params.get('region')   || 'ru';
  const [counts, setCounts] = useState({});

  useEffect(() => {
    fetch('/api/stats/categories')
      .then(r => r.json())
      .then(setCounts)
      .catch(() => {});
  }, []);

  function setFilter(key, value) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  function resetAll() {
    const next = new URLSearchParams();
    next.set('region', region);
    router.push(`/?${next.toString()}`);
  }

  const hasFilters = activeSource || activeCategory;
  const sources = region === 'int' ? INT_SOURCES : RU_SOURCES;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>
          {region === 'int' ? '🌐 Зарубежные биржи' : '🇷🇺 Российские биржи'}
        </p>
        <div className={styles.filterList}>
          {sources.map((s) => (
            <button key={s.key}
              className={`${styles.filterBtn} ${activeSource === s.key ? styles.active : ''}`}
              onClick={() => setFilter('source', s.key)}>
              <span className={styles.filterDot} style={{ background: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Категории</p>
        <div className={styles.filterList}>
          {CATEGORIES.map((cat) => (
            <button key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.active : ''}`}
              onClick={() => setFilter('category', cat)}>
              <span className={styles.catName}>{cat}</span>
              {counts[cat] !== undefined && (
                <span className={styles.catCount}>{counts[cat]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {hasFilters && (
        <button className={styles.resetBtn} onClick={resetAll}>✕ Сбросить фильтры</button>
      )}
      <ArticleOfDay />
    </aside>
  );
}
