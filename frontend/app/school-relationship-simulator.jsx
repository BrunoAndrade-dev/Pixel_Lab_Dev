'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import MotionReveal from './motion-reveal';
import BackendSimulationHeading from './backend-simulation-heading';
import BackendLearningContext from './backend-learning-context';
import useSimulationPlayback from './use-simulation-playback';
import useBackendQuizAccess from './use-backend-quiz-access';
import RelationshipRoom from './relationship-room';
import { relationshipTransferDuration } from './relationship-scene.mjs';

const defaults = { operation: 'transfer', studentId: '3', classId: '2', failure: 'none', level: 'basic', speed: '1' };
const key = 'nara-lab.school.relationships.settings.v1';
const pretty = value => JSON.stringify(value, null, 2);
const roles = { teacher: 'Professor', office: 'Secretaria', student: 'Estudante' };

export default function SchoolRelationshipSimulator() {
  const [settings, setSettings] = useState(defaults);
  const [session, setSession] = useState(null);
  const [execution, setExecution] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState('Relações');
  const [configTab, setConfigTab] = useState('Entrada');
  const [attempt, setAttempt] = useState(0);
  const initial = useRef(null), committed = useRef(null), sequence = useRef(0);
  const steps = execution?.data.steps || [];
  const duration = useCallback(item => item?.motion === 'student-transfer' ? relationshipTransferDuration : 3500, []);
  const playback = useSimulationPlayback(steps, settings.speed, undefined, duration);
  const { step, cursor, playing, last, jump, reset, toggle, pause } = playback;
  const quizUnlocked = useBackendQuizAccess(playback.completed);
  const shown = step?.state || session;
  const pending = execution && committed.current !== execution.id;

  useEffect(() => {
    let alive = true;
    setError('');
    fetch('/api/school/relationships/state').then(async response => {
      if (!response.ok) throw Error(`Não foi possível carregar as turmas (HTTP ${response.status}). Reinicie o backend atualizado e tente novamente.`);
      const data = await response.json();
      if (!Array.isArray(data.students) || !Array.isArray(data.classes)) throw Error('O simulador retornou um estado inicial inválido.');
      if (alive) { initial.current = data; setSession(data); }
    }).catch(problem => { if (alive) setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador para carregar as turmas.' : problem.message); });
    return () => { alive = false; };
  }, [attempt]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (!saved || typeof saved !== 'object') return;
      setSettings(current => ({ ...current,
        operation: ['transfer', 'read'].includes(saved.operation) ? saved.operation : current.operation,
        studentId: ['1', '2', '3'].includes(saved.studentId) ? saved.studentId : current.studentId,
        classId: ['1', '2', '99'].includes(saved.classId) ? saved.classId : current.classId,
        failure: ['none', 'database-unavailable'].includes(saved.failure) ? saved.failure : current.failure,
        level: ['basic', 'technical'].includes(saved.level) ? saved.level : current.level,
        speed: ['0.5', '1', '1.5', '2'].includes(saved.speed) ? saved.speed : current.speed,
      }));
    } catch { /* Preferências antigas não impedem a aula. */ }
  }, []);

  useEffect(() => {
    if (!execution || !last || committed.current === execution.id) return;
    if (cursor.animate && (playing || cursor.clock.elapsed < duration(step))) return;
    committed.current = execution.id;
    setSession(execution.data.finalState);
  }, [execution, last, cursor, playing, duration, step]);

  function update(field, value) { setSettings(current => ({ ...current, [field]: value })); setNotice(''); }

  async function run(event) {
    event.preventDefault();
    if (!session || busy || pending) return;
    pause(); setBusy(true); setError(''); setNotice('');
    const request = { operation: settings.operation, studentId: Number(settings.studentId), classId: Number(settings.classId), students: session.students, failure: settings.failure };
    try {
      const response = await fetch('/api/school/relationships/simulations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw Error(`A API do simulador rejeitou a configuração (HTTP ${response.status}). Isso é diferente de um erro didático de turma inexistente.`);
      if (!data?.steps?.length || !Array.isArray(data?.finalState?.students)) throw Error('O simulador retornou uma sequência inválida.');
      setExecution({ id: ++sequence.current, request, data }); reset(true);
    } catch (problem) { setError(problem instanceof TypeError ? 'Não foi possível acessar a API do simulador. Verifique o servidor e tente novamente.' : problem.message); }
    finally { setBusy(false); }
  }

  function resetClasses() {
    if (!initial.current) return;
    pause(); reset(); setExecution(null); committed.current = null; setSession(initial.current);
    setError(''); setNotice('Turmas reiniciadas: os três alunos estão vinculados à turma A.');
  }

  function save() {
    try { localStorage.setItem(key, JSON.stringify(settings)); setNotice('Preferências salvas. Os vínculos existem apenas nesta visita à página.'); }
    catch { setNotice('Não foi possível salvar a configuração neste navegador.'); }
  }

  const submitted = execution?.request;
  const operation = submitted?.operation || settings.operation;
  const route = operation === 'transfer' ? `/alunos/${submitted?.studentId ?? settings.studentId}/turma` : `/turmas/${submitted?.classId ?? settings.classId}/alunos`;

  return <>
    <BackendSimulationHeading scenario="relationships" title="Relacionamentos entre entidades" eyebrow="Backend · Uma turma, vários alunos" description="Duas salas, três estudantes e uma secretaria: descubra como os cadastros se conectam e o que muda em uma transferência." unlocked={quizUnlocked} onOpen={pause} />
    <div className="relationship-simulation">
      <MotionReveal as="section" className="school-stage" aria-labelledby="relationships-stage-title">
        <div className="school-panel-bar"><h2 id="relationships-stage-title">Turma e aluno · 1:N e N:1</h2><span className="school-run-status">{busy ? 'Preparando…' : playing ? 'Reproduzindo' : execution ? 'Em revisão' : 'Explore os vínculos'}</span></div>
        <RelationshipRoom state={shown} step={step} playback={playback} />
        <div className="relationship-occupancy" aria-label="Alunos por turma no snapshot atual">{(shown?.classes || []).map(turma => <div key={turma.id} className={shown.selectedClassId === turma.id ? 'is-selected' : ''}><strong>{turma.name}</strong><span>{shown.students.filter(s => s.classId === turma.id).map(s => s.name).join(', ') || 'Nenhum aluno vinculado'}</span></div>)}</div>
        <div className="school-caption" aria-live="polite"><small>{step ? `${roles[step.actor]} · ${settings.level === 'basic' ? 'Iniciante' : 'Técnico'}` : 'Antes de começar'}</small><p>{step?.caption?.[settings.level] || 'Os três alunos começam na turma A. Execute uma transferência para a turma B ou consulte uma das turmas. A ficha mostra os vínculos que determinam suas posições.'}</p></div>
        <div className="school-playbar" aria-label="Controles de reprodução">
          <button type="button" aria-label="Reiniciar reprodução" disabled={!execution || busy} onClick={() => jump(0)}>↺</button>
          <button type="button" aria-label="Etapa anterior" disabled={!execution || !cursor.index || busy} onClick={() => jump(cursor.index - 1)}>◀</button>
          <button type="button" className="school-play" aria-label={playing ? 'Pausar reprodução' : 'Reproduzir simulação'} disabled={!execution || busy} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button>
          <button type="button" aria-label="Próxima etapa" disabled={!execution || last || busy} onClick={() => jump(cursor.index + 1)}>▶</button>
          <span className="school-step-counter">{execution ? cursor.index + 1 : 0} / {steps.length}</span>
          <label>Velocidade <select value={settings.speed} onChange={event => update('speed', event.target.value)}>{['0.5', '1', '1.5', '2'].map(speed => <option key={speed} value={speed}>{speed}×</option>)}</select></label>
        </div>
      </MotionReveal>
      <MotionReveal as="aside" className="school-config" delay={.08} aria-labelledby="relationships-config-title">
        <div className="school-panel-bar"><h2 id="relationships-config-title">Configuração</h2></div>
        <form onSubmit={run} noValidate>
          <div className="school-tabs" aria-label="Configuração do exemplo">{['Entrada', 'Falhas'].map(tab => <button type="button" key={tab} aria-pressed={configTab === tab} onClick={() => setConfigTab(tab)}>{tab}</button>)}</div>
          {configTab === 'Entrada' ? <>
            <label>Operação<select value={settings.operation} onChange={event => update('operation', event.target.value)}><option value="transfer">Transferir um aluno</option><option value="read">Consultar alunos de uma turma</option></select></label>
            {settings.operation === 'transfer' && <label>Aluno<select value={settings.studentId} onChange={event => update('studentId', event.target.value)}>{(session?.students || []).map(s => <option key={s.id} value={s.id}>{s.name} · ID {s.id} · turma {s.classId === 1 ? 'A' : 'B'}</option>)}</select></label>}
            <label>{settings.operation === 'transfer' ? 'Turma de destino' : 'Turma para consultar'}<select value={settings.classId} onChange={event => update('classId', event.target.value)}><option value="1">Computação A · ID 1</option><option value="2">Computação B · ID 2</option><option value="99">Turma inexistente · ID 99 (exemplo de falha)</option></select></label>
            <p className="school-config-note">Uma turma pode reunir vários alunos. Cada aluno pertence a uma única turma neste exemplo. A transferência preserva o ID do aluno.</p>
          </> : <><label>Condição da secretaria<select value={settings.failure} onChange={event => update('failure', event.target.value)}><option value="none">Funcionamento normal</option><option value="database-unavailable">Banco de dados indisponível</option></select></label><p className="school-config-note">Com a secretaria indisponível, nenhum vínculo muda e nenhum aluno caminha para outra sala.</p></>}
          <label>Nível da legenda<select value={settings.level} onChange={event => update('level', event.target.value)}><option value="basic">Iniciante</option><option value="technical">Técnico</option></select></label>
          <button className="school-primary" disabled={!session || busy || Boolean(pending)}>{busy ? 'Preparando…' : '▶ Executar simulação'}</button>
          {pending && <p className="school-config-note">Conclua a reprodução ou avance até o final para confirmar esta operação antes de começar outra. Saltar não libera o quiz.</p>}
          <button type="button" className="school-save" onClick={save}>Salvar configuração</button>
          <button type="button" className="school-save" disabled={!session || busy} onClick={resetClasses}>Reiniciar turmas</button>
          {error && <p role="alert" className="school-message school-error">{error}</p>}
          {!session && !busy && <button type="button" className="school-save" onClick={() => setAttempt(value => value + 1)}>Recarregar turmas</button>}
          {notice && <p role="status" className="school-message">{notice}</p>}
        </form>
      </MotionReveal>
    </div>
    <MotionReveal as="section" className="school-inspector" aria-labelledby="relationships-inspector-title">
      <div className="school-panel-bar school-inspector-bar"><h2 id="relationships-inspector-title">Inspetor</h2><div className="school-tabs" aria-label="Dados da simulação">{['Relações', 'HTTP', 'Código', 'SQL', 'Estado', 'Histórico', 'Contexto/Objetivo'].map(tab => <button type="button" key={tab} aria-pressed={detail === tab} onClick={() => setDetail(tab)}>{tab}</button>)}</div></div>
      <div className="school-inspector-content">
        {detail === 'Contexto/Objetivo' ? <BackendLearningContext scenario="relationships" /> : detail === 'Relações' ? <>
          <p className="school-http-note">Uma turma → vários alunos (<code>@OneToMany</code>). Vários alunos → uma turma (<code>@ManyToOne</code>). São duas perspectivas do mesmo vínculo. Abaixo, a ficha da secretaria na etapa atual.</p>
          <div className="school-http-grid"><div><h3>Turmas · cadastro de grupos</h3><ul className="relationship-class-list">{(shown?.classes || []).map(turma => <li key={turma.id}><strong>#{turma.id} · {turma.name}</strong><span>{shown.students.filter(s => s.classId === turma.id).length} aluno(s)</span></li>)}</ul></div><div><h3>Alunos · ficha de vínculos</h3><div className="school-table-scroll"><table className="school-records"><caption>turma_id referencia o ID da turma</caption><thead><tr><th scope="col">ID do aluno</th><th scope="col">Nome</th><th scope="col">turma_id</th></tr></thead><tbody>{(shown?.students || []).map(s => <tr key={s.id}><td>{s.id}</td><td>{s.name}</td><td>{s.classId}</td></tr>)}</tbody></table></div></div></div>
          <p className="school-session-note">Aluno ID 1 e turma ID 1 são registros diferentes. A posição na sala ilustra o vínculo confirmado; não é a posição que grava os dados.</p>
        </> : detail === 'HTTP' ? <>
          <p className="school-http-note">A API real calcula a sequência em <code>POST /api/school/relationships/simulations</code>. Os pedidos abaixo são representados na aula.</p><div className="school-http-grid"><div><small>REQUISIÇÃO DIDÁTICA</small><h3>{operation === 'transfer' ? 'PUT' : 'GET'} {route}</h3><pre>{submitted ? operation === 'transfer' ? pretty({ turmaId: submitted.classId }) : 'Sem corpo; o ID da turma está na rota.' : 'Execute uma operação para observar o pedido.'}</pre></div><div><small>RESPOSTA DIDÁTICA</small><h3>{execution && last ? `HTTP ${execution.data.simulatedResponse.status}` : 'Aguardando resposta'}</h3><pre>{execution && last ? pretty(execution.data.simulatedResponse.body) : 'A resposta aparece ao final da sequência.'}</pre></div></div>
        </> : detail === 'SQL' ? <><p className="school-http-note">SQL ilustrativo. Cada interrogação recebe o parâmetro correspondente; o simulador não executa estes comandos.</p>{step?.sql ? <div className="school-http-grid"><div><h3>Comando</h3><pre>{step.sql.statement}</pre></div><div><h3>Parâmetros</h3><pre>{pretty(step.sql.parameters)}</pre></div></div> : <p>Confira a etapa de confirmação da transferência ou a consulta no histórico.</p>}</> : detail === 'Código' ? <><p className="school-http-note">Java didático: entidades, lado proprietário, lado inverso e mudança do vínculo.</p>{step?.code ? <><h3>{step.code.file}</h3><pre className="school-code">{step.code.source.split('\n').map((line, index) => <span key={index} className={index + 1 === step.code.line ? 'school-code-current' : ''}><i>{String(index + 1).padStart(2, ' ')}</i>{line || ' '}{'\n'}</span>)}</pre></> : <p>Esta etapa mostra apenas o efeito visual, sem executar outro código.</p>}</> : detail === 'Estado' ? <><p className="school-http-note">Snapshot completo da etapa selecionada. classId no JSON corresponde à referência turma_id ilustrada no SQL.</p><pre>{shown ? pretty(shown) : 'Carregando os vínculos iniciais…'}</pre></> : <>
          <p className="school-http-note">Cada etapa explica o acontecimento, o motivo e os efeitos. Voltar não repete a atualização.</p>{steps.length ? <ol className="school-history">{steps.slice(0, cursor.index + 1).map((item, index) => <li key={item.id} className={index === cursor.index ? 'is-current' : undefined}><button type="button" disabled={busy} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => jump(index)}><span>Etapa {index + 1} · {roles[item.actor]}</span><strong>{item.dialogue}</strong></button><p>{item.history[settings.level]}</p><small>Turma A: {item.state.students.filter(s => s.classId === 1).length} · Turma B: {item.state.students.filter(s => s.classId === 2).length}</small></li>)}</ol> : <p>Execute uma transferência ou uma consulta para começar.</p>}
        </>}
      </div>
    </MotionReveal>
    <p className="school-session-note">Sessão fictícia em memória. As operações preservam os vínculos durante esta visita; recarregar ou sair da página restaura os três alunos na turma A. Não altera os dados das outras simulações. Java e SQL são ilustrativos.</p>
  </>;
}
