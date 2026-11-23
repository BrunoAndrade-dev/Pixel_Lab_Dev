'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SchoolRoom from './school-room';
import MotionReveal from './motion-reveal';
import useSimulationPlayback from './use-simulation-playback';
import { schoolStepDuration } from './school-scene.mjs';

const operations = {
  create: { label: 'Cadastrar', method: 'POST', title: 'Create — Cadastrar nota' },
  read: { label: 'Consultar', method: 'GET', title: 'Read — Consultar nota' },
  update: { label: 'Atualizar', method: 'PUT', title: 'Update — Atualizar nota' },
  delete: { label: 'Excluir', method: 'DELETE', title: 'Delete — Excluir nota' },
};
const roles = { student: 'Aluno', teacher: 'Professor', office: 'Secretaria' };
const defaultSettings = { operation: 'create', student: 'Ana', subject: 'Matemática', grade: '8.5', id: '1', failure: 'none', level: 'basic', speed: '1' };
const settingsKey = 'nara-lab.school.settings.v1';
const emptySession = { records: [], nextId: 1 };
const pretty = value => JSON.stringify(value, null, 2);

/** Mantém a sessão de notas separada dos snapshots usados para revisar a execução. */
export default function SchoolSimulator() {
  const [settings, setSettings] = useState(defaultSettings);
  const [session, setSession] = useState(emptySession);
  const [execution, setExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState('HTTP');
  const [configTab, setConfigTab] = useState('Entrada');
  const sequence = useRef(0);
  const committed = useRef(null);
  const steps = execution?.data.steps || [];
  const durationForStep = useCallback(item => item === steps.at(-1) && (!item?.motion || item.motion === 'idle') ? 1000 : schoolStepDuration, [steps]);
  const playback = useSimulationPlayback(steps, settings.speed, undefined, durationForStep);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const shownState = step?.state || session;
  const operation = operations[settings.operation];
  const submitted = execution?.request;
  const submittedOperation = operations[submitted?.operation || settings.operation];
  const route = (submitted?.operation || settings.operation) === 'create' ? '/notas' : `/notas/${submitted?.inputs.id ?? settings.id}`;

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey));
      if (!saved || typeof saved !== 'object') return;
      setSettings(current => ({
        ...current,
        ...Object.fromEntries(['student', 'subject', 'grade', 'id'].filter(key => typeof saved[key] === 'string').map(key => [key, saved[key]])),
        operation: Object.hasOwn(operations, saved.operation) ? saved.operation : current.operation,
        failure: ['none', 'database-unavailable'].includes(saved.failure) ? saved.failure : current.failure,
        level: ['basic', 'technical'].includes(saved.level) ? saved.level : current.level,
        speed: ['0.5', '1', '1.5', '2'].includes(saved.speed) ? saved.speed : current.speed,
      }));
    } catch { /* Configurações ausentes ou antigas não impedem o estudo. */ }
  }, []);

  useEffect(() => {
    if (!execution || !last || cursor.index !== execution.data.steps.length - 1 || committed.current === execution.id) return;
    // Saltar ao fim confirma imediatamente; reprodução automática confirma após terminar a etapa.
    if (cursor.animate && (playing || cursor.clock.elapsed < durationForStep(step))) return;
    committed.current = execution.id;
    const final = execution.data.finalState;
    setSession({ records: final.records, nextId: final.nextId });
    if (execution.request.operation === 'create' && execution.data.simulatedResponse.status === 201) {
      const created = final.records.at(-1);
      if (created) setSettings(current => ({ ...current, id: String(created.id) }));
    }
  }, [execution, last, cursor, playing, durationForStep, step]);

  function update(key, value) {
    setSettings(current => ({ ...current, [key]: value }));
    setNotice('');
  }

  function selectRecord(id) {
    const record = session.records.find(item => item.id === Number(id));
    setSettings(current => ({ ...current, id, ...(record ? { student: record.student, subject: record.subject, grade: String(record.grade) } : {}) }));
  }

  function changeOperation(value) {
    setSettings(current => {
      const selected = session.records.find(record => record.id === Number(current.id));
      return { ...current, operation: value, ...(value === 'update' && selected ? { student: selected.student, subject: selected.subject, grade: String(selected.grade) } : {}) };
    });
    setError('');
    setNotice('');
  }

  async function run(event) {
    event.preventDefault();
    if (busy) return;
    if (execution && committed.current !== execution.id) {
      setError('Conclua a execução atual ou avance até a última etapa antes de iniciar outra operação.');
      return;
    }
    pause();
    setBusy(true);
    setError('');
    setNotice('');
    const inputs = settings.operation === 'create'
      ? { student: settings.student, subject: settings.subject, grade: settings.grade.trim() === '' ? null : Number(settings.grade) }
      : settings.operation === 'update'
        ? { id: Number(settings.id), student: settings.student, subject: settings.subject, grade: settings.grade.trim() === '' ? null : Number(settings.grade) }
        : { id: Number(settings.id) };
    const request = { operation: settings.operation, inputs, ...session, failure: settings.failure };
    try {
      const response = await fetch('/api/school/simulations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw Error(`A API do simulador rejeitou a configuração (HTTP ${response.status}). ${data?.message || 'Confira o ID e os dados enviados.'}`);
      }
      if (!data?.steps?.length || !Array.isArray(data?.finalState?.records)) throw Error('A API do simulador retornou uma sequência inválida. Tente novamente.');
      setExecution({ id: ++sequence.current, request, data });
      reset(true);
    } catch (problem) {
      setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador. Verifique se o servidor está disponível e tente novamente.' : problem.message);
    } finally {
      setBusy(false);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      setNotice('Configuração salva neste navegador. As notas continuam apenas nesta sessão de estudo.');
    } catch { setNotice('Não foi possível salvar a configuração neste navegador.'); }
  }

  const pending = execution && committed.current !== execution.id;
  const canRun = !busy && !pending;

  return (
    <>
      <div className="school-simulation-grid">
        <MotionReveal as="section" className="school-stage" aria-labelledby="school-stage-title">
          <div className="school-panel-bar">
            <h2 id="school-stage-title">Escola em ação</h2>
            <span className="school-run-status">{busy ? 'Preparando…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Pronta para começar'}</span>
          </div>
          <SchoolRoom step={step} playback={playback} />
          <div className="school-caption" aria-live="polite">
            <small>{step ? `${roles[step.actor] || step.actor} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : 'Uma escola, quatro operações'}</small>
            <p>{step?.caption?.[settings.level] || 'Cadastre uma nota e acompanhe o trajeto entre aluno, professor e secretaria.'}</p>
          </div>
          <div className="school-playbar" aria-label="Controles de reprodução">
            <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
            <button type="button" aria-label="Etapa anterior" disabled={!execution || cursor.index === 0 || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
            <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
            <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
            <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
            <label>Velocidade <select value={settings.speed} onChange={event => update('speed', event.target.value)}>{['0.5', '1', '1.5', '2'].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
          </div>
        </MotionReveal>

        <MotionReveal as="aside" className="school-config" delay={0.08} aria-labelledby="school-config-title">
          <div className="school-panel-bar"><h2 id="school-config-title">Configuração</h2></div>
          <form onSubmit={run} noValidate>
            <div className="school-tabs" aria-label="Configuração do exemplo">
              {['Entrada', 'Falhas'].map(tab => <button type="button" key={tab} aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}
            </div>
            {configTab === 'Entrada' ? <>
              <label>Operação<select value={settings.operation} onChange={event => changeOperation(event.target.value)}>{Object.entries(operations).map(([id, item]) => <option key={id} value={id}>{item.title}</option>)}</select></label>
              {settings.operation !== 'create' && <>
                <label>Nota da sessão<select value={session.records.some(record => record.id === Number(settings.id)) ? settings.id : ''} onChange={event => event.target.value && selectRecord(event.target.value)}><option value="">Selecionar registro</option>{session.records.map(record => <option key={record.id} value={record.id}>#{record.id} · {record.student} · {record.subject}</option>)}</select></label>
                <label>ID da nota<input type="number" step="1" inputMode="numeric" value={settings.id} onChange={event => selectRecord(event.target.value)} /></label>
                <small className="school-field-help">Informe um ID positivo. Um ID inexistente permite observar a resposta 404.</small>
              </>}
              {['create', 'update'].includes(settings.operation) && <>
                <label>Nome do aluno<input value={settings.student} onChange={event => update('student', event.target.value)} maxLength={120} /></label>
                <label>Disciplina<input value={settings.subject} onChange={event => update('subject', event.target.value)} maxLength={120} /></label>
                <label>Nota<input type="number" step="any" inputMode="decimal" value={settings.grade} onChange={event => update('grade', event.target.value)} /></label>
                <small className="school-field-help">Valores de 0 a 10. Experimente 11 para acompanhar a validação na sala de aula.</small>
              </>}
              {settings.operation === 'delete' && <p className="school-config-note">Esta operação exclui somente o registro da nota. O aluno não é excluído.</p>}
              <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
            </> : <>
              <label>Condição da secretaria<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal</option><option value="database-unavailable">Banco de dados indisponível</option></select></label>
              <p className="school-config-note">A indisponibilidade gera HTTP 503 na demonstração e preserva os registros. A API do simulador continua retornando HTTP 200 quando calcula a sequência.</p>
            </>}
            <button className="school-primary" disabled={!canRun}>{busy ? 'Preparando simulação…' : `▶ ${operation.label} nota`}</button>
            {pending && <p className="school-config-note">Conclua a reprodução ou avance até a última etapa para iniciar outra operação.</p>}
            <button type="button" className="school-save" onClick={saveSettings}>Salvar configuração</button>
            {error && <p role="alert" className="school-message school-error">{error}</p>}
            {notice && <p role="status" className="school-message">{notice}</p>}
          </form>
        </MotionReveal>
      </div>

      <MotionReveal as="section" className="school-inspector" aria-labelledby="school-inspector-title">
        <div className="school-panel-bar school-inspector-bar">
          <h2 id="school-inspector-title">Inspetor</h2>
          <div className="school-tabs" aria-label="Dados da simulação">{['HTTP', 'Código', 'Estado', 'Histórico'].map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div>
        </div>
        <div className="school-inspector-content">
          {detail === 'HTTP' ? <>
            <p className="school-http-note">Requisição representada na demonstração. A sequência é calculada por <code>POST /api/school/simulations</code>.</p>
            <div className="school-http-grid">
              <div><small>REQUISIÇÃO SIMULADA</small><h3><b>{submittedOperation.method}</b> {route}</h3><pre>{step?.state?.requestBody ? pretty(step.state.requestBody) : submittedOperation.method === 'GET' || submittedOperation.method === 'DELETE' ? 'Sem corpo na requisição.' : 'Execute uma operação para acompanhar os dados.'}</pre></div>
              <div><small>RESPOSTA SIMULADA</small><h3>{execution && last ? `HTTP ${execution.data.simulatedResponse.status}` : 'Aguardando resposta'}</h3><pre>{execution && last ? execution.data.simulatedResponse.status === 204 ? 'Sem conteúdo. O registro da nota foi excluído.' : pretty(execution.data.simulatedResponse.body) : 'A resposta aparece ao final da sequência.'}</pre></div>
            </div>
          </> : detail === 'Código' ? <>
            <p className="school-http-note">Trecho Java didático que representa a etapa atual.</p>
            {step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, index) => <span key={index} className={index + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(index + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Esta etapa não possui um trecho de código associado.</p>}
          </> : detail === 'Estado' ? <>
            <p className="school-http-note">{execution ? `Snapshot da etapa ${cursor.index + 1}. Voltar no histórico revisa os dados sem executar a operação novamente.` : 'Registros da sessão de estudo. Comece cadastrando uma nota.'}</p>
            <RecordsTable records={shownState.records || []} />
            <p className="school-next-id">Próximo identificador: {shownState.nextId}. Os IDs das notas excluídas não são reutilizados nesta sessão.</p>
          </> : <>
            <p className="school-http-note">Cada etapa explica o que aconteceu, o motivo e os efeitos nos dados. Selecione uma etapa para voltar a ela sem refazer a chamada.</p>
            {steps.length ? <ol className="school-history">
              {steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id ?? index} className={index === cursor.index ? 'is-current' : ''}>
                <button type="button" onClick={() => jump(index)} aria-current={index === cursor.index ? 'step' : undefined}><span>Etapa {index + 1} · {roles[item.actor] || item.actor}</span><strong>{item.dialogue || item.action}</strong></button>
                <p>{item.history?.[settings.level] || item.caption?.[settings.level]}</p>
                <small>{item.state.records.length} registro(s) nesta etapa · próximo ID {item.state.nextId}</small>
              </li>)}
            </ol> : <p>Execute uma operação para começar o histórico detalhado.</p>}
          </>}
        </div>
      </MotionReveal>
      <p className="school-session-note">Notas simuladas em memória, mantidas entre as operações enquanto esta página estiver aberta. Nenhum registro acadêmico real é alterado.</p>
    </>
  );
}

function RecordsTable({ records }) {
  if (!records.length) return <p className="school-empty-state">Nenhuma nota registrada nesta etapa.</p>;
  return <div className="school-table-scroll"><table className="school-records"><caption>Notas guardadas na secretaria</caption><thead><tr><th scope="col">ID</th><th scope="col">Aluno</th><th scope="col">Disciplina</th><th scope="col">Nota</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{record.id}</td><td>{record.student}</td><td>{record.subject}</td><td>{Number(record.grade).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td></tr>)}</tbody></table></div>;
}
