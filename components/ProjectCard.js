'use client';
import { useState } from 'react';
import styles from './ProjectCard.module.css';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { scoreProject } from '@/lib/scoring';
import { calcMatch, getMatchLabel } from '@/lib/match';

const SOURCE_META = {
  freelancer: { name: 'Freelancer.com', color: '#29b2fe', flag: '🌐' },
  fl: { name: 'FL.ru', color: '#ff6600', flag: '🇷🇺' },
  kwork: { name: 'Kwork', color: '#ff4d00', flag: '🇷🇺' },
  workzilla: { name: 'Workzilla', color: '#1a7ae0', flag: '🇷🇺' },
  freelanceru: { name: 'Freelance.ru', color: '#2ecc71', flag: '🇷🇺' },
  youdo: { name: 'Youdo', color: '#f5a623', flag: '🇷🇺' },
};

function formatBudget(min, max, currency) {
  if (!min && !max) return null;
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₽';
  const fmt = (n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : n;
  if (min && max) return `${sym}${fmt(min)} — ${sym}${fmt(max)}`;
  if (min) return `от ${sym}${fmt(min)}`;
  if (max) return `до ${sym}${fmt(max)}`;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ru }); }
  catch { return ''; }
}

export function ProjectCard({ project, profile, style }) {
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendDone, setSendDone] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(null);

  const meta = SOURCE_META[project.source] || { name: project.source, color: '#6b7a99', flag: '🌐' };
  const budget = formatBudget(project.budget_min, project.budget_max, project.currency);
  const url = project.referral_url || project.url;
  const scoring = scoreProject(project);

  const matchPct = profile ? calcMatch(project, profile) : null;
  const matchInfo = matchPct !== null ? getMatchLabel(matchPct) : null;

  const isEnglish = project.source === 'freelancer';
  const displayTitle = translated?.title || project.title;
  const displayDesc = translated?.description || project.description;

  async function translate() {
    if (translated) { setTranslated(null); return; }
    setTranslating(true);
    try {
      const text = `Заголовок: ${project.title}\n\nОписание: ${project.description || ''}`;
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.translated) {
        // Парсим ответ
        const lines = data.translated.split('\n');
        const titleLine = lines.find(l => l.toLowerCase().startsWith('заголовок:'));
        const descStart = lines.findIndex(l => l.toLowerCase().startsWith('описание:'));
        const title = titleLine ? titleLine.replace(/^заголовок:\s*/i, '').trim() : data.translated.split('\n')[0];
        const description = descStart >= 0
          ? lines.slice(descStart).join('\n').replace(/^описание:\s*/i, '').trim()
          : '';
        setTranslated({ title, description });
      }
    } catch (_) {}
    setTranslating(false);
  }

  async function generateResponse() {
    setModal(true);
    setSendDone(false);
    if (response) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: project.title, description: project.description, source: project.source, budget }),
      });
      const data = await res.json();
      setResponse(data.text || data.error || 'Ошибка генерации');
    } catch {
      setResponse('Ошибка соединения');
    } finally {
      setLoading(false);
    }
  }

  async function copyText() {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function sendResponse() {
    setSending(true);
    try { await navigator.clipboard.writeText(response); } catch (_) {}
    setSendDone(true);
    setSending(false);
    setTimeout(() => window.open(url, '_blank', 'noopener,noreferrer'), 600);
  }

  function closeModal(e) {
    if (e.target === e.currentTarget) setModal(false);
  }

  return (
    <>
      <article className={`${styles.card} animate-in`} style={style}>
        <div className={styles.topRow}>
          <span className={styles.sourceBadge} style={{ '--source-color': meta.color }}>
            <span>{meta.flag}</span>
            <span>{meta.name}</span>
          </span>
          {project.category && (
            <span className={styles.categoryBadge}>{project.category}</span>
          )}
          <span className={styles.scoreBadge} style={{
            color: scoring.color,
            background: scoring.bg,
            border: `1px solid ${scoring.color}30`,
          }}>
            {scoring.label}
          </span>
          {matchInfo && (
            <span className={styles.matchBadge} style={{ color: matchInfo.color, background: `${matchInfo.color}18`, border: `1px solid ${matchInfo.color}40` }}>
              🎯 {matchInfo.label}
            </span>
          )}
          <span className={styles.time}>
            {timeAgo(project.published_at || project.created_at)}
          </span>
        </div>

        <a href={`/projects/${project.id}`} className={styles.titleLink}>
          <h2 className={styles.title}>{displayTitle}</h2>
        </a>

        {displayDesc && (
          <p className={styles.description}>{displayDesc}</p>
        )}

        {project.tags?.length > 0 && (
          <div className={styles.tags}>
            {project.tags.slice(0, 5).map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          {budget
            ? <span className={styles.budget}>{budget}</span>
            : <span className={styles.budgetEmpty}>Бюджет не указан</span>
          }
          <div className={styles.actions}>
            {isEnglish && (
              <button className={styles.translateBtn} onClick={translate} disabled={translating}>
                {translating ? '...' : translated ? '🌐 Оригинал' : '🌐 RU'}
              </button>
            )}
            <button className={styles.aiBtn} onClick={generateResponse}>✦ Отклик</button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className={styles.ctaBtn} style={{ '--source-color': meta.color }}>
              Перейти →
            </a>
          </div>
        </div>
      </article>

      {modal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <span className={styles.modalAiIcon}>✦</span>
                <span>AI Отклик</span>
              </div>
              <button className={styles.closeBtn} onClick={() => setModal(false)}>✕</button>
            </div>
            <div className={styles.modalProject}>
              <span className={styles.sourceBadge} style={{ '--source-color': meta.color }}>
                {meta.flag} {meta.name}
              </span>
              <p className={styles.modalProjectTitle}>{project.title}</p>
            </div>
            <div className={styles.modalBody}>
              {loading ? (
                <div className={styles.generating}>
                  <div className={styles.genDots}>
                    {[0,1,2].map(i => <span key={i} className={styles.genDot} style={{ animationDelay: `${i*0.2}s` }} />)}
                  </div>
                  <p>Генерирую отклик...</p>
                </div>
              ) : (
                <textarea className={styles.responseText} value={response} onChange={e => setResponse(e.target.value)} rows={10} />
              )}
            </div>
            {!loading && response && (
              <div className={styles.modalFooter}>
                <div className={styles.modalActions}>
                  <button className={styles.copyBtn} onClick={copyText}>
                    {copied ? '✓ Скопировано' : '⎘ Копировать'}
                  </button>
                  <button className={`${styles.sendBtn} ${sendDone ? styles.sendBtnDone : ''}`} onClick={sendResponse} disabled={sending || sendDone}>
                    {sendDone ? '✓ Скопировано! Открываю...' : sending ? '...' : `Откликнуться на ${meta.name} →`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
