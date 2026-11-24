import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolValidationSimulator from '../../../school-validation-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../school-validation.css';

export const metadata = {
  title: 'Validação e tratamento de erros · Backend',
  description: 'Aprenda validação de campos, exceções e respostas HTTP com exemplos na escola, histórico detalhado e quiz.',
};

export default function SchoolValidationPage() {
  return <div className="landing"><SiteHeader /><main className="school-page">
    <Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link>
    <SchoolValidationSimulator />
  </main></div>;
}
