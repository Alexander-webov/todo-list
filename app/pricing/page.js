'use client';
import styles from './pricing.module.css';

export default function PricingPage() {
  return (
    <div className={styles.page}>
      <a href="/" className={styles.back}>← Назад</a>

      <div className={styles.hero}>
        <span className={styles.badge}>🎉 Бесплатно</span>
        <h1 className={styles.title}>Полный доступ — бесплатно!</h1>
        <p className={styles.sub}>Все функции доступны каждому. Без ограничений, без подписок.</p>
      </div>

      <div className={styles.features}>
        {[
          { icon: '🚀', text: 'Все проекты без ограничений' },
          { icon: '🔔', text: 'Уведомления в Telegram' },
          { icon: '✦', text: 'AI-генерация откликов (СКОРО)' },
          { icon: '🔍', text: 'Поиск и фильтры по биржам' },
          { icon: '📊', text: 'Категории и процент совпадения' },
          { icon: '⚡', text: 'Обновление каждую минуту' },
        ].map(f => (
          <div key={f.text} className={styles.feature}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <div className={styles.plans}>
        <div className={`${styles.plan} ${styles.planHighlight}`}>
          <div className={styles.planHeader}>
            <span className={styles.planFlag}>✅</span>
            <div>
              <p className={styles.planName}>Полный доступ</p>
              <p className={styles.planDesc}>Все функции · Без ограничений</p>
            </div>
          </div>
          <div className={styles.planPrice}>
            <span className={styles.price}>0</span>
            <span className={styles.currency}>₽</span>
          </div>
          <a href="/register" className={styles.payBtn} style={{ textAlign: 'center', textDecoration: 'none' }}>
            Зарегистрироваться бесплатно
          </a>
        </div>
      </div>

      <p className={styles.note}>
        Регистрация занимает 30 секунд. Подключи Telegram — и получай заказы моментально.
      </p>
    </div>
  );
}
