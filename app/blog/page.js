import styles from './blog.module.css';
import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Блог о фрилансе — советы и статьи | FreelanceHere',
  description: 'Полезные статьи о фрилансе: как найти заказы, как писать отклики, как зарабатывать больше. Советы для начинающих и опытных фрилансеров.',
  keywords: 'блог о фрилансе, советы фрилансеру, статьи о фрилансе',
};

const ARTICLES = [
  { slug: 'kak-uvelichit-chek-frilanser', title: 'Как поднять ставку в 2 раза не потеряв клиентов', desc: 'Проверенная стратегия повышения цены.', emoji: '📈' },
  { slug: 'avtomatizaciya-frilanser', title: 'Автоматизация рутины: как экономить 3 часа в день', desc: 'Инструменты которые убирают повторяющиеся задачи.', emoji: '🤖' },
  { slug: 'frilanser-brendirovanie', title: 'Личный бренд фрилансера: почему клиенты платят больше знакомым', desc: 'Как построить репутацию которая приводит клиентов сама.', emoji: '⭐' },
  { slug: 'niche-frilanser', title: 'Узкая специализация vs универсальность: что выгоднее', desc: 'Данные и реальные кейсы о доходе узких специалистов.', emoji: '🎯' },
  { slug: 'frilanser-passive-income', title: 'Пассивный доход для фрилансера: 5 рабочих схем', desc: 'Как создать источники дохода которые работают пока ты спишь.', emoji: '💸' },
  { slug: 'frilanser-dogovor', title: 'Договор с заказчиком: как защитить себя юридически', desc: 'Какие пункты обязательны и как избежать неоплаты.', emoji: '📋' },
  { slug: 'frilanser-klienty-telegram', title: 'Как находить клиентов в Telegram: полное руководство', desc: 'Каналы, чаты и стратегии поиска заказов.', emoji: '✈️' },
  { slug: 'frilanser-rate-hour', title: 'Почасовая ставка vs фиксированная цена: что выгоднее', desc: 'Когда брать почасово а когда фиксированно.', emoji: '⏱️' },
  { slug: 'frilanser-repeat-clients', title: 'Система удержания клиентов: как 20% приносят 80% дохода', desc: 'Как превратить разовых заказчиков в постоянных.', emoji: '🔄' },
  { slug: 'frilanser-scope-creep', title: 'Scope creep: как остановить расширение проекта без конфликта', desc: 'Заказчик добавляет задачи? Как говорить нет профессионально.', emoji: '🛑' },
  { slug: 'kak-najti-zakazy-na-freelanse', title: 'Как находить заказы на фрилансе быстрее конкурентов', desc: 'Главный секрет успешного фрилансера — скорость отклика.', emoji: '🚀' },
  { slug: 'kak-napisat-otklik-na-freelanse', title: 'Как написать отклик который точно прочитают', desc: 'Структура идеального отклика на фриланс-проект.', emoji: '✍️' },
  { slug: 'luchshie-frilansy-birzhi-rossii', title: 'Лучшие фриланс-биржи России в 2024 году', desc: 'Сравнение FL.ru, Kwork, Workzilla и Freelance.ru.', emoji: '📊' },
  { slug: 'skolko-zarabatyvaet-frilanser', title: 'Сколько зарабатывает фрилансер в России', desc: 'Реальные цифры по категориям.', emoji: '💰' },
  { slug: 'kak-nachat-frilansat-s-nulya', title: 'Как начать фрилансить с нуля — пошаговый план', desc: 'Пошаговый план для начинающих.', emoji: '🎯' },
  { slug: 'pochemu-frilanser-ne-nahodit-zakazov', title: 'Почему фрилансер не находит заказы — 7 причин', desc: 'Типичные ошибки и как их исправить.', emoji: '🔍' },
  { slug: 'frilanser-vs-ofis', title: 'Фриланс vs офис — что выгоднее в 2024 году', desc: 'Честное сравнение: зарплата, свобода, стабильность.', emoji: '⚖️' },
  { slug: 'kak-ustanovit-tsenu-na-frilanse', title: 'Как установить цену на фрилансе и не продешевить', desc: 'Методики расчёта стоимости услуг.', emoji: '💎' },
  { slug: 'frilanser-portfolio', title: 'Как собрать портфолио фрилансеру с нуля', desc: 'Где брать первые работы если нет опыта.', emoji: '🗂️' },
  { slug: 'kak-rabotat-s-trudnymi-zakazchikami', title: 'Как работать с трудными заказчиками', desc: 'Что делать если заказчик не платит или хамит.', emoji: '🛡️' },
  { slug: 'udalennaya-rabota-sovety', title: 'Удалённая работа — советы как не сойти с ума', desc: 'Режим дня и продуктивность на удалёнке.', emoji: '🏠' },
  { slug: 'frilanser-nalogi', title: 'Налоги для фрилансера — полное руководство', desc: 'Самозанятый или ИП? Как платить налоги.', emoji: '📑' },
  { slug: 'kak-nayti-postoyannyh-klientov', title: 'Как найти постоянных клиентов на фрилансе', desc: 'Стратегии построения базы постоянных клиентов.', emoji: '🤝' },
  { slug: 'frilanser-bez-opyta', title: 'Фриланс без опыта — реально ли начать с нуля', desc: 'Какие навыки самые простые для старта.', emoji: '🌱' },
  { slug: 'kak-obshchatsya-s-zakazchikom', title: 'Как общаться с заказчиком на фрилансе', desc: 'Переписка, ТЗ, шаблоны сообщений.', emoji: '💬' },
  { slug: 'frilanser-vygoranie', title: 'Выгорание фрилансера — признаки и как бороться', desc: 'Как восстановиться и не допустить повторения.', emoji: '🔥' },
  { slug: 'frilanser-sravnenie-birzh', title: 'FL.ru против Kwork — подробное сравнение', desc: 'Комиссии, типы заказов, конкуренция.', emoji: '⚔️' },
  { slug: 'zarabotok-na-freelancer-com', title: 'Как зарабатывать на Freelancer.com', desc: 'Гайд для русскоязычных фрилансеров.', emoji: '🌐' },
  { slug: 'kak-vesti-peregovory-o-tsene', title: 'Как вести переговоры о цене на фрилансе', desc: 'Как отвечать на "дорого". Скрипты переговоров.', emoji: '🎯' },
  { slug: 'frilanser-instrumenty', title: '20 инструментов которые нужны каждому фрилансеру', desc: 'Бесплатные инструменты для работы и поиска заказов.', emoji: '🛠️' },
];

export default function BlogPage() {
  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Блог о фрилансе</h1>
          <p className={styles.sub}>Советы, стратегии и инструменты для фрилансеров</p>
        </div>
        <div className={styles.grid}>
          {ARTICLES.map(a => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className={styles.card}>
              <span className={styles.cardEmoji}>{a.emoji}</span>
              <h2 className={styles.cardTitle}>{a.title}</h2>
              <p className={styles.cardDesc}>{a.desc}</p>
              <span className={styles.cardLink}>Читать →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
