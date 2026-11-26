package lab;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Inicialização e injeção representadas por snapshots: não sobe outra aplicação. */
@RestController
@RequestMapping("/api/boot")
@Tag(name = "Módulo backend\\Springboot")
public class BootSimulationController {
    record BootScenario(String id, String title, List<String> profiles) {}
    record Food(String meatPoint, boolean salad, String accompaniment, String drink) {}
    record BootRequest(@Schema(allowableValues = {"simple", "complete"}) String profile, Food food,
        @Schema(allowableValues = {"none", "missing-repository", "invalid-database"}) String failure) {}
    record Order(String profile, int table, String title, String foodOrder, String exactOrder,
        String page, String endpoint, int port, List<String> libraries, Map<String, String> properties,
        List<String> components, String storage, boolean validation, Food food) {}
    record Bean(String id, String type, List<String> dependencies) {}
    record HttpResult(int status, String method, String path, Object body) {}
    record Delivery(String title, String exactSummary, List<String> features, List<String> connectedBeans) {}
    record BootState(Order order, String startupStatus, List<Bean> beans, HttpResult httpResult, Delivery delivery, String error) {}
    record BootStep(int id, String actor, String action, String motion, String document, String dialogue,
        SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
        SchoolSimulationController.SchoolCode code, BootState state) {}
    record StartupResult(String status, String message) {}
    record BootRun(String schemaVersion, List<BootStep> steps, StartupResult startupResult, BootState finalState) {}

    @GetMapping("/scenarios")
    @Operation(summary = "Listar a aula de inicialização e suas duas configurações")
    public List<BootScenario> scenarios() { return List.of(new BootScenario("boot-restaurant", "Inicialização e injeção de dependência", List.of("simple", "complete"))); }

