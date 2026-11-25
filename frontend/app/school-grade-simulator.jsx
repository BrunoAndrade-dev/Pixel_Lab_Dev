'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SchoolRoom from './school-room';
import MotionReveal from './motion-reveal';
import BackendLearningContext from './backend-learning-context';
import BackendSimulationHeading from './backend-simulation-heading';
import useBackendQuizAccess from './use-backend-quiz-access';
import useSimulationPlayback from './use-simulation-playback';
import { schoolStepDuration } from './school-scene.mjs';
import SchoolJpaInspector from './school-jpa-inspector';

const defaults = { student: 'Ana', subject: 'Matemática', grade: '8.5', failure: 'none', level: 'basic', speed: '1' };
const roles = { student: 'Aluno', teacher: 'Professor', office: 'Secretaria' };
const pretty = value => JSON.stringify(value, null, 2);
const representations = [
  { key: 'inputDto', title: 'DTO de entrada', description: 'O que a interface envia', fields: 'student · subject · grade' },
  { key: 'entity', title: 'Entidade', description: 'O modelo interno da aplicação', fields: 'id · student · subject · grade · createdBy · internalNote' },
  { key: 'outputDto', title: 'DTO de saída', description: 'O que aparece no boletim', fields: 'id · student · subject · grade' },
];

const lessons = {
  dto: {
    title: 'Da nota ao boletim',
    eyebrow: 'Backend · Transferência de dados',
    description: 'Entenda o DTO de entrada, a entidade e o DTO de saída acompanhando a emissão de um boletim escolar.',
    stage: 'Da avaliação ao boletim',
    start: 'Simular emissão do boletim',
    initialTab: 'Dados',
    tabs: ['Dados', 'HTTP', 'Código', 'Histórico', 'Contexto/Objetivo'],
    intro: 'Um DTO define os dados transportados em uma entrada ou saída. Execute o exemplo para comparar esses contratos com a entidade.',
    inputNote: 'Estes são os campos do DTO de entrada. O ID e as informações internas são definidos pela aplicação.',
    failureNote: 'Sem persistência, a demonstração retorna 503 e não gera boletim. O objeto preparado pode existir na aplicação sem ter sido salvo.',
    sessionNote: 'Exemplo determinístico com dados fictícios. Cada execução começa vazia e não altera os registros da simulação de CRUD. DTOs definem contratos; validação e seleção explícita dos campos continuam necessárias.',
  },
  jpa: {
    title: 'Persistência com Spring Data JPA',
    eyebrow: 'Backend · Persistência',
    description: 'Acompanhe uma nota da entidade à tabela. Em seguida, consulte o mesmo registro em uma nova sessão.',
    stage: 'Da avaliação à tabela de notas',
    start: 'Simular gravação e consulta',
    initialTab: 'Estado',
    tabs: ['Estado', 'HTTP', 'Código', 'SQL', 'Histórico', 'Contexto/Objetivo'],
    intro: 'Prepare a nota e acompanhe a primeira gravação. A ficha da secretaria vai mostrar a linha salva antes de uma nova sessão recuperar os dados.',
    inputNote: 'A nota será buscada pelo ID atribuído na gravação.',
    failureNote: 'Com o banco indisponível, a ficha abre vazia e a consulta não começa. O POST representado retorna 503.',
    sessionNote: 'Demonstração com dados fictícios. O simulador calcula as etapas em memória. Java e SQL são ilustrativos. Uma nova execução começa com a tabela vazia.',
  },
};

