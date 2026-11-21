# NARA Lab

O NARA Lab é uma plataforma educativa de simulações interativas. Em uma sala isométrica em pixel art, personagens representam componentes de um sistema para ajudar professores e estudantes a relacionar o que acontece em cada etapa com o código, os dados e o resultado da operação.

## O que a plataforma contempla

- Página inicial responsiva com ícones animados, catálogo por áreas e uma aba **Como funciona** com a proposta didática e orientações para a primeira demonstração.
- Módulo **Backend** com o cenário **Cadastro de Produtos**, que acompanha um `POST /produtos` simulado no Spring Boot. Cliente, Controller, Service, Entity, Repository e Banco têm papéis identificáveis na sala.
- Módulo **Inteligência Artificial** com a **Biblioteca**, sobre respostas apoiadas em documentação, e a **Hamburgueria**, sobre como a precisão de um prompt muda o atendimento.
- Laboratório em pixel art inspirado na sala real, com estações de trabalho, data center e dez sprites da equipe. Cada execução sorteia seis integrantes distintos, um por papel. Os personagens caminham para entregar o envelope, e Service, Repository e Entity têm postos sentados.
- Configuração de nome, preço, falha simulada, nível da legenda e velocidade. As preferências podem ser salvas no navegador.
- Controles para reproduzir, pausar, retomar, avançar, voltar e reiniciar. O inspetor mostra requisição e resposta HTTP, código Java, estado e histórico da etapa selecionada.

### Backend · Cadastro de Produtos

| Cenário | Resposta simulada | Estado dos registros |
| --- | --- | --- |
| Nome preenchido e preço positivo | `201 Created` | Um produto cadastrado |
| Nome em branco ou preço zero/negativo | `400 Bad Request` | Nenhum produto cadastrado |
| Entrada válida e banco indisponível | `503 Service Unavailable` | Nenhum produto cadastrado |

Cada execução começa com registros vazios. O armazenamento é simulado em memória durante a demonstração.

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

Acesse [NARA Lab em localhost:3000](http://localhost:3000), abra **Acessar módulos** e escolha **Backend → Cadastro de Produtos** ou **Inteligência Artificial**. O Next.js encaminha as chamadas da API para o Spring em `http://127.0.0.1:8080` por padrão. Para outro endereço, defina a variável `SPRING_API_URL` no frontend.

Para verificar o projeto, execute `mvn test` em `backend/` e `npm run build` em `frontend/`.

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

No Backend, a evolução prevista inclui novos fluxos HTTP, inicialização do Spring e uma demonstração específica de persistência. Em Inteligência Artificial, as próximas demonstrações aprofundarão agentes, ferramentas, skills e harness. Consulte o [contexto técnico do NARA Lab](context.md) para o contrato da API, a lógica de reprodução e o inventário dos sprites.
