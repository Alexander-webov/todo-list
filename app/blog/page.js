import styles from './blog.module.css';
import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Блог о фрилансе — советы и статьи | FreelanceHere',
  description: 'Полезные статьи о фрилансе: как найти заказы, как писать отклики, как зарабатывать больше. Советы для начинающих и опытных фрилансеров.',
  keywords: 'блог о фрилансе, советы фрилансеру, статьи о фрилансе',
};

const ARTICLES = [
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
