export const jpaLesson = {
  title: 'Como uma nota continua disponível depois do cadastro?',
  concept: 'Persistência é guardar dados para recuperá-los depois. Uma nota pode existir primeiro como um objeto Java e, após a confirmação da gravação, como uma linha em uma tabela.',
  why: 'A aplicação precisa encontrar notas em consultas futuras, mesmo quando o objeto que representava o cadastro já saiu da memória daquela sessão. Acompanhar a escrita e a leitura ajuda a entender em que ponto o registro passa a estar disponível.',
  elements: [
    ['Aluno e avaliação', 'A avaliação fornece aluno, disciplina e nota. Esses dados são enviados em um pedido de cadastro.'],
    ['Professor · aplicação', 'Confere os dados, prepara o objeto Nota e usa o identificador recebido no cadastro para fazer uma nova consulta.'],
    ['Secretaria · repositório e banco', 'A entrega do envelope representa uma chamada ao repositório. O repositório oferece métodos para gravar ou buscar dados, e a ficha da secretaria representa as linhas guardadas no banco.'],
    ['Entidade e tabela', 'A entidade é o objeto Java usado pela aplicação. A tabela organiza dados em colunas e linhas. O mapeamento JPA indica onde cada campo da entidade será guardado.'],
    ['ID e chave primária', 'A chave primária identifica uma linha. Neste exemplo, o banco gera o ID durante a gravação, e a aplicação usa o mesmo valor para localizar a nota.'],
    ['Ficha da tabela', 'O papel mostra uma fotografia da tabela notas na etapa selecionada. Observe a linha após a gravação, o destaque do ID durante a consulta e o estado vazio quando o banco está indisponível.'],
    ['Sessão e confirmação', 'A sessão representa o contexto em que a aplicação acompanha as entidades de uma operação. Ao começar a leitura, a entidade anterior sai de cena e a linha confirmada permanece na tabela.'],
  ],
  connection: 'No código, @Entity identifica a classe mapeada, @Table indica a tabela e @Id marca a chave primária. O JpaRepository oferece save e findById. O exemplo mostra um INSERT durante a gravação e um SELECT durante a leitura. A transação de escrita é confirmada antes de começar a consulta. A ficha e o SQL são representações visuais da sequência simulada.',
  preparation: 'Ajuda ter acompanhado o CRUD na escola ou a aula de DTO. A aba Estado permite comparar os dados mesmo sem experiência prévia com Java ou SQL.',
  prerequisites: [
    ['Objeto, campo e método', 'Um objeto reúne dados. Cada campo guarda um valor, e um método executa uma ação, como salvar ou buscar pelo ID.'],
    ['Linha e coluna', 'Uma linha reúne os dados de um registro. Cada coluna tem um significado, como aluno, disciplina ou nota.'],
    ['INSERT e SELECT', 'INSERT representa a inclusão de uma linha. SELECT representa a consulta de dados. Na aba SQL, compare o comando com os valores de seus parâmetros.'],
  ],
  goals: [
    'Distinguir a entidade em memória de uma linha confirmada na tabela.',
    'Explicar o papel do mapeamento JPA, do repositório e da chave primária.',
    'Mostrar como uma nova sessão recupera a nota pelo ID e o que acontece com a tabela se a gravação falhar.',
  ],
};

export const jpaQuiz = [
  {
    question: 'O professor acabou de criar a entidade Nota. O que o inspetor mostra antes da gravação?',
    options: ['Uma linha definitiva na tabela.', 'Uma entidade com ID nulo e a tabela vazia.', 'Uma resposta GET com a nota.', 'Um cadastro confirmado com HTTP 201.'],
    answer: 1, topic: 'Entidade e linha', study: 'Compare a entidade preparada e a tabela na aba Estado.',
    explanation: 'A entidade existe como objeto da aplicação. A linha aparece na ficha depois da confirmação da gravação.',
  },
  {
    question: 'Qual é a função do mapeamento JPA neste exemplo?',
    options: ['Enviar a nota por HTTP.', 'Decidir a nota de cada aluno.', 'Substituir o banco de dados.', 'Associar a entidade à tabela e seus campos às colunas.'],
    answer: 3, topic: 'Mapeamento JPA', study: 'Revise o trecho Nota.java e localize @Table, @Column e @Id.',
    explanation: 'O mapeamento informa ao provedor JPA como representar os dados do objeto no banco.',
  },
  {
    question: 'Qual método do repositório inicia a gravação da entidade nova?',
    options: ['save', 'findById', 'deleteById', 'count'],
    answer: 0, topic: 'Repositório', study: 'Abra Código na etapa em que a secretaria recebe o pedido de gravação.',
    explanation: 'O serviço chama save para salvar a entidade. No exemplo, ela é nova e o Spring Data JPA usa persist.',
  },
  {
    question: 'Para que serve o ID 1 na ficha da secretaria?',
    options: ['Definir a nota do aluno.', 'Informar quantas vezes o cadastro foi executado.', 'Identificar de forma única a linha consultada.', 'Identificar a disciplina de todas as notas.'],
    answer: 2, topic: 'Chave primária', study: 'Compare o ID na ficha com o parâmetro do SELECT.',
    explanation: 'O ID é a chave primária da linha e permite recuperar o mesmo registro.',
  },
  {
    question: 'Em qual momento a nova sessão pode recuperar a nota neste fluxo?',
    options: ['Ao digitar a nota no formulário.', 'Após a confirmação da transação de escrita.', 'Quando o professor valida os campos.', 'Assim que a entidade é criada em memória.'],
    answer: 1, topic: 'Confirmação da escrita', study: 'Volte à abertura da ficha e compare a etapa do commit com a etapa anterior.',
    explanation: 'A sequência só inicia a leitura depois que a gravação está confirmada e a linha está disponível na tabela.',
  },
  {
    question: 'O que a nova sessão usa para obter a nota quando começa sem a entidade anterior?',
    options: ['O texto do balão do professor.', 'Um novo INSERT com a mesma nota.', 'O número de linhas em memória.', 'findById, com o ID do registro salvo.'],
    answer: 3, topic: 'Consulta em nova sessão', study: 'Acompanhe a abertura da sessão de leitura e a etapa do SELECT na aba SQL.',
    explanation: 'A aplicação usa o ID para localizar a linha existente e carregar a entidade. A consulta preserva a tabela.',
  },
  {
    question: 'Qual comando SQL representa a consulta à tabela neste exemplo?',
    options: ['SELECT com o ID como parâmetro.', 'INSERT com os dados da nota.', 'DELETE com o ID como parâmetro.', 'UPDATE com os campos da entidade.'],
    answer: 0, topic: 'SQL de leitura e escrita', study: 'Compare o INSERT da gravação e o SELECT da leitura na aba SQL.',
    explanation: 'O SELECT busca dados. O INSERT da etapa anterior representa a inclusão da linha.',
  },
  {
    question: 'O que acontece quando o banco está indisponível durante a gravação?',
    options: ['A consulta devolve a nota preparada em memória.', 'O POST confirma 201 e o banco salva depois.', 'O POST didático retorna 503, a tabela fica vazia e a leitura não começa.', 'O cadastro usa o campo nota como ID.'],
    answer: 2, topic: 'Falha na persistência', study: 'Ative Banco de dados indisponível e compare a ficha vazia com a resposta HTTP.',
    explanation: 'A indisponibilidade impede a confirmação da gravação. A entidade preparada continua visível na etapa de falha, com a tabela vazia.',
  },
];
