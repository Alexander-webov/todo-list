'use client';
import { useState, useEffect } from 'react';
import styles from './PremiumGate.module.css';

export function PremiumGate({ isLoggedIn = false, trialUsed = false }) {
  const [stats, setStats] = useState(null);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialDone, setTrialDone] = useState(false);
  const [trialError, setTrialError] = useState('');

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => { });
  }, []);

  async function activateTrial() {
    if (!isLoggedIn) {
      window.location.href = '/register';
      return;
    }
    setTrialLoading(true);
    setTrialError('');
    try {
      const res = await fetch('/api/trial', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTrialDone(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setTrialError(data.error);
      }
    } catch {
      setTrialError('Ошибка соединения');
    } finally {
      setTrialLoading(false);
    }
  }

  const projectsToday = stats?.projectsToday || 0;
  const premiumUsers = stats?.premiumUsers || 0;

  return (
    <div className={styles.gate}>
      <div className={styles.blur} />
      <div className={styles.box}>

        {/* Социальные триггеры */}
        <div className={styles.triggers}>
          <div className={styles.trigger}>
            <span className={styles.triggerFire}>🔥</span>
            <span>+{projectsToday > 0 ? projectsToday : '...'} новых проектов за последние 24 часа</span>
          </div>
          <div className={styles.trigger}>
            <span className={styles.triggerFire}>⚡</span>
            <span> 189 фрилансеров уже смотрят все проекты прямо сейчас</span>
          </div>
          <div className={styles.trigger}>
            <span className={styles.triggerFire}>⏱</span>
            <span>Пока ты читаешь это — кто-то уже отправил отклик</span>
          </div>
        </div>

        <span className={styles.icon}>⚡</span>
        <h2 className={styles.title}>Ты видишь только 5 из {stats?.totalProjects?.toLocaleString('ru') || '...'} проектов</h2>
        <p className={styles.sub}>
          Открой полный доступ и находи заказы <strong>первым</strong> — раньше других фрилансеров.
        </p>

        <div className={styles.perks}>
          <span className={styles.perk}>✓ Все биржи в одном месте</span>
          <span className={styles.perk}>✓ Уведомления в Telegram</span>
          <span className={styles.perk}>✓ AI-генерация откликов (СКОРО)</span>
        </div>

        {trialDone ? (
          <div className={styles.trialSuccess}>
            🎉 Готово! 3 дня Премиума активированы. Обновляем страницу...
          </div>
        ) : (
          <div className={styles.btns}>
            {/* Триал */}
            {!trialUsed && (
              <button className={styles.btnTrial} onClick={activateTrial} disabled={trialLoading}>
                {trialLoading ? '...' : isLoggedIn ? '🎁 Попробовать 3 дня бесплатно' : '🎁 Зарегистрироваться и получить подарок'}
              </button>
            )}

            <a href="/pricing" className={styles.btnPrimary}>
              Смотреть все проекты
            </a>

            {!isLoggedIn && (
              <a href="/login" className={styles.btnSecondary}>
                Уже есть аккаунт? Войти
              </a>
            )}
          </div>
        )}

        {trialError && <p className={styles.trialError}>{trialError}</p>}
      </div>
    </div>
  );
}
