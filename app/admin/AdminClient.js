'use client';
import { useState } from 'react';
import styles from './admin.module.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export function AdminClient({ gifts, totalUsers, premiumUsers }) {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('30');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);
  const [webhookInfo, setWebhookInfo] = useState(null);

  async function giftPremium(e) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, days: parseInt(days), note }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) { setEmail(''); setNote(''); }
    } catch {
      setResult({ error: 'Ошибка соединения' });
    } finally {
      setLoading(false);
    }
  }

  async function registerWebhook(e) {
    e.preventDefault();
    setWebhookLoading(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/admin/telegram-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.replace(/\/$/, '') }),
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch {
      setWebhookResult({ ok: false, description: 'Ошибка соединения' });
    } finally {
      setWebhookLoading(false);
    }
  }

  async function checkWebhook() {
    setWebhookLoading(true);
    try {
      const res = await fetch('/api/admin/telegram-webhook');
      const data = await res.json();
      setWebhookInfo(data.result || data);
    } catch {
      setWebhookInfo({ error: 'Ошибка' });
    } finally {
      setWebhookLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <a href="/" className={styles.back}>← Назад</a>
        <h1 className={styles.title}>🛡 Админ-панель</h1>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <p className={styles.statNum}>{totalUsers}</p>
          <p className={styles.statLabel}>Всего пользователей</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statNum}>{premiumUsers}</p>
          <p className={styles.statLabel}>Премиум активных</p>
        </div>
      </div>

      {/* Подарить премиум */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Подарить премиум</h2>
        <form className={styles.giftForm} onSubmit={giftPremium}>
          <div className={styles.formRow}>
            <input type="email" required placeholder="Email пользователя"
              className={styles.input} value={email}
              onChange={e => setEmail(e.target.value)} />
            <input type="number" min="1" max="3650" required placeholder="Дней"
              className={`${styles.input} ${styles.inputDays}`}
              value={days} onChange={e => setDays(e.target.value)} />
          </div>
          <input type="text" placeholder="Заметка (необязательно)"
            className={styles.input} value={note}
            onChange={e => setNote(e.target.value)} />
          <button type="submit" className={styles.giftBtn} disabled={loading}>
            {loading ? 'Дарим...' : '🎁 Подарить'}
          </button>
        </form>
        {result && (
          <div className={`${styles.result} ${result.success ? styles.resultOk : styles.resultErr}`}>
            {result.message || result.error}
            {result.premium_until && (
              <p className={styles.resultSub}>
                Активен до: {format(new Date(result.premium_until), 'd MMMM yyyy', { locale: ru })}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Telegram Webhook */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Telegram Bot Webhook</h2>
        <div className={styles.giftForm}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
            Укажи URL сайта чтобы бот получал сообщения от пользователей (/start → Chat ID).
          </p>
          <form onSubmit={registerWebhook} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="url" required
              placeholder="https://твой-домен.vercel.app"
              className={styles.input}
              value={webhookUrl}
              onChange={e => setWebhookUrl(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className={styles.giftBtn} disabled={webhookLoading}
                style={{ flex: 1 }}>
                {webhookLoading ? '...' : '🔗 Зарегистрировать webhook'}
              </button>
              <button type="button" className={styles.giftBtn} disabled={webhookLoading}
                onClick={checkWebhook}
                style={{ flex: 1, background: 'var(--border)', color: 'var(--text-muted)' }}>
                📋 Проверить статус
              </button>
            </div>
          </form>

          {webhookResult && (
            <div className={`${styles.result} ${webhookResult.ok ? styles.resultOk : styles.resultErr}`}>
              {webhookResult.ok
                ? `✅ Webhook зарегистрирован: ${webhookResult.registeredUrl}`
                : `❌ ${webhookResult.description || webhookResult.error}`}
            </div>
          )}

          {webhookInfo && (
            <div className={styles.result} style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
              <b>Текущий webhook:</b><br />
              URL: {webhookInfo.url || 'не задан'}<br />
              Ожидает сообщений: {webhookInfo.pending_update_count ?? '—'}<br />
              {webhookInfo.last_error_message && `Последняя ошибка: ${webhookInfo.last_error_message}`}
            </div>
          )}
        </div>
      </div>

      {/* История подарков */}
      {gifts.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>История подарков</h2>
          <div className={styles.giftList}>
            {gifts.map(g => (
              <div key={g.id} className={styles.giftRow}>
                <div>
                  <p className={styles.giftEmail}>{g.profiles?.email || g.user_id}</p>
                  {g.note && <p className={styles.giftNote}>{g.note}</p>}
                </div>
                <div className={styles.giftRight}>
                  <span className={styles.giftDays}>+{g.days} дней</span>
                  <span className={styles.giftDate}>
                    {format(new Date(g.created_at), 'd MMM', { locale: ru })}
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
