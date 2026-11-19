import Link from 'next/link';
import SiteHeader from '../site-header';
import { aiModulePath } from '../ai-scenarios.mjs';
import '../landing.css';

export const metadata = {
  title: 'Como funciona',
  description: 'Entenda a proposta didática do NARA Lab e como acompanhar uma simulação interativa.'
};

/** Apresenta a finalidade pedagógica do NARA Lab e orienta a primeira demonstração. */
export default function HowItWorksPage() {
  return (
    <div className="landing">
      <SiteHeader current="about" />
      <main className="about-page">
        <header className="about-intro">
          <h1>Como funciona</h1>
          <p>
            O NARA Lab torna visíveis os processos que normalmente acontecem dentro de um sistema.
            Em uma sala isométrica em pixel art, cada personagem representa um papel, e cada
            etapa conecta o que acontece no cenário ao código e aos dados que explicam o resultado.
          </p>
          <p>
            A plataforma foi pensada para professores conduzirem demonstrações em aula e para
            estudantes revisarem os exemplos no próprio ritmo.
          </p>
        </header>

        <section className="about-walkthrough" aria-labelledby="walkthrough-title">
          <h2 id="walkthrough-title">Da configuração à resposta</h2>
          <ol className="about-steps">
            <li>
              <h3>Escolha um cenário</h3>
              <p>Explore o cadastro de produtos no Backend ou escolha Biblioteca ou Hamburgueria em Inteligência Artificial.</p>
            </li>
            <li>
              <h3>Acompanhe a execução</h3>
              <p>Observe os personagens em cada etapa, alterne entre legendas iniciante e técnica e pause ou volte para revisar.</p>
            </li>
            <li>
              <h3>Compare os resultados</h3>
              <p>Use o inspetor para acompanhar os dados da API, a fonte consultada ou as comandas, conforme o cenário.</p>
            </li>
          </ol>
        </section>
        <section className="about-demo" aria-labelledby="about-ai-title">
          <h2 id="about-ai-title">Inteligência Artificial</h2>
          <p>Veja como uma fonte sustenta uma resposta na biblioteca e como os detalhes de um prompt mudam o atendimento na hamburgueria.</p>
          <Link href={aiModulePath} className="modules-button">Abrir módulo de IA</Link>
        </section>

        <section className="about-demo" aria-labelledby="about-demo-title">
          <h2 id="about-demo-title">Cadastro de produtos</h2>
          <p>
            A primeira demonstração acompanha <code>POST /produtos</code> no Spring Boot.
            A mesma requisição pode resultar em cadastro bem-sucedido, erro de validação ou
            indisponibilidade do banco. Os registros são simulados em memória durante a execução.
          </p>
          <Link href="/modulos/backend/cadastro-de-produtos" className="modules-button">
            Abrir demonstração
          </Link>
        </section>
      </main>
    </div>
  );
}
