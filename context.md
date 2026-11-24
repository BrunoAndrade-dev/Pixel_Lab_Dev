# Contexto técnico do NARA Lab

## Propósito e escopo

O NARA Lab ensina conceitos de programação, arquitetura e processos de desenvolvimento por meio de simulações interativas. Professores podem conduzir exemplos ao vivo e estudantes podem revisar cada etapa. A landing page apresenta o catálogo por áreas e a rota `/como-funciona` explica a proposta. O conteúdo funcional desta versão está em `/modulos/backend/cadastro-de-produtos`.

## Como a demonstração é calculada

[SimulationController.java](backend/src/main/java/lab/SimulationController.java) implementa a API do simulador.

| Operação | Contrato |
| --- | --- |
| `GET /api/scenarios` | Catálogo com identificador, título e descrição do cenário disponível |
| `POST /api/simulations` | Recebe `scenario`, `inputs.name`, `inputs.price` e `failure`. O identificador atual é `create-product`, e as opções de falha são `none` e `database-unavailable` |

O backend calcula uma sequência determinística e responde com `schemaVersion`, `steps` e `simulatedResponse`. Cada etapa inclui `actor`, `action`, balão, legendas `basic` e `technical`, código opcional (arquivo, linha e fonte) e um estado completo com `requestBody` e `products`.

A requisição à API do simulador retorna HTTP `200` quando a sequência é calculada. O status do cadastro didático fica em `simulatedResponse.status` e pode ser `201`, `400` ou `503`. Uma configuração inválida enviada ao simulador retorna HTTP `400` na própria API. Os trechos Java apresentados na sala ilustram a lógica de um `POST /produtos`.

O fluxo de sucesso passa pelo Cliente, Controller, Service, Entity, Repository e Banco, com retorno pelo Controller ao Cliente. O Service valida a entrada e cria a Entity, que representa os dados do produto. A validação inválida encerra o fluxo antes da persistência. A indisponibilidade simulada encerra a tentativa de gravação. Cada execução começa com uma lista vazia e somente o sucesso gera um registro.

## Como o frontend reproduz as etapas

- Validação e tratamento de erros (`/modulos/backend/validacao-e-erros`) usa `SchoolValidationSimulationController` em `POST /api/school/validation/simulations`. Recebe `operation` (`create`/`read`), `inputs` e `failure` (`none`/`database-unavailable`). Cada execução começa com a nota de Ana, ID 1, sem compartilhar a sessão do CRUD. Cadastro válido acrescenta ID 2; consulta não altera registros. Regras de entrada: aluno e disciplina não vazios, até 120 caracteres; nota obrigatória de 0 a 10. Violações são agregadas antes de acessar a secretaria, com prioridade sobre a indisponibilidade. ID positivo inexistente resulta em 404; acesso indisponível em 503. ID inválido ou JSON/configuração inválidos geram HTTP 400 na API real. Sequências calculadas retornam HTTP 200; resultado didático fica em `simulatedResponse` (201/200/400/404/503).
- Cada etapa desse cenário tem os campos escolares de movimento/legenda/histórico/código e `state` com `requestBody`, `records`, `fieldErrors`, `exception`, `handled`, `responseBody`, `responseStatus`. Os snapshots separam validação, sinalização da exceção, tratamento centralizado e envio. O corpo de erro usa `status`, `code`, `message`, `path`, `fieldErrors`. Anotações e exceções Java são apenas exemplos didáticos, não executados pelo simulador. `school-validation-simulator.jsx` reutiliza sala e reprodução, oferece seis presets, ficha de retorno, Contexto/Objetivo e quiz de 8 perguntas. `school-validation-content.mjs` concentra lição e quiz. Preferências usam `nara-lab.school.validation.settings.v1`. Catálogo escolar inclui `school-validation`.

