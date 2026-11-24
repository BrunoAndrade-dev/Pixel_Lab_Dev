'use client';

import { useCallback, useEffect, useState } from 'react';
import SchoolRoom from './school-room';
import MotionReveal from './motion-reveal';
import BackendLearningContext from './backend-learning-context';
import BackendSimulationHeading from './backend-simulation-heading';
import useBackendQuizAccess from './use-backend-quiz-access';
import useSimulationPlayback from './use-simulation-playback';
import { schoolStepDuration } from './school-scene.mjs';

const defaults = { operation: 'create', student: 'Bruno', subject: 'Programação', grade: '8.5', id: '1', failure: 'none', level: 'basic', speed: '1' };
const presets = [
  { title: 'Cadastro válido', description: 'Dados aceitos e nota salva.', settings: {} },
  { title: 'Campos vazios', description: 'Vários problemas na mesma entrada.', settings: { student: '', subject: '', grade: '' } },
  { title: 'Nota fora do intervalo', description: 'Um número também pode ser inválido.', settings: { grade: '11' } },
  { title: 'Consulta válida', description: 'Registro encontrado, sem alterações.', settings: { operation: 'read' } },
  { title: 'Nota inexistente', description: 'ID positivo, mas sem registro.', settings: { operation: 'read', id: '99' } },
  { title: 'Secretaria indisponível', description: 'Entrada válida, acesso interrompido.', settings: { failure: 'database-unavailable' } },
];
const roles = { student: 'Aluno', teacher: 'Professor', office: 'Secretaria' };
const settingsKey = 'nara-lab.school.validation.settings.v1';
const pretty = value => JSON.stringify(value, null, 2);

