import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolGradeSimulator from '../../../school-grade-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../school-dto.css';

export const metadata = {
  title: 'Persistência com Spring Data JPA · Backend',
  description: 'Grave uma nota na tabela da secretaria e recupere o registro em uma nova sessão.',
};

/** Disponibiliza a aula de persistência no catálogo de Backend. */
export default function SchoolJpaPage() {
  return <div className="landing">
    <SiteHeader />
    <main className="school-page">
      <Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link>
      <SchoolGradeSimulator scenario="jpa" />
    </main>
  </div>;
}
