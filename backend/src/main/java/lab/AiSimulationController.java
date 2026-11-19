package lab;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/ia")
@Tag(name = "Módulo — Inteligência Artificial",
    description = "Simulações didáticas sobre consulta a uma fonte e clareza de prompts. Cada execução sorteia Codex ou Claude Code.")
public class AiSimulationController {
    record AiScenario(String id, String title, String description) {}

    record AiRequest(
        @Schema(allowableValues = {"biblioteca", "hamburgueria"}, requiredMode = Schema.RequiredMode.REQUIRED)
        String scenario,
        @Schema(description = "Na biblioteca, false simula uma falha de acesso à fonte. O padrão é true.")
        Boolean sourceAvailable
    ) {}

    record AiObservation(String label, String value) {}

    @Schema(description = "Etapa em ordem de reprodução. movement identifica um deslocamento no cenário.")
    record AiStep(String actor, String movement, String bubble, SimulationController.Caption caption,
                  List<AiObservation> observations) {}

    record AiTicket(String burger, String fries, String service) {}

    record AiOrderResult(String customer, int clarificationTurns, AiTicket ticket) {}

    record AiOutcome(String summary, List<AiOrderResult> orders) {}

    record AiRun(int schemaVersion,
                 @Schema(allowableValues = {"codex", "claude-code"}) String agent,
                 List<AiStep> steps, AiOutcome outcome) {}

    private static final List<String> AGENTS = List.of("codex", "claude-code");
    private static final AiTicket TICKET = new AiTicket(
        "Hambúrguer sem cebola, carne ao ponto", "Porção grande de batata frita", "Para comer aqui");
    private static final String VAGUE_PROMPT = "Quero um hambúrguer e batata frita.";
    private static final String DETAILED_PROMPT =
        "Quero um hambúrguer sem cebola, com a carne ao ponto, e uma porção grande de batata frita. É para comer aqui.";
    private static final String QUESTION = "Qual status o nosso simulador mostra quando o banco fica indisponível?";
    private static final String ANSWER =
        "O resultado é 503 em simulatedResponse.status. A requisição que calculou a simulação retorna HTTP 200.";
    private static final String UNVERIFIED =
        "A documentação está indisponível. Não consegui confirmar o status nesta fonte.";

    /** Lista as demonstrações que podem ser solicitadas à API do módulo. */
    @GetMapping("/scenarios")
    @Operation(summary = "Listar cenários de IA")
    public List<AiScenario> catalog() {
        return List.of(
            new AiScenario("biblioteca", "Consulta à documentação", "Acompanhe uma resposta fundamentada em uma fonte."),
            new AiScenario("hamburgueria", "O efeito do prompt", "Compare dois pedidos com a mesma intenção e níveis diferentes de detalhe."));
    }