/** Reutiliza as ações, a sala e a avaliação nas aulas escolares que recebem uma nota por execução. */
export default function SchoolGradeSimulator({ scenario }) {
  const lesson = lessons[scenario];
  const jpa = scenario === 'jpa';
  const settingsKey = `nara-lab.school.${scenario}.settings.v1`;
  const [settings, setSettings] = useState(defaults);
  const [execution, setExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(lesson.initialTab);
  const [configTab, setConfigTab] = useState('Entrada');
  const reduced = useReducedMotion();
  const steps = execution?.data.steps || [];
  const duration = useCallback(item => item === steps.at(-1) && item?.motion === 'idle' ? 1500 : schoolStepDuration, [steps]);
  const playback = useSimulationPlayback(steps, settings.speed, undefined, duration);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const quizUnlocked = useBackendQuizAccess(playback.completed);
  const state = step?.state;
  const report = state?.outputDto;
  const tableOpen = jpa && [201, 503].includes(state?.writeResponse?.status);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey));
      if (!saved || typeof saved !== 'object') return;
      setSettings(current => ({ ...current,
        ...Object.fromEntries(['student', 'subject', 'grade'].filter(key => typeof saved[key] === 'string').map(key => [key, saved[key]])),
        failure: ['none', 'database-unavailable'].includes(saved.failure) ? saved.failure : current.failure,
        level: ['basic', 'technical'].includes(saved.level) ? saved.level : current.level,
        speed: ['0.5', '1', '1.5', '2'].includes(saved.speed) ? saved.speed : current.speed,
      }));
    } catch { /* Preferências inválidas não impedem a simulação. */ }
  }, [settingsKey]);

  function update(key, value) {
    setSettings(current => ({ ...current, [key]: value }));
    setNotice('');
  }

  async function run(event) {
    event.preventDefault();
    if (busy) return;
    pause();
    setBusy(true);
    setError('');
    setNotice('');
    const request = { inputs: { student: settings.student, subject: settings.subject,
      grade: settings.grade.trim() === '' ? null : Number(settings.grade) }, failure: settings.failure };
    try {
      const response = await fetch(`/api/school/${scenario}/simulations`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(`A API do simulador rejeitou a configuração (HTTP ${response.status}). Confira os dados enviados.`);
      if (!Array.isArray(data?.steps) || !data.steps.length || !data.simulatedResponse) throw Error('O simulador retornou uma sequência inválida. Tente novamente.');
      setExecution({ request, data });
      reset(true);
    } catch (problem) {
      setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador. Verifique se o servidor está disponível.' : problem.message);
    } finally { setBusy(false); }
  }

  function saveSettings() {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      setNotice('Configuração salva neste navegador. Cada execução continua independente.');
    } catch { setNotice('Não foi possível salvar a configuração.'); }
  }

  return <>
    <BackendSimulationHeading scenario={scenario} title={lesson.title} eyebrow={lesson.eyebrow} description={lesson.description} unlocked={quizUnlocked} onOpen={pause} />
    {!jpa && <div className="dto-concept-strip" aria-label="Representações dos dados">
      {representations.map((item, index) => <div key={item.key} className={state?.[item.key] ? 'dto-concept-ready' : ''}>
        <span>0{index + 1}</span><div><strong>{item.title}</strong><small>{item.description}</small></div>
      </div>)}
    </div>}
    <div className="school-simulation-grid">
      <MotionReveal as="section" className="school-stage" aria-labelledby="grade-stage-title">
        <div className="school-panel-bar"><h2 id="grade-stage-title">{lesson.stage}</h2><span className="school-run-status">{busy ? 'Preparando…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Pronta para começar'}</span></div>
        <SchoolRoom step={step} playback={playback} />
        <div className="dto-report-area" aria-live="polite">
          {tableOpen ? <motion.article className="dto-report jpa-sheet" initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45 }} aria-labelledby="jpa-table-title">
            <header><div><small>SECRETARIA · DEMONSTRAÇÃO</small><h3 id="jpa-table-title">Tabela de notas</h3></div><span>{state.session === 'read' ? 'Sessão de leitura' : 'Sessão de escrita'}</span></header>
            <table aria-labelledby="jpa-table-title">
              <thead><tr><th scope="col">ID</th><th scope="col">Aluno</th><th scope="col">Disciplina</th><th scope="col">Nota</th></tr></thead>
              <tbody>{state.rows.length ? state.rows.map(row => (
                <tr key={row.id} className={state.lookupId === row.id ? 'jpa-selected-row' : undefined}>
                  <th scope="row">{row.id}</th><td>{row.aluno}</td><td>{row.disciplina}</td><td>{Number(row.nota).toLocaleString('pt-BR', { maximumFractionDigits: 20 })}</td>
                </tr>
              )) : <tr className="jpa-empty-row"><td colSpan={4}>Nenhuma linha gravada.</td></tr>}</tbody>
            </table>
            <footer>{state.readResponse ? `Nota de ID ${state.lookupId} recuperada. A linha foi preservada.` : state.lookupId ? `Buscando a nota pelo ID ${state.lookupId}.` : state.rows.length ? 'Linha registrada após a confirmação da gravação.' : 'A secretaria não confirmou a gravação.'}</footer>
          </motion.article> : jpa ? <div className="dto-report-placeholder"><span aria-hidden="true">▤</span><div>
            <strong>{state?.writeResponse ? 'Cadastro recusado' : 'Ficha da tabela fechada'}</strong>
            <p>{state?.writeResponse ? 'Os dados inválidos interromperam o fluxo antes de chegar à secretaria.' : 'A ficha abre quando a secretaria informa o resultado da gravação.'}</p>
          </div></div> : report ? <motion.article className="dto-report" initial={{ opacity: 0, y: reduced ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .45 }} aria-label="Boletim de exemplo: DTO de saída">
            <header><div><small>ESCOLA · DEMONSTRAÇÃO</small><h3>Boletim escolar</h3></div><span>DTO de saída</span></header>
            <dl><div><dt>Aluno</dt><dd>{report.student}</dd></div><div><dt>Registro</dt><dd>#{report.id}</dd></div></dl>
            <table><thead><tr><th scope="col">Disciplina</th><th scope="col">Nota</th></tr></thead><tbody><tr><td>{report.subject}</td><td>{Number(report.grade).toLocaleString('pt-BR', { maximumFractionDigits: 20 })}</td></tr></tbody></table>
            <footer>Somente os campos da resposta. Autoria e observação interna permanecem na entidade.</footer>
          </motion.article> : <div className="dto-report-placeholder"><span aria-hidden="true">▤</span><div><strong>{execution && last ? 'Boletim não emitido' : 'O boletim será preparado aqui'}</strong><p>{execution && last ? 'A operação foi interrompida. Revise o histórico para entender o motivo.' : 'Acompanhe a validação, a entidade e a seleção dos campos da resposta.'}</p></div></div>}
        </div>
        <div className="school-caption" aria-live="polite"><small>{step ? `${roles[step.actor]} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : jpa ? 'Spring Data JPA' : 'DTO · Data Transfer Object'}</small><p>{step?.caption?.[settings.level] || lesson.intro}</p></div>
        <div className="school-playbar" aria-label="Controles de reprodução">
          <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
          <button type="button" aria-label="Etapa anterior" disabled={!execution || cursor.index === 0 || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
          <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
          <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
          <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
          <label>Velocidade <select value={settings.speed} onChange={event => update('speed', event.target.value)}>{['0.5', '1', '1.5', '2'].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
        </div>
      </MotionReveal>
      <MotionReveal as="aside" className="school-config" delay={.08} aria-labelledby="grade-config-title">
        <div className="school-panel-bar"><h2 id="grade-config-title">Configuração</h2></div>
        <form onSubmit={run} noValidate>
          <div className="school-tabs" aria-label="Configuração do exemplo">{['Entrada', 'Falhas'].map(tab => <button key={tab} type="button" aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}</div>
          {configTab === 'Entrada' ? <>
            <label>Nome do aluno<input value={settings.student} maxLength={120} onChange={event => update('student', event.target.value)} /></label>
            <label>Disciplina<input value={settings.subject} maxLength={120} onChange={event => update('subject', event.target.value)} /></label>
            <label>Nota<input type="number" step="any" inputMode="decimal" value={settings.grade} onChange={event => update('grade', event.target.value)} /></label>
            <small className="school-field-help">De 0 a 10. Experimente 11 para observar a validação antes da criação da entidade.</small>
            <p className="school-config-note">{lesson.inputNote}</p>
          </> : <>
            <label>Condição da secretaria<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal</option><option value="database-unavailable">Banco de dados indisponível</option></select></label>
            <p className="school-config-note">{lesson.failureNote}</p>
          </>}
          <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
          <button className="school-primary" disabled={busy}>{busy ? 'Preparando simulação…' : `▶ ${lesson.start}`}</button>
          <button type="button" className="school-save" onClick={saveSettings}>Salvar configuração</button>
          {error && <p role="alert" className="school-message school-error">{error}</p>}
          {notice && <p role="status" className="school-message">{notice}</p>}
        </form>
      </MotionReveal>
    </div>
    <MotionReveal as="section" className="school-inspector" aria-labelledby="grade-inspector-title">
      <div className="school-panel-bar school-inspector-bar"><h2 id="grade-inspector-title">Inspetor</h2><div className="school-tabs" aria-label="Dados da simulação">{lesson.tabs.map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div></div>
      <div className="school-inspector-content">
        {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario={scenario} /> : jpa && ['Estado', 'SQL', 'HTTP'].includes(detail) ? (
          <SchoolJpaInspector detail={detail} step={step} inputs={execution?.request.inputs} />
        ) : detail === 'Dados' ? <>
          <p className="school-http-note">Compare os snapshots da etapa atual. A entidade é exibida aqui para estudo; o cliente da operação demonstrada recebe apenas o DTO de saída.</p>
          <div className="dto-data-grid">{representations.map(item => <section key={item.key}><small>{item.description}</small><h3>{item.title}</h3><p className="dto-field-list">{item.fields}</p><pre>{state?.[item.key] ? pretty(state[item.key]) : 'Ainda não disponível nesta etapa.'}</pre>{item.key === 'entity' && state?.entity && <p className="dto-persistence">{state.persisted ? 'Salva na secretaria · ID atribuído' : 'Preparada na aplicação · ainda não salva · ID 0'}</p>}</section>)}</div>
        </> : detail === 'HTTP' ? <>
          <p className="school-http-note">HTTP da operação representada. A API que calcula os snapshots é <code>POST /api/school/dto/simulations</code> e retorna 200 quando a sequência é calculada, inclusive nos erros didáticos.</p>
          <div className="school-http-grid"><div><small>REQUISIÇÃO SIMULADA · DTO DE ENTRADA</small><h3>POST /notas</h3><pre>{execution ? pretty(execution.request.inputs) : 'Execute a simulação para acompanhar a entrada.'}</pre></div><div><small>RESPOSTA SIMULADA</small><h3>{execution && last ? `HTTP ${execution.data.simulatedResponse.status}` : 'Aguardando resposta'}</h3><pre>{execution && last ? pretty(execution.data.simulatedResponse.body) : 'A resposta aparece ao final da sequência.'}</pre></div></div>
        </> : detail === 'Código' ? <>
          <p className="school-http-note">Java didático da etapa atual. A demonstração não executa este código nem se conecta a um banco real.</p>
          {step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, index) => <span key={index} className={index + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(index + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Execute o exemplo para acompanhar os trechos de código.</p>}
        </> : <>
          <p className="school-http-note">O que aconteceu, por que aconteceu e o que mudou. Selecione uma etapa para revisar sem refazer a chamada.</p>
          {steps.length ? <ol className="school-history">{steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id} className={index === cursor.index ? 'is-current' : undefined}><button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => jump(index)}><span>Etapa {index + 1} · {roles[item.actor]}</span><strong>{item.dialogue}</strong></button><p>{item.history[settings.level]}</p>{!jpa && <small>{item.state.outputDto ? 'DTO de saída disponível' : item.state.persisted ? 'Entidade salva · saída pendente' : item.state.entity ? 'Entidade preparada · sem persistência' : 'Somente DTO de entrada'}</small>}</li>)}</ol> : <p>Execute a simulação para começar o histórico.</p>}
        </>}
      </div>
    </MotionReveal>
    <p className="school-session-note">{lesson.sessionNote}</p>
  </>;
}
