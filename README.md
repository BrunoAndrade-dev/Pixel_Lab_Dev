# NARA Lab

O NARA Lab é uma plataforma educativa de simulações interativas. Em uma sala isométrica em pixel art, personagens representam componentes de um sistema para ajudar professores e estudantes a relacionar o que acontece em cada etapa com o código, os dados e o resultado da operação.

## O que a plataforma contempla

- Página inicial responsiva com ícones animados, catálogo por áreas e uma aba **Como funciona** com a proposta didática e orientações para a primeira demonstração.
- Módulo **Backend** com o cenário **Cadastro de Produtos**, que acompanha um `POST /produtos` simulado no Spring Boot. Cliente, Controller, Service, Entity, Repository e Banco têm papéis identificáveis na sala.
- **CRUD na escola**: aluno, professor e secretaria demonstram cadastro, consulta, atualização e exclusão de registros de notas, com histórico detalhado em níveis iniciante e técnico.
- **DTO e boletim escolar**: compare DTO de entrada, entidade e DTO de saída; o boletim exibe somente os campos selecionados para a resposta.
- **Validação e tratamento de erros**: acompanhe a conferência dos campos, a interrupção por exceção e a preparação de uma resposta orientativa, com exemplos de 400, 404 e 503.
- **Persistência com Spring Data JPA**: acompanhe a gravação de uma nota, veja a linha em uma ficha da tabela e consulte o registro em uma nova sessão.
- **Relacionamentos entre entidades**: duas salas de aula, três estudantes e uma secretaria demonstram o vínculo entre aluno e turma, consultas e transferências.
- **Transações com @Transactional**: compare duas escritas confirmadas juntas com o rollback de uma transferência quando a segunda escrita falha.
- **Inicialização e injeção de dependência na lanchonete**: duas mesas representam configurações independentes; o pedido exato, a comanda, os beans e a entrega conectam bibliotecas, propriedades e construtores.
- Módulo **Inteligência Artificial** com a **Biblioteca**, sobre respostas apoiadas em documentação, e a **Hamburgueria**, sobre como a precisão de um prompt muda o atendimento.
- Laboratório em pixel art inspirado na sala real, com estações de trabalho, data center e dez sprites da equipe. Cada execução sorteia seis integrantes distintos, um por papel. Os personagens caminham para entregar o envelope, e Service, Repository e Entity têm postos sentados.
- Configuração de nome, preço, falha simulada, nível da legenda e velocidade. As preferências podem ser salvas no navegador.
- Controles para reproduzir, pausar, retomar, avançar, voltar e reiniciar. O inspetor mostra requisição e resposta HTTP, código Java, estado e histórico da etapa selecionada.
- Aba **Contexto/Objetivo** nas simulações de Backend, disponível antes da execução: explica por que aprender o conceito, o significado dos elementos da cena e os conhecimentos necessários, com definições para iniciantes e objetivos de aprendizagem.
- **Quiz ao lado do título** em cada simulação de Backend: 8 questões, liberadas após reproduzir todas as etapas de uma execução. Saltar ao fim não libera o acesso. A correção explica as respostas, mostra parabéns a partir de 6 acertos (75%) e recomenda o que estudar conforme os erros. A liberação vale durante a visita à página, sem cadastro ou armazenamento de resultados, e o quiz permite novas tentativas.

## Módulo Backend · Guia das simulações

O catálogo em `/modulos/backend` reúne oito simulações. Cada uma tem suas próprias entradas, objetivo e quiz. As cenas, os trechos Java e os resultados HTTP são representações didáticas; não executam o código exibido nem alteram um banco acadêmico real.

### Recursos disponíveis em todas as simulações

