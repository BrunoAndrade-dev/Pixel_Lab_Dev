import Image from 'next/image';
import Link from 'next/link';
import SiteHeader from '../../site-header';
import MotionReveal from '../../motion-reveal';
import { aiModulePath, aiScenarios } from '../../ai-scenarios.mjs';
import '../../landing.css';
import '../../ai.css';

export const metadata = { title: 'Inteligência Artificial' };

/** Apresenta os cenários disponíveis no módulo e vincula cada ambiente à sua simulação. */
export default function AiModulePage() {
  return (
    <main className="landing">
      <SiteHeader />
      <section className="module-section ai-catalog" aria-labelledby="ai-module-title">
        <h1 id="ai-module-title">Inteligência Artificial</h1>
        <p>Pratique consulta à documentação e escrita de prompts com Codex e Claude Code.</p>
        <ul>
          {Object.entries(aiScenarios).map(([id, scenario], index) => (
            <MotionReveal as="li" key={id} delay={index * 0.1}>
              <Link href={`${aiModulePath}/${id}`}>
                <Image src={`/scenarios/ia/${id}.png`} alt="" width={1774} height={887}
                  sizes="(max-width: 720px) 100vw, 46vw" loading={id === 'biblioteca' ? 'eager' : 'lazy'} />
                <div>
                  <span>{scenario.location}</span>
                  <h2>{scenario.title}</h2>
                  <p>{scenario.description}</p>
                </div>
              </Link>
            </MotionReveal>
          ))}
        </ul>
      </section>
    </main>
  );
}