- Cada simulação de Backend tem um quiz de 8 questões ao lado do título, renderizado por `backend-simulation-heading.jsx` em diálogo modal com respostas preservadas enquanto o componente estiver montado. O botão começa bloqueado. `use-simulation-playback.js` marca como visualizadas apenas as etapas cuja reprodução termina; saltos no histórico não marcam etapas. `completed` só é verdadeiro depois de todas as etapas terminarem, e `reset` limpa esse acompanhamento. `use-backend-quiz-access.js` mantém a liberação durante a visita à simulação, inclusive ao executar novos exemplos; recarregar ou sair da rota bloqueia novamente. A liberação não exige sucesso de negócio: um fluxo de erro concluído também é uma simulação válida. O quiz pausa a reprodução ao abrir. `backend-quiz-data.mjs` define perguntas, gabarito, explicações e recomendações por tema, sem API nem armazenamento de notas. A correção exige todas as respostas; 6/8 (75%) ou mais mostra parabéns. Erros geram recomendações deduplicadas por assunto mesmo quando o objetivo foi atingido. É possível tentar novamente. Não há quiz no módulo de IA.
- As simulações de Backend oferecem a aba `Contexto/Objetivo` ao lado de `Histórico`, disponível antes de executar. `backend-learning-context.jsx` concentra o conteúdo específico de Cadastro (`products`), CRUD (`crud`) e DTO (`dto`): conceito, motivação, correspondência entre elementos da cena e programação, conhecimentos prévios explicados, orientação sobre o inspetor e objetivos de aprendizagem. O conteúdo é estático e não depende da sequência, não altera a reprodução e não é usado no módulo de IA. O estilo responsivo fica em `backend-learning-context.css`.
- O catálogo em `/modulos/backend` oferece Cadastro de produtos e CRUD na escola (`/modulos/backend/crud-escolar`), ambos funcionais. A exclusão escolar remove apenas o registro da nota, não o aluno.
- O catálogo também oferece DTO e boletim escolar (`/modulos/backend/dto-escolar`). `SchoolDtoSimulationController` expõe `POST /api/school/dto/simulations`, com `inputs` (`student`, `subject`, `grade`) e `failure` (`none`, `database-unavailable`). O catálogo escolar inclui `school-dto`. A sequência determinística retorna `schemaVersion`, `steps` e `simulatedResponse`; cada etapa traz `state.inputDto`, `state.entity`, `state.persisted` e `state.outputDto`, além dos campos de animação, código e explicação usados na escola. Campos internos da entidade são `createdBy` e `internalNote`; a saída seleciona apenas `id`, `student`, `subject`, `grade`. O ID começa em 0 na entidade preparada e passa a 1 ao salvar. A entidade fica ausente antes do mapeamento, a saída fica ausente antes da projeção, e erros não emitem boletim. HTTP da API é 200 para sequências calculadas; HTTP didático é 201/400/503. Configurações inválidas geram HTTP 400 real.
- `school-grade-simulator.jsx` compartilha sala, relógio, configurações, avaliação e navegação entre DTO e JPA. Na aula de DTO, o boletim HTML usa o snapshot `outputDto`, aparece após o mapeamento e desaparece ao retroceder. Preferências ficam sob `nara-lab.school.dto.settings.v1`; cada execução começa vazia, sem alterar a sessão do CRUD.
- A aula de JPA fica em `/modulos/backend/persistencia-jpa`. `SchoolJpaSimulationController` expõe `POST /api/school/jpa/simulations` e é listado no catálogo como `school-jpa`. Os snapshots representam as sessões de escrita e leitura. A ficha acompanha as linhas confirmadas, enquanto `entity` fica nula ao abrir a sessão de leitura e volta a ser preenchida pelo resultado de `findById`. A aba SQL mostra comandos parametrizados ilustrativos. Preferências usam `nara-lab.school.jpa.settings.v1`. Cada execução parte de tabela vazia e armazena apenas snapshots didáticos em memória.
- Acordo de contrato entre backend/frontend: `POST /api/school/simulations` recebe `operation` (`create`, `read`, `update`, `delete`), `inputs`, `records`, `nextId` e `failure` (`none`, `database-unavailable`). Cada registro contém `id`, `student`, `subject`, `grade`. UPDATE é PUT completo; READ/DELETE usam o ID e não têm corpo didático (`state.requestBody: null`). O GET `/api/school/scenarios` lista `school-grades`.
- A resposta escolar contém `schemaVersion`, `steps`, `simulatedResponse` e `finalState`. Cada etapa inclui `actor` (`student`, `teacher`, `office`), `action`, `motion`, `dialogue`, legendas `caption`, histórico `history` iniciante/técnico, código Java didático e snapshot completo em `state`. A API real retorna HTTP 200 quando calcula a sequência; os resultados didáticos são 201/200/204/400/404/503. Configurações inválidas, como ID não positivo ou fracionário, geram HTTP 400 na própria API. Nota fora de 0 a 10 interrompe o fluxo no professor, antes da secretaria. Falhas preservam registros e próximo ID.
- `school-simulator.jsx` mantém o snapshot canônico da sessão separado do histórico. Aplica `finalState` apenas uma vez ao terminar a reprodução ou ao saltar à última etapa. Pausar, reiniciar e retroceder não fazem chamadas adicionais nem duplicam operações. As notas são mantidas entre operações enquanto a página permanece aberta; preferências podem ser salvas explicitamente no navegador. IDs excluídos não são reutilizados.
- `school-scene.mjs` registra posições, espelhamento, oclusão das mesas e trajetos. `school-room.jsx` compõe a sala em Canvas, com professor e secretaria olhando para seus computadores. O aluno leva a prova ao professor e retorna ao posto; envelopes digitais representam solicitações e respostas entre professor e secretaria. Movimentos seguem o relógio de reprodução e respeitam movimento reduzido. Fundo e poses são independentes: originais em `backend/sprites/school/`, cópias WebP em `frontend/public/scenarios/school/`. Em telas estreitas, a sala permite rolagem horizontal.