| Recurso | Como utilizar |
| --- | --- |
| **Entrada** | Personalize os dados da operação. Os campos específicos estão descritos em cada cenário abaixo. |
| **Falhas** | Alterne entre funcionamento normal e banco/secretaria indisponível para comparar os caminhos da execução. |
| **Nível da legenda** | Escolha **Iniciante** para explicações diretas ou **Técnico** para aproximar a cena dos termos utilizados no código. |
| **Reprodução** | Reproduza, pause, retome, reinicie ou navegue entre as etapas. A velocidade pode ser `0,5×`, `1×`, `1,5×` ou `2×`. Voltar revisa a sequência recebida, sem fazer outra chamada à API. |
| **Salvar configuração** | Salve explicitamente as preferências no navegador. Cada simulação mantém suas próprias preferências; isso não salva os registros nem o resultado do quiz. |
| **HTTP** | Compare a requisição representada e a resposta enviada ao final da sequência. |
| **Código** | Leia o trecho Java da etapa atual, com destaque para a linha relacionada à ação. Os trechos são exemplos para estudo. |
| **Estado / Dados** | Inspecione um retrato dos dados na etapa selecionada, chamado snapshot. O DTO usa a aba **Dados** para comparar entrada, entidade e saída; os demais cenários usam **Estado**. |
| **Histórico** | Revise a sequência de acontecimentos. Nos cenários escolares, cada etapa detalha o que aconteceu, o motivo e os efeitos nos dados, nos níveis iniciante e técnico. |
| **Contexto/Objetivo** | Acesse antes de executar, ao lado de **Histórico**. Explica por que aprender o assunto, o significado dos elementos da cena, a ligação com a programação, os conhecimentos necessários e os objetivos de aprendizagem. |

As entradas e os movimentos respeitam a preferência de movimento reduzido do navegador. No cenário escolar, telas estreitas permitem deslizar horizontalmente para explorar os ambientes.

### Como funciona o quiz

O botão **Quiz** fica ao lado do título de cada simulação. Cada quiz atual contém **8 questões de múltipla escolha**, com uma alternativa por questão.

1. Execute um exemplo e reproduza todas as suas etapas até o término. Apenas saltar para a última etapa ou percorrer o histórico não libera o quiz. Um exemplo concluído com erro didático também permite a liberação.
2. Abra o quiz; a reprodução é pausada. Responda todas as questões e selecione **Corrigir minhas respostas**.
3. Com **6 ou mais acertos (75%)**, a plataforma apresenta uma mensagem de parabéns. Abaixo disso, incentiva a revisão dos conceitos.
4. Confira a resposta correta e a explicação de cada questão. Os erros geram recomendações específicas de estudo, agrupadas por assunto, mesmo quando a meta de 75% foi atingida.
5. Use **Voltar à simulação** para revisar Contexto/Objetivo, o código ou o histórico. **Tentar novamente** limpa as respostas e inicia uma nova tentativa.

A liberação permanece durante a visita à simulação, inclusive após executar outros exemplos nela. Recarregar ou sair da rota exige visualizar uma execução novamente. As respostas ficam em memória enquanto o componente do quiz estiver montado; não há cadastro, envio de notas ou armazenamento permanente dos resultados.

### Backend · Cadastro de Produtos

**Acesso:** `/modulos/backend/cadastro-de-produtos`. **Objetivo:** compreender como uma requisição percorre Controller, Service, Entity, Repository e banco, distinguindo validação e persistência.

| Configuração | Funcionamento |
| --- | --- |
| Nome do produto | Informe o nome enviado no campo `name`. Um nome em branco permite observar a recusa no Service. |
| Preço (R$) | Informe o campo `price`. O cadastro aceita valores positivos; zero e negativos demonstram a validação. |
| Falha simulada | Na aba **Falhas**, escolha **Nenhuma** ou **Banco indisponível**. |
| Exemplos prontos | Na aba **Cenários**, escolha cadastro válido, preço inválido ou banco indisponível. A seleção prepara o formulário; clique em executar para iniciar. |

| Cenário | Resposta simulada | Estado dos registros |
| --- | --- | --- |
| Nome preenchido e preço positivo | `201 Created` | Um produto cadastrado |
| Nome em branco ou preço zero/negativo | `400 Bad Request` | Nenhum produto cadastrado |
| Entrada válida e banco indisponível | `503 Service Unavailable` | Nenhum produto cadastrado |

Cada execução começa com registros vazios. O armazenamento é simulado em memória durante a demonstração.

**Contexto e fixação:** Contexto/Objetivo explica as responsabilidades das camadas, HTTP, JSON, objetos e métodos. O quiz verifica esses conceitos, os resultados de validação/indisponibilidade e a diferença entre criar um objeto e salvar seus dados.

### Backend · CRUD na escola

Abra **Backend → CRUD na escola**, cadastre uma nota e use o ID atribuído para consultar, atualizar ou excluir o registro. Professor e secretaria ficam voltados aos seus computadores; a prova e os envelopes representam a circulação dos dados.

**Acesso:** `/modulos/backend/crud-escolar`. **Objetivo:** compreender as quatro operações CRUD e seus efeitos nos registros.

