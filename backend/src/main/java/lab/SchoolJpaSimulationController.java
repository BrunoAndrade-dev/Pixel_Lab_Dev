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

/** Calcula snapshots isolados de escrita e leitura para explicar persistência com Spring Data JPA. */
@RestController
@RequestMapping("/api/school/jpa")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolJpaSimulationController {
    record JpaInput(String student, String subject, BigDecimal grade) {}
    record JpaRequest(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) JpaInput inputs,
                      @Schema(allowableValues = {"none", "database-unavailable"},
                          requiredMode = Schema.RequiredMode.REQUIRED) String failure) {}
    record JpaGrade(Long id, String student, String subject, BigDecimal grade) {}
    record JpaRow(long id, String aluno, String disciplina, BigDecimal nota) {}
    record JpaGradeOutput(long id, String student, String subject, BigDecimal grade) {}
    record JpaSql(String statement, List<Object> parameters) {}
    record JpaResponse(int status, Object body) {}
    record JpaState(String session, JpaGrade entity, List<JpaRow> rows, Long lookupId,
                    JpaResponse writeResponse, JpaResponse readResponse) {}
    record JpaStep(int id, String actor, String action, String motion, String dialogue,
                   SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
                   SchoolSimulationController.SchoolCode code, JpaSql sql, JpaState state) {}
    record JpaRun(String schemaVersion, List<JpaStep> steps, JpaResponse simulatedResponse) {}

    /** Demonstra POST e GET em sessões separadas, conservando somente as linhas confirmadas entre elas. */
    @PostMapping("/simulations")
    @Operation(summary = "Demonstrar gravação e leitura de uma nota com Spring Data JPA",
        description = "Representa save, INSERT, commit e findById em dois contextos. Cada execução começa com tabela vazia. "
            + "Java e SQL são exemplos didáticos. A API retorna HTTP 200 após calcular a sequência, "
            + "e os resultados de POST e GET aparecem nos snapshots de cada sessão.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true,
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = JpaRequest.class),
                examples = {
                    @ExampleObject(name = "Salvar e consultar", value = """
                        {"inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"failure":"none"}
                        """),
                    @ExampleObject(name = "Nota inválida", value = """
                        {"inputs":{"student":"Ana","subject":"Matemática","grade":11},"failure":"none"}
                        """),
                    @ExampleObject(name = "Banco indisponível", value = """
                        {"inputs":{"student":"Ana","subject":"Matemática","grade":8.5},"failure":"database-unavailable"}
                        """)
                })))
    @ApiResponse(responseCode = "200", description = "Sequência calculada com resultado didático.",
        content = @Content(mediaType = "application/json", schema = @Schema(implementation = JpaRun.class)))
    @ApiResponse(responseCode = "400", description = "Configuração do simulador inválida.", content = @Content)
    public JpaRun simulate(@RequestBody JpaRequest request) {
        if (request == null || request.inputs() == null || request.failure() == null
            || !Set.of("none", "database-unavailable").contains(request.failure())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe inputs e uma opção de falha válida.");
        }

        JpaInput input = request.inputs();
        var steps = new ArrayList<JpaStep>();
        var initial = new JpaState("write", null, List.of(), null, null, null);
        add(steps, initial, "student", "prepare", "idle", "Minha nota será registrada.",
            "A avaliação fornece aluno, disciplina e nota. A tabela começa vazia.",
            "POST /notas leva os dados até a aplicação, que fará a validação antes de criar a entidade.",
            "O formulário contém os dados de entrada. Ainda não existe objeto Nota nem linha na tabela.",
            "A execução cria uma tabela didática vazia e abre a sessão de escrita. O corpo do POST não inclui ID.",
            null, null);
        add(steps, initial, "teacher", "validate", "exam-to-teacher", "Vou conferir os dados da avaliação.",
            "O professor confere os campos. Uma nota de 11 interrompe o cadastro antes da secretaria.",
            "A validação exige aluno e disciplina preenchidos com até 120 caracteres e nota de 0 a 10.",
            "A prova chega ao professor. A validação protege a tabela de dados fora das regras.",
            "A validação ocorre antes de chamar o repositório. A tabela e o contexto de persistência continuam sem a nota.",
            code("NotaService.java", 1, "validar(entrada);"), null);
        if (!valid(input)) {
            return fail(steps, initial, 400, "Dados inválidos. Confira os campos e use uma nota de 0 a 10.",
                "Os dados foram recusados antes da criação da entidade. A tabela permanece vazia.");
        }

        var draft = new JpaGrade(null, input.student().strip(), input.subject().strip(), input.grade());
        var prepared = new JpaState("write", draft, List.of(), null, null, null);
        add(steps, prepared, "teacher", "map-entity", "idle", "Preparei a entidade Nota, ainda sem ID.",
            "A nota já existe como objeto da aplicação. A linha ainda não foi registrada na tabela.",
            "A JPA usa o mapeamento de Nota para a tabela notas. O ID nulo indica uma entidade nova neste exemplo.",
            "O professor cria o objeto com os campos conferidos. A ficha da tabela ainda não tem nenhuma linha.",
            "A entidade usa chave gerada pelo banco. O mapeamento informa a tabela, a chave primária e os nomes das colunas.",
            code("Nota.java", 6, """
                @Entity
                @Table(name = "notas")
                class Nota {
                    @Id
                    @GeneratedValue(strategy = GenerationType.IDENTITY)
                    private Long id;
                    @Column(name = "aluno") private String student;
                    @Column(name = "disciplina") private String subject;
                    @Column(name = "nota") private BigDecimal grade;
                    protected Nota() {}
                }"""), null);
        add(steps, prepared, "office", "save", "teacher-to-office", "O repositório recebeu a nota para salvar.",
            "O envelope chega à secretaria. Ele representa uma chamada de salvamento entre partes da aplicação.",
            "O serviço chama save no JpaRepository. Para esta entidade nova, o Spring Data JPA usa persist.",
            "A secretaria recebe o pedido de gravação. Nesta etapa, o pedido ainda não foi confirmado.",
            "JpaRepository<Nota, Long> oferece operações de escrita e leitura. A chamada save não é uma nova requisição HTTP.",
            code("NotaService.java", 6, """
                interface NotaRepository extends JpaRepository<Nota, Long> {}

                @Transactional
                public Nota cadastrar(NotaEntradaDTO entrada) {
                    Nota nota = mapear(entrada);
                    return repository.save(nota);
                }"""), null);
        if (request.failure().equals("database-unavailable")) {
            return fail(steps, prepared, 503, "Banco indisponível. A gravação não foi confirmada.",
                "A entidade foi preparada, mas nenhuma linha da nota ficou registrada. Sem ID salvo, a consulta seguinte não começa.");
        }

        var saved = new JpaGrade(1L, draft.student(), draft.subject(), draft.grade());
        var rows = List.of(new JpaRow(saved.id(), saved.student(), saved.subject(), saved.grade()));
        var created = success(201, saved);
        var written = new JpaState("write", saved, rows, null, created, null);
        add(steps, written, "office", "commit", "idle", "A gravação foi confirmada. A nota recebeu o ID 1.",
            "A ficha da secretaria se abre e mostra a linha registrada com o número que identifica a nota.",
            "O SQL INSERT representa a escrita. Com a transação confirmada, a linha fica disponível para a consulta seguinte.",
            "A secretaria guarda a linha com os mesmos valores da entidade. O banco gera o ID 1 neste exemplo. O cadastro responde 201.",
            "O provedor JPA executa a escrita e obtém o ID gerado. O snapshot mostra a linha depois do commit. As interrogações do SQL representam parâmetros.",
            null, new JpaSql("INSERT INTO notas (aluno, disciplina, nota) VALUES (?, ?, ?)",
                List.of(saved.student(), saved.subject(), saved.grade())));

        var reopened = new JpaState("read", null, rows, saved.id(), created, null);
        add(steps, reopened, "teacher", "open-read-session", "office-to-teacher", "Abri outra sessão para buscar a nota pelo ID.",
            "A aplicação começa a consulta sem o objeto da sessão anterior. A linha continua guardada na tabela.",
            "GET /notas/1 inicia uma leitura em outro contexto de persistência. A entidade da escrita saiu da memória deste contexto.",
            "Fechamos a sessão de escrita e guardamos o ID para a nova consulta. A ficha continua mostrando a linha salva.",
            "A nova requisição trabalha com outro contexto de persistência. O snapshot tem entity=null e ainda contém a linha confirmada.",
            code("NotaController.java", 1, "@GetMapping(\"/notas/{id}\")"), null);
        add(steps, reopened, "office", "find-by-id", "teacher-to-office", "A secretaria procura a linha de ID 1.",
            "A busca usa o ID para localizar a nota. A ficha continua com a mesma linha.",
            "findById consulta pela chave primária. O SELECT ilustrativo usa o ID como parâmetro.",
            "O professor envia somente o identificador. A secretaria encontra a linha sem atualizar a nota.",
            "O repositório usa findById em uma transação de leitura. Neste fluxo, a entidade é recuperada a partir do resultado do SELECT.",
            code("NotaService.java", 3, """
                @Transactional(readOnly = true)
                public Optional<Nota> buscar(Long id) {
                    return repository.findById(id);
                }"""), new JpaSql("SELECT id, aluno, disciplina, nota FROM notas WHERE id = ?", List.of(saved.id())));

        JpaRow found = rows.stream().filter(row -> row.id() == reopened.lookupId()).findFirst().orElseThrow();
        var loaded = new JpaGrade(found.id(), found.aluno(), found.disciplina(), found.nota());
        var response = success(200, loaded);
        var read = new JpaState("read", loaded, rows, saved.id(), created, response);
        add(steps, read, "teacher", "read-result", "office-to-teacher", "Encontrei a mesma nota que foi salva.",
            "A aplicação montou o objeto a partir da tabela e devolveu a nota. O ID e os valores são os mesmos do cadastro.",
            "O novo contexto contém a entidade recuperada por findById. GET /notas/1 retorna 200 sem modificar a tabela.",
            "Compare a entidade recuperada com a linha da ficha. A nota ficou disponível depois que a sessão de escrita terminou.",
            "O mapeamento reconstrói a entidade a partir da linha consultada. O corpo público representa os dados da nota e a leitura preserva o snapshot da tabela.",
            code("NotaController.java", 3, """
                @GetMapping("/notas/{id}")
                ResponseEntity<NotaSaidaDTO> buscar(@PathVariable Long id) {
                    return ResponseEntity.of(service.buscar(id).map(mapper::paraSaida));
                }"""), null);
        return new JpaRun("1.0", List.copyOf(steps), response);
    }

    /** Registra a recusa no POST e preserva o snapshot sem iniciar uma leitura. */
    private JpaRun fail(List<JpaStep> steps, JpaState state, int status, String message, String effect) {
        var response = new JpaResponse(status, Map.of("error", message));
        var rejected = new JpaState("write", state.entity(), state.rows(), null, response, null);
        add(steps, rejected, "teacher", "write-error", status == 503 ? "office-to-teacher" : "idle", message,
            effect, "O POST demonstrado retorna HTTP " + status + ". Nenhuma linha confirmada foi adicionada.",
            effect, "O snapshot contém a resposta de escrita e nenhuma resposta de leitura. A API do simulador calculou este fluxo com HTTP 200.",
            null, null);
        return new JpaRun("1.0", List.copyOf(steps), response);
    }

    /** Mantém a ordem das etapas e associa explicação, evidência de código e snapshot. */
    private void add(List<JpaStep> steps, JpaState state, String actor, String action, String motion, String dialogue,
                     String basic, String technical, String basicHistory, String technicalHistory,
                     SchoolSimulationController.SchoolCode code, JpaSql sql) {
        steps.add(new JpaStep(steps.size() + 1, actor, action, motion, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical),
            new SchoolSimulationController.SchoolText(basicHistory, technicalHistory), code, sql, state));
    }

    private SchoolSimulationController.SchoolCode code(String file, int line, String source) {
        return new SchoolSimulationController.SchoolCode(file + " (didático)", line, source);
    }

    /** Monta o DTO público da nota a partir da entidade salva ou recuperada. */
    private JpaResponse success(int status, JpaGrade grade) {
        return new JpaResponse(status, new JpaGradeOutput(grade.id(), grade.student(), grade.subject(), grade.grade()));
    }

    private boolean valid(JpaInput input) {
        return input.student() != null && !input.student().isBlank() && input.student().length() <= 120
            && input.subject() != null && !input.subject().isBlank() && input.subject().length() <= 120
            && input.grade() != null && input.grade().signum() >= 0 && input.grade().compareTo(BigDecimal.TEN) <= 0;
    }
}
