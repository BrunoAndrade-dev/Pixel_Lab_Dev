package lab;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Modelo determinístico de validação e tratamento; não executa os trechos Java exibidos na aula. */
@RestController
@RequestMapping("/api/school/validation")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolValidationSimulationController {
    record ValidationInputs(@JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer id,
                            String student, String subject, BigDecimal grade) {}
    record ValidationRequest(@Schema(allowableValues = {"create", "read"}, requiredMode = Schema.RequiredMode.REQUIRED) String operation,
                             @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ValidationInputs inputs,
                             @Schema(allowableValues = {"none", "database-unavailable"}, requiredMode = Schema.RequiredMode.REQUIRED) String failure) {}
    record FieldError(String field, String message) {}
    record LessonError(int status, String code, String message, String path, List<FieldError> fieldErrors) {}
    record ValidationState(Map<String, Object> requestBody, List<SchoolSimulationController.SchoolGrade> records,
                           List<FieldError> fieldErrors, String exception, boolean handled, Object responseBody, Integer responseStatus) {}
    record ValidationStep(int id, String actor, String action, String motion, String dialogue,
                          SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
                          SchoolSimulationController.SchoolCode code, ValidationState state) {}
    record ValidationResponse(int status, Object body) {}
    record ValidationRun(String schemaVersion, List<ValidationStep> steps, ValidationResponse simulatedResponse) {}

    @PostMapping("/simulations")
    @Operation(summary = "Demonstrar validação de campos e tratamento centralizado de erros",
        description = "HTTP 200 significa sequência calculada. simulatedResponse.status é o HTTP didático (201/200/400/404/503). "
            + "Configuração inválida da API retorna HTTP 400 real. Cada execução começa com uma nota fictícia, sem persistência compartilhada. "
            + "@Valid, constraints, exceções e @RestControllerAdvice são ilustrados; o simulador calcula os estados deterministicamente.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            schema = @Schema(implementation = ValidationRequest.class), examples = {
                @ExampleObject(name = "Cadastro válido", value = """
                    {"operation":"create","inputs":{"student":"Bruno","subject":"Programação","grade":8.5},"failure":"none"}
                    """),
                @ExampleObject(name = "Vários campos inválidos", value = """
                    {"operation":"create","inputs":{"student":"","subject":"","grade":11},"failure":"none"}
                    """),
                @ExampleObject(name = "Nota inexistente", value = """
                    {"operation":"read","inputs":{"id":99},"failure":"none"}
                    """),
                @ExampleObject(name = "Secretaria indisponível", value = """
                    {"operation":"read","inputs":{"id":1},"failure":"database-unavailable"}
                    """)
            })))
    @ApiResponse(responseCode = "200", description = "Sequência didática calculada.", content = @Content(schema = @Schema(implementation = ValidationRun.class)))
    @ApiResponse(responseCode = "400", description = "JSON ou configuração do simulador inválidos.", content = @Content)
    public ValidationRun simulate(@RequestBody ValidationRequest request) {
        if (request == null || request.inputs() == null || request.operation() == null
            || !Set.of("create", "read").contains(request.operation()) || request.failure() == null
            || !Set.of("none", "database-unavailable").contains(request.failure())
            || (request.operation().equals("read") && (request.inputs().id() == null || request.inputs().id() <= 0))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configuração inválida: confira operação, inputs, ID positivo e falha.");
        }
        boolean create = request.operation().equals("create");
        ValidationInputs input = request.inputs();
        String path = create ? "/notas" : "/notas/" + input.id();
        Map<String, Object> body = null;
        if (create) {
            var fields = new java.util.LinkedHashMap<String, Object>();
            fields.put("student", input.student()); fields.put("subject", input.subject()); fields.put("grade", input.grade());
            body = java.util.Collections.unmodifiableMap(fields);
        }
        var baseline = List.of(new SchoolSimulationController.SchoolGrade(1, "Ana", "Matemática", new BigDecimal("8.5")));
        ValidationState initial = new ValidationState(body, baseline, List.of(), null, false, null, null);
        var steps = new ArrayList<ValidationStep>();
        add(steps, "teacher", "receive", "idle", "Recebi uma solicitação; vou verificar como ela deve ser processada.",
            create ? "O professor recebe os dados para cadastrar uma nota." : "O professor recebe um ID para consultar uma nota.",
            (create ? "POST " : "GET ") + path + ". Receber a requisição ainda não garante sucesso.",
            "A solicitação chegou. A secretaria começa com uma nota fictícia, de ID 1. Nada mudou ainda. O professor representa a entrada e a lógica da aplicação; ele não é uma única classe Java.",
            "A API real recebe uma configuração e calcula snapshots. Esta etapa representa a requisição da aula. GET usa ID na rota e não envia corpo; POST transporta student, subject e grade.",
            "NotaController.java", 2, create ? """
                @PostMapping("/notas")
                ResponseEntity<NotaSaidaDTO> criar(@Valid @RequestBody NotaEntradaDTO entrada) {
                    return ResponseEntity.status(201).body(service.criar(entrada));
                }""" : """
                @GetMapping("/notas/{id}")
                NotaSaidaDTO consultar(@PathVariable int id) {
                    return service.consultar(id);
                }""", initial);

        List<FieldError> errors = create ? validate(input) : List.of();
        ValidationState checked = new ValidationState(body, baseline, errors, null, false, null, null);
        add(steps, "teacher", "validate", "idle", errors.isEmpty() ? "Os dados necessários passaram pela conferência." : "Encontrei campos que precisam ser corrigidos.",
            create ? "Aluno e disciplina são obrigatórios. A nota deve ser informada e estar entre 0 e 10." : "O ID é válido como identificador; isso ainda não garante que a nota existe.",
            create ? "@Valid aciona a validação do DTO no fluxo representado. Constraints descrevem os limites de cada campo." : "Um ID positivo passa pela conferência de formato; a existência do recurso exige uma busca.",
            errors.isEmpty() ? "A conferência não encontrou campos inválidos. Isso permite continuar, mas não garante que a consulta ou o armazenamento terá sucesso. A lista de registros ainda é a mesma."
                : "A conferência encontrou " + errors.size() + " problema(s). Todos aparecem juntos para orientar a correção. A solicitação não será enviada à secretaria e nenhum registro será criado.",
            create ? "Este simulador calcula as mesmas regras dos exemplos de constraints: @NotBlank, @Size, @NotNull, @DecimalMin e @DecimalMax. Ele não executa Bean Validation dinamicamente. Uma entrada inválida representa MethodArgumentNotValidException antes da execução do método do Controller."
                : "Validade do identificador e existência do recurso são verificações distintas. Aqui, um ID positivo inexistente é um resultado didático 404, não uma configuração inválida da API do simulador.",
            create ? "NotaEntradaDTO.java" : "NotaService.java", create ? 4 : 1, create ? """
                record NotaEntradaDTO(
                    @NotBlank @Size(max = 120) String student,
                    @NotBlank @Size(max = 120) String subject,
                    @NotNull @DecimalMin("0") @DecimalMax("10") BigDecimal grade
                ) {}""" : "// ID positivo não garante que repository.findById(id) encontrará uma nota.", checked);
        if (!errors.isEmpty()) return fail(steps, checked, 400, "INVALID_FIELDS", "Corrija os campos indicados e envie novamente.", path,
            "MethodArgumentNotValidException", "idle");

        add(steps, "office", "access-storage", "teacher-to-office", "Vou acessar os registros da secretaria.",
            "A secretaria tenta realizar a operação solicitada.", "Após a validação de entrada, a aplicação acessa o repositório.",
            "O professor encaminha a operação. A secretaria representa o armazenamento: receber o pedido não significa que ele foi concluído. Nenhum registro mudou nesta etapa.",
            "O envelope representa uma chamada de método ao repositório, não uma nova requisição HTTP pública. Uma falha nesta fronteira deve ser tratada sem expor detalhes da infraestrutura.",
            "NotaService.java", 1, create ? "Nota salva = repository.save(nota);" : "var encontrada = repository.findById(id);", checked);
        if (request.failure().equals("database-unavailable")) return fail(steps, checked, 503, "STORAGE_UNAVAILABLE",
            "Secretaria temporariamente indisponível. Tente novamente mais tarde.", path, "SecretariaIndisponivel", "office-to-teacher");
        if (!create) {
            add(steps, "office", "find", "idle", input.id() == 1 ? "Localizei a nota solicitada." : "Não existe uma nota com esse ID.",
                "A secretaria procura o registro pelo identificador.", "findById pode retornar um resultado vazio mesmo com um ID válido.",
                "A secretaria verifica se o ID corresponde a um registro. A busca não altera nenhuma nota. Se o registro não existir, a aplicação precisa informar isso de forma clara.",
                "A ausência é representada por Optional vazio. orElseThrow transforma essa condição em uma exceção da aplicação, depois traduzida em resposta HTTP pelo tratador.",
                "NotaService.java", 2, """
                    Nota nota = repository.findById(id)
                        .orElseThrow(NotaNaoEncontrada::new);""", checked);
            if (input.id() != 1) return fail(steps, checked, 404, "GRADE_NOT_FOUND", "Registro de nota não encontrado.", path,
                "NotaNaoEncontrada", "office-to-teacher");
        }
        var records = new ArrayList<>(baseline);
        var success = create ? new SchoolSimulationController.SchoolGrade(2, input.student().strip(), input.subject().strip(), input.grade()) : baseline.getFirst();
        if (create) records.add(success);
        ValidationState done = new ValidationState(body, List.copyOf(records), List.of(), null, false, null, null);
        add(steps, "office", create ? "save" : "read", "idle", create ? "Nova nota salva com ID 2." : "Consulta concluída sem alterar os dados.",
            create ? "A secretaria confirma o cadastro." : "A secretaria confirma a consulta.",
            "O fluxo de sucesso não passa pelos métodos @ExceptionHandler.",
            create ? "Somente agora o novo registro aparece. Os dados passaram pela validação e o armazenamento funcionou. A nota fictícia inicial permanece intacta."
                : "A nota encontrada será devolvida. Como foi uma consulta, a lista de registros permanece igual.",
            "Não houve exceção. O Controller devolve o resultado normal. Tratamento de erros e resposta de sucesso são caminhos diferentes; o tratador não deve transformar um erro em sucesso.",
            "NotaController.java", 1, create ? "return ResponseEntity.status(201).body(saida);" : "return ResponseEntity.ok(saida);", done);
        return respond(steps, done, create ? 201 : 200, success, "office-to-teacher");
    }

    private ValidationRun fail(List<ValidationStep> steps, ValidationState previous, int status, String code, String message,
                               String path, String exception, String motion) {
        ValidationState raised = new ValidationState(previous.requestBody(), previous.records(), previous.fieldErrors(), exception, false, null, null);
        add(steps, status == 400 ? "teacher" : "office", "raise", "idle", "O fluxo normal foi interrompido por um problema.",
            "A aplicação sinaliza o problema para que ele seja tratado.", "Exceção representada: " + exception + ". Ainda não é a resposta HTTP.",
            "Uma exceção sinaliza que a operação não pode seguir pelo caminho normal. Ela ainda precisa ser traduzida em uma resposta útil. Os registros permanecem como estavam antes da solicitação.",
            "A demonstração representa " + exception + ". Os objetos reais do simulador não lançam essa exceção: o ramo didático produz snapshots para revisão. Não há tentativa de continuar a escrita após a falha.",
            "FluxoDeErro.java", 1, status == 400 ? "// O framework sinaliza MethodArgumentNotValidException na validação de @Valid." : "throw new " + exception + "();", raised);
        LessonError error = new LessonError(status, code, message, path, previous.fieldErrors());
        ValidationState handled = new ValidationState(previous.requestBody(), previous.records(), previous.fieldErrors(), exception, true, error, status);
        add(steps, "teacher", "handle", motion, "Vou transformar o problema em uma resposta compreensível.",
            "Um tratador escolhe o status e uma mensagem que orienta o usuário.", "@RestControllerAdvice reúne tratadores; @ExceptionHandler associa o tipo de exceção à resposta.",
            "O professor agora representa o tratamento centralizado. O problema vira uma ficha com status, código, mensagem, caminho e campos inválidos. Não são enviados senha, consulta SQL ou detalhes internos de conexão.",
            "O exemplo seleciona um tratador para " + exception + " e devolve HTTP " + status + ". O corpo padronizado é uma escolha desta aplicação, não um formato automático de todo projeto Spring. Uma resposta de erro não significa que a operação foi concluída.",
            "ApiExceptionHandler.java", 3, """
                @RestControllerAdvice
                class ApiExceptionHandler {
                    @ExceptionHandler(%s.class)
                    ResponseEntity<ApiErro> tratar(%s erro) {
                        return ResponseEntity.status(%d).body(montarErro(erro));
                    }
                }""".formatted(exception, exception, status), handled);
        return respond(steps, handled, status, error, "idle");
    }

    private ValidationRun respond(List<ValidationStep> steps, ValidationState state, int status, Object body, String motion) {
        ValidationState finalState = new ValidationState(state.requestBody(), state.records(), state.fieldErrors(), state.exception(), state.handled(), body, status);
        add(steps, "teacher", "respond", motion, status >= 400 ? "A resposta explica o problema e o próximo passo." : "A resposta confirma que a operação foi concluída.",
            "O cliente recebe HTTP " + status + " e o corpo da resposta.", "O status simulado e o corpo descrevem o mesmo resultado.",
            status >= 400 ? "A operação terminou com erro. Leia a mensagem: dados inválidos precisam de correção; nota inexistente exige conferir o ID; indisponibilidade pode exigir uma nova tentativa mais tarde. Nenhuma nota foi alterada."
                : "A operação terminou com sucesso. A resposta mostra a nota criada ou consultada. Voltar no histórico permite comparar os snapshots sem repetir a operação.",
            "HTTP " + status + " pertence à demonstração. A API /api/school/validation/simulations retorna HTTP 200 quando calcula a sequência. Falha de rede ou configuração inválida dessa API é outro problema, mostrado fora da cena.",
            "RespostaHttp.java", 1, "// HTTP " + status + ": corpo JSON mostrado na aba HTTP.", finalState);
        return new ValidationRun("1.0", List.copyOf(steps), new ValidationResponse(status, body));
    }

    private List<FieldError> validate(ValidationInputs input) {
        var errors = new ArrayList<FieldError>();
        checkText(errors, "student", "Aluno", input.student());
        checkText(errors, "subject", "Disciplina", input.subject());
        if (input.grade() == null) errors.add(new FieldError("grade", "Informe a nota."));
        else if (input.grade().signum() < 0 || input.grade().compareTo(BigDecimal.TEN) > 0) errors.add(new FieldError("grade", "A nota deve estar entre 0 e 10."));
        return List.copyOf(errors);
    }

    private void checkText(List<FieldError> errors, String field, String label, String value) {
        if (value == null || value.isBlank()) errors.add(new FieldError(field, label + " é obrigatório(a)."));
        if (value != null && value.length() > 120) errors.add(new FieldError(field, label + " deve ter até 120 caracteres."));
    }

    private void add(List<ValidationStep> steps, String actor, String action, String motion, String dialogue,
                     String basic, String technical, String basicHistory, String technicalHistory,
                     String file, int line, String source, ValidationState state) {
        steps.add(new ValidationStep(steps.size() + 1, actor, action, motion, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical), new SchoolSimulationController.SchoolText(basicHistory, technicalHistory),
            new SchoolSimulationController.SchoolCode(file + " (didático)", line, source), state));
    }
}