| Configuração | Funcionamento |
| --- | --- |
| Operação | Escolha **Cadastrar**, **Consultar**, **Atualizar** ou **Excluir**. |
| Aluno, disciplina e nota | Aparecem em cadastro e atualização. Aluno e disciplina devem estar preenchidos, com até 120 caracteres; a nota deve estar entre 0 e 10. |
| Nota da sessão / ID da nota | Nas operações sobre um registro existente, selecione uma nota já cadastrada ou informe seu ID inteiro positivo. Outro ID positivo permite demonstrar o resultado 404. |
| Condição da secretaria | Na aba **Falhas**, escolha funcionamento normal ou banco de dados indisponível. |

| Operação | Requisição didática | Resultado normal |
| --- | --- | --- |
| Cadastrar | `POST /notas` | `201 Created` |
| Consultar | `GET /notas/{id}` | `200 OK` |
| Atualizar | `PUT /notas/{id}` com todos os campos | `200 OK` |
| Excluir nota | `DELETE /notas/{id}` | `204 No Content` |

Notas fora de 0 a 10 interrompem o fluxo no professor (`400` didático); um ID positivo inexistente produz `404`; secretaria indisponível produz `503`. As falhas preservam os registros. As notas ficam na memória da página entre operações, e os IDs excluídos não são reutilizados. Recarregar ou sair da página encerra a sessão de notas. Só as preferências são salvas explicitamente no navegador.

A execução aplica seu estado final uma única vez, ao concluir a reprodução ou avançar à última etapa. Voltar no Histórico revisa snapshots, sem repetir chamadas à API nem aplicar a alteração novamente. A exclusão remove a nota, não o aluno.

Para iniciar outra operação, conclua a execução atual ou avance até sua última etapa. Esse avanço confirma o estado da sessão, mas **não substitui a reprodução completa exigida para liberar o quiz**.

**Contexto e fixação:** Contexto/Objetivo apresenta campos, registros, listas, IDs e métodos HTTP. O quiz explora a escolha da operação, consulta sem alteração, atualização com o mesmo ID, exclusão da nota e preservação dos dados nas falhas.

### Backend · DTO e boletim escolar

Abra **Backend → DTO e boletim escolar** (`/modulos/backend/dto-escolar`). Informe aluno, disciplina e nota. A sequência mostra validação, mapeamento para entidade, persistência simulada e seleção dos campos do DTO de saída, representado por um boletim na tela.

**Objetivo:** distinguir o que o cliente envia, o que a aplicação mantém internamente e o que ela devolve.

| Configuração | Funcionamento |
| --- | --- |
| Aluno e disciplina | Campos do DTO de entrada, obrigatórios e com até 120 caracteres. |
| Nota | Aceita valores de 0 a 10. Uma nota 11 ou um campo vazio permite observar a validação. |
| Condição da secretaria | Na aba **Falhas**, alterne funcionamento normal e banco de dados indisponível. |
| ID e campos internos | São definidos pela aplicação, não pelo formulário. O inspetor permite acompanhá-los na entidade. |

| Representação | Campos |
| --- | --- |
| DTO de entrada | `student`, `subject`, `grade` |
| Entidade | `id`, `student`, `subject`, `grade`, `createdBy`, `internalNote` |
| DTO de saída | `id`, `student`, `subject`, `grade` |

O inspetor compara as três representações em cada etapa. O boletim aparece somente após o mapeamento da saída e acompanha o retrocesso no histórico. Uma nota inválida interrompe o fluxo antes de criar a entidade (`400` didático). Secretaria indisponível mantém a entidade preparada, sem persistência e sem boletim (`503` didático). O sucesso retorna `201` didático. Cada execução é independente, começa vazia e não modifica a sessão do CRUD. O ID 0 representa uma entidade ainda não salva; o sucesso atribui ID 1.

DTOs não validam nem ocultam campos automaticamente. O exemplo demonstra validação e mapeamento explícitos. A entidade interna aparece apenas no inspetor educacional; não faz parte da resposta pública representada. Código Java, persistência e HTTP da escola são didáticos.

**Contexto e fixação:** Contexto/Objetivo relaciona o boletim ao contrato de saída e explica objetos, mapeamento e persistência. O quiz verifica a diferença entre DTO e entidade, a origem do ID, a seleção dos campos e a necessidade de validação explícita.

