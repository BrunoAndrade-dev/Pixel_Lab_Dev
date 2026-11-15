# Laboratório visual Java e Spring Boot

Plataforma de demonstrações configuráveis para uso em computador e projetor. O primeiro exemplo acompanha um cadastro de produto, da requisição HTTP até a resposta. Controller recebe a requisição, Service aplica a regra, a entidade representa o produto e Repository cuida da persistência simulada.

## Stacks utilizadas

| Parte | Tecnologias |
|---|---|
| Backend | Java 21, Spring Boot 3.5.16 e Spring Web MVC |
| Frontend | Next.js 16.2.6, React 19.2.6 e JavaScript com JSX |
| Interface e animações | CSS e Canvas 2D do navegador |
| Comunicação | API HTTP com dados em JSON |
| Build e dependências | Maven e npm |
| Testes do backend | JUnit 5 e MockMvc, via Spring Boot Starter Test |
| Configurações do professor | localStorage do navegador |

Os registros de produtos são simulados em memória durante cada demonstração.

## Executar no computador

Abra dois terminais na raiz do projeto. No primeiro, com JDK 21 e Maven instalados:

```sh
cd backend
mvn spring-boot:run
```

No segundo, com Node.js 22.12 ou superior e npm instalados:

```sh
cd frontend
npm install
npm run dev
```

Abra http://localhost:3000 no navegador com o backend em execução na porta 8080.

## Demonstrar

Comece com nome preenchido e preço positivo. Pause na validação e acompanhe a legenda, o código e os dados antes de avançar. Repita com preço inválido para verificar em qual camada o fluxo termina. Depois, use preço válido e ative a indisponibilidade do banco na aba de falhas. Compare o estado dos registros e o status HTTP da API representada nos três casos.
