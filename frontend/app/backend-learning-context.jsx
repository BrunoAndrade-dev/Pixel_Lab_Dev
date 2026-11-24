import './backend-learning-context.css';
import { jpaLesson } from './school-jpa-content.mjs';
import { validationLesson } from './school-validation-content.mjs';

const lessons = {
  jpa: jpaLesson,
  validation: validationLesson,
  products: {
    title: 'Como um cadastro funciona por dentro?',
    concept: 'Backend é a parte de uma aplicação que recebe pedidos, aplica regras e trabalha com os dados. Spring Boot é uma ferramenta do ecossistema Java que ajuda a construir essa parte do sistema.',
    why: 'Ao clicar em “Cadastrar”, várias responsabilidades precisam ser cumpridas. Separá-las ajuda a organizar o código, localizar erros e mudar uma regra sem reescrever todo o sistema. Este exemplo acompanha um cadastro do pedido inicial até a resposta.',
    elements: [
      ['Cliente', 'É quem faz o pedido à aplicação, como uma página ou um aplicativo. O personagem representa esse programa solicitando o cadastro; não é a pessoa que escreve o backend.'],
      ['Envelope · requisição e resposta', 'Representa dados passando de uma parte para outra. A requisição é o pedido; a resposta informa o resultado. Dentro do backend, as entregas também representam chamadas de métodos: nem toda entrega é uma nova comunicação pela internet.'],
      ['Controller · ponto de entrada', 'Recebe o pedido externo, encaminha o trabalho e prepara a resposta. Pense nele como a recepção da aplicação.'],
      ['Service · regras do negócio', 'Decide o que pode acontecer. Neste cadastro, confere se há um nome e se o preço é maior que zero antes de tentar salvar. Uma regra de negócio expressa uma necessidade da aplicação.'],
      ['Entity · entidade', 'É o objeto que representa o produto no modelo da aplicação. Um objeto reúne informações relacionadas, como nome e preço. Criar esse objeto ainda não significa guardá-lo no banco.'],
      ['Repository · acesso aos dados', 'Oferece operações para guardar e buscar registros. Ele faz a ligação entre a lógica da aplicação e o armazenamento.'],
      ['Banco de dados', 'É onde os registros ficam armazenados em uma aplicação real. Aqui, o banco é representado por uma lista em memória: cada execução começa vazia.'],
      ['HTTP, POST e /produtos', 'HTTP é um conjunto de regras para pedidos e respostas entre programas. POST indica, neste exemplo, um pedido de criação. /produtos é o endereço da operação na API, a interface que permite a comunicação com o backend.'],
      ['Campos, JSON e status', 'name é o nome e price é o preço. JSON organiza esses campos em um texto que programas conseguem trocar. O status resume o resultado: 201 significa criado; 400, dados recusados; 503, serviço temporariamente indisponível.'],
    ],
    connection: 'Quando o Service recusa um preço negativo, isso representa uma condição no código: “se o preço não for positivo, interrompa o cadastro”. Quando o Repository salva o produto, isso representa uma operação de armazenamento. Os sprites tornam essas responsabilidades visíveis; em uma aplicação, elas são realizadas por código.',
    prerequisites: [
      ['Dados e variáveis', 'Uma variável dá um nome a um valor usado pelo programa. Por exemplo, o preço pode conter 89,90.'],
      ['Condições', 'Um “se” permite escolher o próximo passo de acordo com uma regra, como aceitar somente preços positivos.'],
      ['Objetos e métodos', 'Um objeto reúne dados relacionados. Um método é uma ação definida no código, como validar ou salvar um produto.'],
    ],
    preparation: 'Você pode explorar a cena sem conhecer Java ou Spring Boot. Para acompanhar a aba Código com mais autonomia, ajuda conhecer classes, objetos e métodos em Java.',
    goals: ['Explicar o papel de Controller, Service, Entity, Repository e banco.', 'Distinguir receber um pedido, validar os dados, criar um objeto e salvar um registro.', 'Identificar por que um preço inválido para antes do banco e por que uma falha do banco é outro tipo de problema.'],
  },
  crud: {
    title: 'O que significa trabalhar com os dados de um sistema?',
    concept: 'CRUD reúne quatro operações: Create (criar), Read (consultar), Update (atualizar) e Delete (excluir). Elas aparecem em cadastros de produtos, agendas, sistemas escolares e muitas outras aplicações.',
    why: 'Aprender CRUD ajuda a entender como um programa mantém informações ao longo do uso. Cada operação tem uma intenção diferente: consultar uma nota não deve alterá-la, e corrigir uma nota não deve criar um segundo registro por engano.',
    elements: [
      ['Aluno e prova', 'Representam a origem da informação. A prova dá motivo ao registro de uma nota; o aluno não representa uma camada técnica do backend.'],
      ['Professor e notebook', 'Representam quem prepara a operação e confere suas regras. Na analogia, o professor reúne responsabilidades da aplicação; em um sistema real elas podem estar divididas entre diferentes partes do código.'],
      ['Secretaria', 'Representa a guarda dos registros. Enviar um pedido à secretaria equivale a solicitar uma operação de acesso aos dados. A cena não reproduz toda a estrutura interna de um banco.'],
      ['Registro e seus campos', 'Um registro é um conjunto de dados guardado como uma unidade. Aqui, cada nota tem id (identificador), student (aluno), subject (disciplina) e grade (nota).'],
      ['ID da nota', 'É o número que distingue um registro dos outros, como uma etiqueta. Ele identifica a nota, não o aluno. Duas notas do mesmo aluno podem ter IDs diferentes.'],
      ['Create · cadastrar', 'Cria um registro que ainda não existia e atribui um ID. No exemplo, POST /notas solicita esse cadastro.'],
      ['Read · consultar', 'Busca uma nota pelo ID e devolve seus dados sem mudá-los. GET /notas/1 significa consultar o registro de ID 1.'],
      ['Update · atualizar', 'Corrige os dados de um registro existente e preserva seu ID. Aqui, PUT envia aluno, disciplina e nota juntos: é uma atualização completa.'],
      ['Delete · excluir', 'Remove o registro da nota escolhido pelo ID. DELETE não apaga o aluno nem todos os registros da escola. Nesta sessão, IDs excluídos não são reutilizados.'],
      ['Envelopes e respostas HTTP', 'Os envelopes mostram a circulação dos pedidos e resultados. 201 indica criação; 200, consulta ou atualização concluída; 204, exclusão concluída sem conteúdo de resposta; 400, dados inválidos; 404, nota não encontrada; 503, secretaria indisponível.'],
    ],
    connection: 'No código, consultar significa procurar um registro pelo ID; atualizar significa localizar esse registro e substituir seus dados; excluir significa removê-lo. A tabela do inspetor mostra os efeitos dessas ações. Compare o estado anterior e o posterior para perceber o que cada operação realmente muda.',
    prerequisites: [
      ['Campos e registros', 'Um campo guarda uma informação, como a disciplina. Um registro reúne os campos de uma nota.'],
      ['Listas e identificadores', 'Uma lista reúne vários registros. O ID permite escolher um deles sem depender de sua posição na lista.'],
      ['Condições e funções', 'Condições conferem regras, como nota entre 0 e 10. Funções ou métodos agrupam instruções para realizar uma tarefa.'],
    ],
    preparation: 'Não é necessário conhecer SQL para começar. Para ler os trechos Java, ajuda ter noções de objetos e métodos. Os nomes HTTP das operações são explicados nesta aba.',
    goals: ['Escolher a operação adequada para cadastrar, consultar, corrigir ou remover uma nota.', 'Explicar o papel do ID e distinguir atualizar um registro de criar outro.', 'Reconhecer que consultar preserva os dados e que erros não devem alterar os registros desta simulação.'],
  },
  dto: {
    title: 'Por que a entrada, o registro e a resposta podem ser diferentes?',
    concept: 'DTO significa Data Transfer Object: um objeto usado para transportar um conjunto definido de dados. A entrada informa o que a aplicação recebe; a saída informa o que ela devolve. Esses conjuntos não precisam ter os mesmos campos da entidade usada internamente.',
    why: 'Um sistema costuma guardar informações que não precisam aparecer para quem o utiliza. Separar entrada, entidade e saída ajuda a definir quais dados o cliente pode enviar e quais ele pode receber, sem fazer a interface depender de todos os detalhes internos.',
    elements: [
      ['Aluno e avaliação', 'Representam a origem dos dados da nota. O aluno recebe o boletim; ele não precisa receber todas as informações usadas para organizar o registro.'],
      ['Formulário · DTO de entrada', 'Envia student (aluno), subject (disciplina) e grade (nota). O ID, a autoria e a observação interna não são campos dessa entrada. O DTO é o formato dos dados, não o formulário em si.'],
      ['Professor · validação e conversão', 'Representa a aplicação conferindo os valores e preparando os objetos. Primeiro verifica os dados; depois cria a entidade e, ao final, monta o DTO de saída.'],
      ['Entidade · registro interno', 'Reúne os dados da nota e campos controlados pela aplicação. Neste exemplo, createdBy registra a autoria e internalNote guarda uma observação interna. Preparar uma entidade na memória não significa que ela já foi salva.'],
      ['Secretaria · persistência', 'Representa o armazenamento da entidade completa. Persistir significa guardar os dados. Aqui, isso é simulado em memória; cada execução começa vazia.'],
      ['ID antes e depois de salvar', 'O valor 0 indica, neste modelo didático, que a entidade ainda não recebeu um ID. Ao salvar, o registro recebe o ID 1. Essa escolha é do exemplo; não é uma regra universal de DTOs.'],
      ['Mapeamento', 'É a conversão de uma representação para outra. O código copia campos da entrada para a entidade e seleciona campos da entidade para a saída. Não é necessário usar uma ferramenta especial para fazer essa seleção.'],
      ['Boletim · DTO de saída', 'O papel representa a resposta com id, student, subject e grade. createdBy e internalNote ficam de fora. O DTO é o objeto com esses campos; o boletim é uma forma visual de apresentá-los.'],
      ['JSON, envelopes e HTTP', 'JSON é o texto usado para trocar os campos entre programas. Os envelopes representam a circulação dos dados. POST /notas pede o cadastro; 201 indica criação, 400 indica dados recusados e 503 indica indisponibilidade da secretaria.'],
    ],
    connection: 'Pense no mapeamento de saída como montar um novo objeto escolhendo quatro campos da entidade. A entidade continua com seus campos internos; a resposta usa outro objeto. Ter um DTO não valida nem esconde dados automaticamente: o código precisa validar a entrada e selecionar explicitamente a saída.',
    prerequisites: [
      ['Objetos e campos', 'Um objeto reúne valores relacionados. Seus campos dão nome a cada informação, como aluno e nota.'],
      ['Entrada e saída', 'Entrada é o que uma operação recebe; saída é o que ela devolve. Uma resposta pode acrescentar informações criadas pela aplicação, como o ID.'],
      ['Cadastro e armazenamento', 'Ajuda ter explorado o Create no CRUD escolar: preparar um registro e salvá-lo são momentos diferentes.'],
    ],
    preparation: 'Você pode começar pela comparação dos dados sem conhecer Java. Para acompanhar o código, ajuda entender objetos, métodos e record, uma forma compacta de declarar uma classe de dados em Java.',
    goals: ['Distinguir DTO de entrada, entidade e DTO de saída.', 'Explicar por que o ID aparece na saída e por que os campos internos não aparecem no boletim.', 'Localizar no fluxo a validação, a persistência e o mapeamento, reconhecendo que são responsabilidades diferentes.'],
  },
};

