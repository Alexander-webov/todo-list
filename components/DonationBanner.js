'use client';
import { useState } from 'react';
import styles from './DonationBanner.module.css';

export function DonationBanner() {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL || 'https://www.donationalerts.com/r/allfreelancershere';

  return (
    <div className={styles.banner}>
      <button className={styles.close} onClick={() => setHidden(true)}>×</button>
      <div className={styles.emoji}>❤️</div>
      <p className={styles.title}>Помоги проекту выжить</p>
      <p className={styles.text}>
        allFreelancersHere — полностью бесплатный сервис для вас, который делает один человек.
        Серверы, базы данных, домен имногое другое - стоит денег.
        Даже 100₽ помогут проекту жить и развиваться.
      </p>
      <a href={donationUrl} target="_blank" rel="noopener noreferrer" className={styles.btn}>
        ☕ Поддержать проект
      </a>
      <p className={styles.note}>Каждый, каждый рубль идёт на поддержку сервиса</p>
    </div>
  );
}
