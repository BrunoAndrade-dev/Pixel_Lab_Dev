import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '../../site-header';
import MotionReveal from '../../motion-reveal';
import '../../landing.css';
import '../../ai.css';

export const metadata = { title: 'Backend' };

const scenarios = [
  { href: '/modulos/backend/inicializacao-spring', image: '/scenarios/boot/lanchonete.webp', label: 'Simulação disponível', title: 'Inicialização e injeção de dependência', description: 'Monte a comanda na lanchonete, conecte os componentes e confira a aplicação pronta para atender HTTP.' },
  { href: '/modulos/backend/transacoes', image: '/scenarios/school/relationships-room.webp', label: 'Simulação disponível', title: 'Transações com @Transactional', description: 'Confirme a nova turma e o histórico juntos ou observe o rollback quando a segunda escrita falha.' },
  { href: '/modulos/backend/relacionamentos', image: '/scenarios/school/relationships-room.webp', label: 'Simulação disponível', title: 'Relacionamentos entre entidades', description: 'Conecte turma e aluno, consulte os vínculos e acompanhe uma transferência entre duas salas de aula.' },
  { href: '/modulos/backend/cadastro-de-produtos', image: '/scenarios/nara-lab-room.png', label: 'Simulação disponível', title: 'Cadastro de produtos', description: 'Acompanhe uma requisição pelas camadas do Spring Boot, incluindo validação e falhas de persistência.' },
  { href: '/modulos/backend/crud-escolar', image: '/scenarios/school/school-room.webp', label: 'Simulação disponível', title: 'CRUD na escola', description: 'Cadastre, consulte, atualize e exclua notas, acompanhando a interação entre sala de aula e secretaria.' },
  { href: '/modulos/backend/dto-escolar', image: '/scenarios/school/school-room.webp', label: 'Simulação disponível', title: 'DTO e boletim escolar', description: 'Compare os dados de entrada, a entidade e a resposta da aplicação, representada por um boletim escolar.' },
  { href: '/modulos/backend/validacao-e-erros', image: '/scenarios/school/school-room.webp', label: 'Simulação disponível', title: 'Validação e tratamento de erros', description: 'Descubra como validar campos, identificar problemas e devolver respostas claras sem alterar os dados em caso de falha.' },
  { href: '/modulos/backend/persistencia-jpa', image: '/scenarios/school/school-room.webp', label: 'Simulação disponível', title: 'Persistência com Spring Data JPA', description: 'Veja a nota virar uma linha na tabela e recupere o registro em uma nova sessão.' },
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