    @PostMapping("/simulations")
    @Operation(summary = "Montar uma aplicação Spring na lanchonete: bibliotecas, configuração e injeção",
        description = "Duas configurações didáticas independentes, uma por mesa. API real 200 para sequências calculadas, inclusive inicialização representada como FAILED. "
            + "Não há HTTP de uma aplicação que não iniciou. Não cria servidor, página, arquivos de projeto ou banco reais. Configuração inválida retorna 400 real. invalid-database só se aplica ao combo complete.")
    @ApiResponse(responseCode = "200", description = "Aula calculada", content = @Content(schema = @Schema(implementation = BootRun.class)))
    @ApiResponse(responseCode = "400", description = "Configuração inválida", content = @Content)
    public BootRun simulate(@RequestBody BootRequest request) {
        validate(request);
        Order order = order(request);
        var steps = new ArrayList<BootStep>();
        var beans = new ArrayList<Bean>();
        var initial = state(order, "ORDERED", beans, null, null, null);
        add(steps, "client", "order", "arrive", "ORDER", order.exactOrder(),
            "O cliente representa quem desenvolve o projeto. Seu pedido combina o lanche da história com os recursos da aplicação escolhida.",
            "A comanda separa bibliotecas do build, propriedades e classes de negócio já escritas. Escolher starters não gera Controllers ou Services.",
            "Este é exatamente o pedido recebido: " + order.exactOrder() + " A comanda completa aparece nesta etapa. A página /pedidos é uma tela ilustrativa de frontend; o atendimento do backend usa /api/pedidos. Não estamos enviando uma requisição para uma aplicação ainda desligada.",
            "O cliente representa o desenvolvedor nesta fase. As opções do lanche pertencem à narrativa, não são nomes de anotações Java. As duas mesas representam projetos independentes. A ordem recebe as bibliotecas e propriedades reais de exemplo listadas no papel.",
            "pom.xml", 1, pom(order), initial);
        add(steps, "waiter", "receipt", "idle", "ORDER", "Registrei a comanda completa da mesa " + order.table() + ". Vou organizar os componentes.",
            "O garçom representa o contêiner Spring: ele organiza os objetos da aplicação e suas ligações.",
            "ApplicationContext gerencia beans. Dependência de biblioteca no Maven é diferente de dependência entre objetos no construtor.",
            "A comanda guarda exatamente o pedido, com página, rota HTTP, porta, armazenamento e bibliotecas. O garçom é uma analogia do organizador, não uma classe chamada Dependencies. Registrar o pedido ainda não significa que a aplicação foi inicializada.",
            "Bibliotecas precisam estar disponíveis no build antes de executar o programa. Na inicialização, o Spring usa classes e configurações disponíveis para montar o contexto. A cena não baixa bibliotecas nem compila um projeto.",
            "application.properties", 1, properties(order), initial);
        var starting = state(order, "STARTING", beans, null, null, null);
        add(steps, "waiter", "start", "to-kitchen", null, "Vou iniciar o preparo com as bibliotecas e configurações escolhidas.",
            "A inicialização prepara a aplicação. É diferente de receber um pedido HTTP depois que ela já está pronta.",
            "SpringApplication.run inicia o contexto. @SpringBootApplication reúne configuração, auto-configuração e component scan.",
            "É como abrir a cozinha antes de atender pedidos. O Spring procura componentes e prepara a infraestrutura. A classe principal fica no pacote acima dos componentes neste exemplo, para permitir que sejam encontrados.",
            "O código do desenvolvedor já existe antes do início. Component scan encontra classes elegíveis no escopo de pacotes. Auto-configuração pode oferecer infraestrutura conforme classpath, propriedades e beans existentes; a ordem da cena é uma simplificação lógica.",
            "LanchoneteApplication.java", 4, """
                @SpringBootApplication
                public class LanchoneteApplication {
                    public static void main(String[] args) {
                        SpringApplication.run(LanchoneteApplication.class, args);
                    }
                }""", starting);
        if (request.failure().equals("invalid-database")) {
            add(steps, "waiter", "database-error", "idle", null, "Não consegui preparar o banco com essa URL. O preparo será interrompido.",
                "A configuração do banco está errada. A aplicação de exemplo não ficará pronta para atender.",
                "A URL inválida impede criar a infraestrutura de persistência. O contexto falha antes de disponibilizar a aplicação.",
                "A mesa completa pediu JPA e H2, mas a comanda contém uma URL inválida. A secretaria desta história é o armazenamento da cozinha: sem ele, os componentes que dependem do banco não conseguem ser montados. Não há resposta HTTP de teste.",
                "A falha representa erro de configuração de DataSource. A API que calcula esta aula continua funcionando: ela retorna snapshots, não é a aplicação ilustrada que deixou de iniciar.",
                "application.properties", 3, properties(order), state(order, "STARTING", beans, null, null, null));
            return fail(steps, order, "Configuração de banco inválida. Corrija spring.datasource.url antes de inicializar.");
        }
        if (order.validation()) {
            beans.add(new Bean("dataSource", "DataSource H2", List.of()));
            beans.add(new Bean("entityManagerFactory", "EntityManagerFactory", List.of("dataSource")));
            beans.add(new Bean("pedidoJpaRepository", "Proxy Spring Data JPA", List.of("entityManagerFactory")));
        }
        add(steps, "waiter", "infrastructure", "idle", null, order.validation() ? "JPA e H2 estão disponíveis para o armazenamento deste combo." : "Este combo usa uma lista em memória e não precisa de banco JDBC.",
            "As bibliotecas e propriedades permitem preparar a infraestrutura escolhida. A lógica do pedido continua sendo código do desenvolvedor.",
            order.validation() ? "O cenário representa DataSource, EntityManagerFactory e o proxy do repository Spring Data. H2 está em memória e não conserva dados após encerrar esta aplicação." : "A implementação em memória é uma classe @Repository escrita pelo desenvolvedor. Ela não precisa de JPA ou DataSource.",
            order.validation() ? "O combo completo inclui Web, Validation, Data JPA e o driver H2. O banco é de demonstração e fica na memória; não é PostgreSQL nem armazenamento permanente. Os personagens da cozinha representam componentes, não bibliotecas que criam regras automaticamente." : "O combo simples tem atendimento HTTP e guarda exemplos numa lista. @Repository registra a implementação em memória como componente; a anotação não transforma essa lista em um banco de dados.",
            "As duas aplicações oferecem a mesma abstração PedidoRepository para o Service. A implementação muda conforme o projeto escolhido. Nenhuma das conexões ou bibliotecas representadas é realmente carregada pelo simulador.",
            "pom.xml", 1, pom(order), state(order, "STARTING", beans, null, null, null));
        add(steps, "waiter", "scan", "idle", null, "Encontrei as receitas escritas pelo desenvolvedor. Vou montar os objetos necessários.",
            "Classe é uma receita. Objeto é uma instância criada a partir dela. Bean é um objeto gerenciado pelo Spring.",
            "O scan registra definições de componentes. Construtores indicam as dependências necessárias para instanciar os beans.",
            "A receita do atendente está marcada com @RestController; a do preparo com @Service; a do armazenamento com @Repository. Localizar a receita é diferente de já ter o objeto pronto e conectado.",
            "Uma interface sozinha não fornece uma instância. O exemplo requer uma implementação concreta de PedidoRepository registrada como bean. Em JPA, o adaptador usa ainda o proxy criado pelo Spring Data para a interface que estende JpaRepository.",
            "Componentes.java", 1, "// Classes já escritas no escopo do scan:\n@RestController class PedidoController { /* ... */ }\n@Service class PedidoService { /* ... */ }\n// PedidoRepository é o contrato; a implementação concreta é registrada abaixo.", state(order, "STARTING", beans, null, null, null));
        if (request.failure().equals("missing-repository")) return fail(steps, order,
            "PedidoService precisa de PedidoRepository, mas nenhuma implementação foi registrada como bean.");
        beans.add(new Bean("pedidoRepository", order.validation() ? "JpaPedidoAdapter" : "MemoriaPedidoRepository", order.validation() ? List.of("pedidoJpaRepository") : List.of()));
        add(steps, "storage", "repository", "idle", null, "O componente de armazenamento está pronto para ser entregue ao preparo.",
            "O Spring disponibilizou um objeto que oferece acesso aos pedidos. Agora o Service pode receber esse objeto.",
            "PedidoRepository é a abstração injetada. Existe uma implementação elegível no contexto desta configuração.",
            "A cozinha já tem quem busque os registros. No combo simples, é uma implementação que usa uma lista. No completo, é um adaptador que consulta o repository Spring Data JPA. Essa diferença fica escondida atrás do mesmo contrato usado pelo Service.",
            "Os beans são referências a objetos, não cópias de bibliotecas. A implementação em memória e o adaptador JPA pertencem a projetos didáticos separados; não há duas implementações concorrendo pela mesma injeção nesta aula.",
            "PedidoRepository.java", 1, repositoryCode(order), state(order, "STARTING", beans, null, null, null));
        beans.add(new Bean("pedidoService", "PedidoService", List.of("pedidoRepository")));
        add(steps, "cook", "service", "idle", null, "Recebi o acesso aos pedidos pelo construtor. Posso aplicar as regras de preparo.",
            "O Spring entrega ao Service o objeto de que ele precisa. Isso é injeção de dependência pelo construtor.",
            "PedidoService recebe PedidoRepository no único construtor. Não precisa de @Autowired neste caso.",
            "Imagine o cozinheiro recebendo o instrumento necessário para trabalhar. O Service recebe uma referência já disponível; não precisa criar seu próprio armazenamento com new. Isso permite trocar a implementação de armazenamento sem reescrever essa ligação no Service.",
            "O contêiner resolve o tipo exigido pelo construtor e fornece o bean correspondente. O exemplo omite múltiplos candidatos, escopos e dependências circulares para manter o foco na ligação básica.",
            "PedidoService.java", 4, """
                @Service
                class PedidoService {
                    private final PedidoRepository repository;
                    PedidoService(PedidoRepository repository) {
                        this.repository = repository;
                    }
                    List<PedidoDto> listar() { return repository.listar(); }
                }""", state(order, "STARTING", beans, null, null, null));
        beans.add(new Bean("pedidoController", "PedidoController", List.of("pedidoService")));
        add(steps, "counter", "controller", "idle", null, "Recebi o Service. Já sei para quem encaminhar o atendimento HTTP.",
            "O atendente representa o Controller. Ele recebe o Service pelo construtor e define a rota que atenderá o cliente.",
            "@RestController e @RequestMapping definem a entrada HTTP. O construtor conecta PedidoController a PedidoService.",
            "O atendente não precisa cozinhar nem buscar registros diretamente. Ele conhece o Service que coordena o trabalho. A cadeia ficou Controller → Service → Repository. Conectar objetos é o ponto central desta aula.",
            "A rota existe porque foi programada. O starter Web oferece infraestrutura para atendimento; não gera a rota de pedidos. @RestController também não cria automaticamente uma página HTML.",
            "PedidoController.java", 5, controllerCode(), state(order, "STARTING", beans, null, null, null));
        add(steps, "waiter", "ready", "idle", null, "Os componentes estão conectados. A aplicação está pronta para receber requisições.",
            "Só agora o exemplo representa uma aplicação pronta. Inicialização e atendimento são fases diferentes.",
            "Contexto e infraestrutura HTTP prontos; a porta ilustrativa é " + order.port() + ". Não abrimos essa porta de verdade.",
            "A cozinha foi organizada e os papéis estão conectados. Uma requisição pode ser atendida depois desse ponto. A página /pedidos pertence ao frontend ilustrativo e consumirá a API /api/pedidos.",
            "A etapa READY representa a conclusão bem-sucedida da inicialização. A sequência não pretende reproduzir a ordem de todos os eventos internos do Spring Boot. Não há servidor novo ou página gerada no computador.",
            "Inicializacao.log", 1, "Started LanchoneteApplication\n// Porta ilustrativa: " + order.port(), state(order, "READY", beans, null, null, null));
        add(steps, "counter", "http-request", "idle", null, "A página Pedidos está solicitando a lista pela API.",
            "A tela faz GET /api/pedidos. O Controller chama o Service, que consulta o Repository.",
            "O atendimento usa os objetos previamente conectados; não reinicializa a aplicação nem injeta tudo novamente a cada chamada.",
            "Agora o cliente representa quem utiliza a aplicação pronta. A pequena página ilustrativa Pedidos pede a lista. GET é uma consulta: ela não cria um novo pedido no banco. Os dados da lista são exemplos preparados para a demonstração.",
            "A mudança de papel do cliente é explícita: primeiro ele representava o desenvolvedor configurando o projeto; agora representa um usuário de frontend. O caminho HTTP é apenas representado na API do simulador.",
            "PedidoController.java", 8, controllerCode(), state(order, "READY", beans, null, null, null));
        var http = new HttpResult(200, "GET", order.endpoint(), List.of(Map.of("id", 1, "descricao", order.foodOrder(), "status", "Exemplo pronto")));
        add(steps, "cook", "http-response", "idle", null, "A consulta terminou. A página recebeu a lista de pedidos.",
            "A resposta HTTP 200 contém os dados que a tela pode apresentar. Isso é atendimento, depois da inicialização.",
            "Controller → Service → Repository retornou uma lista de DTOs. HTTP 200 é o resultado da consulta ilustrativa.",
            "A página Pedidos pode mostrar o lanche descrito na comanda. O desenho de um hambúrguer é apenas a analogia de uma aplicação configurada: a aplicação real continua sendo código, objetos e infraestrutura.",
            "No combo completo, Validation está disponível para rotas que validem entrada com @Valid e constraints. Esta consulta GET não demonstra rejeição de entrada. O simulador não executa os trechos Java nem acessa H2.",
            "Resposta.json", 1, "// GET /api/pedidos → 200\n// Lista ilustrativa de PedidoDto para a página Pedidos.", state(order, "READY", beans, http, null, null));
        String summary = "Mesa " + order.table() + ": aplicação pronta com página Pedidos ilustrativa, API GET " + order.endpoint()
            + ", porta " + order.port() + ", " + order.storage() + (order.validation() ? " e validação de entrada disponível." : ".");
        var features = new ArrayList<>(List.of("Página /pedidos: frontend ilustrativo que consome a API", "Atendimento HTTP em " + order.endpoint(), "Porta ilustrativa " + order.port(), "Armazenamento: " + order.storage(), "Controller → Service → Repository conectados por construtor"));
        if (order.validation()) features.add("Validação de entrada disponível para uso com @Valid e constraints");
        var delivery = new Delivery("Aplicação pronta · mesa " + order.table(), summary, List.copyOf(features), beans.stream().map(Bean::id).toList());
        var delivered = state(order, "DELIVERED", beans, http, delivery, null);
        add(steps, "waiter", "delivery", "deliver", "DELIVERY", summary,
            "A ficha de entrega mostra exatamente o que ficou disponível. Compare-a com a comanda inicial.",
            "Entrega resume configuração, beans e teste HTTP. É um resultado didático, não um deploy ou um projeto gerado.",
            "Entrega concluída: " + summary + " A ficha completa mostra os recursos e os componentes conectados. Você pode revisar a comanda e a entrega no histórico, ou escolher a outra mesa para comparar as configurações.",
            "O resultado desta mesa não altera o da outra. Reproduzir, pausar ou voltar apenas revisa snapshots e não reinicializa uma aplicação de verdade. O H2 de demonstração também é em memória; não representa persistência entre reinícios.",
            "Entrega.txt", 1, summary, delivered);
        return new BootRun("1.0", List.copyOf(steps), new StartupResult("READY", summary), delivered);
    }