### Backend · Validação e tratamento de erros

Abra **Backend → Validação e tratamento de erros** (`/modulos/backend/validacao-e-erros`). Há exemplos de cadastro válido, campos vazios, nota fora do intervalo, consulta válida, nota inexistente e secretaria indisponível. Também é possível personalizar os campos e salvar preferências no navegador.

**Objetivo:** distinguir validação de entrada, sinalização de exceção e tradução do problema em resposta HTTP.

| Configuração | Funcionamento |
| --- | --- |
| Exemplos prontos | Os seis botões preenchem a configuração. Depois da escolha, execute o exemplo. |
| Operação | Escolha cadastro (`POST`) ou consulta (`GET`). |
| Campos do cadastro | Aluno, disciplina e nota. Campos vazios, nota fora de 0 a 10 e textos acima de 120 caracteres demonstram violações; o formulário permite digitar 121 caracteres para explorar esse limite. |
| ID da consulta | Use `1` para encontrar a nota inicial ou outro inteiro positivo para demonstrar 404. Um ID inválido é uma configuração rejeitada pela própria API do simulador. |
| Condição da secretaria | Na aba **Falhas**, escolha funcionamento normal ou banco de dados indisponível. Campos inválidos interrompem o cadastro antes de chegar a essa falha. |

| Situação | Resultado didático | Efeito nos registros |
| --- | --- | --- |
| Cadastro válido | `201` | Acrescenta nota de ID 2 |
| Consulta de ID 1 | `200` | Preserva os registros |
| Campos inválidos | `400` | Interrompe antes da secretaria |
| ID positivo inexistente | `404` | Preserva os registros |
| Armazenamento indisponível | `503` | Preserva os registros |

Cada execução começa com uma nota fictícia de Ana (ID 1), independentemente dos outros cenários. O inspetor e a ficha de retorno acompanham snapshots: primeiro aparecem os campos inválidos, depois a exceção e, quando tratada, a resposta. O corpo de erro tem `status`, `code`, `message`, `path` e `fieldErrors`, sem dados internos de conexão. A validação de entrada tem precedência sobre a indisponibilidade simulada.

O código didático apresenta `@Valid`, constraints, `@RestControllerAdvice` e `@ExceptionHandler`. A sequência é calculada deterministicamente; não executa esses trechos Java nem acessa um banco real. Contexto/Objetivo explica os conceitos antes da execução. O quiz de 8 questões segue o mesmo bloqueio por reprodução completa e a meta de 75%.

**Contexto e fixação:** a explicação introdutória define as regras de campos, exceções e tratamento centralizado em linguagem simples. O quiz verifica a interpretação dos status, dos campos da resposta e da diferença entre um erro didático e uma falha real do simulador.

### Backend · Persistência com Spring Data JPA

Abra **Backend → Persistência com Spring Data JPA** (`/modulos/backend/persistencia-jpa`). Informe aluno, disciplina e nota de 0 a 10. A sequência valida a entrada, prepara a entidade, mostra `save` e abre a ficha da tabela `notas` quando a gravação é confirmada. A sessão de leitura começa com a entidade fora do contexto, conserva a linha e usa `findById` com o ID produzido no cadastro.

- O inspetor mostra **Estado**, **HTTP**, **Código**, **SQL**, **Histórico** e **Contexto/Objetivo**. Na aba SQL, o `INSERT` e o `SELECT` usam parâmetros e aparecem nas etapas correspondentes.
- O caminho normal representa `POST /notas` com `201` seguido de `GET /notas/{id}` com `200`. Dados inválidos retornam `400` antes de criar a entidade. Banco indisponível retorna `503`, abre a ficha vazia e encerra a escrita sem consulta.
- A ficha acompanha o snapshot ao voltar ou avançar. Cada execução começa com a tabela didática vazia. O cenário calcula os estados em memória e usa Java e SQL ilustrativos.
- Contexto/Objetivo explica persistência, mapeamento, chave primária e sessões. O quiz de oito questões é liberado após a reprodução completa.

### Backend · Relacionamentos entre entidades

Abra **Backend → Relacionamentos entre entidades** (`/modulos/backend/relacionamentos`). A escola possui duas salas e uma secretaria. Bruno, Júlio e Carlos começam vinculados à turma Computação A; Computação B começa vazia. Cada aluno tem seu próprio ID e uma referência à turma, representada por `classId` no estado e por `turma_id` no SQL didático.

