import { parseFL } from './fl.js';
import { parseKwork } from './kwork.js';
import { parseWorkzilla } from './workzilla.js';
import { parseFreelanceRu } from './freelanceru.js';
import { parseYoudo } from './youdo.js';
import { supabaseAdmin } from '../supabase.js';
import { sendNewProjectNotifications } from '../telegram.js';

export async function runAllParsers() {
  console.log('[Parsers] Запуск...');

  const [fl, kwork, workzilla, freelanceru, youdo] = await Promise.allSettled([
    parseFL(),
    parseKwork(),
    parseWorkzilla(),
    parseFreelanceRu(),
    parseYoudo(),
  ]);

  const log = (name, r) => {
    if (r.status === 'fulfilled') console.log(`[${name}] ✓ ${r.value.length}`);
    else console.error(`[${name}] ✗`, r.reason?.message);
  };
  log('FL.ru', fl);
  log('Kwork', kwork);
  log('Workzilla', workzilla);
  log('Freelance.ru', freelanceru);
  log('Youdo', youdo);

  const allProjects = [
...(fl.status          === 'fulfilled' ? fl.value          : []),
    ...(kwork.status       === 'fulfilled' ? kwork.value       : []),
    ...(workzilla.status   === 'fulfilled' ? workzilla.value   : []),
    ...(freelanceru.status === 'fulfilled' ? freelanceru.value : []),
    ...(youdo.status       === 'fulfilled' ? youdo.value       : []),
  ];

  console.log(`[Parsers] Всего собрано: ${allProjects.length}`);
  if (allProjects.length === 0) return 0;

  const db = supabaseAdmin();

  // Workzilla — upsert с обновлением (одни и те же заказы, нужно обновлять published_at)
  const workzillaProjects = allProjects.filter(p => p.source === 'workzilla');
  const otherProjects = allProjects.filter(p => p.source !== 'workzilla');

  let newProjects = [];

  // Остальные биржи — только новые
  if (otherProjects.length > 0) {
    const { data: inserted, error } = await db
      .from('projects')
      .upsert(otherProjects, { onConflict: 'source,external_id', ignoreDuplicates: true })
      .select('id, source, title, category, budget_min, currency, url');
    if (error) console.error('[Parsers] Ошибка сохранения:', error.message);
    else newProjects = [...newProjects, ...(inserted || [])];
  }

  // Workzilla — только новые (ignoreDuplicates: true)
  // Старые удаляются через 48 часов через cleanup
  if (workzillaProjects.length > 0) {
    const { data: inserted, error } = await db
      .from('projects')
      .upsert(workzillaProjects, { onConflict: 'source,external_id', ignoreDuplicates: true })
      .select('id, source, title, category, budget_min, currency, url');
    if (error) console.error('[Workzilla] Ошибка сохранения:', error.message);
    else newProjects = [...newProjects, ...(inserted || [])];
  }

  if (!newProjects) newProjects = [];
  console.log(`[Parsers] Новых в БД: ${newProjects.length}`);

  if (newProjects.length > 0) {
    await sendNewProjectNotifications(newProjects).catch(e =>
      console.error('[Telegram] Ошибка:', e.message)
    );
  }

  // Обновляем статистику заказчиков
  await Promise.allSettled([
  ]);

  return newProjects.length;
}

export const SOURCES = {
  fl:          { name: 'FL.ru',          flag: '🇷🇺', color: '#f60' },
  kwork:       { name: 'Kwork',          flag: '🇷🇺', color: '#ff4d00' },
  workzilla:   { name: 'Workzilla',      flag: '🇷🇺', color: '#1a7ae0' },
  freelanceru: { name: 'Freelance.ru',   flag: '🇷🇺', color: '#2ecc71' },
  youdo:       { name: 'Youdo',          flag: '🇷🇺', color: '#7c3aed' },
};
