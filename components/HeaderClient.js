'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function HeaderClient({ user, isPremium, isAdmin }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚡</span>
          <span className={styles.logoText}>
            Freelance<span className={styles.logoAccent}>Hub</span>
          </span>
        </a>

        <div className={styles.liveBadge}>
          <span className={styles.liveDot} />
          <span>Live</span>
        </div>

        <nav className={styles.nav}>
          <a href="#" className={styles.navLink}>Проекты</a>
          <a href="/pricing" className={styles.navLink}>Тарифы</a>
          {isAdmin && <a href="/admin" className={styles.navLink}>Админ</a>}
        </nav>

        <div className={styles.actions}>
          {user ? (
            <>
              {isPremium && (
                <span className={styles.premiumBadge}>⚡ Премиум</span>
              )}
              <a href="/dashboard" className={styles.btnOutline}>
                {user.email.split('@')[0]}
              </a>
              <button className={styles.btnOutline} onClick={logout}>
                Выйти
              </button>
            </>
          ) : (
            <>
              <a href="/login" className={styles.btnOutline}>Войти</a>
              <a href="/pricing" className={styles.btnPrimary}>Получить доступ</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
