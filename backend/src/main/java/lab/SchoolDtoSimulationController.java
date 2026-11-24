package lab;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

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

/** Sequência determinística independente do CRUD: cada execução parte de uma secretaria vazia. */
@RestController
@RequestMapping("/api/school/dto")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolDtoSimulationController {
    record GradeInputDto(String student, String subject, BigDecimal grade) {}
    record DtoRequest(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) GradeInputDto inputs,
                      @Schema(allowableValues = {"none", "database-unavailable"}, requiredMode = Schema.RequiredMode.REQUIRED) String failure) {}
    record GradeEntity(int id, String student, String subject, BigDecimal grade, String createdBy, String internalNote) {}
    record ReportCardDto(int id, String student, String subject, BigDecimal grade) {}
    record DtoState(GradeInputDto inputDto, GradeEntity entity, boolean persisted, ReportCardDto outputDto) {}
    record DtoStep(int id, String actor, String action, String motion, String dialogue,
                   SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
                   SchoolSimulationController.SchoolCode code, DtoState state) {}
    record DtoResponse(int status, Object body) {}
    record DtoRun(String schemaVersion, List<DtoStep> steps, DtoResponse simulatedResponse) {}

    @PostMapping("/simulations")
    @Operation(summary = "Demonstrar DTO de entrada, entidade e DTO de saída com um boletim",
        description = "Cada execução é independente, sem persistência real. HTTP 200 indica que a sequência foi calculada; "
            + "simulatedResponse.status é o resultado didático (201, 400 ou 503). Os campos internos da entidade "
            + "aparecem nos snapshots apenas para inspeção educacional, nunca no DTO de saída representado.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            schema = @Schema(implementation = DtoRequest.class), examples = {
                @ExampleObject(name = "Boletim", value = """
                    {"inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"failure":"none"}
                    """),
                @ExampleObject(name = "Nota inválida", value = """
                    {"inputs":{"student":"Ana","subject":"Matemática","grade":11},"failure":"none"}
                    """),
                @ExampleObject(name = "Secretaria indisponível", value = """
                    {"inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"failure":"database-unavailable"}
                    """)
            })))
    @ApiResponse(responseCode = "200", description = "Sequência calculada com resultado didático.", content = @Content(schema = @Schema(implementation = DtoRun.class)))
    @ApiResponse(responseCode = "400", description = "Configuração do simulador inválida.", content = @Content)
    public DtoRun simulate(@RequestBody DtoRequest request) {
        if (request == null || request.inputs() == null || request.failure() == null
            || !Set.of("none", "database-unavailable").contains(request.failure())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe inputs e uma opção de falha válida.");
        }
        GradeInputDto input = request.inputs();
        var steps = new ArrayList<DtoStep>();
        DtoState initial = new DtoState(input, null, false, null);
        add(steps, "student", "prepare-input", "idle", "Minha avaliação está pronta para ser registrada.",
            "A entrada contém somente aluno, disciplina e nota.",
            "NotaEntradaDTO define o contrato do corpo de POST /notas. ID e campos internos não fazem parte desta entrada.",
            "O aluno fornece a origem dos dados. O formulário prepara três campos; ainda não há entidade, registro salvo ou boletim. O DTO transporta dados entre a interface e a aplicação.",
            "O JSON será desserializado em NotaEntradaDTO. O contrato de entrada é separado da entidade para que o cliente não controle ID, autoria ou observações internas. DTO não é uma tabela de banco.",
            "NotaEntradaDTO.java", 1, "record NotaEntradaDTO(String student, String subject, BigDecimal grade) {}", initial);
        add(steps, "teacher", "validate-input", "exam-to-teacher", "Vou conferir os dados recebidos.",
            "O professor valida os dados antes de criar o registro.",
            "Desserialização e validação são responsabilidades distintas: receber um DTO não torna seus dados válidos.",
            "O professor recebe os dados e verifica aluno, disciplina e nota de 0 a 10. A validação evita encaminhar informações inválidas à secretaria. Nenhum dado foi salvo.",
            "A aplicação verifica nomes preenchidos com até 120 caracteres e nota entre 0 e 10. Uma falha encerra a demonstração com 400 antes do mapeamento e da persistência. Usar DTO não substitui validação.",
            "NotaService.java", 2, """
                NotaSaidaDTO criar(NotaEntradaDTO entrada) {
                    validar(entrada);
                    // A conversão ocorre somente após a validação.
                }""", initial);
        if (!valid(input)) {
            return finish(steps, initial, 400, Map.of("error", "Informe aluno e disciplina (até 120 caracteres) e nota entre 0 e 10."),
                "Os dados foram recusados; nenhum boletim foi emitido.", "idle");
        }
        GradeEntity draft = new GradeEntity(0, input.student().strip(), input.subject().strip(), input.grade(),
            "professor-demo", "Conferência pedagógica interna; não publicar no boletim.");
        DtoState mapped = new DtoState(input, draft, false, null);
        add(steps, "teacher", "map-entity", "idle", "Vou preparar a entidade com os dados da aplicação.",
            "A entidade reúne a nota e informações internas. Ela ainda não foi salva.",
            "O serviço mapeia NotaEntradaDTO → Nota. O ID ainda não foi atribuído (0 neste modelo didático).",
            "O professor prepara o registro completo. Além dos campos recebidos, a aplicação define autoria e uma observação interna. Esses campos não foram enviados pelo aluno. Criar o objeto ainda não significa salvá-lo.",
            "O mapeamento copia apenas os campos permitidos e acrescenta valores controlados pela aplicação. A entidade modela a persistência; seus campos não precisam coincidir com os contratos públicos. Não há biblioteca de mapeamento obrigatória.",
            "NotaService.java", 2, """
                Nota nota = new Nota(entrada.student().strip(), entrada.subject().strip(), entrada.grade());
                nota.setCreatedBy("professor-demo");
                nota.setInternalNote("Conferência pedagógica interna; não publicar no boletim.");""", mapped);
        add(steps, "office", "receive-entity", "teacher-to-office", "Recebi a entidade para guardar na secretaria.",
            "A secretaria recebe o registro completo para persistência.",
            "repository.save(nota) representa o acesso ao armazenamento, não uma nova requisição HTTP.",
            "A secretaria recebe a entidade, incluindo os campos internos. Essa entrega representa uma chamada de repositório. O armazenamento só é confirmado na próxima etapa.",
            "O simulador calcula snapshots em memória e não executa JPA ou SQL. Uma falha nesta fronteira não produz boletim de sucesso, embora a entidade já tenha sido preparada na aplicação.",
            "NotaService.java", 1, "Nota salva = repository.save(nota);", mapped);
        if (request.failure().equals("database-unavailable")) {
            return finish(steps, mapped, 503, Map.of("error", "Secretaria indisponível. Nenhum registro foi salvo."),
                "A secretaria não conseguiu salvar; não há boletim de saída.", "office-to-teacher");
        }
        GradeEntity saved = new GradeEntity(1, draft.student(), draft.subject(), draft.grade(), draft.createdBy(), draft.internalNote());
        DtoState persisted = new DtoState(input, saved, true, null);
        add(steps, "office", "persist-entity", "idle", "Nota registrada. O identificador é 1.",
            "A secretaria guarda a entidade e atribui o identificador.",
            "A entidade persistida tem ID 1. Os campos createdBy e internalNote continuam no modelo interno.",
            "A nota foi guardada nesta execução didática e recebeu um identificador. A secretaria mantém os campos necessários à aplicação. O boletim ainda não foi montado: salvar e preparar a resposta são etapas diferentes.",
            "O snapshot passa a persisted=true. Cada execução começa vazia e usa ID 1; este cenário não altera a sessão do CRUD escolar. A entidade salva ainda não deve ser retornada diretamente ao cliente.",
            "NotaService.java", 1, "Nota salva = repository.save(nota); // ID atribuído na persistência", persisted);
        add(steps, "teacher", "receive-saved", "office-to-teacher", "Recebi a nota salva; vou montar o boletim.",
            "O professor recebe a entidade salva e prepara a resposta.",
            "O serviço recebe a entidade devolvida pelo repositório antes do mapeamento de saída.",
            "A secretaria devolve o resultado ao professor. Ele tem acesso ao registro completo, mas o aluno precisa apenas das informações do boletim. A seleção dos campos acontece a seguir.",
            "A volta da mensagem representa o retorno do repositório ao serviço. A resposta pública ainda não existe; revisar esta etapa mostra outputDto=null sem repetir o salvamento.",
            "NotaService.java", 2, """
                Nota salva = repository.save(nota);
                // Em seguida, mapear para o contrato público de saída.""", persisted);
        ReportCardDto output = new ReportCardDto(saved.id(), saved.student(), saved.subject(), saved.grade());
        DtoState ready = new DtoState(input, saved, true, output);
        add(steps, "teacher", "map-output", "idle", "O boletim está pronto com os campos da resposta.",
            "O boletim mostra ID, aluno, disciplina e nota. Os campos internos ficam de fora.",
            "Nota → NotaSaidaDTO: o mapeamento explícito seleciona id, student, subject e grade.",
            "O professor monta o boletim com os campos destinados ao aluno. Autoria e observação interna permanecem na entidade. O boletim é a representação visual do DTO de saída; o papel e o JSON mostram os mesmos dados.",
            "O mapeamento cria um objeto separado, sem modificar a entidade. DTO não oculta campos automaticamente: a seleção explícita e o contrato de serialização fazem isso. Nesta ferramenta, o inspetor expõe a entidade apenas para estudo.",
            "NotaMapper.java", 2, """
                NotaSaidaDTO paraSaida(Nota nota) {
                    return new NotaSaidaDTO(nota.getId(), nota.getStudent(), nota.getSubject(), nota.getGrade());
                }
                record NotaSaidaDTO(int id, String student, String subject, BigDecimal grade) {}""", ready);
        return finish(steps, ready, 201, output, "O aluno recebe o boletim, sem os campos internos.", "idle");
    }

    private DtoRun finish(List<DtoStep> steps, DtoState state, int status, Object body, String dialogue, String motion) {
        boolean success = status == 201;
        add(steps, "teacher", "respond", motion, dialogue,
            success ? "A resposta contém o DTO de saída representado no boletim." : "A operação terminou com erro e não gerou boletim.",
            "HTTP didático " + status + (success ? " Created: corpo NotaSaidaDTO." : ": corpo de erro, sem DTO de sucesso."),
            success ? "A operação terminou. O aluno recebe o boletim e a secretaria mantém a entidade completa. A entrada não tinha ID; a saída inclui o ID atribuído. Voltar no histórico permite comparar cada representação."
                : dialogue + " Voltar no histórico permite localizar a interrupção sem enviar outra requisição.",
            "HTTP " + status + " pertence à operação demonstrada. A API /api/school/dto/simulations retorna HTTP 200 ao calcular esta sequência. "
                + (success ? "O corpo público contém apenas id, student, subject e grade; snapshots internos são dados educacionais do simulador."
                    : "Não há outputDto. A entidade " + (state.entity() == null ? "não foi criada." : "foi preparada, mas não persistida.")),
            "NotaController.java", 2, success ? """
                @PostMapping("/notas")
                ResponseEntity<NotaSaidaDTO> criar(@RequestBody NotaEntradaDTO entrada) {
                    return ResponseEntity.status(201).body(service.criar(entrada));
                }""" : """
                // Representação didática do tratamento da falha.
                return ResponseEntity.status(%d).body(erro);""".formatted(status), state);
        return new DtoRun("1.0", List.copyOf(steps), new DtoResponse(status, body));
    }

    private void add(List<DtoStep> steps, String actor, String action, String motion, String dialogue,
                     String basic, String technical, String basicHistory, String technicalHistory,
                     String file, int line, String source, DtoState state) {
        steps.add(new DtoStep(steps.size() + 1, actor, action, motion, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical),
            new SchoolSimulationController.SchoolText(basicHistory, technicalHistory),
            new SchoolSimulationController.SchoolCode(file + " (didático)", line, source), state));
    }

    private boolean valid(GradeInputDto input) {
        return input.student() != null && !input.student().isBlank() && input.student().length() <= 120
            && input.subject() != null && !input.subject().isBlank() && input.subject().length() <= 120
            && input.grade() != null && input.grade().signum() >= 0 && input.grade().compareTo(BigDecimal.TEN) <= 0;
    }
}
