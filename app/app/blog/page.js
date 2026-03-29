import styles from './blog.module.css';
import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Блог о фрилансе — советы и статьи | FreelanceHub',
  description: 'Полезные статьи о фрилансе: как найти заказы, как писать отклики, как зарабатывать больше.',
};

const ARTICLES = [
  {
    slug: 'kak-najti-zakazy-na-freelanse',
    title: 'Как находить заказы на фрилансе быстрее конкурентов',
    desc: 'Главный секрет успешного фрилансера — скорость отклика. Рассказываем как видеть новые заказы раньше всех.',
    date: '2024-01-15',
    readTime: '5 мин',
    emoji: '🚀',
  },
  {
    slug: 'kak-napisat-otklik-na-freelanse',
    title: 'Как написать отклик который точно прочитают',
    desc: 'Заказчик получает 50 откликов. Как сделать так чтобы твой оказался в первых? Разбираем структуру идеального отклика.',
    date: '2024-01-20',
    readTime: '7 мин',
    emoji: '✍️',
  },
  {
    slug: 'luchshie-frilansy-birzhi-rossii',
    title: 'Лучшие фриланс-биржи России в 2024 году',
    desc: 'Сравниваем FL.ru, Kwork, Workzilla и Freelance.ru — где больше заказов, где лучше платят и где меньше конкуренция.',
    date: '2024-01-25',
    readTime: '10 мин',
    emoji: '📊',
  },
  {
    slug: 'skolko-zarabatyvaet-frilanser',
    title: 'Сколько зарабатывает фрилансер в России',
    desc: 'Реальные цифры по категориям: сколько платят дизайнерам, разработчикам, копирайтерам. Как увеличить доход.',
    date: '2024-02-01',
    readTime: '8 мин',
    emoji: '💰',
  },
  {
    slug: 'kak-nachat-frilansat-s-nulya',
    title: 'Как начать фрилансить с нуля — пошаговый план',
    desc: 'Пошаговый план для тех кто только начинает. Где искать первые заказы, как установить цену и не работать за копейки.',
    date: '2024-02-10',
    readTime: '12 мин',
    emoji: '🎯',
  },
  {
    slug: 'pochemu-frilanser-ne-nahodit-zakazov',
    title: 'Почему фрилансер не находит заказы — 7 причин',
    desc: 'Разбираем типичные ошибки которые мешают находить клиентов. Как исправить каждую из них.',
    date: '2024-02-15',
    readTime: '6 мин',
    emoji: '🔍',
  },
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
              <div className={styles.cardMeta}>
                <span>{a.readTime} чтения</span>
                <span>Читать →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
