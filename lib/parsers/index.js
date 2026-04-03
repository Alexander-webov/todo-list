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

  // Сохраняем проекты
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

  // Обновляем статистику заказчиков
  await Promise.allSettled([
    updateCustomerStats('workzilla'),
    updateCustomerStats('youdo'),
    updateCustomerStats('kwork'),
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
