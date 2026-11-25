'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import MotionReveal from './motion-reveal';
import BackendLearningContext from './backend-learning-context';
import BackendSimulationHeading from './backend-simulation-heading';
import useBackendQuizAccess from './use-backend-quiz-access';
import Room from './room';
import { drawCast, previewCast, stations } from './room-motion.mjs';
import useSimulationPlayback from './use-simulation-playback';

const presets = [{
  name: 'Cadastro válido',
  description: 'Acompanhe a criação de um produto.',
  status: '201',
  price: 89.9,
  failure: 'none'
}, {
  name: 'Preço inválido',
  description: 'Veja onde a regra de negócio interrompe o fluxo.',
  status: '400',
  price: -1,
  failure: 'none'
}, {
  name: 'Banco indisponível',
  description: 'Observe uma falha na persistência.',
  status: '503',
  price: 89.9,
  failure: 'database-unavailable'
}];
const initial = {
  name: 'Teclado',
  price: '89.90',
  failure: 'none',
  level: 'basic',
  speed: '1'
};
// A chave original preserva as configurações salvas antes da mudança de nome.
const key = 'pixel-lab.settings.v1';
const pretty = value => JSON.stringify(value, null, 2);

/** Reproduz a sequência determinística do cenário de cadastro e exibe os dados de cada etapa. */
export default function Simulator() {
  const [catalog, setCatalog] = useState(null),
    [catalogError, setCatalogError] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setCatalogError(false);
    fetch('/api/scenarios').then(r => {
      if (!r.ok) throw Error();
      return r.json();
    }).then(items => {
      if (alive) setCatalog(items);
    }).catch(() => {
      if (alive) setCatalogError(true);
    });
    return () => {
      alive = false;
    };
  }, [attempt]);
  const [config, setConfig] = useState(initial),
    [tab, setTab] = useState('Sala'),
    [side, setSide] = useState('Entrada'),
    [detail, setDetail] = useState('HTTP');
  const [result, setResult] = useState(null),
    [cast, setCast] = useState(previewCast),
    [inspect, setInspect] = useState(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [sent, setSent] = useState(null);
  useEffect(() => {
    try {
      let s = JSON.parse(localStorage.getItem(key));
      if (s) setConfig({
        ...initial,
        ...s
      });
    } catch {}
  }, []);
  const update = (k, v) => {
    setConfig(o => ({
      ...o,
      [k]: v
    }));
    setNotice('');
  };
  const steps = result?.steps || [];
  const { cursor, step, last, playing: play, previous, jump, toggle: togglePlayback, reset, pause, completed } =
    useSimulationPlayback(steps, config.speed, setInspect);
  const quizUnlocked = useBackendQuizAccess(completed);
  const pos = cursor.index;
  const actor = inspect || step?.actor || 'client',
    station = stations[actor] || stations.client;
  const bubble = inspect ? station[3] : step?.bubble;
  const caption = inspect ? station[config.level === 'basic' ? 4 : 5] : step?.caption?.[config.level] || 'Configure a entrada e execute o exemplo para acompanhar o pedido.';
  /** Solicita ao Spring Boot uma nova sequência e inicia a reprodução a partir da primeira etapa. */
  async function run(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    pause();
    setError('');
    setNotice('');
    const inputs = {
      name: config.name,
      price: Number(config.price)
    };
    try {
      const r = await fetch('/api/simulations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: 'create-product',
          inputs,
          failure: config.failure
        })
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      if (!data.steps?.length) throw new Error();
      setResult(data);
      setSent(inputs);
      setCast(drawCast(cast));
      reset(true);
      setTab('Sala');
    } catch {
      setError('Não foi possível iniciar a simulação. Confira se o backend Spring Boot está disponível e tente novamente.');
    } finally {
      setBusy(false);
    }
  }
  /** Persiste as preferências do professor no contrato de armazenamento local existente. */
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(config));
      setNotice('Configuração salva neste navegador.');
    } catch {
      setNotice('Não foi possível salvar neste navegador.');
    }
  }
  /** Aplica um preset e descarta a sequência anterior até que o professor execute o cenário. */
  function choose(p) {
    setConfig(c => ({
      ...c,
      price: String(p.price),
      failure: p.failure
    }));
    setTab('Sala');
    reset();
    setResult(null);
    setSent(null);
    setError('');
    setSide(p.failure === 'none' ? 'Entrada' : 'Falhas');
    setNotice('Exemplo carregado. Clique em Executar.');
  }
  return <div className="simulator">
  <header className="sim-header">
    <Link href="/#modulos" className="sim-brand" aria-label="NARA Lab — voltar aos módulos">
      <Image src="/brand/nara-lab.png" alt="NARA Lab" width={160} height={53} unoptimized />
    </Link>
    <nav aria-label="Simulação">{['Sala', 'Cenários'].map(t => <button aria-current={tab === t ? 'page' : undefined} onClick={() => setTab(t)} key={t}>{t}</button>)}</nav>
    <Link href="/#modulos" className="sim-back">Módulos</Link>
  </header>
 <main>{tab === 'Cenários' ? <><div className="intro"><p>Framework Spring Boot</p><h1>Cenários</h1></div>{catalogError ? <p role="alert">Cenários indisponíveis. <button onClick={() => setAttempt(a => a + 1)}>Tentar novamente</button></p> : !catalog ? <p>Carregando exemplos…</p> : catalog.some(s => s.id === 'create-product') ? <><h2>{catalog.find(s => s.id === 'create-product').title}</h2><p>Escolha o cenário da requisição.</p><div className="cards">{presets.map(p => <button className="card" key={p.name} onClick={() => choose(p)}><small>POST /produtos</small><strong>{p.name}</strong><span>{p.description}</span><b>HTTP {p.status} ↗</b></button>)}</div></> : <p>Nenhum exemplo disponível.</p>}</> : <>
 <BackendSimulationHeading scenario="products" title="Cadastro de produtos" eyebrow="Spring Boot / APIs e requisições HTTP" description="Explore o caminho de uma requisição, do cliente ao banco de dados." className="intro" unlocked={quizUnlocked} onOpen={pause} />
 <div className="grid"><MotionReveal as="section" className="stage" delay={0.08}><div className="bar"><h2>Sala de simulação</h2><span className="status"><i />{busy ? 'Carregando' : play ? 'Reproduzindo' : result ? 'Em revisão' : 'Pronta'}</span></div>
 <Room previous={inspect ? null : previous} cast={cast} clock={cursor.clock} active={actor} playing={play} bubble={bubble} onInspect={a => {
              setInspect(a);
              pause();
            }} />
 <div className="caption" aria-live="polite"><small>{station[0]} <em> / </em> {cast[actor].name} <em> / </em> {config.level === 'basic' ? 'Iniciante' : 'Técnico'}</small><p>{caption}</p></div>
 <div className="playbar"><button disabled={!result} onClick={() => jump(0)} aria-label="Reiniciar" title="Reiniciar">↺</button><button disabled={!result || pos === 0} onClick={() => jump(pos - 1)} aria-label="Etapa anterior" title="Etapa anterior">◀</button>
 <button className="play" disabled={!result} onClick={togglePlayback} aria-label={play ? 'Pausar' : 'Reproduzir'}>{play ? 'Ⅱ' : '▶'}</button>
 <button disabled={!result || last} onClick={() => jump(pos + 1)} aria-label="Próxima etapa" title="Próxima etapa">▶</button><small>{result ? pos + 1 : 0} / {steps.length}</small><label>Velocidade <select value={config.speed} onChange={e => update('speed', e.target.value)}>{['0.5', '1', '1.5', '2'].map(x => <option value={x} key={x}>{x}×</option>)}</select></label></div></MotionReveal>
 <MotionReveal as="aside" delay={0.16}><div className="bar"><h2>Configuração</h2></div><form onSubmit={run}><div className="tabs">{['Entrada', 'Falhas'].map(t => <button key={t} type="button" aria-pressed={side === t} onClick={() => setSide(t)}>{t}</button>)}</div>
 {side === 'Entrada' ? <><label>Nome do produto<input value={config.name} onChange={e => update('name', e.target.value)} /></label><label>Preço (R$)<input type="number" step="any" required value={config.price} onChange={e => update('price', e.target.value)} /></label></> : <label>Falha simulada<select value={config.failure} onChange={e => update('failure', e.target.value)}><option value="none">Nenhuma</option><option value="database-unavailable">Banco indisponível</option></select></label>}
 <label>Nível da legenda<select value={config.level} onChange={e => update('level', e.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
 <button className="primary" disabled={busy}>{busy ? 'Iniciando…' : '▶  Executar exemplo'}</button><button className="save" type="button" onClick={save}>Salvar configuração</button>{(error || notice) && <p role="status" className="notice">{error || notice}</p>}</form></MotionReveal></div>
 <MotionReveal as="section" className="inspector" delay={0.08}><div className="bar"><h2>Inspetor</h2><div className="tabs">{['HTTP', 'Código', 'Estado', 'Histórico', 'Contexto/Objetivo'].map(t => <button key={t} aria-pressed={detail === t} onClick={() => setDetail(t)}>{t}</button>)}</div></div>
 {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario="products" /> : detail === 'HTTP' ? <div className="split"><div><small>REQUISIÇÃO</small><h3><b>POST</b> /produtos</h3><pre>{pretty(sent || {
                  name: config.name,
                  price: Number(config.price)
                })}</pre></div><div><small>RESPOSTA SIMULADA</small><h3>{result && last ? 'HTTP ' + result.simulatedResponse.status : 'Aguardando resposta'}</h3><pre>{result && last ? pretty(result.simulatedResponse.body) : 'A resposta aparece ao final do fluxo.'}</pre></div></div> : detail === 'Código' ? <div className="readout"><small>{step?.code?.file || 'Código Java'}</small>{step?.code ? <pre>{step.code.source.split('\n').map((l, i) => <div className={step.code.line === i + 1 ? 'current' : ''} key={i}>{String(i + 1).padStart(2, ' ')}  {l || ' '}</div>)}</pre> : <p>Esta etapa não possui trecho Java associado.</p>}</div> : detail === 'Estado' ? <pre className="readout">{step ? pretty(step.state) : 'Execute o exemplo para inspecionar os dados.'}</pre> : <div className="readout">{steps.length ? <ol>{steps.slice(0, pos + 1).map((s, i) => <li key={i}><button onClick={() => jump(i)}>{stations[s.actor]?.[0] || s.actor} · {s.bubble}</button></li>)}</ol> : 'O histórico será preenchido durante a execução.'}</div>}</MotionReveal></>}</main></div>;
}
