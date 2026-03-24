'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import styles from '../login/auth.module.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    setError('');

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message.includes('already registered')
        ? 'Этот email уже зарегистрирован' : signUpError.message);
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setError('Аккаунт создан! Войди через форму входа.');
      setLoading(false);
      return;
    }

    window.location.href = '/';
  }

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
            {loading ? 'Создаём...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className={styles.footer}>
          Уже есть аккаунт? <Link href="/login" className={styles.link}>Войти</Link>
        </p>
      </div>
    </div>
  );
}
