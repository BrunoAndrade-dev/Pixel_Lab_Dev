# NARA Lab

O NARA Lab é uma plataforma educativa de simulações interativas. Em uma sala isométrica em pixel art, personagens representam componentes de um sistema para ajudar professores e estudantes a relacionar o que acontece em cada etapa com o código, os dados e o resultado da operação.

## O que a plataforma contempla

- Página inicial responsiva com ícones animados, catálogo por áreas e uma aba **Como funciona** com a proposta didática e orientações para a primeira demonstração.
- Módulo **Backend** com o cenário **Cadastro de Produtos**, que acompanha um `POST /produtos` simulado no Spring Boot. Cliente, Controller, Service, Entity, Repository e Banco têm papéis identificáveis na sala.
- Laboratório em pixel art inspirado na sala real, com estações de trabalho, data center e dez sprites da equipe. Cada execução sorteia seis integrantes distintos, um por papel. Os personagens caminham para entregar o envelope, e Service, Repository e Entity têm postos sentados.
- Configuração de nome, preço, falha simulada, nível da legenda e velocidade. As preferências podem ser salvas no navegador.
- Controles para reproduzir, pausar, retomar, avançar, voltar e reiniciar. O inspetor mostra requisição e resposta HTTP, código Java, estado e histórico da etapa selecionada.

### Cenários disponíveis

| Cenário | Resposta simulada | Estado dos registros |
| --- | --- | --- |
| Nome preenchido e preço positivo | `201 Created` | Um produto cadastrado |
| Nome em branco ou preço zero/negativo | `400 Bad Request` | Nenhum produto cadastrado |
| Entrada válida e banco indisponível | `503 Service Unavailable` | Nenhum produto cadastrado |

Cada execução começa com registros vazios. O armazenamento é simulado em memória durante a demonstração.

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

Acesse [NARA Lab em localhost:3000](http://localhost:3000), abra **Acessar módulos** e selecione **Backend → Cadastro de Produtos**. O Next.js encaminha as chamadas da API para o Spring em `http://127.0.0.1:8080` por padrão. Para outro endereço, defina a variável `SPRING_API_URL` no frontend.

Para verificar o projeto, execute `mvn test` em `backend/` e `npm run build` em `frontend/`.

## Passos futuros

O catálogo já exibe as áreas abaixo. Os conteúdos indicados são propostas iniciais para as próximas implementações.

| Módulo a implementar | Primeiro cenário proposto |
| --- | --- |
| Lógica de Programação | Percorrer condicionais e laços, observando o valor das variáveis a cada passo |
| Frontend | Acompanhar eventos de formulário, validação e atualização da interface |
| Banco de Dados | Simular operações CRUD e visualizar os efeitos de uma transação |
| Arquitetura | Acompanhar a troca de dados entre componentes com responsabilidades diferentes |
| Agentes de IA | Visualizar uma tarefa desde a entrada até o uso de uma ferramenta e a devolução do resultado |
| DevOps | Simular as etapas de build, teste e entrega de uma aplicação |
| Metodologias Ágeis | Acompanhar um fluxo Kanban, com limites de trabalho em andamento e bloqueios |

No Backend, a evolução prevista inclui novos fluxos HTTP, inicialização do Spring e uma demonstração específica de persistência. Consulte o [contexto técnico do NARA Lab](context.md) para o contrato da API, a lógica de reprodução e o inventário dos sprites.
