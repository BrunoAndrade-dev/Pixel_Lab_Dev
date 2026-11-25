package lab;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Simulador stateless: o navegador envia o estado da sessão e recebe snapshots para revisão. */
@RestController
@RequestMapping("/api/school")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolSimulationController {
    record SchoolScenario(String id, String title, String description) {}
    record SchoolInputs(
        @JsonDeserialize(using = StrictInteger.class) Integer id,
        String student, String subject, BigDecimal grade
    ) {}
    record SchoolGrade(
        @JsonDeserialize(using = StrictInteger.class) Integer id,
        String student, String subject, BigDecimal grade
    ) {}
    record SchoolRequest(
        @Schema(allowableValues = {"create", "read", "update", "delete"}, requiredMode = Schema.RequiredMode.REQUIRED) String operation,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) SchoolInputs inputs,
        @Schema(description = "Snapshot dos registros da sessão, não um banco compartilhado.", requiredMode = Schema.RequiredMode.REQUIRED) List<SchoolGrade> records,
        @JsonDeserialize(using = StrictInteger.class)
        @Schema(description = "Próximo ID, inteiro positivo maior que todos os IDs do snapshot.", requiredMode = Schema.RequiredMode.REQUIRED) Integer nextId,
        @Schema(allowableValues = {"none", "database-unavailable"}, requiredMode = Schema.RequiredMode.REQUIRED) String failure
    ) {}
    record SchoolText(String basic, String technical) {}
    record SchoolCode(String file, int line, String source) {}
    record SchoolState(List<SchoolGrade> records, int nextId, Map<String, Object> requestBody) {}
    record SchoolFinalState(List<SchoolGrade> records, int nextId) {}
    record SchoolStep(int id, String actor, String action, String motion, String dialogue,
                      SchoolText caption, SchoolText history, SchoolCode code, SchoolState state) {}
    record SchoolResponse(int status, Object body) {}
    record SchoolRun(String schemaVersion, List<SchoolStep> steps, SchoolResponse simulatedResponse, SchoolFinalState finalState) {}

    /** Não permite que Jackson transforme silenciosamente um ID fracionário em inteiro. */
    public static class StrictInteger extends JsonDeserializer<Integer> {
        @Override
        public Integer deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            if (parser.currentToken() != JsonToken.VALUE_NUMBER_INT) {
                return (Integer) context.handleUnexpectedToken(Integer.class, parser);
            }
            return parser.getIntValue();
        }
    }

    @GetMapping("/scenarios")
    @Operation(summary = "Listar cenários escolares de Backend")
    public List<SchoolScenario> catalog() {
        return List.of(new SchoolScenario("school-grades", "CRUD na escola",
            "Cadastre, consulte, atualize e exclua registros de notas, acompanhando professor e secretaria."),
            new SchoolScenario("school-dto", "DTO e boletim escolar",
                "Compare DTO de entrada, entidade e DTO de saída durante a emissão de um boletim."),
            new SchoolScenario("school-validation", "Validação e tratamento de erros",
                "Valide campos e acompanhe a tradução de exceções em respostas HTTP compreensíveis."),
            new SchoolScenario("school-jpa", "Persistência com Spring Data JPA",
                "Grave uma nota na tabela e consulte o mesmo registro em uma nova sessão."));
    }

    @PostMapping("/simulations")
    @Operation(summary = "Calcular uma operação CRUD de notas",
        description = """
            Recebe o snapshot da sessão e calcula uma sequência determinística, sem banco real ou estado compartilhado.
            HTTP 200 significa que a simulação foi calculada; simulatedResponse.status representa o HTTP didático
            (201, 200, 204, 400, 404 ou 503). Configuração inválida da própria API retorna HTTP 400.
            UPDATE representa PUT completo. DELETE exclui só o registro da nota, não o aluno.
            Código, tráfego entre personagens e persistência são representações didáticas.
            """,
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            schema = @Schema(implementation = SchoolRequest.class), examples = {
                @ExampleObject(name = "Cadastrar nota", value = """
                    {"operation":"create","inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"records":[],"nextId":1,"failure":"none"}
                    """),
                @ExampleObject(name = "Consultar nota", value = """
                    {"operation":"read","inputs":{"id":1},"records":[{"id":1,"student":"Ana","subject":"Matemática","grade":8.5}],"nextId":2,"failure":"none"}
                    """),
                @ExampleObject(name = "Atualizar nota", value = """
                    {"operation":"update","inputs":{"id":1,"student":"Ana","subject":"Matemática","grade":9},"records":[{"id":1,"student":"Ana","subject":"Matemática","grade":8.5}],"nextId":2,"failure":"none"}
                    """),
                @ExampleObject(name = "Excluir nota", value = """
                    {"operation":"delete","inputs":{"id":1},"records":[{"id":1,"student":"Ana","subject":"Matemática","grade":8.5}],"nextId":2,"failure":"none"}
                    """),
                @ExampleObject(name = "Nota inválida", value = """
                    {"operation":"create","inputs":{"student":"Ana","subject":"Matemática","grade":11},"records":[],"nextId":1,"failure":"none"}
                    """),
                @ExampleObject(name = "Secretaria indisponível", value = """
                    {"operation":"create","inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"records":[],"nextId":1,"failure":"database-unavailable"}
                    """)
            })))
    @ApiResponse(responseCode = "200", description = "Sequência e resultado HTTP didático calculados.",
        content = @Content(schema = @Schema(implementation = SchoolRun.class)))
    @ApiResponse(responseCode = "400", description = "JSON, operação, ID, snapshot, nextId ou opção de falha inválidos.", content = @Content)
    public SchoolRun simulate(@RequestBody SchoolRequest request) {
        validateConfiguration(request);
        String operation = request.operation();
        SchoolInputs input = request.inputs();
        List<SchoolGrade> records = List.copyOf(request.records());
        Map<String, Object> body = requestBody(operation, input);
        SchoolState state = new SchoolState(records, request.nextId(), body);
        var steps = new ArrayList<SchoolStep>();

        if (operation.equals("create")) {
            add(steps, "student", "exam", "idle", "Terminei a prova.",
                "O aluno conclui a prova que dará origem a uma nota.", "A cena apresenta a origem do dado, antes da chamada POST /notas.",
                "O que aconteceu: o aluno terminou a prova. Por quê: o professor precisa de uma avaliação para registrar a nota. Os registros da secretaria ainda não mudaram.",
                "Esta etapa é a analogia de origem dos dados. Nenhuma chamada de persistência ocorreu; o snapshot inicial permanece intacto.", null, state);
            add(steps, "teacher", "receive-exam", "exam-to-teacher", "Recebi a prova e preparei os dados da nota.",
                "O professor prepara aluno, disciplina e nota.", "O corpo de POST /notas é convertido em uma entrada de aplicação.",
                "O professor recebe a prova e prepara o registro. A entrega da prova não salva nada: é preciso conferir os dados e solicitar o cadastro.",
                "No exemplo Java, @RequestBody representa a desserialização do JSON em NotaEntrada. O ID será atribuído somente após o cadastro válido.", code(operation, 3), state);
        } else {
            add(steps, "teacher", "request", "idle", requestDialogue(operation, input.id()),
                "O professor escolhe o registro e a operação.", method(operation) + " " + path(operation, input.id()) + " identifica a operação e o recurso.",
                "O professor informa o identificador da nota. Cada registro tem seu próprio ID: ele não é o identificador do aluno. Nenhum dado foi alterado nesta etapa.",
                method(operation) + " " + path(operation, input.id()) + ". O ID é parte da rota; GET e DELETE não precisam de corpo neste exemplo. UPDATE é um PUT completo com aluno, disciplina e nota.", code(operation, 3), state);
        }

        add(steps, "teacher", "validate", "idle", "Vou conferir a solicitação antes de encaminhá-la.",
            writesData(operation)
                ? "Antes de salvar, aluno e disciplina devem estar preenchidos e a nota deve estar entre 0 e 10."
                : "O professor confere o identificador da nota que deseja " + (operation.equals("read") ? "consultar." : "excluir."),
            "A camada de negócio valida a entrada antes da operação de persistência.",
            writesData(operation)
                ? "O professor confere os dados. Nomes vazios, nomes com mais de 120 caracteres e notas fora de 0 a 10 são recusados. A secretaria ainda mantém o estado anterior."
                : "O professor confere o identificador informado. Aluno, disciplina e nota não precisam ser reenviados para consultar ou excluir o registro. A secretaria ainda mantém o estado anterior.",
            writesData(operation)
                ? "A validação de domínio ocorre antes do acesso ao armazenamento. Uma entrada de negócio inválida produz HTTP didático 400 e interrompe o fluxo antes de qualquer escrita."
                : "A operação usa o ID na rota. A existência da nota será verificada na secretaria; um ID positivo inexistente produzirá HTTP didático 404, sem alteração do snapshot.", null, state);
        if (writesData(operation) && !validFields(input.student(), input.subject(), input.grade())) {
            return finish(steps, state, 400, Map.of("error", "Informe aluno e disciplina, e uma nota entre 0 e 10."),
                "A entrada foi recusada antes de chegar à secretaria.", "A validação falhou; nenhum registro ou próximo ID foi modificado.", "idle");
        }

        add(steps, "office", "receive-request", "teacher-to-office", "Recebi a solicitação do professor.",
            "A secretaria recebe a operação solicitada.", "A chamada de repositório representa o acesso à persistência, não uma nova rota pública.",
            "O professor encaminha a operação à secretaria, que representa a guarda dos registros. O fato de receber a solicitação ainda não significa que ela foi concluída.",
            "A mensagem na cena simboliza a chamada da aplicação ao repositório. O simulador calcula snapshots em memória; ele não executa SQL ou uma conexão real ao banco.", null, state);
        if (request.failure().equals("database-unavailable")) {
            add(steps, "office", "unavailable", "idle", "Não consigo acessar os registros agora.",
                "A secretaria está indisponível e não conclui a operação.", "Uma falha simulada de persistência produz HTTP didático 503.",
                "A secretaria não consegue consultar nem alterar os registros. O professor recebe uma falha temporária. O estado anterior e o próximo ID são preservados.",
                "A falha representa indisponibilidade do armazenamento. A requisição à API do simulador continua sendo HTTP 200; 503 pertence à operação demonstrada em simulatedResponse.", null, state);
            return finish(steps, state, 503, Map.of("error", "Secretaria indisponível. Tente novamente mais tarde."),
                "A operação não pôde ser concluída.", "Falha temporária de persistência: nenhum registro foi modificado.", "office-to-teacher");
        }

        SchoolGrade found = records.stream().filter(row -> row.id().equals(input.id())).findFirst().orElse(null);
        if (!operation.equals("create")) {
            add(steps, "office", "find", "idle", "Vou localizar a nota pelo identificador.",
                "A secretaria procura uma nota com o ID informado.", "findById representa a busca pelo identificador do registro da nota.",
                "A secretaria procura o registro indicado pelo professor. A consulta não altera a lista; ela apenas verifica se aquela nota existe.",
                "O exemplo usa repository.findById(id). Um ID positivo inexistente é um caso de negócio (HTTP didático 404), não uma configuração inválida do simulador.", code(operation, 3), state);
            if (found == null) {
                return finish(steps, state, 404, Map.of("error", "Registro de nota não encontrado."),
                    "Não existe uma nota com esse identificador.", "A busca não encontrou o registro. A lista de notas e o próximo ID permanecem iguais.", "office-to-teacher");
            }
        }

        var changed = new ArrayList<>(records);
        int nextId = state.nextId();
        Object response;
        int status;
        String basic;
        String technical;
        switch (operation) {
            case "create" -> {
                SchoolGrade created = new SchoolGrade(nextId, input.student().strip(), input.subject().strip(), input.grade());
                changed.add(created);
                nextId++;
                response = created;
                status = 201;
                basic = "A secretaria cria um novo registro de nota e atribui um ID próprio.";
                technical = "CREATE acrescenta uma linha ao snapshot e avança nextId. A resposta didática é 201 Created com o registro criado.";
            }
            case "read" -> {
                response = found;
                status = 200;
                basic = "A secretaria encontra a nota e entrega uma cópia ao professor. Nada é alterado.";
                technical = "READ devolve o recurso encontrado com 200 OK. O snapshot e nextId permanecem idênticos à entrada.";
            }
            case "update" -> {
                SchoolGrade updated = new SchoolGrade(found.id(), input.student().strip(), input.subject().strip(), input.grade());
                changed.set(changed.indexOf(found), updated);
                response = updated;
                status = 200;
                basic = "A secretaria atualiza os dados da nota encontrada, preservando o mesmo ID.";
                technical = "UPDATE substitui os dados do recurso por um PUT completo. Mantém o ID, não cria uma nova linha e não avança nextId.";
            }
            case "delete" -> {
                changed.remove(found);
                response = null;
                status = 204;
                basic = "A secretaria exclui somente o registro da nota. O aluno não é excluído.";
                technical = "DELETE remove a linha identificada. Retorna 204 No Content com body null; nextId não retrocede, evitando reutilização de IDs.";
            }
            default -> throw new IllegalStateException("Operação já validada.");
        }
        SchoolState updated = new SchoolState(List.copyOf(changed), nextId, body);
        add(steps, "office", operation, "idle", basic, basic, technical,
            "O que aconteceu: " + basic + " Por quê: esta é a operação escolhida pelo professor. " + stateEffect(operation),
            technical + " Cada etapa inclui um snapshot completo: voltar no histórico revisa o estado daquela etapa sem executar outra operação.", code(operation, 4), updated);
        return finish(steps, updated, status, response, "A secretaria enviou o resultado ao professor.",
            "A operação terminou. " + stateEffect(operation), "office-to-teacher");
    }

    private SchoolRun finish(List<SchoolStep> steps, SchoolState state, int status, Object body,
                             String dialogue, String history, String motion) {
        add(steps, "teacher", "respond", motion, dialogue,
            "O professor recebe o resultado da operação.", "A operação demonstrada termina com HTTP " + status + ".",
            history + " Resultado: HTTP " + status + ".",
            "HTTP " + status + " é o status da demonstração; o cálculo desta sequência retorna HTTP 200 na API /api/school/simulations. O snapshot final pode ser aplicado uma única vez à sessão do navegador. Revisar etapas não repete a persistência.", null, state);
        return new SchoolRun("1.0", List.copyOf(steps), new SchoolResponse(status, body),
            new SchoolFinalState(state.records(), state.nextId()));
    }

    private void add(List<SchoolStep> steps, String actor, String action, String motion, String dialogue,
                     String basic, String technical, String basicHistory, String technicalHistory, SchoolCode code, SchoolState state) {
        steps.add(new SchoolStep(steps.size() + 1, actor, action, motion, dialogue,
            new SchoolText(basic, technical), new SchoolText(basicHistory, technicalHistory), code, state));
    }

    private static boolean writesData(String operation) { return operation.equals("create") || operation.equals("update"); }
    private static boolean validFields(String student, String subject, BigDecimal grade) {
        return student != null && !student.isBlank() && student.length() <= 120
            && subject != null && !subject.isBlank() && subject.length() <= 120
            && grade != null && grade.signum() >= 0 && grade.compareTo(BigDecimal.TEN) <= 0;
    }
    private static Map<String, Object> requestBody(String operation, SchoolInputs input) {
        if (!writesData(operation)) return null;
        var result = new LinkedHashMap<String, Object>();
        result.put("student", input.student()); result.put("subject", input.subject()); result.put("grade", input.grade());
        return Collections.unmodifiableMap(result);
    }
    private void validateConfiguration(SchoolRequest request) {
        if (request == null || request.operation() == null || !Set.of("create", "read", "update", "delete").contains(request.operation())
            || request.inputs() == null || request.records() == null || request.records().size() > 500
            || request.nextId() == null || request.nextId() <= 0 || request.nextId() == Integer.MAX_VALUE
            || request.failure() == null || !Set.of("none", "database-unavailable").contains(request.failure())) {
            throw invalidConfiguration();
        }
        if (!request.operation().equals("create") && (request.inputs().id() == null || request.inputs().id() <= 0)) throw invalidConfiguration();
        var ids = new HashSet<Integer>();
        for (SchoolGrade record : request.records()) {
            if (record == null || record.id() == null || record.id() <= 0 || record.id() >= request.nextId()
                || !ids.add(record.id()) || !validFields(record.student(), record.subject(), record.grade())) throw invalidConfiguration();
        }
        if (request.operation().equals("create") && request.records().size() >= 500) throw invalidConfiguration();
    }
    private static ResponseStatusException invalidConfiguration() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configuração escolar inválida: confira operação, ID, registros, nextId e falha.");
    }
    private static String method(String operation) {
        return switch (operation) { case "create" -> "POST"; case "read" -> "GET"; case "update" -> "PUT"; default -> "DELETE"; };
    }
    private static String path(String operation, Integer id) { return operation.equals("create") ? "/notas" : "/notas/" + id; }
    private static String requestDialogue(String operation, Integer id) {
        return switch (operation) { case "read" -> "Quero consultar a nota " + id + "."; case "update" -> "Quero atualizar a nota " + id + "."; default -> "Quero excluir o registro da nota " + id + "."; };
    }
    private static String stateEffect(String operation) {
        return switch (operation) {
            case "create" -> "Há uma nota a mais nos registros e o próximo ID foi incrementado.";
            case "read" -> "Nenhum registro ou identificador foi alterado.";
            case "update" -> "A quantidade de registros e o próximo ID não mudaram; os dados da nota foram substituídos.";
            default -> "Há uma nota a menos nos registros, mas o próximo ID foi preservado.";
        };
    }
    private static SchoolCode code(String operation, int line) {
        String source = switch (operation) {
            case "create" -> """
                // Exemplo Java didático; não é o código executado pelo simulador.
                @PostMapping("/notas")
                ResponseEntity<Nota> criar(@RequestBody NotaEntrada entrada) {
                    Nota salva = service.criar(entrada); // valida antes de salvar
                    return ResponseEntity.status(201).body(salva);
                }""";
            case "read" -> """
                // Exemplo Java didático; não é o código executado pelo simulador.
                Nota consultar(long id) {
                    return repository.findById(id)
                        .orElseThrow(NotaNaoEncontrada::new);
                }""";
            case "update" -> """
                // Exemplo Java didático; PUT recebe todos os campos da nota.
                Nota atualizar(long id, NotaEntrada entrada) {
                    Nota nota = repository.findById(id).orElseThrow(NotaNaoEncontrada::new);
                    validar(entrada); nota.atualizar(entrada);
                    return repository.save(nota);
                }""";
            default -> """
                // Exemplo Java didático: exclui a nota, não o aluno.
                ResponseEntity<Void> excluir(long id) {
                    service.excluirNotaExistente(id);
                    return ResponseEntity.noContent().build();
                }""";
        };
        return new SchoolCode("NotaExemplo.java (didático)", line, source);
    }
}
