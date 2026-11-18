import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from './site-header';
import TechnologyScene from './technology-scene';
import './landing.css';

const modules = [
  'Lógica de Programação',
  'Frontend',
  'Backend',
  'Banco de Dados',
  'Arquitetura',
  'Agentes de IA',
  'DevOps',
  'Metodologias Ágeis',
];

const topics = ['Java', 'Spring Boot', 'Requisições HTTP', 'APIs'];

/** Exibe a introdução e mantém um caminho direto entre o catálogo e a simulação disponível. */
export default function LandingPage() {
  return (
    <main className="landing" id="inicio">
      <SiteHeader current="home" />

      <section className="landing-hero" aria-labelledby="landing-title">
        <TechnologyScene />
        <div className="hero-copy">
          <h1 id="landing-title">
            Desbloqueie seu<br /> potencial em<br /> <span>programação.</span>
          </h1>
          <p>Aprenda na prática com simulações interativas e animações 2D.</p>
        </div>
      </section>

      <section className="module-section" id="modulos" tabIndex={-1} aria-labelledby="modules-title">
        <h2 id="modules-title">Módulos</h2>
        <ul className="module-grid">
          {modules.map(name => (
            <li key={name} className={name === 'Backend' ? 'module-backend' : 'module-item'}>
              <h3>{name}</h3>
              {name === 'Backend' && (
                <Link className="scenario-card" href="/modulos/backend/cadastro-de-produtos">
                  <div className="scenario-copy">
                    <p className="scenario-framework">Framework Spring Boot</p>
                    <h4>Cenário — Cadastro de Produtos</h4>
                    <ul className="scenario-topics" aria-label="Tópicos da simulação">
                      {topics.map(topic => <li key={topic}>{topic}</li>)}
                    </ul>
                  </div>
                  <Image className="scenario-illustration" src="/technologies/spring-boot.png" alt="" width={138} height={138} unoptimized />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