const tools = [
  ['Legenda e nível', 'A legenda acompanha a etapa atual. Iniciante usa explicações diretas; Técnico aproxima a explicação dos termos usados no código.'],
  ['Código', 'Mostra um trecho Java didático relacionado à etapa. O movimento do personagem representa uma ação desse código; o simulador não executa o trecho exibido.'],
  ['Estado ou Dados', 'Mostra um retrato das informações na etapa selecionada, chamado snapshot. Compare etapas para descobrir quando os dados mudam.'],
  ['Histórico e reprodução', 'Permitem revisar o caminho percorrido. Pausar, avançar ou voltar não executa novamente a operação nem faz outra chamada à API.'],
  ['Falhas', 'Permite observar situações em que o objetivo não é concluído. Dados inválidos e armazenamento indisponível são problemas diferentes.'],
];

/** Apoio conceitual estático, disponível antes da primeira execução e independente do histórico. */
export default function BackendLearningContext({ scenario }) {
  const lesson = lessons[scenario];
  return <article className="backend-context" aria-label="Contexto e objetivo da simulação">
    <header className="backend-context-intro"><span>ENTENDA O CONCEITO</span><h3>{lesson.title}</h3><p>{lesson.concept}</p></header>
    <section><h4>Por que aprender isso?</h4><p>{lesson.why}</p></section>
    <section><h4>O que cada elemento representa?</h4><dl className="backend-context-definitions">{lesson.elements.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></section>
    <section className="backend-context-connection"><h4>Da cena para a programação</h4><p>{lesson.connection}</p></section>
    <section><h4>Conhecimentos para acompanhar</h4><p>{lesson.preparation}</p><dl className="backend-context-definitions">{lesson.prerequisites.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></section>
    <section><h4>Como usar o inspetor para estudar</h4><dl className="backend-context-definitions">{tools.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl><p className="backend-context-note">Os status HTTP da escola ou do cadastro são resultados representados na demonstração. A API do simulador, a interface que o navegador usa para pedir o cálculo das etapas, pode retornar 200 mesmo quando a operação demonstrada termina em erro.</p></section>
    <section className="backend-context-goals"><h4>Ao terminar, você deve conseguir…</h4><ul>{lesson.goals.map(goal => <li key={goal}>{goal}</li>)}</ul></section>
  </article>;
}
