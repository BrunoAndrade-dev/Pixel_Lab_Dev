'use client';

import { useEffect, useRef, useState } from 'react';
import MotionReveal from './motion-reveal';
import BackendSimulationHeading from './backend-simulation-heading';
import BackendLearningContext from './backend-learning-context';
import useSimulationPlayback from './use-simulation-playback';
import useBackendQuizAccess from './use-backend-quiz-access';
import BootRoom from './boot-room';
import { bootRoles, bootStepDuration } from './boot-scene.mjs';
import { BootOrderReceipt, BootDeliveryReceipt, BootOrdersPage } from './boot-receipt';

const defaults = { profile: 'simple', meatPoint: 'ao ponto', salad: 'yes', accompaniment: 'batata frita', drink: 'refrigerante', failure: 'none', level: 'basic', speed: '1' };
const allowed = { profile: ['simple', 'complete'], meatPoint: ['ao ponto', 'bem passado'], salad: ['yes', 'no'], accompaniment: ['batata frita', 'sem acompanhamento'], drink: ['refrigerante', 'suco de laranja', 'água'], failure: ['none', 'missing-repository', 'invalid-database'], level: ['basic', 'technical'], speed: ['0.5', '1', '1.5', '2'] };
const storageKey = 'nara-lab.backend.boot.settings.v1';
const pretty = value => JSON.stringify(value, null, 2);
const statusNames = { ORDERED: 'Comanda recebida', STARTING: 'Preparando componentes', READY: 'Aplicação pronta', DELIVERED: 'Entrega concluída', FAILED: 'Inicialização interrompida' };

