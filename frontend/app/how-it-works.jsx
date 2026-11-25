import SimulationPreview from './simulation-preview';

/** Compartilha a apresentação da plataforma entre a seção inicial e a rota institucional. */
export default function HowItWorks({ standalone = false }) {
  const Title = standalone ? 'h1' : 'h2';
  return (
    <>
        <div className="about-overview">
          <header className="about-intro">
            <Title className="about-title">Como funciona</Title>
            <p>
              O NARA Lab torna visíveis os processos que normalmente acontecem dentro de um sistema.
              Em uma sala isométrica em pixel art, cada personagem representa um papel, e cada
              etapa conecta o que acontece no cenário ao código e aos dados que explicam o resultado.
            </p>
            <p>
              Desenvolvida pelo grupo <a href="https://site.nucleonara.tech/" target="_blank" rel="noopener noreferrer">NARA</a>,
              a plataforma apoia a compreensão de conceitos e o aprendizado de estudantes de
              Engenharia de Computação e áreas afins, por meio de exemplos práticos e tecnologias
              utilizadas nos projetos do grupo.
            </p>
          </header>
          <SimulationPreview />
        </div>

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
    </>
  );
}
