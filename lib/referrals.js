/**
 * Партнёрские/реферальные ссылки на биржи.
 * Замени на свои реферальные токены после регистрации партнёром.
 *
 * Как получить:
 * - Kwork:       https://kwork.ru/affiliate
 * - FL.ru:       https://www.fl.ru/pages/referral/
 * - Freelancer:  https://www.freelancer.com/affiliate/
 * - Workzilla:   https://work-zilla.com/pages/affiliate
 */

const REFERRAL_TOKENS = {
  kwork:       process.env.KWORK_REFERRAL       || '',
  fl:          process.env.FL_REFERRAL          || '',
  freelancer:  process.env.FREELANCER_REFERRAL  || '',
  workzilla:   process.env.WORKZILLA_REFERRAL   || '',
  freelanceru: process.env.FREELANCERU_REFERRAL || '',
};

/**
 * Строит реферальную ссылку для проекта.
 * Если токен не задан — возвращает оригинальный URL.
 */
export function buildReferralUrl(source, originalUrl) {
  const token = REFERRAL_TOKENS[source];
  if (!token) return originalUrl;

  switch (source) {
    case 'kwork':
      // Kwork: добавляем ?ref=TOKEN
      return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}ref=${token}`;

    case 'fl':
      // FL.ru: добавляем ?ref=TOKEN
      return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}ref=${token}`;

    case 'freelancer':
      // Freelancer.com: добавляем ?ref=TOKEN
      return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}reference=${token}`;

    case 'workzilla':
      // Workzilla: добавляем ?invite=TOKEN
      return `${originalUrl}${originalUrl.includes('?') ? '&' : '?'}invite=${token}`;

    default:
      return originalUrl;
  }
}

/**
 * Ссылки на регистрацию на биржах (для страницы партнёрства)
 */
export const PARTNER_LINKS = {
  kwork: {
    name: 'Kwork',
    color: '#ff4d00',
    registerUrl: REFERRAL_TOKENS.kwork
      ? `https://kwork.ru/?ref=${REFERRAL_TOKENS.kwork}`
      : 'https://kwork.ru',
    affiliateUrl: 'https://kwork.ru/affiliate',
    commission: 'до 25% от комиссии биржи',
    description: 'Крупнейшая русскоязычная биржа заданий',
  },
  fl: {
    name: 'FL.ru',
    color: '#ff6600',
    registerUrl: REFERRAL_TOKENS.fl
      ? `https://www.fl.ru/?ref=${REFERRAL_TOKENS.fl}`
      : 'https://www.fl.ru',
    affiliateUrl: 'https://www.fl.ru/pages/referral/',
    commission: 'фиксированная выплата за регистрацию',
    description: 'Старейшая фриланс-биржа России',
  },
  freelancer: {
    name: 'Freelancer.com',
    color: '#29b2fe',
    registerUrl: REFERRAL_TOKENS.freelancer
      ? `https://www.freelancer.com/signup?reference=${REFERRAL_TOKENS.freelancer}`
      : 'https://www.freelancer.com',
    affiliateUrl: 'https://www.freelancer.com/affiliate/',
    commission: '$5–$150 за активного пользователя',
    description: 'Крупнейшая международная биржа',
  },
  workzilla: {
    name: 'Workzilla',
    color: '#1a7ae0',
    registerUrl: REFERRAL_TOKENS.workzilla
      ? `https://work-zilla.com/?invite=${REFERRAL_TOKENS.workzilla}`
      : 'https://work-zilla.com',
    affiliateUrl: 'https://work-zilla.com/pages/affiliate',
    commission: 'процент от заработка исполнителей',
    description: 'Популярная биржа микрозаданий',
  },
};
