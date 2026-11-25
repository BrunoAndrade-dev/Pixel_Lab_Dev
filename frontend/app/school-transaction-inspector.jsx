const statusLabels = { IDLE: 'Antes de começar', ACTIVE: 'Em andamento · sem confirmação', COMMITTED: 'Commit · alterações confirmadas', ROLLED_BACK: 'Rollback · alterações desfeitas' };

export function TransactionStatus({ state }) {
  return <span className={`transaction-status is-${(state?.transactionStatus || 'IDLE').toLowerCase()}`}>{statusLabels[state?.transactionStatus || 'IDLE']}</span>;
}

function Students({ students, caption }) {
  return <div className="school-table-scroll"><table className="school-records"><caption>{caption}</caption><thead><tr><th scope="col">Aluno</th><th scope="col">Turma</th></tr></thead><tbody>{(students || []).map(student => <tr key={student.id}><td>{student.name} · ID {student.id}</td><td>{student.classId === 1 ? 'A' : 'B'}</td></tr>)}</tbody></table></div>;
}

function Transfers({ records, caption }) {
  return <div><h4>{caption}</h4>{records?.length ? <div className="school-table-scroll"><table className="school-records"><thead><tr><th scope="col">ID</th><th scope="col">Aluno ID</th><th scope="col">Origem</th><th scope="col">Destino</th></tr></thead><tbody>{records.map(record => <tr key={record.id}><td>{record.id}</td><td>{record.studentId}</td><td>A</td><td>B</td></tr>)}</tbody></table></div> : <p className="transaction-empty">Nenhuma transferência neste quadro.</p>}</div>;
}

export default function SchoolTransactionInspector({ state }) {
  return <div className="transaction-inspector">
    <p>Uma transferência exige <strong>duas escritas no mesmo banco</strong>: atualizar a turma do aluno e acrescentar uma linha na tabela de transferências.</p>
    <TransactionStatus state={state} />
    <div className="school-http-grid transaction-comparison">
      <section className="transaction-confirmed"><h3>Dados confirmados</h3><p>São os vínculos que determinam o destino dos estudantes. Após o commit, a próxima etapa representa a caminhada até esse destino.</p><Students students={state?.students} caption="Ficha de alunos confirmada" /><Transfers records={state?.historyRecords} caption="Ficha de transferências confirmada" /></section>
      <section className="transaction-working"><h3>Área de trabalho da transação</h3><p>Enquanto a transação está em andamento, estas escritas ainda podem ser desfeitas. SQL enviado não significa commit.</p><Students students={state?.workingStudents} caption="Vínculos na área de trabalho" /><Transfers records={state?.pendingHistory} caption="Transferências pendentes de confirmação" /></section>
    </div>
    <p className="school-session-note">A área de trabalho é uma representação didática. Não é outra sala nem outro banco. Depois do commit, não há histórico pendente; depois do rollback, o trabalho volta aos vínculos iniciais. O Histórico da reprodução registra a explicação das etapas e não é a tabela de transferências.</p>
  </div>;
}