    /** Sorteia o assistente uma vez e retorna toda a sequência didática para reprodução local. */
    @PostMapping("/simulations")
    @Operation(summary = "Executar uma simulação de IA",
        description = "Calcula uma sequência didática com um assistente sorteado. As interações e a consulta à fonte são simuladas.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
            content = @Content(schema = @Schema(implementation = AiRequest.class), examples = {
                @ExampleObject(name = "Biblioteca", value = "{\"scenario\":\"biblioteca\",\"sourceAvailable\":true}"),
                @ExampleObject(name = "Fonte indisponível", value = "{\"scenario\":\"biblioteca\",\"sourceAvailable\":false}"),
                @ExampleObject(name = "Hamburgueria", value = "{\"scenario\":\"hamburgueria\"}")
            })))
    @ApiResponse(responseCode = "200", description = "Sequência calculada.",
        content = @Content(schema = @Schema(implementation = AiRun.class)))
    @ApiResponse(responseCode = "400", description = "Cenário desconhecido ou configuração inválida.", content = @Content)
    public AiRun simulate(@RequestBody AiRequest request) {
        if (request.scenario() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe o cenário.");
        }
        String agent = AGENTS.get(ThreadLocalRandom.current().nextInt(AGENTS.size()));
        return switch (request.scenario()) {
            case "biblioteca" -> library(agent, !Boolean.FALSE.equals(request.sourceAvailable()));
            case "hamburgueria" -> {
                if (request.sourceAvailable() != null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceAvailable só se aplica à biblioteca.");
                }
                yield restaurant(agent);
            }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cenário de IA desconhecido.");
        };
    }

    /** Demonstra a consulta e condiciona a resposta à disponibilidade da evidência. */
    private AiRun library(String agent, boolean available) {
        var source = observation("Fonte", "README.md do NARA Lab · cadastro de produtos");
        var question = observation("Pergunta", QUESTION);
        var evidence = observation("Trecho consultado",
            "| Entrada válida e banco indisponível | `503 Service Unavailable` | Nenhum produto cadastrado |");
        String answer = available ? ANSWER : UNVERIFIED;
        var lookup = available
            ? step("assistant", "consult", "Encontrei o caso de banco indisponível na documentação.",
                "O assistente encontra o trecho sobre a falha do banco.",
                "A consulta simulada recupera uma passagem da tabela de resultados do cadastro.", source, evidence)
            : step("assistant", "consult", "Não consegui abrir a documentação.",
                "A fonte está indisponível e o status segue sem confirmação.",
                "A consulta simulada falha antes de recuperar a evidência.", source, observation("Resultado da consulta", "Fonte indisponível"));

        return new AiRun(1, agent, List.of(
            step("student", "stay", QUESTION, "Uma pessoa da equipe faz uma pergunta sobre o cadastro de produtos.",
                "O prompt pede um valor definido pelo contrato do NARA Lab.", question),
            step("assistant", "to-source", "Vou consultar a documentação do projeto.",
                "O assistente vai até a fonte que pode responder à pergunta.",
                "A biblioteca representa documentação acessada durante a execução.", question, source),
            lookup,
            step("assistant", "return", answer,
                available ? "O assistente volta com o resultado e indica de onde ele veio."
                    : "O assistente volta e explica por que ainda não pode confirmar a resposta.",
                available ? "A resposta distingue o status didático do status HTTP da API do simulador."
                    : "A resposta registra a ausência de evidência para manter explícita a incerteza.",
                available ? evidence : source, observation("Resposta", answer))
        ), new AiOutcome(answer, List.of()));
    }

    /** Compara os prompts mantendo a intenção, a comanda final e o fluxo da cozinha equivalentes. */
    private AiRun restaurant(String agent) {
        var vague = observation("Pedido inicial", VAGUE_PROMPT);
        var detailed = observation("Pedido inicial", DETAILED_PROMPT);
        var missing = observation("Detalhes ausentes", "Cebola, ponto da carne, tamanho da porção e local de consumo");
        var ticket = observation("Comanda", String.join(" · ", TICKET.burger(), TICKET.fries(), TICKET.service()));
        return new AiRun(1, agent, List.of(
            step("vague", "first-to-counter", VAGUE_PROMPT,
                "O primeiro cliente pede hambúrguer e fritas com poucos detalhes.",
                "O prompt informa os itens e deixa quatro campos relevantes em aberto.", vague, missing),
            step("assistant", "stay", "Quer cebola? Qual o ponto da carne e o tamanho das fritas? Vai comer aqui?",
                "O atendente pergunta pelos detalhes que faltam.",
                "Uma rodada de esclarecimento coleta os quatro parâmetros que faltam.", vague, missing),
            step("vague", "stay", "Sem cebola, carne ao ponto, fritas grandes e para comer aqui.",
                "O primeiro cliente completa o pedido.",
                "A resposta resolve os campos pendentes da comanda.",
                observation("Esclarecimento", "Sem cebola, carne ao ponto, porção grande, para comer aqui.")),
            step("assistant", "stay", "Pedido confirmado. Vou enviar a comanda à cozinha.",
                "O atendente registra o primeiro pedido completo.",
                "A comanda é estruturada após uma rodada de esclarecimento.", ticket),
            grill(ticket), fry(ticket), assemble(ticket),
            step("assistant", "first-to-table", "Seu pedido está pronto!",
                "O primeiro pedido é entregue.", "A cozinha concluiu a comanda do primeiro cliente.", ticket),
            step("detailed", "second-to-counter", DETAILED_PROMPT,
                "O segundo cliente já diz como quer cada item.",
                "O prompt especifica os quatro parâmetros na mensagem inicial.", detailed),
            step("assistant", "stay", "Pedido confirmado. Vou enviar a comanda à cozinha.",
                "O atendente já tem os detalhes para registrar o segundo pedido.",
                "A mesma estrutura de comanda é preenchida sem uma rodada de esclarecimento.", ticket),
            grill(ticket), fry(ticket), assemble(ticket),
            step("assistant", "second-to-table", "Seu pedido está pronto!",
                "O segundo pedido é entregue com os mesmos detalhes.",
                "A cozinha concluiu uma comanda com os mesmos valores da primeira.", ticket),
            step("assistant", "stay", "As comandas ficaram iguais. O primeiro atendimento precisou de uma rodada extra.",
                "Os clientes recebem a mesma refeição. O segundo pedido já continha os detalhes.",
                "A comparação mantém a intenção constante e mede as rodadas de esclarecimento.",
                observation("Primeiro cliente", "1 rodada de esclarecimento"),
                observation("Segundo cliente", "0 rodadas de esclarecimento"), ticket)
        ), new AiOutcome("Os dois pedidos geraram a mesma comanda após 1 e 0 rodadas de esclarecimento.",
            List.of(new AiOrderResult("vague", 1, TICKET), new AiOrderResult("detailed", 0, TICKET))));
    }

    private AiStep grill(AiObservation ticket) {
        return step("grill", "stay", "Carne ao ponto, saindo da chapa!",
            "A chapa prepara a carne ao ponto.", "A estação de chapa executa o ponto registrado na comanda.", ticket);
    }

    private AiStep fry(AiObservation ticket) {
        return step("fry", "stay", "Uma porção grande de fritas!",
            "A fritadeira prepara a porção grande.", "A estação de fritura usa o tamanho registrado na comanda.", ticket);
    }

    private AiStep assemble(AiObservation ticket) {
        return step("assembly", "stay", "Sem cebola. Vou servir no salão.",
            "A montagem finaliza o hambúrguer e arruma a bandeja.",
            "A estação de montagem aplica a restrição de ingrediente e o modo de serviço.", ticket);
    }

    /** Agrupa o diálogo, as duas legendas e os dados inspecionáveis de uma etapa. */
    private AiStep step(String actor, String movement, String bubble, String basic, String technical,
                        AiObservation... observations) {
        return new AiStep(actor, movement, bubble, new SimulationController.Caption(basic, technical), List.of(observations));
    }

    private AiObservation observation(String label, String value) {
        return new AiObservation(label, value);
    }
}
