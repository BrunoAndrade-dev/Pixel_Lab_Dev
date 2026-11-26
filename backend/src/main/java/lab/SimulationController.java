package lab;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${CORS_ALLOWED_ORIGINS:http://localhost:3000,http://127.0.0.1:3000}")
@Tag(name = "Módulo backend\\Springboot",
    description = "Simula o cadastro de produtos com Spring Boot. Consulte os cenários e acompanhe o fluxo HTTP do cliente ao banco de dados.")
public class SimulationController {
    record Scenario(
        @Schema(description = "Identificador enviado ao solicitar a simulação.", example = "create-product")
        String id,
        @Schema(example = "Cadastro de produto") String title,
        @Schema(example = "Acompanhe POST /produtos pelas camadas do Spring.") String description
    ) {}

    record Inputs(
        @Schema(description = "Nome do produto. Use uma string vazia para simular erro de validação.",
            example = "Teclado", requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(description = "Preço do produto. Zero ou valores negativos simulam erro de validação.",
            example = "89.90", requiredMode = Schema.RequiredMode.REQUIRED) BigDecimal price
    ) {}

    record Request(
        @Schema(description = "Identificador do cenário consultado no catálogo.",
            allowableValues = "create-product", requiredMode = Schema.RequiredMode.REQUIRED) String scenario,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Inputs inputs,
        @Schema(description = "Falha que a demonstração deve simular.",
            allowableValues = {"none", "database-unavailable"}, requiredMode = Schema.RequiredMode.REQUIRED)
        String failure
    ) {}

    record Product(
        @Schema(example = "1", requiredMode = Schema.RequiredMode.REQUIRED) int id,
        @Schema(example = "Teclado", requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(example = "89.90", requiredMode = Schema.RequiredMode.REQUIRED) BigDecimal price
    ) {}
    record SimulatedError(
        @Schema(example = "Banco indisponível.", requiredMode = Schema.RequiredMode.REQUIRED) String error
    ) {}

    @Schema(description = "Estado dos dados na etapa. Cada execução começa com a lista de produtos vazia.")
    record State(Inputs requestBody, List<Product> products) {}
    record Caption(
        @Schema(description = "Explicação para iniciantes.") String basic,
        @Schema(description = "Explicação técnica sobre o que ocorre na etapa.") String technical
    ) {}
    @Schema(description = "Trecho Java de apoio. É nulo em etapas sem código associado.")
    record Code(String file, @Schema(description = "Linha destacada, começando em 1.") int line, String source) {}
    record Step(
        @Schema(allowableValues = {"client", "controller", "service", "entity", "repository", "database"})
        String actor,
        @Schema(description = "Identificador da ação representada.", example = "validate") String action,
        @Schema(description = "Texto exibido no balão do personagem.") String bubble,
        Caption caption,
        Code code,
        State state
    ) {}
    record Response(
        @Schema(description = "Status HTTP do cadastro demonstrado. Pode ser 201, 400 ou 503.", example = "201")
        int status,
        @Schema(description = "Produto cadastrado no sucesso ou mensagem de erro na falha.",
            oneOf = {Product.class, SimulatedError.class}) Object body
    ) {}
    record Run(
        @Schema(description = "Versão do formato da sequência de etapas.", example = "1") int schemaVersion,
        @Schema(description = "Etapas em ordem de reprodução.") List<Step> steps,
        Response simulatedResponse
    ) {}

    private static final String CONTROLLER = """
            @PostMapping("/produtos")
            ResponseEntity<Produto> cadastrar(@RequestBody Entrada entrada) {
                Produto salvo = service.cadastrar(entrada);
                return ResponseEntity.status(201).body(salvo);
            }""";
    private static final String SERVICE = """
            Produto cadastrar(Entrada entrada) {
                if (entrada.name().isBlank() || entrada.price().signum() <= 0)
                    throw new EntradaInvalida();
                Produto produto = new Produto(entrada.name(), entrada.price());
                return repository.save(produto);
            }""";

    @GetMapping("/scenarios")
    @Operation(summary = "Listar cenários disponíveis",
        description = "Retorna o catálogo de demonstrações. Use o id de um cenário para executar a simulação.")
    @ApiResponse(responseCode = "200", description = "Catálogo de cenários.",
        content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = Scenario.class))))
    public List<Scenario> catalog() {
        return List.of(new Scenario("create-product", "Cadastro de produto", "Acompanhe POST /produtos pelas camadas do Spring."));
    }

    @PostMapping("/simulations")
    @Operation(summary = "Calcular uma simulação",
        description = """
            Calcula as etapas do cadastro a partir dos valores informados. Cada execução simula seus próprios registros.
            Uma simulação calculada retorna HTTP 200. O resultado didático fica em simulatedResponse.status
            e pode ser 201 (produto cadastrado), 400 (entrada rejeitada) ou 503 (banco indisponível).
            """,
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = Request.class),
            examples = {
                @ExampleObject(name = "Cadastro válido", summary = "Resultado simulado 201",
                    value = """
                        {"scenario":"create-product","inputs":{"name":"Teclado","price":89.90},"failure":"none"}
                        """),
                @ExampleObject(name = "Preço inválido", summary = "Resultado simulado 400",
                    value = """
                        {"scenario":"create-product","inputs":{"name":"Teclado","price":0},"failure":"none"}
                        """),
                @ExampleObject(name = "Banco indisponível", summary = "Resultado simulado 503",
                    value = """
                        {"scenario":"create-product","inputs":{"name":"Teclado","price":89.90},"failure":"database-unavailable"}
                        """)
            }
        )))
    @ApiResponse(responseCode = "200", description = "Simulação calculada, incluindo o resultado didático.",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = Run.class)))
    @ApiResponse(responseCode = "400",
        description = "JSON malformado, configuração desconhecida ou campos obrigatórios ausentes.",
        content = @Content(mediaType = "application/json", schema = @Schema(type = "object"),
            examples = @ExampleObject(value = """
                {"timestamp":"2026-01-01T12:00:00.000+00:00","status":400,"error":"Bad Request","path":"/api/simulations"}
                """)))
    public Run simulate(@RequestBody Request request) {
        Inputs input = request.inputs();
        if (!"create-product".equals(request.scenario()) || input == null ||
                input.name() == null || input.price() == null || request.failure() == null ||
                !Set.of("none", "database-unavailable").contains(request.failure())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cenário, entradas ou opção de falha inválidos.");
        }
        State state = new State(input, List.of());
        var steps = new ArrayList<Step>();
        steps.add(new Step("client", "request", "Vou cadastrar um produto.", new Caption("O cliente envia o nome e o preço.", "POST /produtos transporta o corpo JSON."), null, state));
        steps.add(new Step("controller", "receive", "Recebi o pedido.", new Caption("O Controller entrega a entrada ao Service.", "@RequestBody converte o JSON em Entrada."), new Code("ProdutoController.java", 3, CONTROLLER), state));
        steps.add(new Step("service", "validate", "Vou conferir nome e preço.", new Caption("O nome precisa estar preenchido e o preço deve ser positivo.", "O Service verifica isBlank() e o sinal de BigDecimal."), new Code("ProdutoService.java", 2, SERVICE), state));

        if (input.name().isBlank() || input.price().signum() <= 0) {
            return failure(steps, state, 400, "Informe um nome e um preço positivo.", "EntradaInvalida");
        }
        steps.add(new Step("entity", "create", "Represento o produto em memória.", new Caption("O Service cria o objeto que será gravado.", "A instância de Produto contém nome e preço e ainda não foi persistida."), new Code("ProdutoService.java", 4, SERVICE), state));
        steps.add(new Step("repository", "save", "Solicito a gravação.", new Caption("O Repository encaminha a operação de persistência.", "O exemplo usa o método save da interface de repositório."), new Code("ProdutoService.java", 5, SERVICE), state));
        if (request.failure().equals("database-unavailable")) {
            steps.add(new Step("database", "unavailable", "A conexão está indisponível.", new Caption("Nenhum produto foi salvo.", "A simulação representa uma falha de conexão durante a persistência."), null, state));
            return failure(steps, state, 503, "Banco indisponível.", "DataAccessResourceFailureException");
        }
        Product saved = new Product(1, input.name(), input.price());
        State updated = new State(input, List.of(saved));
        steps.add(new Step("database", "persist", "Produto gravado com o identificador 1.", new Caption("O produto aparece nos registros.", "A gravação simulada atribui o identificador e conclui a persistência."), null, updated));
        steps.add(new Step("controller", "respond", "O produto foi criado.", new Caption("O Controller devolve o registro criado.", "A resposta HTTP usa 201 Created e o produto como corpo."), new Code("ProdutoController.java", 4, CONTROLLER), updated));
        return finish(steps, updated, new Response(201, saved));
    }

    private Run failure(List<Step> steps, State state, int status, String message, String exception) {
        String handler = "@ExceptionHandler(" + exception + ".class)\nResponseEntity<?> tratar() {\n    return ResponseEntity.status(" + status + ").body(Map.of(\"error\", \"" + message + "\"));\n}";
        steps.add(new Step("controller", "handle-error", message, new Caption("Um tratador prepara a resposta de erro.", "O @RestControllerAdvice do exemplo mapeia " + exception + " para HTTP " + status + "."), new Code("TratadorDeErros.java", 3, handler), state));
        return finish(steps, state, new Response(status, new SimulatedError(message)));
    }

    private Run finish(List<Step> steps, State state, Response response) {
        steps.add(new Step("client", "receive-response", "Recebi HTTP " + response.status() + ".", new Caption("O cliente vê o resultado da operação.", "O status e o corpo JSON compõem a resposta simulada."), null, state));
        return new Run(1, steps, response);
    }
}