- **Transferir um aluno:** escolha o estudante e a turma de destino. A secretaria confirma a alteração do vínculo antes de o estudante caminhar pelo corredor e se sentar na outra sala. O ID e o nome permanecem iguais; os demais estudantes não mudam de turma. A relação ilustrada é `Turma @OneToMany` e `Aluno @ManyToOne`.
- **Consultar alunos de uma turma:** veja a lista e o destaque dos estudantes associados. Uma turma existente sem alunos retorna `200` com lista vazia; uma turma inexistente retorna `404`.
- **Falhas:** selecione a turma inexistente (ID 99) ou simule a indisponibilidade da secretaria (`503`). Os vínculos e as posições permanecem iguais. Transferir para a turma atual também não movimenta o estudante.
- **Sessão:** operações concluídas conservam os vínculos enquanto a página estiver aberta. **Reiniciar turmas** restaura os três estudantes na turma A. Voltar pelo histórico revisa snapshots; não desfaz a sessão. Recarregar a página restaura o estado inicial. Salvar configuração conserva apenas as preferências.
- **Inspetor:** as abas **Relações**, **HTTP**, **Código**, **SQL**, **Estado**, **Histórico** e **Contexto/Objetivo** explicam o vínculo visual, a chave estrangeira e os dois lados do relacionamento. O contexto apresenta os pré-requisitos em linguagem iniciante. O quiz tem 8 questões, exige reprodução completa, apresenta parabéns a partir de 75% e orienta a revisão conforme os erros.

A API didática usa `GET /api/school/relationships/state` e `POST /api/school/relationships/simulations`. O catálogo escolar identifica o cenário como `school-relationships`. Java, JPA e SQL são exemplos ilustrativos; os estados são calculados em memória, sem banco real. Uma sequência calculada retorna HTTP `200` na API, enquanto seu resultado didático fica em `simulatedResponse`.

### Backend · Transações com @Transactional

Abra **Backend → Transações com @Transactional** (`/modulos/backend/transacoes`). A aula reutiliza as duas salas, os três estudantes, o professor e a secretária com os sprites sentados atrás das mesas e os balões acompanhando quem fala. Escolha Bruno, Júlio ou Carlos para uma transferência da turma A para B.

A operação reúne **duas escritas no mesmo banco**: atualizar `alunos.turma_id` e inserir uma linha em `transferencias`. O inspetor **Transação** separa os registros confirmados da área de trabalho pendente. Um `saveAndFlush` pode enviar o SQL sem confirmar a transação; a posição do aluno acompanha apenas os dados confirmados.

| Condição em Falhas | Resultado representado |
| --- | --- |
| Funcionamento normal | UPDATE e INSERT ficam pendentes; o commit confirma os dois, depois o estudante caminha para B. HTTP didático 200. |
| Falha ao registrar histórico | A primeira escrita fica pendente e a segunda lança uma RuntimeException não suprimida. O rollback descarta as alterações: aluno em A e nenhuma transferência confirmada. HTTP didático 500. |
| Secretaria indisponível | O fluxo para na consulta, antes de qualquer escrita; a transação é encerrada sem confirmação. HTTP didático 503. |

Cada execução começa novamente com os três alunos em A e o histórico vazio, sem compartilhar a sessão da aula de relacionamentos. **Reiniciar exemplo** limpa a reprodução; **Salvar configuração** conserva apenas preferências em `nara-lab.school.transactions.settings.v1`.

As abas **Transação**, **HTTP**, **Código**, **SQL**, **Estado**, **Histórico** e **Contexto/Objetivo** permitem comparar os retratos de cada etapa. Contexto/Objetivo explica os termos e pré-requisitos em linguagem iniciante. O quiz ao lado do título tem oito questões, exige reprodução completa, parabeniza a partir de 75% e recomenda revisão por assunto conforme os erros. Saltar ao final não libera o quiz.

API: `GET /api/school/transactions/state` e `POST /api/school/transactions/simulations`, com `{ "studentId": 3, "failure": "none" }`. As falhas aceitas são `none`, `history-write-failed` e `database-unavailable`. Configuração inválida gera HTTP 400 real; aluno positivo inexistente gera 404 didático. O catálogo escolar inclui `school-transactions`. Sequências calculadas retornam HTTP 200 real, com o resultado didático em `simulatedResponse`.