export default function SchoolValidationSimulator() {
  const [settings, setSettings] = useState(defaults);
  const [execution, setExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState('HTTP');
  const [configTab, setConfigTab] = useState('Entrada');
  const steps = execution?.data.steps || [];
  const duration = useCallback(item => item === steps.at(-1) && item?.motion === 'idle' ? 1500 : schoolStepDuration, [steps]);
  const playback = useSimulationPlayback(steps, settings.speed, undefined, duration);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const quizUnlocked = useBackendQuizAccess(playback.completed);
  const state = step?.state;
  const responseBody = state?.responseBody;
  const request = execution?.request;
  const operation = request?.operation || settings.operation;
  const route = operation === 'create' ? '/notas' : `/notas/${request?.inputs.id ?? settings.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey));
      if (!saved || typeof saved !== 'object') return;
      setSettings(current => ({ ...current,
        ...Object.fromEntries(['student', 'subject', 'grade', 'id'].filter(key => typeof saved[key] === 'string').map(key => [key, saved[key]])),
        operation: ['create', 'read'].includes(saved.operation) ? saved.operation : current.operation,
        failure: ['none', 'database-unavailable'].includes(saved.failure) ? saved.failure : current.failure,
        level: ['basic', 'technical'].includes(saved.level) ? saved.level : current.level,
        speed: ['0.5', '1', '1.5', '2'].includes(saved.speed) ? saved.speed : current.speed,
      }));
    } catch { /* Preferências inválidas não impedem a exploração. */ }
  }, []);

  function update(key, value) { setSettings(current => ({ ...current, [key]: value })); setNotice(''); }

  function choose(preset) {
    pause();
    reset();
    setExecution(null);
    setSettings(current => ({ ...defaults, level: current.level, speed: current.speed, ...preset.settings }));
    setConfigTab(preset.settings.failure ? 'Falhas' : 'Entrada');
    setError('');
    setNotice('Exemplo preparado. Execute para acompanhar cada etapa.');
  }

  async function run(event) {
    event.preventDefault();
    if (busy) return;
    pause(); setBusy(true); setError(''); setNotice('');
    const inputs = settings.operation === 'read' ? { id: Number(settings.id) }
      : { student: settings.student, subject: settings.subject, grade: settings.grade.trim() === '' ? null : Number(settings.grade) };
    const submitted = { operation: settings.operation, inputs, failure: settings.failure };
    try {
      const response = await fetch('/api/school/validation/simulations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(submitted),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(`A API do simulador rejeitou a configuração (HTTP ${response.status}). Confira a operação e o ID, que deve ser um inteiro positivo. Esse erro não é o resultado didático da cena.`);
      if (!Array.isArray(data?.steps) || !data.steps.length || !data.simulatedResponse) throw Error('O simulador retornou uma sequência inválida. Tente novamente.');
      setExecution({ request: submitted, data }); reset(true);
    } catch (problem) {
      setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador. Verifique se o backend está disponível. Isso não representa a falha da secretaria na aula.' : problem.message);
    } finally { setBusy(false); }
  }

  function saveSettings() {
    try { localStorage.setItem(settingsKey, JSON.stringify(settings)); setNotice('Configuração salva neste navegador. Os registros são reiniciados a cada execução.'); }
    catch { setNotice('Não foi possível salvar a configuração.'); }
  }

  return <>
    <BackendSimulationHeading scenario="validation" title="Validação e tratamento de erros" eyebrow="Backend · Regras e respostas" description="Entenda onde um problema é identificado e como a aplicação o transforma em uma resposta útil." unlocked={quizUnlocked} onOpen={pause} />
    <section className="validation-presets" aria-labelledby="validation-examples-title"><h2 id="validation-examples-title">Escolha um exemplo para explorar</h2><div>{presets.map(preset => <button type="button" key={preset.title} disabled={busy} onClick={() => choose(preset)}><strong>{preset.title}</strong><span>{preset.description}</span></button>)}</div></section>
    <div className="school-simulation-grid">
      <MotionReveal as="section" className="school-stage" aria-labelledby="validation-stage-title">
        <div className="school-panel-bar"><h2 id="validation-stage-title">Da conferência à resposta</h2><span className="school-run-status">{busy ? 'Preparando…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Pronta para começar'}</span></div>
        <SchoolRoom step={step} playback={playback} />
        <div className="validation-receipt" aria-live="polite">
          <small>{responseBody ? last ? 'RESPOSTA ENVIADA' : 'RESPOSTA PREPARADA PELO TRATADOR' : state?.exception ? 'FLUXO NORMAL INTERROMPIDO' : 'ACOMPANHAMENTO DA SOLICITAÇÃO'}</small>
          <h3>{state?.responseStatus ? `HTTP ${state.responseStatus} · ${state.responseStatus >= 400 ? 'Operação não concluída' : 'Operação concluída'}` : state?.exception ? 'Problema identificado; resposta ainda não preparada' : 'A ficha de retorno será preparada durante a execução'}</h3>
          {state?.exception && <p className="validation-exception">Exceção representada: <code>{state.exception}</code> · {state.handled ? 'tratada' : 'aguardando tratamento'}</p>}
          {state?.fieldErrors?.length > 0 && <ul className="validation-fields">{state.fieldErrors.map((item, index) => <li key={`${item.field}-${index}`}><strong>{item.field}:</strong> {item.message}</li>)}</ul>}
          {responseBody && <><p>{state.responseStatus >= 400 ? responseBody.message : `Nota de ${responseBody.student} em ${responseBody.subject}.`}</p>{responseBody.code && <p className="validation-error-code">{responseBody.code} · {responseBody.path}</p>}</>}
          {!responseBody && !state?.exception && <p>Observe a validação, o acesso à secretaria e, quando necessário, o tratamento do problema.</p>}
        </div>
        <div className="school-caption" aria-live="polite"><small>{step ? `${roles[step.actor]} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : 'Validação, exceção e tratamento'}</small><p>{step?.caption?.[settings.level] || 'Escolha um exemplo ou personalize os dados. A cena mostra por que cada resultado exige uma resposta diferente.'}</p></div>
        <div className="school-playbar" aria-label="Controles de reprodução">
          <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
          <button type="button" aria-label="Etapa anterior" disabled={!execution || cursor.index === 0 || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
          <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
          <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
          <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
          <label>Velocidade <select value={settings.speed} onChange={event => update('speed', event.target.value)}>{['0.5', '1', '1.5', '2'].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
        </div>
      </MotionReveal>
      <MotionReveal as="aside" className="school-config" delay={.08} aria-labelledby="validation-config-title">
        <div className="school-panel-bar"><h2 id="validation-config-title">Configuração</h2></div>
        <form onSubmit={run} noValidate>
          <div className="school-tabs" aria-label="Configuração do exemplo">{['Entrada', 'Falhas'].map(tab => <button type="button" key={tab} aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}</div>
          {configTab === 'Entrada' ? <>
            <label>Operação<select value={settings.operation} onChange={event => update('operation', event.target.value)}><option value="create">Cadastrar nota · POST</option><option value="read">Consultar nota · GET</option></select></label>
            {settings.operation === 'create' ? <>
              <label>Nome do aluno<input value={settings.student} maxLength={121} onChange={event => update('student', event.target.value)} /></label>
              <label>Disciplina<input value={settings.subject} maxLength={121} onChange={event => update('subject', event.target.value)} /></label>
              <label>Nota<input type="number" step="any" inputMode="decimal" value={settings.grade} onChange={event => update('grade', event.target.value)} /></label>
              <small className="school-field-help">Deixe campos vazios ou experimente nota 11. Nomes aceitam até 120 caracteres; 121 permite observar o limite.</small>
            </> : <><label>ID da nota<input type="number" step="1" value={settings.id} onChange={event => update('id', event.target.value)} /></label><small className="school-field-help">ID 1 existe. Use outro inteiro positivo para observar 404. IDs inválidos são erros de configuração do simulador.</small></>}
          </> : <><label>Condição da secretaria<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal</option><option value="database-unavailable">Banco de dados indisponível</option></select></label><p className="school-config-note">Campos inválidos interrompem o cadastro antes de acessar a secretaria, mesmo com esta falha ativada.</p></>}
          <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
          <button className="school-primary" disabled={busy}>{busy ? 'Preparando simulação…' : '▶ Executar exemplo'}</button>
          <button type="button" className="school-save" onClick={saveSettings}>Salvar configuração</button>
          {error && <p role="alert" className="school-message school-error">{error}</p>}{notice && <p role="status" className="school-message">{notice}</p>}
        </form>
      </MotionReveal>
    </div>
    <MotionReveal as="section" className="school-inspector" aria-labelledby="validation-inspector-title">
      <div className="school-panel-bar school-inspector-bar"><h2 id="validation-inspector-title">Inspetor</h2><div className="school-tabs" aria-label="Dados da simulação">{['HTTP', 'Código', 'Estado', 'Histórico', 'Contexto/Objetivo'].map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div></div>
      <div className="school-inspector-content">
        {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario="validation" /> : detail === 'HTTP' ? <>
          <p className="school-http-note">O pedido abaixo pertence à aula. A API real <code>POST /api/school/validation/simulations</code> retorna 200 ao calcular as etapas, mesmo quando o resultado didático é 400, 404 ou 503.</p>
          <div className="school-http-grid"><div><small>REQUISIÇÃO SIMULADA</small><h3>{operation === 'create' ? 'POST' : 'GET'} {route}</h3><pre>{request ? operation === 'read' ? 'Sem corpo. O ID está na rota.' : pretty(request.inputs) : 'Execute um exemplo para acompanhar a requisição.'}</pre></div><div><small>RESPOSTA SIMULADA</small><h3>{execution && last ? `HTTP ${execution.data.simulatedResponse.status}` : 'Aguardando envio'}</h3><pre>{execution && last ? pretty(execution.data.simulatedResponse.body) : 'A resposta enviada aparece ao final. A ficha da cena mostra sua preparação.'}</pre></div></div>
        </> : detail === 'Código' ? <>
          <p className="school-http-note">Trecho Java didático da etapa atual. O simulador não executa as anotações, as exceções nem SQL real.</p>
          {step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, index) => <span key={index} className={index + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(index + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Execute um exemplo para acompanhar o código.</p>}
        </> : detail === 'Estado' ? <>
          <p className="school-http-note">Snapshot da etapa selecionada. Cada execução começa com uma nota fictícia (ID 1); somente um cadastro válido acrescenta o ID 2. Falhas e consultas preservam os registros.</p>
          <pre>{state ? pretty(state) : 'Execute um exemplo para acompanhar registros, campos inválidos, exceção e resposta.'}</pre>
        </> : <>
          <p className="school-http-note">Selecione uma etapa para revisar a origem do problema e sua tradução em resposta, sem refazer a chamada.</p>
          {steps.length ? <ol className="school-history">{steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id} className={index === cursor.index ? 'is-current' : ''}><button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => jump(index)}><span>Etapa {index + 1} · {roles[item.actor]}</span><strong>{item.dialogue}</strong></button><p>{item.history[settings.level]}</p><small>{item.state.records.length} registro(s) · {item.state.exception ? item.state.handled ? 'Exceção tratada' : 'Exceção aguardando tratamento' : 'Sem exceção'}</small></li>)}</ol> : <p>Execute um exemplo para começar o histórico.</p>}
        </>}
      </div>
    </MotionReveal>
    <p className="school-session-note">Dados fictícios e execução independente do CRUD e do DTO. Nenhum registro acadêmico real é alterado. O erro exibido na cena é parte da aula; uma falha real ao acessar a API aparece na configuração.</p>
  </>;
}
