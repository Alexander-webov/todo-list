'use client';
import { useState } from 'react';
import styles from './pricing.module.css';

export default function PricingPage() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  async function pay(provider) {
    setLoading(provider);
    setError('');
    try {
      const res = await fetch(`/api/payment/${provider}/create`, { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Ошибка создания платежа');
        setLoading(null);
      }
    } catch {
      setError('Ошибка соединения');
      setLoading(null);
    }
  }

  return (
    <div className={styles.page}>
      <a href="/" className={styles.back}>← Назад</a>

      <div className={styles.hero}>
        <span className={styles.badge}>⚡ Премиум</span>
        <h1 className={styles.title}>Доступ ко всем проектам</h1>
        <p className={styles.sub}>Тысячи новых проектов каждый день с 5 фриланс-бирж в одном месте</p>
      </div>

      <div className={styles.features}>
        {[
          { icon: '🚀', text: 'Все проекты без ограничений' },
          { icon: '🔔', text: 'Уведомления в Telegram' },
          { icon: '✦', text: 'AI-генерация откликов' },
          { icon: '🔍', text: 'Поиск и фильтры по биржам' },
        ].map(f => (
          <div key={f.text} className={styles.feature}>
            <span className={styles.featureIcon}>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <div className={styles.plans}>
        {/* YooKassa — для РФ */}
        <div className={styles.plan}>
          <div className={styles.planHeader}>
            <span className={styles.planFlag}>🇷🇺</span>
            <div>
              <p className={styles.planName}>Российская карта</p>
              <p className={styles.planDesc}>Visa, Mastercard, Мир · ЮKassa</p>
            </div>
          </div>
          <div className={styles.planPrice}>
            <span className={styles.price}>299</span>
            <span className={styles.currency}>₽/мес</span>
          </div>
          <button
            className={styles.payBtn}
            onClick={() => pay('yookassa')}
            disabled={!!loading}
          >
            {loading === 'yookassa' ? 'Переход...' : 'Оплатить через ЮKassa'}
          </button>
        </div>

        {/* Stripe — международные */}
        <div className={`${styles.plan} ${styles.planHighlight}`}>
          <div className={styles.planHeader}>
            <span className={styles.planFlag}>🌍</span>
            <div>
              <p className={styles.planName}>Международная карта</p>
              <p className={styles.planDesc}>Visa, Mastercard · Stripe</p>
            </div>
          </div>
          <div className={styles.planPrice}>
            <span className={styles.price}>$5</span>
            <span className={styles.currency}>/мес</span>
          </div>
          <button
            className={`${styles.payBtn} ${styles.payBtnStripe}`}
            onClick={() => pay('stripe')}
            disabled={!!loading}
          >
            {loading === 'stripe' ? 'Переход...' : 'Pay with Stripe'}
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <p className={styles.note}>
        Подписка активируется сразу после оплаты. Отмена — в любое время.
      </p>
    </div>
  );
}
