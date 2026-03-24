'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function DashboardClient({ profile, email, payments, paymentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const isPremium = profile?.is_premium && profile?.premium_until
    ? new Date(profile.premium_until) > new Date()
    : false;

  const premiumUntil = profile?.premium_until
    ? format(new Date(profile.premium_until), 'd MMMM yyyy', { locale: ru })
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <a href="/" className={styles.back}>← Назад</a>
        <button className={styles.logoutBtn} onClick={logout} disabled={loading}>
          {loading ? '...' : 'Выйти'}
        </button>
      </div>

      {/* Успешная оплата */}
      {paymentStatus === 'success' && (
        <div className={styles.successBanner}>
          🎉 Оплата прошла успешно! Премиум активирован.
        </div>
      )}

      {/* Профиль */}
      <div className={styles.section}>
        <h1 className={styles.sectionTitle}>Мой аккаунт</h1>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Email</span>
            <span className={styles.rowValue}>{email}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.rowLabel}>Статус</span>
            <span className={`${styles.rowValue} ${isPremium ? styles.premium : styles.free}`}>
              {isPremium ? '⚡ Премиум' : '🔒 Бесплатный'}
            </span>
          </div>
          {isPremium && premiumUntil && (
            <div className={styles.row}>
              <span className={styles.rowLabel}>Активен до</span>
              <span className={styles.rowValue}>{premiumUntil}</span>
            </div>
          )}
        </div>
      </div>

      {/* Кнопка оплаты если нет премиума */}
      {!isPremium && (
        <div className={styles.section}>
          <a href="/pricing" className={styles.upgradeBtn}>
            ⚡ Получить Премиум — от 299 ₽/мес
          </a>
        </div>
      )}

      {/* История платежей */}
      {payments.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>История платежей</h2>
          <div className={styles.card}>
            {payments.map((p) => (
              <div key={p.id} className={styles.paymentRow}>
                <div>
                  <p className={styles.paymentName}>
                    {p.provider === 'yookassa' ? '🇷🇺 ЮKassa' : '🌍 Stripe'} · {p.days_granted} дней
                  </p>
                  <p className={styles.paymentDate}>
                    {format(new Date(p.created_at), 'd MMM yyyy', { locale: ru })}
                  </p>
                </div>
                <div className={styles.paymentRight}>
                  <span className={styles.paymentAmount}>
                    {p.currency === 'RUB' ? `${p.amount} ₽` : `$${p.amount}`}
                  </span>
                  <span className={`${styles.paymentStatus} ${p.status === 'succeeded' ? styles.statusOk : styles.statusPending}`}>
                    {p.status === 'succeeded' ? 'Оплачен' : 'Ожидает'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