    private BootRun fail(List<BootStep> steps, Order order, String error) {
        var failed = state(order, "FAILED", List.of(), null, null, error);
        add(steps, "waiter", "failed", "idle", "ORDER", "Não consegui concluir esta montagem. Confira a comanda e o motivo da falha.",
            error + " A aplicação ilustrada não ficou pronta e não atende a consulta de teste.",
            "Falha de inicialização: o contexto é encerrado. Não existe resposta HTTP da aplicação que não iniciou.",
            "A comanda continua disponível para revisão, mas não existe ficha de entrega nem página pronta. Motivo: " + error + " Corrija a configuração e execute um novo exemplo. A outra mesa mantém sua própria demonstração.",
            "Beans parcialmente criados não tornam o contexto saudável. O snapshot final limpa os componentes ativos para representar o encerramento após falha. O erro é um resultado da aula, não uma falha real do backend que calcula as etapas.",
            "Inicializacao.log", 1, "APPLICATION FAILED TO START\n" + error, failed);
        return new BootRun("1.0", List.copyOf(steps), new StartupResult("FAILED", error), failed);
    }
    private Order order(BootRequest r) {
        boolean full = r.profile().equals("complete"); int table = full ? 2 : 1, port = full ? 8082 : 8081;
        String food = "Hambúrguer " + r.food().meatPoint() + ", " + (r.food().salad() ? "com salada" : "sem salada")
            + ", acompanhamento: " + r.food().accompaniment() + ", bebida: " + r.food().drink() + ".";
        var libraries = new ArrayList<>(List.of("org.springframework.boot:spring-boot-starter-web"));
        var props = new LinkedHashMap<String, String>();
        props.put("spring.application.name", full ? "lanchonete-completa" : "lanchonete-simples"); props.put("server.port", String.valueOf(port));
        if (full) {
            libraries.addAll(List.of("org.springframework.boot:spring-boot-starter-validation", "org.springframework.boot:spring-boot-starter-data-jpa", "com.h2database:h2 (runtime)"));
            props.put("spring.datasource.url", r.failure().equals("invalid-database") ? "jdbc:invalido:pedidos" : "jdbc:h2:mem:pedidos;DB_CLOSE_ON_EXIT=FALSE");
            props.put("spring.datasource.username", "sa"); props.put("spring.datasource.password", "");
            props.put("spring.jpa.hibernate.ddl-auto", "create-drop");
        }
        String storage = full ? "JPA + H2 em memória (demonstração)" : "lista em memória, sem JDBC";
        String exact = food + " Quero uma página Pedidos (/pedidos), atendimento HTTP GET /api/pedidos, porta " + port + ", "
            + storage + (full ? " e validação de entrada. Banco: URL " + props.get("spring.datasource.url")
                + ", usuário sa, senha vazia de demonstração e esquema create-drop." : ". Não preciso de configuração de banco JDBC.");
        return new Order(r.profile(), table, full ? "Combo completo" : "Combo simples", food, exact, "/pedidos", "/api/pedidos", port,
            List.copyOf(libraries), java.util.Collections.unmodifiableMap(props), List.of("PedidoController · @RestController", "PedidoService · @Service", "PedidoRepository · contrato e implementação"), storage, full, r.food());
    }
    private void validate(BootRequest r) {
        if (r == null || r.profile() == null || !Set.of("simple", "complete").contains(r.profile()) || r.failure() == null
            || !Set.of("none", "missing-repository", "invalid-database").contains(r.failure()) || r.food() == null
            || r.food().meatPoint() == null || !Set.of("ao ponto", "bem passado").contains(r.food().meatPoint())
            || r.food().accompaniment() == null || !Set.of("batata frita", "sem acompanhamento").contains(r.food().accompaniment())
            || r.food().drink() == null || !Set.of("refrigerante", "suco de laranja", "água").contains(r.food().drink())
            || r.profile().equals("simple") && r.failure().equals("invalid-database"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Confira combo, lanche e condição. Falha de banco só é válida no combo completo.");
    }
    private BootState state(Order order, String status, List<Bean> beans, HttpResult http, Delivery delivery, String error) {
        return new BootState(order, status, List.copyOf(beans), http, delivery, error);
    }
    private String properties(Order order) { return order.properties().entrySet().stream().map(e -> e.getKey() + "=" + e.getValue()).collect(java.util.stream.Collectors.joining("\n")); }
    private String pom(Order order) {
        var xml = new StringBuilder("<!-- Trecho Spring Boot 3.5: parent/BOM e demais campos omitidos. -->\n<dependencies>\n");
        for (String library : order.libraries()) {
            String[] coordinate = library.replace(" (runtime)", "").split(":");
            xml.append("  <dependency>\n    <groupId>").append(coordinate[0]).append("</groupId>\n    <artifactId>")
                .append(coordinate[1]).append("</artifactId>\n");
            if (library.endsWith(" (runtime)")) xml.append("    <scope>runtime</scope>\n");
            xml.append("  </dependency>\n");
        }
        return xml.append("</dependencies>").toString();
    }
    private String repositoryCode(Order order) { return order.validation() ? """
        interface PedidoRepository { List<PedidoDto> listar(); }
        interface PedidoJpaRepository extends JpaRepository<PedidoEntity, Long> {}
        @Repository("pedidoRepository")
        class JpaPedidoAdapter implements PedidoRepository {
            private final PedidoJpaRepository jpa;
            JpaPedidoAdapter(PedidoJpaRepository jpa) { this.jpa = jpa; }
            public List<PedidoDto> listar() {
                return jpa.findAll().stream().map(PedidoDto::from).toList();
            }
        }
        // Entity, DTO e detalhes omitidos: código ilustrativo já escrito.""" : """
        interface PedidoRepository { List<PedidoDto> listar(); }
        @Repository("pedidoRepository")
        class MemoriaPedidoRepository implements PedidoRepository {
            private final List<PedidoDto> exemplos = new ArrayList<>();
            public List<PedidoDto> listar() { return List.copyOf(exemplos); }
        }
        // A lista de exemplo é preenchida pelo código da aplicação.
        // @Repository não converte a lista em um banco."""; }
    private String controllerCode() { return """
        @RestController
        @RequestMapping("/api/pedidos")
        class PedidoController {
            private final PedidoService service;
            PedidoController(PedidoService service) {
                this.service = service;
            }
            @GetMapping
            List<PedidoDto> listar() { return service.listar(); }
        }
        // /pedidos é uma tela de frontend ilustrativa, não gerada pela anotação."""; }
    private void add(List<BootStep> steps, String actor, String action, String motion, String document, String dialogue,
        String basic, String technical, String historyBasic, String historyTechnical, String file, int line, String code, BootState state) {
        steps.add(new BootStep(steps.size() + 1, actor, action, motion, document, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical), new SchoolSimulationController.SchoolText(historyBasic, historyTechnical),
            new SchoolSimulationController.SchoolCode(file + " (didático)", line, code), state));
    }
}