export default function BootSimulator() {
  const [settings, setSettings] = useState(defaults), [execution, setExecution] = useState(null);
  const [completedTables, setCompletedTables] = useState({});
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [configTab, setConfigTab] = useState('Entrada'), [detail, setDetail] = useState('Comanda');
  const sequence = useRef(0), applied = useRef(null);
  const steps = execution?.data.steps || [];
  const playback = useSimulationPlayback(steps, settings.speed, undefined, bootStepDuration);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const unlocked = useBackendQuizAccess(playback.completed);
  const shown = step?.state;
  const profile = execution?.request.profile || settings.profile;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== 'object') return;
      const next = { ...defaults };
      for (const [field, options] of Object.entries(allowed)) if (options.includes(saved[field])) next[field] = saved[field];
      if (next.profile === 'simple' && next.failure === 'invalid-database') next.failure = 'none';
      setSettings(next);
    } catch { /* Uma preferência antiga não impede a aula. */ }
  }, []);

  useEffect(() => {
    if (!execution || !last || applied.current === execution.id) return;
    if (cursor.animate && (playing || cursor.clock.elapsed < bootStepDuration(step))) return;
    applied.current = execution.id;
    setCompletedTables(current => ({ ...current, [execution.request.profile]: execution.data }));
  }, [execution, last, cursor, playing, step]);

  function update(field, value) {
    setSettings(current => ({ ...current, [field]: value, ...(field === 'profile' && value === 'simple' && current.failure === 'invalid-database' ? { failure: 'none' } : {}) }));
    setNotice('');
  }
  async function run(event) {
    event.preventDefault(); if (busy) return;
    pause(); setBusy(true); setError(''); setNotice('');
    const request = { profile: settings.profile, failure: settings.failure, food: { meatPoint: settings.meatPoint, salad: settings.salad === 'yes', accompaniment: settings.accompaniment, drink: settings.drink } };
    try {
      const response = await fetch('/api/boot/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(`A API do simulador recusou a configuração (HTTP ${response.status}). Confira combo, pedido e falha.`);
      if (!data?.steps?.length || !data.finalState?.order || !data.startupResult) throw Error('A API retornou uma sequência inválida.');
      setExecution({ id: ++sequence.current, request, data }); reset(true);
    } catch (problem) { setError(problem instanceof TypeError ? 'Não foi possível acessar o backend. Confira o servidor e tente novamente.' : problem.message); }
    finally { setBusy(false); }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); setNotice('Preferências salvas. Comandas, entregas e resultados do quiz não são salvos.'); }
    catch { setNotice('Não foi possível salvar a configuração neste navegador.'); }
  }
  function clear() { pause(); reset(); setExecution(null); setCompletedTables({}); applied.current = null; setError(''); setNotice('As duas mesas foram reiniciadas.'); }

  return <>
    <BackendSimulationHeading scenario="boot" title="Inicialização e injeção de dependência" eyebrow="Backend · A aplicação começa na comanda" description="Monte o pedido na lanchonete, acompanhe o Spring conectando os componentes e confira a aplicação pronta para atender." unlocked={unlocked} onOpen={pause} />
    <div className="relationship-simulation">
      <MotionReveal as="section" className="school-stage" aria-labelledby="boot-stage-title">
        <div className="school-panel-bar"><h2 id="boot-stage-title">Lanchonete · duas configurações</h2><span className="school-run-status">{busy ? 'Preparando aula…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Escolha seu combo'}</span></div>
        <BootRoom profile={profile} step={step} playback={playback} completedTables={completedTables} />
        <div className="boot-tables">{['simple', 'complete'].map(which => <div key={which} className={profile === which ? 'is-active' : ''}><strong>{which === 'simple' ? 'Mesa 1 · Combo simples' : 'Mesa 2 · Combo completo'}</strong><span>{which === 'simple' ? 'HTTP + lista em memória' : 'HTTP + validação + JPA + H2'}</span><span className="boot-status">{profile === which && shown ? statusNames[shown.startupStatus] : completedTables[which] ? completedTables[which].startupResult.status === 'READY' ? 'Última montagem entregue' : 'Última montagem interrompida' : 'Aguardando pedido'}</span></div>)}</div>
        <div className="school-caption" aria-live="polite"><small>{step ? `${bootRoles[step.actor]} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : 'Antes de começar'}</small><p>{step?.caption[settings.level] || 'O cliente representa o desenvolvedor escolhendo recursos. Primeiro montamos os componentes; depois demonstramos uma consulta HTTP. A comanda e a entrega completas ficam no inspetor e no histórico.'}</p></div>
        <div className="school-playbar" aria-label="Controles de reprodução">
          <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
          <button type="button" aria-label="Etapa anterior" disabled={!execution || !cursor.index || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
          <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
          <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
          <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
          <label>Velocidade<select value={settings.speed} onChange={event => update('speed', event.target.value)}>{allowed.speed.map(value => <option key={value} value={value}>{value}×</option>)}</select></label>
        </div>
      </MotionReveal>
      <MotionReveal as="aside" className="school-config" aria-labelledby="boot-config-title">
        <div className="school-panel-bar"><h2 id="boot-config-title">Monte a comanda</h2></div>
        <form onSubmit={run}>
          <div className="school-tabs" aria-label="Configuração do exemplo">{['Entrada', 'Falhas'].map(tab => <button type="button" key={tab} aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}</div>
          {configTab === 'Entrada' ? <>
            <label>Combo e mesa<select value={settings.profile} onChange={event => update('profile', event.target.value)}><option value="simple">Mesa 1 · Simples · HTTP e memória</option><option value="complete">Mesa 2 · Completo · HTTP, validação, JPA e H2</option></select></label>
            <label>Ponto do hambúrguer<select value={settings.meatPoint} onChange={event => update('meatPoint', event.target.value)}>{allowed.meatPoint.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Salada<select value={settings.salad} onChange={event => update('salad', event.target.value)}><option value="yes">Com salada</option><option value="no">Sem salada</option></select></label>
            <label>Acompanhamento<select value={settings.accompaniment} onChange={event => update('accompaniment', event.target.value)}>{allowed.accompaniment.map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Bebida<select value={settings.drink} onChange={event => update('drink', event.target.value)}>{allowed.drink.map(value => <option key={value}>{value}</option>)}</select></label>
            <p className="school-config-note">O lanche pertence à história. O combo escolhe os recursos técnicos. Ambos incluem uma página Pedidos ilustrativa e uma API HTTP; o completo acrescenta configuração de banco e validação. Os dois exemplos usam dados voláteis em memória.</p>
          </> : <><label>Condição da inicialização<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal</option><option value="missing-repository">Repository não registrado como bean</option><option value="invalid-database" disabled={settings.profile !== 'complete'}>Configuração de banco inválida · apenas completo</option></select></label><p className="school-config-note">Uma falha de inicialização interrompe o preparo: não existe entrega nem atendimento HTTP da aplicação ilustrada. A aula continua disponível para explicar o motivo.</p></>}
          <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
          <button className="school-primary" disabled={busy}>{busy ? 'Preparando…' : '▶ Executar simulação'}</button>
          <button type="button" className="school-save" onClick={save}>Salvar configuração</button><button type="button" className="school-save" disabled={busy} onClick={clear}>Reiniciar mesas</button>
          {error && <p role="alert" className="school-message school-error">{error}</p>}{notice && <p role="status" className="school-message">{notice}</p>}
        </form>
      </MotionReveal>
    </div>
    <MotionReveal as="section" className="school-inspector" aria-labelledby="boot-inspector-title">
      <div className="school-panel-bar school-inspector-bar"><h2 id="boot-inspector-title">Execução e documentos</h2><div className="school-tabs" aria-label="Dados da simulação">{['Comanda', 'Entrega', 'Componentes', 'HTTP / Página', 'Código', 'Estado', 'Histórico', 'Contexto/Objetivo'].map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div></div>
      <div className="school-inspector-content">
        {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario="boot" /> : detail === 'Comanda' ? <BootOrderReceipt order={shown?.order} /> : detail === 'Entrega' ? <BootDeliveryReceipt state={shown} /> : detail === 'Componentes' ? <>
          <p className="school-http-note">Beans são objetos gerenciados pelo Spring. A lista acompanha a etapa selecionada. Bibliotecas do projeto ficam na comanda; as setas abaixo representam dependências entre objetos.</p>
          {shown?.beans.length ? <ul className="boot-beans">{shown.beans.map(bean => <li key={bean.id}><strong>{bean.id}</strong><span>{bean.type}</span><span>{bean.dependencies.length ? `Recebe pelo construtor/infraestrutura: ${bean.dependencies.join(', ')}` : 'Disponível no contexto'}</span></li>)}</ul> : <p>Ainda não há objetos ativos neste snapshot.</p>}{shown?.error && <p role="status" className="school-message school-error">{shown.error}</p>}
        </> : detail === 'HTTP / Página' ? <>
          <p className="school-http-note">A API desta aula usa <code>POST /api/boot/simulations</code>. A consulta abaixo pertence à aplicação ilustrada e só aparece após a inicialização. Não há uma nova porta ou aplicação real.</p>
          <BootOrdersPage state={shown} />{shown?.httpResult && <><h3>Resposta da consulta ilustrativa</h3><pre>{pretty(shown.httpResult)}</pre></>}
        </> : detail === 'Código' ? <>
          <p className="school-http-note">Exemplos Spring Boot 3.5. Classes, DTOs e detalhes omitidos estão indicados no trecho. O simulador não compila nem executa este código.</p>
          {step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, i) => <span key={i} className={i + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(i + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Execute um exemplo para acompanhar o código.</p>}
        </> : detail === 'Estado' ? <><p className="school-http-note">Snapshot completo. startupStatus descreve a aplicação ilustrada; não é o status HTTP da API do simulador.</p><pre>{shown ? pretty(shown) : 'Execute uma configuração.'}</pre></> : <>
          <p className="school-http-note">Passo a passo com acontecimento, motivo e efeitos. A comanda exata e a ficha de entrega fazem parte dos documentos da execução. Voltar não repete chamadas.</p>
          {steps.length ? <ol className="school-history">{steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id} className={index === cursor.index ? 'is-current' : undefined}><button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => jump(index)}><span>Etapa {index + 1} · {bootRoles[item.actor]}</span><strong>{item.dialogue}</strong></button><p>{item.history[settings.level]}</p>{item.document === 'ORDER' && <BootOrderReceipt order={item.state.order} compact />}{item.document === 'DELIVERY' && <BootDeliveryReceipt state={item.state} compact />}<small>{statusNames[item.state.startupStatus]} · {item.state.beans.length} objeto(s) representado(s)</small></li>)}</ol> : <p>Escolha uma mesa e execute para começar.</p>}
        </>}
      </div>
    </MotionReveal>
    <p className="school-session-note">Demonstração em memória. Cada execução monta uma configuração independente. As mesas conservam o último resultado apenas durante esta visita. Nenhum servidor, página, projeto Maven ou banco adicional é criado. As cenas existentes de IA permanecem independentes.</p>
  </>;
}
