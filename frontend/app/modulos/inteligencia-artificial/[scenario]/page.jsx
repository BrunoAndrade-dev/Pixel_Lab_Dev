import { notFound } from 'next/navigation';
import AiSimulator from '../../../ai-simulator';
import { aiScenarios } from '../../../ai-scenarios.mjs';
import '../../../ai.css';

export const dynamicParams = false;

/** Gera as rotas dos cenários presentes no módulo. */
export function generateStaticParams() {
  return Object.keys(aiScenarios).map(scenario => ({ scenario }));
}

/** Usa o título do cenário na aba do navegador. */
export async function generateMetadata({ params }) {
  const { scenario } = await params;
  if (!Object.hasOwn(aiScenarios, scenario)) notFound();
  return { title: aiScenarios[scenario].title, description: aiScenarios[scenario].description };
}

/** Limita a reprodução às demonstrações disponíveis no catálogo da interface. */
export default async function AiScenarioPage({ params }) {
  const { scenario } = await params;
  if (!Object.hasOwn(aiScenarios, scenario)) notFound();
  return <AiSimulator key={scenario} id={scenario} />;
}
