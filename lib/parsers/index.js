import { parseFreelancer } from './freelancer.js';
import { parseFL } from './fl.js';
import { parseKwork } from './kwork.js';
import { parseWorkzilla } from './workzilla.js';
import { parseFreelanceRu } from './freelanceru.js';
import { supabaseAdmin } from '../supabase.js';
import { sendNewProjectNotifications } from '../telegram.js';

export async function runAllParsers() {
  console.log('[Parsers] Запуск...');

  const [freelancer, fl, kwork, workzilla, freelanceru] = await Promise.allSettled([
    parseFreelancer(),
    parseFL(),
    parseKwork(),
    parseWorkzilla(),
    parseFreelanceRu(),
  ]);

  const log = (name, r) => {
    if (r.status === 'fulfilled') console.log(`[${name}] ✓ ${r.value.length}`);
    else console.error(`[${name}] ✗`, r.reason?.message);
  };
  log('Freelancer', freelancer);
  log('FL.ru', fl);
  log('Kwork', kwork);
  log('Workzilla', workzilla);
  log('Freelance.ru', freelanceru);

  const allProjects = [
    ...(freelancer.status === 'fulfilled' ? freelancer.value : []),
    ...(fl.status === 'fulfilled' ? fl.value : []),
    ...(kwork.status === 'fulfilled' ? kwork.value : []),
    ...(workzilla.status === 'fulfilled' ? workzilla.value : []),
    ...(freelanceru.status === 'fulfilled' ? freelanceru.value : []),
  ];

  console.log(`[Parsers] Всего собрано: ${allProjects.length}`);
  if (allProjects.length === 0) return 0;

  const db = supabaseAdmin();
  const { data: inserted, error } = await db
    .from('projects')
    .upsert(allProjects, { onConflict: 'source,external_id', ignoreDuplicates: true })
    .select('id, source, title, category, budget_min, currency, url');

  if (error) {
    console.error('[Parsers] Ошибка сохранения:', error.message);
    return 0;
  }

  const newProjects = inserted || [];
  console.log(`[Parsers] Новых в БД: ${newProjects.length}`);

  if (newProjects.length > 0) {
    await sendNewProjectNotifications(newProjects).catch(e =>
      console.error('[Telegram] Ошибка:', e.message)
    );
  }

  return newProjects.length;
}

export const SOURCES = {
  freelancer:  { name: 'Freelancer.com', flag: '🌐', color: '#29b2fe' },
  fl:          { name: 'FL.ru',          flag: '🇷🇺', color: '#f60' },
  kwork:       { name: 'Kwork',          flag: '🇷🇺', color: '#ff4d00' },
  workzilla:   { name: 'Workzilla',      flag: '🇷🇺', color: '#1a7ae0' },
  freelanceru: { name: 'Freelance.ru',   flag: '🇷🇺', color: '#2ecc71' },
};
