import styles from './StatsBar.module.css';

const SOURCES = {
  freelancer:  { name: 'Freelancer.com', color: '#29b2fe' },
  fl:          { name: 'FL.ru',          color: '#ff6600' },
  kwork:       { name: 'Kwork',          color: '#ff4d00' },
  freelanceru: { name: 'Freelance.ru',   color: '#2ecc71' },
  workzilla:   { name: 'Workzilla',      color: '#1a7ae0' },
  youdo:       { name: 'Youdo',          color: '#f5a623' },
};

export function StatsBar({ stats = {}, total = 0 }) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.totalBlock}>
          <span className={styles.totalNum}>{total.toLocaleString('ru')}</span>
          <span className={styles.totalLabel}>проектов в базе</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.sources}>
          {Object.entries(SOURCES).map(([key, { name, color }]) => (
            <div key={key} className={styles.sourceItem}>
              <span className={styles.dot} style={{ background: color }} />
              <span className={styles.sourceName}>{name}</span>
              <span className={styles.sourceCount}>{(stats[key] || 0).toLocaleString('ru')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