- Em “Como funciona”, `frontend/app/simulation-preview.jsx` reutiliza a sala em modo `preview`, sem controles, rótulos de papéis, balões ou chamadas à API. O teaser repete somente uma entrega entre dois personagens; não apresenta o fluxo completo. O Canvas substitui a necessidade de um GIF ou vídeo e acompanha os assets da demonstração. A reprodução para fora da tela ou com a aba oculta e vira uma imagem estática com movimento reduzido. No computador, aparece ao lado do texto; em telas estreitas, abaixo dele.

- O catálogo inicial usa `frontend/app/modules-carousel.jsx`, com Swiper e efeito coverflow adaptado de Skiper UI. Os oito módulos compartilham cards em marrom, creme e dourado; somente Backend e Inteligência Artificial têm links de acesso. Os demais exibem “Em breve”. A navegação permite arrastar, usar setas e selecionar a paginação, sem reprodução automática. Movimento reduzido desativa o efeito 3D. Os oito módulos usam ilustrações 3D em uma sprite sheet de quatro colunas e duas linhas, `frontend/public/technologies/module-icons-3d.webp`, em creme e dourado. A ordem é Lógica, Frontend, Backend, Banco de Dados, Arquitetura, IA, DevOps e Metodologias Ágeis; os ícones preservam as referências fornecidas e acompanham o estilo volumétrico da hero.

- [simulator.jsx](frontend/app/simulator.jsx) coordena o formulário, os presets, a execução e o inspetor. A posição atual na sequência determina a legenda, o código destacado, o histórico visível e o estado dos produtos. Avançar ou voltar usa os estados enviados na resposta, sem uma nova requisição.
- [room.jsx](frontend/app/room.jsx) compõe o cenário, os personagens, os objetos e o envelope em Canvas 2D. As estações podem ser inspecionadas por botões. O Banco fica ao lado dos racks. O Service fica no computador do fundo, o Repository na bancada direita e a Entity na mesa redonda com notebook.
- [room-motion.mjs](frontend/app/room-motion.mjs) define os postos, as rotas e os tempos. O relógio da etapa mantém o ponto da animação na pausa e ajusta a reprodução à velocidade escolhida. Ao transferir dados, o emissor se aproxima, entrega o envelope e volta ao posto. Personagens sentados se levantam antes da saída e voltam a se sentar. O Service leva os dados ao Repository após a criação da Entity.
- A sala respeita a preferência por movimento reduzido e pode ser rolada horizontalmente em telas estreitas. As preferências são salvas sob a chave `pixel-lab.settings.v1`, mantida para compatibilidade com configurações gravadas antes da mudança de nome.

## Sprites e cenário

