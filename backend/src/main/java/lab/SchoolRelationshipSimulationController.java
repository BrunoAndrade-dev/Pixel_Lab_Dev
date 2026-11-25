package lab;

import java.util.ArrayList;
import java.util.HashSet;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/school/relationships")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolRelationshipSimulationController {
    record Classroom(int id, String name) {}
    record Student(@JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer id, String name,
                   @JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer classId) {}
    record RelationshipRequest(@Schema(allowableValues = {"transfer", "read"}) String operation,
        @JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer studentId,
        @JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer classId,
        List<Student> students, @Schema(allowableValues = {"none", "database-unavailable"}) String failure) {}
    record RelationshipState(List<Classroom> classes, List<Student> students, Integer selectedClassId) {}
    record Movement(int studentId, int fromClassId, int toClassId) {}
    record Sql(String statement, List<Object> parameters) {}
    record RelationshipStep(int id, String actor, String action, String motion, Movement movement, String dialogue,
        SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
        SchoolSimulationController.SchoolCode code, Sql sql, RelationshipState state) {}
    record LessonResponse(int status, Object body) {}
    record RelationshipRun(String schemaVersion, List<RelationshipStep> steps, LessonResponse simulatedResponse, RelationshipState finalState) {}
    private static final List<Classroom> CLASSES = List.of(new Classroom(1, "Computação A"), new Classroom(2, "Computação B"));
    private static final List<Student> INITIAL = List.of(new Student(1, "Bruno", 1), new Student(2, "Júlio", 1), new Student(3, "Carlos", 1));

    @GetMapping("/state")
    @Operation(summary = "Obter as duas turmas e os três alunos fictícios da sessão inicial")
    public RelationshipState initialState() { return new RelationshipState(CLASSES, INITIAL, null); }

    @PostMapping("/simulations")
    @Operation(summary = "Simular um relacionamento Turma–Aluno, com consulta e transferência",
        description = "Uma turma tem vários alunos; cada aluno pertence a uma turma neste exemplo. Recebe snapshot de três alunos. "
            + "Calcula etapas sem JPA ou banco real. HTTP 200 é o cálculo; simulatedResponse.status é 200/404/503 didático. "
            + "Snapshots/configurações inválidos geram HTTP 400 real. Falhas preservam vínculos. A caminhada ocorre após confirmar a atualização.",
        requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, content = @Content(
            schema = @Schema(implementation = RelationshipRequest.class), examples = @ExampleObject(name = "Transferir Carlos para B", value = """
                {"operation":"transfer","studentId":3,"classId":2,"students":[{"id":1,"name":"Bruno","classId":1},{"id":2,"name":"Júlio","classId":1},{"id":3,"name":"Carlos","classId":1}],"failure":"none"}
                """))))
    @ApiResponse(responseCode = "200", description = "Sequência didática calculada.", content = @Content(schema = @Schema(implementation = RelationshipRun.class)))
    @ApiResponse(responseCode = "400", description = "Configuração inválida.", content = @Content)
    public RelationshipRun simulate(@RequestBody RelationshipRequest request) {
        validate(request);
        var before = new RelationshipState(CLASSES, List.copyOf(request.students()), null);
        var steps = new ArrayList<RelationshipStep>();
        boolean transfer = request.operation().equals("transfer");
        add(steps, "teacher", "observe", "idle", null, "Uma turma pode reunir vários alunos.",
            "Existem duas turmas, cada uma com seu próprio ID. Cada aluno também tem um ID próprio.",
            "Turma e Aluno são entidades diferentes. Em alunos, classId representa a coluna turma_id.",
            "Observe as salas A e B e a secretaria. Uma entidade representa um tipo de coisa sobre a qual guardamos dados. Turmas e alunos têm registros separados. Os lugares na sala ilustram os vínculos cadastrados, não criam esses vínculos.",
            "O snapshot inicial contém turmas e alunos. A cardinalidade do modelo é 1:N de Turma para Aluno e N:1 no sentido inverso. A regra de uma única turma por aluno é deste exemplo, não de todo sistema escolar.",
            "Entidades.java", 1, "// Turma: id, nome. Aluno: id, nome e referência à turma.", null, before);
        add(steps, "teacher", "mapping", "idle", null, "São duas formas de enxergar o mesmo vínculo.",
            "Da turma, vemos vários alunos. De um aluno, vemos a única turma à qual ele pertence.",
            "@OneToMany(mappedBy = \"turma\") e @ManyToOne descrevem o mesmo relacionamento bidirecional.",
            "Na direção Turma → Alunos, uma turma pode ter nenhum, um ou vários estudantes. Na direção Aluno → Turma, cada estudante deste modelo aponta para uma turma. Não duplicamos o cadastro da turma dentro de cada aluno: guardamos uma referência a ela.",
            "Aluno.turma é o lado proprietário: @JoinColumn define a chave estrangeira turma_id na tabela alunos. mappedBy referencia o nome do atributo Java turma, não o nome da coluna. A coleção Turma.alunos é o lado inverso.",
            "Mapeamento.java", 3, """
                class Aluno {
                    @ManyToOne(optional = false)
                    @JoinColumn(name = "turma_id", nullable = false)
                    private Turma turma;
                }
                class Turma {
                    @OneToMany(mappedBy = "turma")
                    private List<Aluno> alunos = new ArrayList<>();
                }
                // Trechos de duas entidades; IDs e demais campos foram omitidos.""", null, before);
        add(steps, "teacher", "request", "idle", null,
            transfer ? "Quero mudar o aluno " + request.studentId() + " para a turma " + request.classId() + "." : "Quero consultar os alunos da turma " + request.classId() + ".",
            transfer ? "O pedido identifica o aluno e a turma de destino." : "A consulta identifica a turma que desejamos observar.",
            transfer ? "PUT /alunos/{id}/turma recebe turmaId no corpo didático." : "GET /turmas/{id}/alunos consulta o vínculo sem fazer alterações.",
            "O professor prepara a solicitação usando identificadores. O ID do aluno e o ID da turma pertencem a cadastros diferentes, mesmo quando seus números coincidem. Nada foi alterado na secretaria.",
            transfer ? "O DTO de entrada contém apenas turmaId. A rota identifica o aluno. O serviço deve verificar a existência de ambos antes de mudar a chave estrangeira."
                : "A consulta seleciona os alunos cujo turma_id corresponde à turma escolhida. Uma turma existente sem alunos devolve lista vazia, e não um erro.",
            "AlunoController.java", 1, transfer ? "@PutMapping(\"/alunos/{id}/turma\") // corpo: {\"turmaId\": 2}" : "@GetMapping(\"/turmas/{id}/alunos\")", null, before);
        add(steps, "office", "lookup", "teacher-to-office", null, "Vou conferir os registros antes de responder.",
            "A secretaria procura a turma e, na transferência, o aluno.",
            "findById valida a existência dos recursos antes da atualização ou consulta.",
            "A secretaria recebeu o pedido. Antes de mudar qualquer vínculo, é necessário encontrar a turma. Para transferir, também precisamos encontrar o aluno. A simples chegada do envelope ainda não confirma a operação.",
            "A mensagem representa chamadas ao repositório. O simulador não executa SQL nem usa um banco real. Uma indisponibilidade neste acesso interrompe o fluxo e preserva o snapshot.",
            "AlunoService.java", 1, "Turma destino = turmaRepository.findById(turmaId).orElseThrow(TurmaNaoEncontrada::new);", null, before);
        if (request.failure().equals("database-unavailable")) return finish(steps, before, 503, Map.of("error", "Secretaria indisponível. Nenhum vínculo foi alterado."));
        Classroom target = CLASSES.stream().filter(c -> c.id() == request.classId()).findFirst().orElse(null);
        Student student = before.students().stream().filter(s -> s.id().equals(request.studentId())).findFirst().orElse(null);
        if (target == null || (transfer && student == null)) return finish(steps, before, 404, Map.of("error", target == null ? "Turma não encontrada. Confira o ID de destino." : "Aluno não encontrado. Confira o ID do aluno."));
        if (!transfer) {
            var selected = new RelationshipState(CLASSES, before.students(), target.id());
            List<Student> members = selected.students().stream().filter(s -> s.classId() == target.id()).toList();
            add(steps, "office", "read", "idle", null, "Encontrei " + members.size() + " aluno(s) na turma " + target.name() + ".",
                "A turma consultada é destacada. A lista pode estar vazia sem ser um erro.",
                "SELECT filtra alunos por turma_id. Consultar não modifica os vínculos.",
                "A secretaria reúne somente os alunos ligados à turma consultada. A cena destaca esses integrantes. Nenhum aluno foi transferido e nenhum novo registro foi criado.",
                "A coleção resulta do filtro pela chave estrangeira. Seu tamanho representa a quantidade atual de alunos, e não o limite do relacionamento. 1:N admite zero alunos do lado da turma.",
                "AlunoRepository.java", 1, "List<Aluno> findByTurmaId(Long turmaId);",
                new Sql("SELECT id, nome, turma_id FROM alunos WHERE turma_id = ?", List.of(target.id())), selected);
            return finish(steps, selected, 200, members);
        }
        if (student.classId() == target.id()) return finish(steps, before, 200, Map.of("message", "O aluno já pertence à turma escolhida. Nenhum vínculo foi alterado.", "student", student));
        add(steps, "office", "prepare", "idle", null, "Encontrei o aluno e a turma. Vou atualizar o vínculo.",
            "O aluno continuará com o mesmo ID e nome. Só a referência à turma mudará.",
            "Atualizamos Aluno.turma, o lado proprietário, e mantemos as duas coleções Java coerentes.",
            "A secretaria preparou a mudança, mas a ficha ainda mostra a turma anterior. Transferir não é excluir o aluno nem criar uma cópia: é trocar a referência que diz a qual turma ele pertence.",
            "Em um relacionamento bidirecional, um método auxiliar pode remover o aluno da coleção anterior, definir aluno.turma e adicioná-lo à nova coleção. Alterar apenas o lado mappedBy não basta para definir a chave estrangeira.",
            "AlunoService.java", 3, """
                Turma anterior = aluno.getTurma();
                anterior.getAlunos().remove(aluno);
                aluno.setTurma(destino); // lado proprietário
                destino.getAlunos().add(aluno);
                alunoRepository.save(aluno);
                // Trecho didático dentro de um serviço transacional.""", null, before);
        List<Student> updated = before.students().stream().map(s -> s.id().equals(student.id()) ? new Student(s.id(), s.name(), target.id()) : s).toList();
        var committed = new RelationshipState(CLASSES, updated, null);
        add(steps, "office", "commit", "idle", null, "Mudança confirmada: o aluno agora pertence à turma " + target.name() + ".",
            "A secretaria confirmou a atualização de turma_id. O aluno pode ir para a outra sala.",
            "UPDATE alunos SET turma_id = ? WHERE id = ?; a confirmação precede a animação.",
            "A ficha do aluno agora aponta para a turma de destino. O ID e o nome do estudante continuam iguais; os outros alunos também não mudaram. Só depois dessa confirmação representaremos a transferência na cena.",
            "O snapshot confirmado altera uma única chave estrangeira. A demonstração não ensina exclusão em cascata. Recuar uma etapa mostra o vínculo anterior sem executar outra operação.",
            "Persistencia.sql", 1, "UPDATE alunos SET turma_id = ? WHERE id = ?;",
            new Sql("UPDATE alunos SET turma_id = ? WHERE id = ?", List.of(target.id(), student.id())), committed);
        add(steps, "student", "walk", "student-transfer", new Movement(student.id(), student.classId(), target.id()), "A mudança foi confirmada; vou para a outra sala.",
            "O deslocamento ilustra o vínculo já atualizado. Caminhar sozinho não altera um banco.",
            "A animação usa o snapshot confirmado e não faz outra requisição HTTP.",
            "O estudante deixa o lugar anterior e ocupa sua carteira na sala de destino. O movimento torna o resultado visível, mas não é ele que grava a mudança. Se a operação falhasse, esta caminhada não aconteceria.",
            "A posição visual acompanha o classId confirmado. A revisão estática posiciona o aluno no destino; a reprodução usa a origem e o destino da etapa para animar sem repetir a atualização.", null, 0, null, null, committed);
        return finish(steps, committed, 200, updated.stream().filter(s -> s.id().equals(student.id())).findFirst().orElseThrow());
    }

    private RelationshipRun finish(List<RelationshipStep> steps, RelationshipState state, int status, Object body) {
        add(steps, "teacher", "respond", "office-to-teacher", null, status >= 400 ? "Não foi possível concluir. Os vínculos anteriores foram preservados." : "Recebi o resultado da operação.",
            "A operação representada termina com HTTP " + status + ".",
            "A API do simulador retorna 200 para esta sequência; o status didático é " + status + ".",
            status >= 400 ? "A solicitação terminou sem mudar os alunos de turma. Confira os identificadores no caso de 404; no caso de 503, a secretaria não conseguiu acessar os dados. A cena permanece no estado anterior."
                : "A resposta está disponível. Compare as duas turmas e os registros. Você pode consultar as turmas A e B ou executar outra transferência depois de concluir esta reprodução.",
            "Cada etapa guarda um snapshot. A sessão recebe finalState uma única vez ao concluir ou saltar ao fim. Revisar não chama a API novamente. O corpo público evita devolver um grafo bidirecional recursivo de entidades.",
            "Resposta.java", 1, "// HTTP " + status + ": resultado didático; confira o corpo na aba HTTP.", null, state);
        return new RelationshipRun("1.0", List.copyOf(steps), new LessonResponse(status, body), state);
    }

    private void validate(RelationshipRequest request) {
        boolean valid = request != null && request.operation() != null && Set.of("transfer", "read").contains(request.operation())
            && request.failure() != null && Set.of("none", "database-unavailable").contains(request.failure())
            && request.classId() != null && request.classId() > 0 && request.students() != null && request.students().size() == 3
            && (!request.operation().equals("transfer") || request.studentId() != null && request.studentId() > 0);
        if (!valid) throw invalid();
        var ids = new HashSet<Integer>();
        for (Student student : request.students()) {
            if (student == null || student.id() == null || student.id() < 1 || student.id() > 3 || !ids.add(student.id())
                || !INITIAL.get(student.id() - 1).name().equals(student.name()) || student.classId() == null
                || !Set.of(1, 2).contains(student.classId())) throw invalid();
        }
    }
    private ResponseStatusException invalid() { return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Configuração inválida: confira operação, IDs, falha e snapshot dos três alunos."); }
    private void add(List<RelationshipStep> steps, String actor, String action, String motion, Movement movement,
        String dialogue, String basic, String technical, String basicHistory, String technicalHistory,
        String file, int line, String source, Sql sql, RelationshipState state) {
        steps.add(new RelationshipStep(steps.size() + 1, actor, action, motion, movement, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical), new SchoolSimulationController.SchoolText(basicHistory, technicalHistory),
            file == null ? null : new SchoolSimulationController.SchoolCode(file + " (didático)", line, source), sql, state));
    }
}
