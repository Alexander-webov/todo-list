'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../login/auth.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (error) {
      setError(error.message === 'User already registered' ? 'Этот email уже зарегистрирован' : error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  if (done) return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>⚡ FreelanceHub</a>
        <div className={styles.successIcon}>✉️</div>
        <h1 className={styles.title}>Проверь почту</h1>
        <p className={styles.subtitle}>Мы отправили письмо на <strong>{email}</strong>. Перейди по ссылке для подтверждения.</p>
        <Link href="/login" className={styles.btn} style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
          Войти
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <a href="/" className={styles.logo}>⚡ FreelanceHub</a>
        <h1 className={styles.title}>Регистрация</h1>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" required className={styles.input}
              placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Пароль</label>
            <input type="password" required className={styles.input}
              placeholder="Минимум 6 символов" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className={styles.footer}>
          Уже есть аккаунт? <Link href="/login" className={styles.link}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
