import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolSimulator from '../../../school-simulator';
import '../../../landing.css';
import '../../../school.css';

export const metadata = {
  title: 'CRUD escolar · Backend',
  description: 'Simule o cadastro, a consulta, a atualização e a exclusão de notas, acompanhando cada etapa entre a sala de aula e a secretaria.',
};

export default function SchoolCrudPage() {
  return (
    <div className="landing">
      <SiteHeader />
      <main className="school-page">
        <Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link>

        <SchoolSimulator />
      </main>
    </div>
  );
}
