'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import MotionReveal from './motion-reveal';
import BackendSimulationHeading from './backend-simulation-heading';
import BackendLearningContext from './backend-learning-context';
import useSimulationPlayback from './use-simulation-playback';
import useBackendQuizAccess from './use-backend-quiz-access';
import SchoolTransactionInspector, { TransactionStatus } from './school-transaction-inspector';
import RelationshipRoom from './relationship-room';
import { relationshipTransferDuration } from './relationship-scene.mjs';

const defaults = { studentId: '3', failure: 'none', level: 'basic', speed: '1' };
const key = 'nara-lab.school.transactions.settings.v1';
const pretty = value => JSON.stringify(value, null, 2);
const roles = { teacher: 'Professor', office: 'Secretaria', student: 'Estudante' };

export default function SchoolTransactionSimulator() {
  const [settings, setSettings] = useState(defaults);
  const [session, setSession] = useState(null);
  const [execution, setExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState('Transação');
  const [configTab, setConfigTab] = useState('Entrada');
  const [attempt, setAttempt] = useState(0);
  const sequence = useRef(0);
  const steps = execution?.data.steps || [];
  const duration = useCallback(item => item?.motion === 'student-transfer' ? relationshipTransferDuration : 3500, []);
  const playback = useSimulationPlayback(steps, settings.speed, undefined, duration);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const quizUnlocked = useBackendQuizAccess(playback.completed);
  const shown = step?.state || session;

  useEffect(() => {
    let alive = true;
    setError('');
    fetch('/api/school/transactions/state').then(async response => {
      if (!response.ok) throw Error(`Não foi possível carregar as turmas (HTTP ${response.status}). Reinicie o backend atualizado e tente novamente.`);
      const data = await response.json();
      if (!Array.isArray(data.students) || !Array.isArray(data.classes)) throw Error('O simulador retornou um estado inicial inválido.');
      if (alive) { setSession(data); }
    }).catch(problem => { if (alive) setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador para carregar as turmas.' : problem.message); });
    return () => { alive = false; };
  }, [attempt]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || typeof saved !== 'object') return;
      setSettings(current => ({ ...current,
        studentId: ['1', '2', '3'].includes(saved.studentId) ? saved.studentId : current.studentId,
        failure: ['none', 'history-write-failed', 'database-unavailable'].includes(saved.failure) ? saved.failure : current.failure,
        level: ['basic', 'technical'].includes(saved.level) ? saved.level : current.level,
        speed: ['0.5', '1', '1.5', '2'].includes(saved.speed) ? saved.speed : current.speed,
      }));
    } catch { /* Preferências antigas não impedem a aula. */ }
  }, []);

  function update(field, value) { setSettings(current => ({ ...current, [field]: value })); setNotice(''); }

  async function run(event) {
    event.preventDefault();
    if (!session || busy) return;
    pause(); setBusy(true); setError(''); setNotice('');
    const request = { studentId: Number(settings.studentId), failure: settings.failure };
    try {
      const response = await fetch('/api/school/transactions/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(`A API do simulador rejeitou a configuração (HTTP ${response.status}). Confira o ID do aluno e a condição escolhida.`);
      if (!data?.steps?.length || !Array.isArray(data?.finalState?.students)) throw Error('O simulador retornou uma sequência inválida.');
      setExecution({ id: ++sequence.current, request, data }); reset(true);
    } catch (problem) { setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador. Verifique o servidor e tente novamente.' : problem.message); }
    finally { setBusy(false); }
  }

  function resetExample() {
    pause(); reset(); setExecution(null); setError(''); setNotice('Exemplo reiniciado: três alunos na turma A e histórico de transferências vazio.');
  }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(settings)); setNotice('Preferências salvas. Cada execução começa com os dados iniciais.'); }
    catch { setNotice('Não foi possível salvar a configuração neste navegador.'); }
  }

  const submitted = execution?.request;
  const route = `/alunos/${submitted?.studentId ?? settings.studentId}/transferencias`;

  return <>
    <BackendSimulationHeading scenario="transactions" title="Transações com @Transactional" eyebrow="Backend · Confirmar ou desfazer juntos" description="Transfira um aluno e registre a mudança: descubra por que as duas escritas precisam ser confirmadas juntas e o que acontece se uma delas falhar." unlocked={quizUnlocked} onOpen={pause} />
    <div className="relationship-simulation">
      <MotionReveal as="section" className="school-stage" aria-labelledby="transactions-stage-title">
        <div className="school-panel-bar"><h2 id="transactions-stage-title">Uma transferência · duas escritas</h2><span className="school-run-status">{busy ? 'Preparando…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Compare commit e rollback'}</span></div>
        <RelationshipRoom state={shown} step={step} playback={playback} waitingMovement={step?.action === 'commit' ? steps[cursor.index + 1]?.movement : null} introDialogue="Vamos confirmar a nova turma e o histórico juntos." />
        <div className="transaction-stage-status"><TransactionStatus state={shown} /></div>
        <div className="relationship-occupancy" aria-label="Alunos por turma no snapshot atual">{(shown?.classes || []).map(turma => <div key={turma.id} className={shown.selectedClassId === turma.id ? 'is-selected' : ''}><strong>{turma.name}</strong><span>{shown.students.filter(s => s.classId === turma.id).map(s => s.name).join(', ') || 'Nenhum aluno vinculado'}</span></div>)}</div>
        <div className="school-caption" aria-live="polite"><small>{step ? `${roles[step.actor]} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : 'Antes de começar'}</small><p>{step?.caption?.[settings.level] || 'Cada execução começa com os três alunos em A e o histórico vazio. Compare o funcionamento normal com a falha na segunda escrita: só o commit permite mudar de sala.'}</p></div>
        <div className="school-playbar" aria-label="Controles de reprodução">
          <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
          <button type="button" aria-label="Etapa anterior" disabled={!execution || !cursor.index || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
          <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
          <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
          <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
          <label>Velocidade <select value={settings.speed} onChange={event => update('speed', event.target.value)}>{['0.5', '1', '1.5', '2'].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
        </div>
      </MotionReveal>
      <MotionReveal as="aside" className="school-config" delay={.08} aria-labelledby="transactions-config-title">
        <div className="school-panel-bar"><h2 id="transactions-config-title">Configuração</h2></div>
        <form onSubmit={run} noValidate>
          <div className="school-tabs" aria-label="Configuração do exemplo">{['Entrada', 'Falhas'].map(tab => <button type="button" key={tab} aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}</div>
          {configTab === 'Entrada' ? <>
            <label>Aluno<select value={settings.studentId} onChange={event => update('studentId', event.target.value)}>{(session?.students || []).map(s => <option key={s.id} value={s.id}>{s.name} · ID {s.id}</option>)}</select></label>
            <p className="school-config-note">Destino: Computação B. Toda execução começa com o aluno em A e precisa atualizar o vínculo e registrar a transferência no mesmo banco. Não compartilha a sessão de outras aulas.</p>
          </> : <><label>Condição da operação<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal · commit</option><option value="history-write-failed">Falha ao registrar histórico · rollback</option><option value="database-unavailable">Secretaria indisponível antes das escritas</option></select></label><p className="school-config-note">Na falha do histórico, a primeira escrita já foi preparada, mas o rollback impede confirmar uma transferência pela metade.</p></>}
          <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
          <button className="school-primary" disabled={!session || busy}>{busy ? 'Preparando…' : '▶ Executar simulação'}</button>
          <button type="button" className="school-save" onClick={save}>Salvar configuração</button>
          <button type="button" className="school-save" disabled={!session || busy} onClick={resetExample}>Reiniciar exemplo</button>
          {error && <p role="alert" className="school-message school-error">{error}</p>}
          {!session && !busy && <button type="button" className="school-save" onClick={() => setAttempt(value => value + 1)}>Recarregar turmas</button>}
          {notice && <p role="status" className="school-message">{notice}</p>}
        </form>
      </MotionReveal>
    </div>
    <MotionReveal as="section" className="school-inspector" aria-labelledby="transactions-inspector-title">
      <div className="school-panel-bar school-inspector-bar"><h2 id="transactions-inspector-title">Inspetor</h2><div className="school-tabs" aria-label="Dados da simulação">{['Transação', 'HTTP', 'Código', 'SQL', 'Estado', 'Histórico', 'Contexto/Objetivo'].map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div></div>
      <div className="school-inspector-content">
        {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario="transactions" /> : detail === 'Transação' ? <SchoolTransactionInspector state={shown} /> : detail === 'HTTP' ? <>
          <p className="school-http-note">A API real calcula a sequência em <code>POST /api/school/transactions/simulations</code>. Os pedidos abaixo são representados na aula.</p><div className="school-http-grid"><div><small>REQUISIÇÃO DIDÁTICA</small><h3>POST {route}</h3><pre>{submitted ? pretty({ turmaId: 2 }) : 'Execute uma operação para observar o pedido.'}</pre></div><div><small>RESPOSTA DIDÁTICA</small><h3>{execution && last ? `HTTP ${execution.data.simulatedResponse.status}` : 'Aguardando resposta'}</h3><pre>{execution && last ? pretty(execution.data.simulatedResponse.body) : 'A resposta aparece ao final da sequência.'}</pre></div></div>
        </> : detail === 'SQL' ? <><p className="school-http-note">SQL ilustrativo. Cada interrogação recebe o parâmetro correspondente; o simulador não executa estes comandos.</p>{step?.sql ? <div className="school-http-grid"><div><h3>Comando</h3><pre>{step.sql.statement}</pre></div><div><h3>Parâmetros</h3><pre>{pretty(step.sql.parameters)}</pre></div></div> : <p>Confira Início, Primeira escrita, Registro de histórico, Commit ou Rollback no histórico da reprodução.</p>}</> : detail === 'Código' ? <><p className="school-http-note">Java didático: @Transactional coordena as duas escritas no Service. Os repositórios usam o mesmo banco e a exceção não é suprimida.</p>{step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, index) => <span key={index} className={index + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(index + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Esta etapa mostra apenas o efeito visual, sem executar outro código.</p>}</> : detail === 'Estado' ? <><p className="school-http-note">Snapshot da etapa: students são vínculos confirmados; workingStudents mostra o trabalho da transação; historyRecords e pendingHistory separam transferências confirmadas e pendentes.</p><pre>{shown ? pretty(shown) : 'Carregando os vínculos iniciais…'}</pre></> : <>
          <p className="school-http-note">Cada etapa explica o acontecimento, o motivo e os efeitos. Voltar não repete a atualização.</p>{steps.length ? <ol className="school-history">{steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id} className={index === cursor.index ? 'is-current' : undefined}><button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => jump(index)}><span>Etapa {index + 1} · {roles[item.actor]}</span><strong>{item.dialogue}</strong></button><p>{item.history[settings.level]}</p><small>Turma A: {item.state.students.filter(s => s.classId === 1).length} · Turma B: {item.state.students.filter(s => s.classId === 2).length}</small></li>)}</ol> : <p>Execute um exemplo para observar as duas escritas e a decisão da transação.</p>}
        </>}
      </div>
    </MotionReveal>
    <p className="school-session-note">Cada execução é independente: três alunos em A e histórico vazio. A aula calcula snapshots em memória, sem banco ou transação reais. Ações externas como e-mails não são desfeitas por rollback. Java e SQL são ilustrativos.</p>
  </>;
}
