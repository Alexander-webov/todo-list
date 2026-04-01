'use client';
import { useState, useEffect } from 'react';
import styles from './HeroBlock.module.css';

const STATS = [
  { label: 'проектов за 24 часа', value: '3 000+' },
  { label: 'бирж в одном месте', value: '6' },
  { label: 'обновление', value: 'каждую минуту' },
];

const FEATURES = [
  { icon: '🔥', text: '4400+ ПРОЕКТОВ каждый день. Все ТОП сервисы тут!' },
  { icon: '🔔', text: 'Уведомления в Telegram. Легко подключить - всегда есть доступ!' },
  { icon: '✦', text: 'AI генерирует отклик за тебя — просто нажми кнопку!' },
  { icon: '⚡', text: 'Сервис дает возможность быть ПЕРВЫМ! У конкурентов нет шанса' },
];

export function HeroBlock({ isLoggedIn }) {
  const [count, setCount] = useState(3031);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + Math.floor(Math.random() * 3));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  if (isLoggedIn) return null;

  return (
    <div className={styles.hero}>
      <div className={styles.badge}>
        <span className={styles.dot} />
        <span>Обновляется прямо сейчас</span>
      </div>

      <h1 className={styles.title}>
        Все фриланс-заказы<br />
        <span className={styles.accent}>в одном месте</span>
      </h1>

      <p className={styles.sub}>
        Удобный интерфейс позволяет видит заказы с ТОПОВЫХ фриланс бирж в реальном времени. Пока кто-то нажимаю кнопку обновить и бегают по вкладкам, ты видишь заказ здесь и сейчас, ТЫ ПЕРВЫЙ!   <br />
        AI отклик дает тебе супер скорость. <strong>Тебя заметят.</strong>
      </p>

      <div className={styles.features}>
        {FEATURES.map((f, i) => (
          <div key={i} className={styles.feature}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <div className={styles.ctas}>
        <a href="/register" className={styles.ctaPrimary}>
          🎁 Попробовать 3 дня бесплатно
        </a>
        <a href="/pricing" className={styles.ctaSecondary}>
          Смотреть тарифы →
        </a>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{count.toLocaleString('ru')}</span>
          <span className={styles.statLabel}>проектов за 24 часа</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>6 топовых</span>
          <span className={styles.statLabel}>бирж одновременно</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>1 мин</span>
          <span className={styles.statLabel}>интервал обновления</span>
        </div>
      </div>

      <p className={styles.proof}>
        Уже используют фрилансеры из России и СНГ · Без карты · Отмена в любой момент
      </p>
    </div>
  );
}
