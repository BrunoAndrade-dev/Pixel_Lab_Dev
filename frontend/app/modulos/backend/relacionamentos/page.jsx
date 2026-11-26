import Link from 'next/link';
import SiteHeader from '../../../site-header';
import SchoolRelationshipSimulator from '../../../school-relationship-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../relationships.css';

export const metadata = {
  title: 'Relacionamentos entre entidades · Backend',
  description: 'Entenda Turma e Aluno, chave estrangeira, OneToMany e ManyToOne em duas salas de aula com transferência e consulta de vínculos.',
};

export default function RelationshipsPage() {
  return <div className="landing"><SiteHeader /><main className="school-page"><Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link><SchoolRelationshipSimulator /></main></div>;
}
