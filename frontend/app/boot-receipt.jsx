export function BootOrderReceipt({ order, compact = false }) {
  if (!order) return <p>Execute um exemplo para registrar a comanda exata do cliente.</p>;
  return <article className={`boot-receipt${compact ? ' is-compact' : ''}`} aria-label={`Comanda completa da mesa ${order.table}`}>
    <header><span>NARA LANCHONETE · EXEMPLO</span><h3>Comanda · mesa {order.table}</h3><p>{order.title}</p></header>
    <h4>Pedido exato do cliente</h4><p className="boot-exact-order">{order.exactOrder}</p>
    <dl><div><dt>Página de exemplo</dt><dd>{order.page} · frontend ilustrativo</dd></div><div><dt>Atendimento HTTP</dt><dd>GET {order.endpoint}</dd></div><div><dt>Porta ilustrativa</dt><dd>{order.port}</dd></div><div><dt>Armazenamento</dt><dd>{order.storage}</dd></div><div><dt>Validação de entrada</dt><dd>{order.validation ? 'Disponível para usar com @Valid e constraints' : 'Fora deste combo'}</dd></div></dl>
    <h4>Bibliotecas do projeto</h4><ul>{order.libraries.map(library => <li key={library}><code>{library}</code></li>)}</ul>
    <h4>application.properties · exemplo</h4><pre>{Object.entries(order.properties).map(([key, value]) => `${key}=${value}`).join('\n')}</pre>
    {order.validation && <p>Usuário <code>sa</code> e senha vazia são dados deste H2 local de demonstração. <code>create-drop</code> cria e remove o esquema ao abrir/fechar a aplicação de exemplo; os dados não sobrevivem ao encerramento.</p>}
    <h4>Componentes escritos pelo desenvolvedor</h4><ul>{order.components.map(component => <li key={component}>{component}</li>)}</ul>
    <footer>Bibliotecas oferecem recursos. O Spring conecta objetos; as regras e a página precisam ser programadas.</footer>
  </article>;
}

export function BootDeliveryReceipt({ state, compact = false }) {
  if (!state?.delivery) return <p>{state?.startupStatus === 'FAILED' ? 'Sem entrega: a inicialização falhou. Confira a comanda e o diagnóstico.' : 'A ficha de entrega aparece somente ao concluir a montagem e o atendimento de teste.'}</p>;
  return <article className={`boot-receipt is-delivery${compact ? ' is-compact' : ''}`} aria-label={`Ficha de entrega da mesa ${state.order.table}`}>
    <header><span>ENTREGA CONCLUÍDA · SIMULAÇÃO</span><h3>{state.delivery.title}</h3></header>
    <p className="boot-exact-order">{state.delivery.exactSummary}</p><h4>Recursos entregues</h4><ul>{state.delivery.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
    <h4>Objetos conectados</h4><ul>{state.beans.map(bean => <li key={bean.id}><code>{bean.id}</code>{bean.dependencies.length > 0 ? ` recebe ${bean.dependencies.join(', ')}` : ' · disponível no contexto'}</li>)}</ul>
    <h4>Configuração utilizada</h4><pre>{Object.entries(state.order.properties).map(([key, value]) => `${key}=${value}`).join('\n')}</pre>
    <footer>Aplicação e porta ilustrativas. Esta aula não publica um sistema, não cria um servidor e não gera uma página real.</footer>
  </article>;
}

export function BootOrdersPage({ state }) {
  return <section className="boot-page-preview" aria-label="Prévia ilustrativa da página Pedidos">
    <div className="boot-page-address">Frontend de exemplo · /pedidos</div><h3>Pedidos</h3>
    {state?.httpResult ? <><p>Dados recebidos de <code>GET {state.httpResult.path}</code> · HTTP {state.httpResult.status}</p><ul>{state.httpResult.body.map(item => <li key={item.id}><strong>Pedido #{item.id}</strong><p>{item.descricao}</p><span>{item.status}</span></li>)}</ul></> : <p>{state?.startupStatus === 'FAILED' ? 'Indisponível: a aplicação de exemplo não terminou de inicializar.' : 'Aguardando a inicialização e a consulta HTTP de demonstração.'}</p>}
    <small>Prévia visual: @RestController fornece dados pela API; ele não gera esta página HTML.</small>
  </section>;
}
