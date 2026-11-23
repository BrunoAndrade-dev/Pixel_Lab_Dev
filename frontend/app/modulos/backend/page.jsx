import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '../../site-header';
import MotionReveal from '../../motion-reveal';
import '../../landing.css';
import '../../ai.css';

export const metadata = { title: 'Backend' };

const scenarios = [
  { href: '/modulos/backend/cadastro-de-produtos', image: '/scenarios/nara-lab-room.png', label: 'Simulação disponível', title: 'Cadastro de produtos', description: 'Acompanhe uma requisição pelas camadas do Spring Boot, incluindo validação e falhas de persistência.' },
  { href: '/modulos/backend/crud-escolar', image: '/scenarios/school/school-room.webp', label: 'Simulação disponível', title: 'CRUD na escola', description: 'Cadastre, consulte, atualize e exclua notas, acompanhando a interação entre sala de aula e secretaria.' },
];

export default function BackendModulePage() {
  return (
    <main className="landing">
      <SiteHeader />
      <section className="module-section ai-catalog" aria-labelledby="backend-module-title">
        <h1 id="backend-module-title">Backend</h1>
        <p>Explore o funcionamento de aplicações por meio de cenários e simulações visuais.</p>
        <ul>
          {scenarios.map((scenario, index) => (
            <MotionReveal as="li" key={scenario.href} delay={index * 0.1}>
              <Link href={scenario.href}>
                <Image src={scenario.image} alt="" width={1774} height={887} sizes="(max-width: 720px) 100vw, 46vw" />
                <div><span>{scenario.label}</span><h2>{scenario.title}</h2><p>{scenario.description}</p></div>
              </Link>
            </MotionReveal>
          ))}
        </ul>
      </section>
    </main>
  );
}
