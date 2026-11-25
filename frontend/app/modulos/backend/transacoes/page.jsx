import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolTransactionSimulator from '../../../school-transaction-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../relationships.css';
import '../../../transactions.css';

export const metadata = {
  title: 'Transações com @Transactional · Backend',
  description: 'Compare commit e rollback de uma transferência escolar, distinguindo escritas pendentes e confirmadas no mesmo banco.',
};

export default function TransactionsPage() {
  return <div className="landing"><SiteHeader /><main className="school-page"><Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link><SchoolTransactionSimulator /></main></div>;
}
