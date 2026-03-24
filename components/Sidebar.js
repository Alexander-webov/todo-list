'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './Sidebar.module.css';

const SOURCES = [
  { key: 'freelancer', label: 'Freelancer.com', color: '#29b2fe' },
  { key: 'fl',         label: 'FL.ru',          color: '#ff6600' },
  { key: 'kwork',      label: 'Kwork',          color: '#ff4d00' },
  { key: 'freelanceru', label: 'Freelance.ru',   color: '#2ecc71' },
  { key: 'workzilla',  label: 'Workzilla',      color: '#1a7ae0' },
];

const CATEGORIES = [
  'Web Development', 'Mobile', 'Design', 'Writing',
  'Marketing', 'Data', 'Backend', 'Другое',
];

export function Sidebar() {
  const router = useRouter();
  const params = useSearchParams();
  const activeSource   = params.get('source')   || '';
  const activeCategory = params.get('category') || '';

  function setFilter(key, value) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    router.push(`/?${next.toString()}`);
  }

  function resetAll() { router.push('/'); }

  const hasFilters = activeSource || activeCategory;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Биржи</p>
        <div className={styles.filterList}>
          {SOURCES.map((s) => (
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
              {cat}
            </button>
          ))}
        </div>
      </div>
      {hasFilters && (
        <button className={styles.resetBtn} onClick={resetAll}>✕ Сбросить фильтры</button>
      )}
    </aside>
  );
}