Os PNGs originais com transparência ficam em [backend/sprites](backend/sprites). O frontend serve cópias WebP de 300 × 300 em [frontend/public/scenarios/people](frontend/public/scenarios/people), com o mesmo nome-base. As duas pastas fazem parte do fluxo de manutenção: uma guarda os originais e a outra entrega os arquivos otimizados ao navegador. Ao editar um sprite existente, atualize também o WebP correspondente e preserve o enquadramento usado pelas poses.

| Arquivo-base | Integrante | Detalhe visual |
| --- | --- | --- |
| `ana-elisa` | Ana Elisa | Shih-tzu na guia |
| `andre` | André | Polo com “Eu ♥ machine learning” |
| `bruno-raphael` | Bruno Raphael | Terço |
| `carlos-vinicius` | Carlos Vinícius | Gato preto e branco |
| `gilberto` | Gilberto | Raquete de pingue-pongue e relógio |
| `julio-cesar` | Júlio César | Jaqueta marrom |
| `luca-maia` | Luca Maia | Taco de sinuca |
| `maria-eduarda` | Maria Eduarda | Cachos com tonalidade ruiva |
| `pedro-fernandes` | Pedro Fernandes | Cabo de rede e escudo com cadeado |
| `pedro-mary` | Pedro Mary | Cabelo loiro e olhos azuis |

A cada nova simulação bem-sucedida, o frontend sorteia seis integrantes distintos para os seis papéis. Pausa, navegação entre etapas e reinício da reprodução mantêm o elenco daquela execução. Os papéis e a lógica do backend independem de quem foi sorteado.

A sala, os racks e o notebook ficam em [frontend/public/scenarios](frontend/public/scenarios). As âncoras de chão e os percursos usam coordenadas proporcionais ao cenário. As máscaras que desenham as mesas à frente dos personagens correspondem à imagem atual da sala. Ao alterar a arte, revise também as âncoras, os corredores e essas máscaras.

## Módulo Inteligência Artificial

- `GET /api/ia/scenarios` lista os cenários. `POST /api/ia/simulations` calcula a sequência e sorteia `codex` ou `claude-code`. A resposta contém `schemaVersion`, `agent`, `steps` e `outcome`. O navegador sorteia os integrantes humanos sem reposição quando recebe a resposta. Pausar, revisar ou reiniciar a reprodução usa a execução já recebida.
- Na biblioteca, `sourceAvailable: false` simula a falha da consulta. A evidência exibida é a linha da tabela de cadastro no README que registra o resultado `503`. A consulta é encenada e a ausência da fonte faz a resposta declarar que o status segue sem confirmação.
- Na hamburgueria, os dois clientes e as três estações de cozinha recebem cinco integrantes distintos. Os dois pedidos chegam à mesma comanda. O resultado registra `clarificationTurns` por cliente e os campos da comanda para comparação.
- Cada etapa tem um papel, um identificador de movimento, um diálogo, duas legendas e observações para o inspetor. As posições são reconstruídas até a etapa escolhida, inclusive ao saltar pelo histórico. A reprodução compartilha o relógio do módulo Backend.
- Os PNGs originais dos ícones estão em `backend/sprites/ia/`. As cópias WebP e os cenários de proporção 2:1 estão em `frontend/public/scenarios/ia/`. Os movimentos e as âncoras dos cenários ficam em `frontend/app/ai-scenarios.mjs`.

## Critérios de continuidade

- Padrão obrigatório das próximas simulações, inclusive em outros módulos: entrada e reprodução com movimento suave e suporte a movimento reduzido; legendas iniciante/técnica; histórico com acontecimentos, motivos e efeitos nos dados; Contexto/Objetivo acessível antes da execução, explicando conceitos e conhecimentos necessários; inspetor pertinente ao assunto; quiz de 6 a 12 questões ao lado do título, liberado após visualizar a execução, com parabéns a partir de 75% e recomendações conforme os erros. A IA existente ainda não foi migrada; aplicar o padrão aos próximos cenários.

- Ao adicionar um cenário, defina entradas, resultados, regras de negócio e estados de cada etapa. Mantenha alinhados o catálogo da API, a rota da demonstração e os papéis que a cena sabe renderizar.
- Verifique o fluxo completo, incluindo as respostas HTTP, os dados nos ramos de falha, a inspeção, a pausa e o retrocesso.
- Use a seção [Passos futuros](README.md#passos-futuros) do README para acompanhar os módulos pendentes.