**Limites didáticos:** o simulador calcula snapshots sem banco ou transação reais. O código pressupõe um Service gerenciado pelo Spring, chamado por seu proxy, com infraestrutura transacional configurada e repositórios no mesmo banco. A falha usada é uma RuntimeException; checked exceptions podem precisar de regras específicas de rollback. Um status HTTP de erro sozinho não desfaz dados. E-mails ou outras ações externas não são desfeitos automaticamente. Isolamento, propagação e concorrência ficam para aulas posteriores. Referência: [documentação oficial de @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html).

### Backend · Inicialização e injeção de dependência

Abra **Backend → Inicialização e injeção de dependência** (`/modulos/backend/inicializacao-spring`). A lanchonete é uma ampliação da arte usada na IA, com duas mesas adicionais e corredores livres. A arte original da IA não muda. Cada uma das duas mesas de configuração representa uma aplicação independente, executada uma por vez.

| Configuração | Recursos ilustrados |
| --- | --- |
| Mesa 1 · Combo simples | Página Pedidos ilustrativa, API HTTP `GET /api/pedidos`, porta 8081 e implementação Repository com lista em memória. Biblioteca Web. |
| Mesa 2 · Combo completo | Página Pedidos ilustrativa, API HTTP, porta 8082, validação disponível, JPA e H2 em memória. Bibliotecas Web, Validation, Data JPA e driver H2. |

O formulário permite escolher ponto do hambúrguer, salada, acompanhamento e bebida. Os clientes usam poses próprias de restaurante, sem caderno ou lapiseira. Na entrega, o hambúrguer, o acompanhamento escolhido e a bebida aparecem sobre a mesa; ao revisar etapas anteriores, o lanche da mesa ativa desaparece. Os funcionários da cozinha têm a mesma escala dos demais personagens em pé e ficam no piso livre à frente das bancadas, com o corpo inteiro visível. Os clientes ficam centralizados nos assentos. Os balões permanecem por pelo menos 6,5 segundos, com mínimo de 16 segundos para o pedido inicial e tempo adicional proporcional ao número de palavras, na velocidade padrão. O **texto exato do pedido** retornado pela API aparece no balão do cliente, no papel da comanda e no histórico. O lanche pertence à narrativa; os recursos técnicos são definidos pelo combo. A comanda completa inclui página, rota HTTP, porta, bibliotecas, propriedades do banco e componentes escritos pelo desenvolvedor.

- O cliente representa o desenvolvedor durante a configuração. O garçom representa o contêiner Spring. Todos os participantes já estão presentes na cena. A criação e a conexão dos objetos são acompanhadas nas etapas e no inspetor Componentes; a presença física de um personagem não indica que seu bean já esteja pronto.
- A aula distingue biblioteca disponível no projeto de colaborador recebido pelo construtor. Spring não escreve as regras de negócio nem cria a página HTML ao adicionar starters.
- Após montar os componentes, a aplicação fica pronta e uma consulta HTTP ilustrativa retorna dados para a prévia da página **Pedidos**. Só depois aparece a **ficha de entrega**, com resumo exato, recursos, objetos conectados e propriedades utilizadas. A entrega também é registrada em papel no histórico da execução.
- **Repository não registrado** interrompe as duas configurações. **Banco inválido** só pode ser escolhido no combo completo, e a URL incorreta aparece na comanda. A aplicação ilustrada não inicia, não produz entrega e não oferece resposta HTTP de teste; isso não representa um HTTP 500 enviado por um servidor que não iniciou.
- As mesas conservam o último resultado apenas durante a visita. **Reiniciar mesas** limpa as execuções; **Salvar configuração** conserva preferências em `nara-lab.backend.boot.settings.v1`. Cada montagem começa independente e não altera a outra aplicação.
- Inspetor: **Comanda**, **Entrega**, **Componentes**, **HTTP / Página**, **Código**, **Estado**, **Histórico**, **Contexto/Objetivo**. Os documentos e a lista de beans acompanham o snapshot selecionado, inclusive ao retroceder. Quiz de 8 questões, reprodução completa obrigatória, meta de 75% e revisão orientada pelos erros.

Exemplo de chamada: `POST /api/boot/simulations`, com `{ "profile": "complete", "food": { "meatPoint": "ao ponto", "salad": true, "accompaniment": "batata frita", "drink": "refrigerante" }, "failure": "none" }`. `profile` aceita `simple`/`complete`; falhas: `none`, `missing-repository`, `invalid-database`. `GET /api/boot/scenarios` lista `boot-restaurant` e as duas configurações. A API retorna HTTP 200 para sequências calculadas, inclusive falhas didáticas; o resultado de inicialização fica em `startupResult`. Configurações inválidas geram HTTP 400 real.

