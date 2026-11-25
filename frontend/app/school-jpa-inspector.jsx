const pretty = value => JSON.stringify(value, null, 2);

/** Separa o estado persistido, o SQL ilustrativo e as respostas das duas sessões. */
export default function SchoolJpaInspector({ detail, step, inputs }) {
  const state = step?.state;

  if (detail === 'Estado') {
    return <>
      <p className="school-http-note">{state?.session === 'read'
        ? 'Sessão de leitura. Compare o objeto disponível nesta sessão com a linha conservada na tabela.'
        : 'Sessão de escrita. Compare o objeto preparado na aplicação e as linhas confirmadas no banco.'}</p>
      <div className="school-http-grid">
        <div><h3>Entidade Nota</h3><pre>{state?.entity ? pretty(state.entity) : 'Nenhuma entidade carregada.'}</pre></div>
        <div><h3>Tabela notas</h3><pre>{state?.rows.length ? pretty(state.rows) : 'Nenhuma linha gravada.'}</pre></div>
      </div>
    </>;
  }

  if (detail === 'SQL') {
    const sql = step?.sql;
    return <>
      <p className="school-http-note">SQL ilustrativo da etapa. Cada <code>?</code> recebe o parâmetro correspondente, na ordem exibida.</p>
      {sql ? <div className="school-http-grid">
        <div><h3>Comando</h3><pre>{sql.statement}</pre></div>
        <div><h3>Parâmetros</h3><pre>{pretty(sql.parameters)}</pre></div>
      </div> : <p>Esta etapa não apresenta um comando SQL. Confira a gravação e a consulta no histórico.</p>}
    </>;
  }

  return <>
    <p className="school-http-note">O POST e o GET abaixo pertencem à demonstração. A API <code>POST /api/school/jpa/simulations</code> retorna 200 ao calcular as duas sessões, inclusive quando o cadastro didático falha.</p>
    <div className="school-http-grid">
      <div><small>SESSÃO DE ESCRITA</small><h3>POST /notas</h3>
        <pre>{inputs ? pretty(inputs) : 'Execute a simulação para acompanhar a entrada.'}</pre>
        <p>{state?.writeResponse ? `Resposta HTTP ${state.writeResponse.status}` : 'Aguardando cadastro'}</p>
        {state?.writeResponse && <pre>{pretty(state.writeResponse.body)}</pre>}
      </div>
      <div><small>SESSÃO DE LEITURA</small><h3>GET /notas/{state?.lookupId ?? '{id}'}</h3>
        <p>{state?.readResponse ? `Resposta HTTP ${state.readResponse.status}`
          : state?.lookupId ? 'Consulta em andamento' : 'A consulta começa após a confirmação do cadastro.'}</p>
        {state?.readResponse && <pre>{pretty(state.readResponse.body)}</pre>}
      </div>
    </div>
  </>;
}
