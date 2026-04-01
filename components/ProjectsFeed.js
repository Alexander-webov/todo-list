'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectCard } from './ProjectCard';
import { SearchBar } from './SearchBar';
import { PremiumGate } from './PremiumGate';
import styles from './ProjectsFeed.module.css';

const FREE_LIMIT = 5;

export function ProjectsFeed({ initialProjects = [], total = 0, isPremium = false, isLoggedIn = false, trialUsed = false, profile = null }) {
  const params = useSearchParams();
  const [projects, setProjects] = useState(initialProjects);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialProjects.length < total);
  const lastChecked = useRef(new Date().toISOString());
  const loaderRef = useRef(null);

  const source   = params.get('source')   || '';
  const category = params.get('category') || '';
  const search   = params.get('search')   || '';

  useEffect(() => {
    setProjects([]);
    setPage(1);
    setHasMore(true);
    setNewCount(0);
    fetchPage(1, true);
  }, [source, category, search]);

  async function fetchPage(pageNum, replace = false) {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: pageNum, limit: 20 });
      if (source)   qs.set('source', source);
      if (category) qs.set('category', category);
      if (search)   qs.set('search', search);

      const res  = await fetch(`/api/projects?${qs}`);
      const data = await res.json();

      setProjects(prev => replace ? data.projects : [...prev, ...data.projects]);
      setHasMore(pageNum < data.pages);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isPremium) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchPage(next);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, isPremium]);

  useEffect(() => {
    if (!isPremium) return;
    const interval = setInterval(async () => {
      try {
        const qs = new URLSearchParams({ since: lastChecked.current, limit: 50 });
        if (source)   qs.set('source', source);
        if (category) qs.set('category', category);

        const res  = await fetch(`/api/projects?${qs}`);
        const data = await res.json();

        if (data.projects?.length > 0) {
          lastChecked.current = new Date().toISOString();
          setNewCount(c => c + data.projects.length);
        }
      } catch (_) {}
    }, 10_000);
    return () => clearInterval(interval);
  }, [source, category, isPremium]);

  function loadNewProjects() {
    setPage(1);
    fetchPage(1, true);
    setNewCount(0);
    lastChecked.current = new Date().toISOString();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const visibleProjects = isPremium ? projects : projects.slice(0, FREE_LIMIT);
  const showGate = !isPremium && projects.length > 0;

  return (
    <div className={styles.feed}>
      <SearchBar />

      {isPremium && newCount > 0 && (
        <button className={styles.newBadge} onClick={loadNewProjects}>
          <span className={styles.newDot} />
          {newCount} новых проектов — нажми, чтобы обновить
        </button>
      )}

      <div className={styles.grid}>
        {visibleProjects.map((p, i) => (
          <ProjectCard
            key={p.id}
            project={p}
            profile={profile}
            style={{ animationDelay: `${Math.min(i % 20, 10) * 40}ms` }}
          />
        ))}
      </div>

      {showGate && <PremiumGate isLoggedIn={isLoggedIn} trialUsed={trialUsed} />}

      {isPremium && (
        <div ref={loaderRef} className={styles.loader}>
          {loading && (
            <div className={styles.spinner}>
              {[0,1,2].map(i => (
                <span key={i} className={styles.spinnerDot} style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
          {!hasMore && projects.length > 0 && (
            <p className={styles.endMsg}>Все проекты загружены</p>
          )}
        </div>
      )}
    </div>
  );
}