**Limites:** exemplos de dependências do Spring Boot 3.5; nenhuma biblioteca é baixada, aplicação adicional iniciada, porta aberta, página gerada ou banco criado. H2 e lista são voláteis; o H2 com `create-drop`, usuário `sa` e senha vazia é somente um exemplo local. A cena mostra uma ordem lógica simplificada de montagem, não todos os eventos internos do Spring. Referências: [Beans e injeção de dependência](https://docs.spring.io/spring-boot/3.5/reference/using/spring-beans-and-dependency-injection.html) e [bancos SQL](https://docs.spring.io/spring-boot/3.5/reference/data/sql.html).

### Inteligência Artificial

- **Biblioteca**. Um integrante da equipe pergunta qual status o cadastro simula quando o banco fica indisponível. O assistente consulta a documentação e mostra a evidência. A opção de fonte indisponível demonstra como comunicar que o status ainda não pôde ser confirmado.
- **Hamburgueria**. Dois clientes fazem o mesmo pedido com níveis diferentes de detalhe. O atendente pede esclarecimentos para um deles e confirma o outro de imediato. Três cozinheiros executam as comandas, que terminam iguais. O inspetor compara as duas rodadas de atendimento.

Cada execução sorteia **Codex ou Claude Code** e os integrantes da equipe que participam. Os ícones flutuantes representam o assistente ao longo de uma sequência didática pré-calculada no Spring Boot. As duas simulações funcionam localmente sem serviços externos de IA.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5.16, Spring Web MVC e Maven |
| Frontend | Next.js 16.2.6, React 19.2.6, JavaScript com JSX, CSS e Canvas 2D |
| Comunicação | HTTP e JSON |
| Testes do backend | JUnit 5 e MockMvc |
| Preferências locais | `localStorage` |

## Executar localmente

Em um terminal, com JDK 21 e Maven:

~~~sh
cd backend
mvn spring-boot:run
~~~

Em outro terminal, com Node.js 22.12 ou superior e npm:

~~~sh
cd frontend
npm ci
npm run dev
~~~

Acesse [NARA Lab em localhost:3000](http://localhost:3000), abra **Acessar módulos** e escolha **Backend** para ver as oito simulações ou **Inteligência Artificial** para os cenários de IA. O Next.js encaminha as chamadas da API para o Spring em `http://127.0.0.1:8080` por padrão. Para outro endereço, defina a variável `SPRING_API_URL` no frontend.

Para verificar o projeto, execute `mvn test` em `backend/` e `npm run build` em `frontend/`.

Em `frontend/`, `node --test tests/*.test.mjs` verifica a movimentação escolar e as regras dos quizzes: quantidade de questões, pontuação, limite de 75%, recomendações e verificação de etapas concluídas.

## Documentação da API

### Acessar o Swagger na porta 8080

1. Na pasta `backend/`, execute `mvn spring-boot:run`. Se uma versão anterior do backend já estiver rodando na porta `8080`, encerre aquela instância e inicie o projeto novamente.
2. Aguarde o Spring Boot indicar que o servidor iniciou na porta `8080` e abra o [Swagger UI](http://127.0.0.1:8080/swagger-ui/index.html).
3. Expanda **`Módulo backend\Springboot`** ou **Módulo — Inteligência Artificial** para ver os endpoints da área.

O Swagger é servido diretamente pelo Spring Boot. Basta iniciar o backend para consultar a interface ou baixar a [especificação OpenAPI em JSON](http://127.0.0.1:8080/v3/api-docs).

- `GET /api/scenarios` lista os cenários disponíveis e seus identificadores.
- `POST /api/simulations` recebe o identificador, os dados do produto e a opção de falha (`none` para nenhuma). Retorna as etapas ordenadas e o resultado didático.

No Swagger, abra `POST /api/simulations`, clique em **Try it out**, escolha um exemplo e clique em **Execute**. Os três exemplos retornam HTTP `200` na API e exibem `201`, `400` ou `503` dentro de `simulatedResponse.status`. Se você enviar uma configuração inválida, a própria API retorna HTTP `400`.

- `GET /api/ia/scenarios` lista os cenários `biblioteca` e `hamburgueria`.
- `POST /api/ia/simulations` recebe `scenario` e retorna o assistente sorteado, as etapas e o resultado. Na biblioteca, use `sourceAvailable: false` para simular falha de acesso à documentação. O Swagger oferece exemplos para os dois cenários.

- `GET /api/school/scenarios` lista os cenários escolares `school-grades`, `school-dto`, `school-validation` e `school-jpa`.
- `POST /api/school/simulations` calcula o CRUD a partir de `operation`, `inputs`, `records`, `nextId` e `failure`. HTTP `200` pertence ao cálculo; `simulatedResponse.status` representa o resultado didático. IDs/configurações inválidas geram HTTP `400` na própria API. O navegador envia o snapshot da sessão; não há armazenamento acadêmico real.
- `POST /api/school/dto/simulations` recebe `inputs` (`student`, `subject`, `grade`) e `failure` (`none` ou `database-unavailable`). Retorna `schemaVersion`, `steps` e `simulatedResponse`. Cada etapa inclui os snapshots `inputDto`, `entity`, `persisted` e `outputDto`, além de movimento, código, legenda e histórico nos dois níveis. A API retorna HTTP `200` quando calcula a demonstração; configurações inválidas retornam HTTP `400` na própria API. O Swagger oferece exemplos de sucesso, nota inválida e indisponibilidade.

O endpoint `POST /api/school/validation/simulations` recebe `operation` (`create` ou `read`), `inputs` e `failure` (`none` ou `database-unavailable`). A criação usa aluno, disciplina e nota; a consulta usa ID inteiro positivo. Retorna `schemaVersion`, `steps` e `simulatedResponse`, com snapshots de `requestBody`, `records`, `fieldErrors`, `exception`, `handled`, `responseBody` e `responseStatus`. Os HTTP didáticos são `201/200/400/404/503`; a API retorna HTTP `200` para sequências calculadas e HTTP `400` para configurações inválidas. O Swagger traz exemplos.

`POST /api/school/jpa/simulations` recebe `inputs` (`student`, `subject`, `grade`) e `failure` (`none` ou `database-unavailable`). Cada etapa contém o estado da sessão, a entidade, as linhas confirmadas, o ID de consulta e as respostas didáticas de escrita e leitura quando disponíveis. O SQL e seus parâmetros aparecem nas etapas correspondentes. `simulatedResponse` representa o desfecho da sequência.

## Créditos de interface

O carrossel de módulos é uma adaptação de **Skiper 49 / Carousel_003**, de [Skiper UI](https://skiper-ui.com/v1/skiper49), criado por [Gurvinder Singh](https://gxuri.me), utilizando Swiper.js. O crédito é mantido para o uso da versão gratuita do componente.

## Passos futuros

O catálogo já exibe as áreas abaixo. Os conteúdos indicados são propostas iniciais para as próximas implementações.

| Módulo a implementar | Primeiro cenário proposto |
| --- | --- |
| Lógica de Programação | Percorrer condicionais e laços, observando o valor das variáveis a cada passo |
| Frontend | Acompanhar eventos de formulário, validação e atualização da interface |
| Banco de Dados | Simular operações CRUD e visualizar os efeitos de uma transação |
| Arquitetura | Acompanhar a troca de dados entre componentes com responsabilidades diferentes |
| DevOps | Simular as etapas de build, teste e entrega de uma aplicação |
| Metodologias Ágeis | Acompanhar um fluxo Kanban, com limites de trabalho em andamento e bloqueios |

No Backend, os fundamentos atuais incluem inicialização, injeção de dependência, CRUD, DTO, validação, persistência, relacionamentos e transações. Os próximos aprofundamentos serão definidos conforme a evolução da trilha. Em Inteligência Artificial, as próximas demonstrações aprofundarão agentes, ferramentas, skills e harness. Consulte o [contexto técnico do NARA Lab](context.md) para o contrato da API, a lógica de reprodução e o inventário dos sprites.

As próximas simulações, inclusive em outros módulos, seguirão o padrão de animações com movimento reduzido, legendas iniciante/técnica, histórico explicativo, Contexto/Objetivo, inspetor pertinente ao tema e quiz de 6 a 12 questões com liberação após a visualização, meta de 75% e revisão orientada pelos erros. Esses recursos de contexto e quiz estão implementados atualmente no Backend; os cenários de IA existentes ainda não foram migrados.
