'use client';

import Image from 'next/image';
import Link from 'next/link';
import MotionReveal from './motion-reveal';
import { useEffect, useState } from 'react';
import AiRoom from './ai-room';
import { agents, aiModulePath, aiScenarios, aiStepDuration, drawAiCast } from './ai-scenarios.mjs';
import useSimulationPlayback from './use-simulation-playback';

const settingsKey = 'nara-lab.ai-settings.v1';
const defaults = { sourceAvailable: true, speed: '1', level: 'basic' };
const speeds = ['0.5', '1', '1.5', '2'];

/** Coordena o sorteio por execução, as preferências locais e a inspeção da demonstração de IA. */
export default function AiSimulator({ id }) {
  const scenario = aiScenarios[id];
  const [settings, setSettings] = useState(defaults);
  const [run, setRun] = useState(null);
  const [cast, setCast] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inspector, setInspector] = useState('step');
  const steps = run?.steps ?? [];
  const playback = useSimulationPlayback(steps, settings.speed, undefined, aiStepDuration);
  const { cursor, step, last, playing, jump, toggle, reset, pause } = playback;
  const activeInspector = inspector === 'result' && !last ? 'step' : inspector;
  const isLibrary = id === 'biblioteca';
  const role = scenario.roles[step?.actor];

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey));
      if (saved) {
        setSettings({
          sourceAvailable: saved.sourceAvailable !== false,
          speed: speeds.includes(saved.speed) ? saved.speed : defaults.speed,
          level: saved.level === 'technical' ? 'technical' : defaults.level
        });
      }
    } catch {}
  }, []);

  /** Aplica uma preferência e limpa a confirmação anterior. */
  function update(name, value) {
    setSettings(current => ({ ...current, [name]: value }));
    setNotice('');
  }

  /** Persiste a configuração de legenda, velocidade e falha da biblioteca no navegador. */
  function save() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      setNotice('Configuração salva neste navegador.');
    } catch {
      setNotice('Não foi possível salvar neste navegador.');
    }
  }

  /** Solicita uma nova execução e mantém o elenco sorteado fixo durante a reprodução. */
  async function execute(event) {
    event.preventDefault();
    if (busy) return;
    pause();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/ia/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isLibrary ? { scenario: id, sourceAvailable: settings.sourceAvailable } : { scenario: id })
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!data.steps?.length || !Object.hasOwn(agents, data.agent)) throw new Error();
      setRun(data);
      setCast(drawAiCast(scenario.roles, data.agent));
      setInspector('step');
      reset(true);
    } catch {
      setError('Não foi possível iniciar a simulação. Confira se o backend está em execução e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="simulator ai-simulator">
      <header className="sim-header">
        <Link href="/#modulos" className="sim-brand" aria-label="NARA Lab — voltar aos módulos">
          <Image src="/brand/nara-lab.png" alt="NARA Lab" width={160} height={53} unoptimized />
        </Link>
        <nav aria-label="Simulações de Inteligência Artificial">
          {Object.entries(aiScenarios).map(([key, item]) => (
            <Link key={key} href={`${aiModulePath}/${key}`} aria-current={id === key ? 'page' : undefined}>{item.location}</Link>
          ))}
        </nav>
        <Link href={aiModulePath} className="sim-back">Módulo de IA</Link>
      </header>
      <main>
        <div className="intro">
          <p>Inteligência Artificial <span>/</span> {scenario.location}</p>
          <h1>{scenario.title}</h1>
          <div>{scenario.description}</div>
        </div>
        <div className="grid">
          <MotionReveal as="section" className="stage" delay={0.08}>
            <div className="bar">
              <h2>{scenario.location}</h2>
              <span className="status"><i />{busy ? 'Carregando' : playing ? 'Reproduzindo' : run ? 'Em revisão' : 'Pronta'}</span>
            </div>
            <AiRoom id={id} scenario={scenario} cast={cast} steps={steps} playback={playback} />
            <div className="caption" aria-live="polite">
              {step && <small>{role.label} <em>/</em> {cast[step.actor].name} <em>/</em> {settings.level === 'basic' ? 'Iniciante' : 'Técnico'}</small>}
              <p>{step?.caption[settings.level] ?? 'Execute o exemplo para sortear o assistente e a equipe NARA.'}</p>
            </div>
            <div className="playbar">
              <button disabled={!run || busy} type="button" onClick={() => jump(0)} aria-label="Reiniciar" title="Reiniciar">↺</button>
              <button disabled={!run || busy || cursor.index === 0} type="button" onClick={() => jump(cursor.index - 1)} aria-label="Etapa anterior" title="Etapa anterior">◀</button>
              <button className="play" disabled={!run || busy} type="button" onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproduzir'}>{playing ? 'Ⅱ' : '▶'}</button>
              <button disabled={!run || busy || last} type="button" onClick={() => jump(cursor.index + 1)} aria-label="Próxima etapa" title="Próxima etapa">▶</button>
              <small>{run ? cursor.index + 1 : 0} / {steps.length}</small>
              <label>Velocidade <select value={settings.speed} onChange={e => update('speed', e.target.value)}>
                {speeds.map(speed => <option key={speed} value={speed}>{speed}×</option>)}
              </select></label>
            </div>
          </MotionReveal>
          <MotionReveal as="aside" delay={0.16}>
            <div className="bar"><h2>Configuração</h2></div>
            <form onSubmit={execute}>
              {isLibrary && <label>Fonte consultada<select value={String(settings.sourceAvailable)}
                onChange={e => update('sourceAvailable', e.target.value === 'true')}>
                <option value="true">Documentação disponível</option>
                <option value="false">Documentação indisponível</option>
              </select></label>}
              <label>Nível da legenda<select value={settings.level} onChange={e => update('level', e.target.value)}>
                <option value="basic">Iniciante</option>
                <option value="technical">Técnico</option>
              </select></label>
              <button className="primary" disabled={busy}>{busy ? 'Iniciando…' : '▶ Executar exemplo'}</button>
              <button type="button" className="save" onClick={save}>Salvar configuração</button>
              {run && <p className="notice">Assistente sorteado <strong>{agents[run.agent]}</strong></p>}
              {error && <p role="alert" className="notice">{error}</p>}
              {notice && <p role="status" className="notice">{notice}</p>}
            </form>
          </MotionReveal>
        </div>
        <MotionReveal as="section" className="inspector" delay={0.08}>
          <div className="bar">
            <h2>Inspetor</h2>
            <div className="tabs" aria-label="Dados da simulação">
              {[['step', 'Etapa'], ['history', 'Histórico'], ['result', 'Resultado']].map(([key, label]) => (
                <button key={key} type="button" aria-pressed={activeInspector === key}
                  disabled={key === 'result' && !last} onClick={() => setInspector(key)}>{label}</button>
              ))}
            </div>
          </div>
          {!step ? <p className="readout">Os diálogos e dados da demonstração aparecem a cada etapa.</p>
            : activeInspector === 'history' ? (
              <ol className="readout ai-history">
                {steps.map((item, index) => (
                  <li key={index} className={index === cursor.index ? 'current' : undefined}>
                    <button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined}
                      onClick={() => { jump(index); setInspector('step'); }}>
                      <strong>{scenario.roles[item.actor].label}</strong> · {item.caption[settings.level]}
                    </button>
                  </li>
                ))}
              </ol>
            ) : activeInspector === 'result' ? (
              <div className="readout">
                <p>{run.outcome.summary}</p>
                {!!run.outcome.orders.length && <div className="ai-orders">
                  {run.outcome.orders.map(({ customer, ticket, clarificationTurns }) => (
                    <article key={customer}>
                      <h3>{scenario.roles[customer].label}</h3>
                      <p>{clarificationTurns === 1 ? '1 rodada de esclarecimento' : '0 rodadas de esclarecimento'}</p>
                      <ul>
                        <li>{ticket.burger}</li>
                        <li>{ticket.fries}</li>
                        <li>{ticket.service}</li>
                      </ul>
                    </article>
                  ))}
                </div>}
              </div>
            ) : (
              <dl className="readout ai-observations">
                <div><dt>Diálogo</dt><dd>{step.bubble}</dd></div>
                {step.observations.map(({ label, value }) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            )}
        </MotionReveal>
      </main>
    </div>
  );
}
