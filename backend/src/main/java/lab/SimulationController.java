package lab;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class SimulationController {
    record Scenario(String id, String title, String description) {}
    record Inputs(String name, BigDecimal price) {}
    record Request(String scenario, Inputs inputs, String failure) {}
    record Product(int id, String name, BigDecimal price) {}
    record State(Inputs requestBody, List<Product> products) {}
    record Caption(String basic, String technical) {}
    record Code(String file, int line, String source) {}
    record Step(String actor, String action, String bubble, Caption caption, Code code, State state) {}
    record Response(int status, Object body) {}
    record Run(int schemaVersion, List<Step> steps, Response simulatedResponse) {}

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
    public List<Scenario> catalog() {
        return List.of(new Scenario("create-product", "Cadastro de produto", "Acompanhe POST /produtos pelas camadas do Spring."));
    }

    @PostMapping("/simulations")
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
        return finish(steps, state, new Response(status, Map.of("error", message)));
    }

    private Run finish(List<Step> steps, State state, Response response) {
        steps.add(new Step("client", "receive-response", "Recebi HTTP " + response.status() + ".", new Caption("O cliente vê o resultado da operação.", "O status e o corpo JSON compõem a resposta simulada."), null, state));
        return new Run(1, steps, response);
    }
}
