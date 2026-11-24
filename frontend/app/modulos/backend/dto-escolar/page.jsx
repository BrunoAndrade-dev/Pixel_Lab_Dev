import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolDtoSimulator from '../../../school-dto-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../school-dto.css';

export const metadata = {
  title: 'DTO e boletim escolar · Backend',
  description: 'Compare DTO de entrada, entidade e DTO de saída em uma simulação escolar com boletim, código e histórico detalhado.',
};

export default function SchoolDtoPage() {
  return <div className="landing">
    <SiteHeader />
    <main className="school-page">
      <Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link>

      <SchoolDtoSimulator />
    </main>
  </div>;
}
