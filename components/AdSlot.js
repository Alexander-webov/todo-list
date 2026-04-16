'use client';
import styles from './AdSlot.module.css';

export function AdSlot({ ad }) {
  if (!ad) return null;

  function handleClick() {
    fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ad.id }),
    }).catch(() => {});
  }

  return (
    <a
      href={ad.link}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={styles.ad}
      onClick={handleClick}
    >
      <div className={styles.badge}>Реклама</div>
      <div className={styles.content}>
        {ad.image_url && (
          <img src={ad.image_url} alt="" className={styles.image} />
        )}
        <div className={styles.text}>
          <p className={styles.title}>{ad.title}</p>
          {ad.description && (
            <p className={styles.desc}>{ad.description}</p>
          )}
          <span className={styles.cta}>Подробнее →</span>
        </div>
      </div>
    </a>
  );
}

export function YandexAdSlot({ blockId }) {
  if (!blockId) return null;

  return (
    <div className={styles.ad}>
      <div className={styles.badge}>Реклама</div>
      <div
        id={`yandex_rtb_${blockId}`}
        className={styles.yandex}
        ref={(el) => {
          if (el && typeof window !== 'undefined' && window.yaContextCb) {
            window.yaContextCb.push(() => {
              window.Ya.Context.AdvManager.render({
                blockId,
                renderTo: `yandex_rtb_${blockId}`,
              });
            });
          }
        }}
      />
    </div>
  );
}
