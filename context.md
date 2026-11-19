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

- Ao adicionar um cenário, defina entradas, resultados, regras de negócio e estados de cada etapa. Mantenha alinhados o catálogo da API, a rota da demonstração e os papéis que a cena sabe renderizar.
- Verifique o fluxo completo, incluindo as respostas HTTP, os dados nos ramos de falha, a inspeção, a pausa e o retrocesso.
- Use a seção [Passos futuros](README.md#passos-futuros) do README para acompanhar os módulos pendentes.
