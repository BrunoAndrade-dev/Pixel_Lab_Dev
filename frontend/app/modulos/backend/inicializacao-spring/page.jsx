import Link from 'next/link';
import SiteHeader from '../../../site-header';
import BootSimulator from '../../../boot-simulator';
import '../../../landing.css';
import '../../../school.css';
import '../../../relationships.css';
import '../../../boot.css';

export const metadata = {
  title: 'Inicialização e injeção de dependência · Backend',
  description: 'Monte duas aplicações ilustrativas na lanchonete, confira comandas, configurações, beans, injeção pelo construtor e atendimento HTTP.',
};

export default function BootPage() {
  return <div className="landing"><SiteHeader /><main className="school-page"><Link className="school-back" href="/modulos/backend">← Simulações de Backend</Link><BootSimulator /></main></div>;
}
