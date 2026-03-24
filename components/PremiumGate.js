import styles from './PremiumGate.module.css';

export function PremiumGate() {
  return (
    <div className={styles.gate}>
      <div className={styles.blur} />
      <div className={styles.box}>
        <span className={styles.icon}>⚡</span>
        <h2 className={styles.title}>Тысячи проектов ждут тебя</h2>
        <p className={styles.sub}>
          Ты видишь только 5 из <strong>1000+</strong> актуальных проектов. <br />
          Открой полный доступ и находи заказы первым.
        </p>
        <div className={styles.perks}>
          <span className={styles.perk}>✓ Все биржи в одном месте</span>
          <span className={styles.perk}>✓ Обновление в реальном времени</span>
          <span className={styles.perk}>✓ AI-генерация откликов</span>
        </div>
        <div className={styles.btns}>
          <a href="/pricing" className={styles.btnPrimary}>
            Смотреть все проекты — от 299 ₽/мес
          </a>
          <a href="/login" className={styles.btnSecondary}>
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </div>
  );
}
