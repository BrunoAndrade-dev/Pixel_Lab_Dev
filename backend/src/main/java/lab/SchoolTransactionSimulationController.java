package lab;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import lab.SchoolRelationshipSimulationController.Classroom;
import lab.SchoolRelationshipSimulationController.Student;
import lab.SchoolRelationshipSimulationController.Movement;
import lab.SchoolRelationshipSimulationController.Sql;
import lab.SchoolRelationshipSimulationController.LessonResponse;

/** Sequência educativa determinística, sem transação ou banco de dados reais. */
@RestController
@RequestMapping("/api/school/transactions")
@Tag(name = "Módulo backend\\Springboot")
public class SchoolTransactionSimulationController {
    record TransactionRequest(@JsonDeserialize(using = SchoolSimulationController.StrictInteger.class) Integer studentId,
        @Schema(allowableValues = {"none", "history-write-failed", "database-unavailable"}) String failure) {}
    record TransferRecord(int id, int studentId, int fromClassId, int toClassId) {}
    record TransactionState(List<Classroom> classes, List<Student> students, Integer selectedClassId,
        List<Student> workingStudents, List<TransferRecord> historyRecords, List<TransferRecord> pendingHistory,
        String transactionStatus) {}
    record TransactionStep(int id, String actor, String action, String motion, Movement movement, String dialogue,
        SchoolSimulationController.SchoolText caption, SchoolSimulationController.SchoolText history,
        SchoolSimulationController.SchoolCode code, Sql sql, TransactionState state) {}
    record TransactionRun(String schemaVersion, List<TransactionStep> steps, LessonResponse simulatedResponse, TransactionState finalState) {}

    private static final List<Classroom> CLASSES = List.of(new Classroom(1, "Computação A"), new Classroom(2, "Computação B"));
    private static final List<Student> INITIAL = List.of(new Student(1, "Bruno", 1), new Student(2, "Júlio", 1), new Student(3, "Carlos", 1));
    private static final String SERVICE = """
        @Service // dependências injetadas; detalhes omitidos
        class TransferenciaService {
            @Transactional
            public TransferenciaDto transferir(Long alunoId) {
                Aluno aluno = alunos.findById(alunoId).orElseThrow(AlunoNaoEncontrado::new);
                Turma destino = turmas.findById(2L).orElseThrow(TurmaNaoEncontrada::new);
                aluno.setTurma(destino);
                alunos.saveAndFlush(aluno); // SQL enviado, ainda sem commit
                historicos.saveAndFlush(new Transferencia(alunoId, 1L, 2L));
                return new TransferenciaDto(alunoId, 2L);
            }
        }
        // Controller chama este bean pelo proxy do Spring.
        // Mesma transação e mesmo banco. Exceções não são suprimidas.
        // O Spring confirma antes de devolver o resultado ao Controller.""";

    @GetMapping("/state")
    @Operation(summary = "Obter o estado inicial da aula de transações")
    public TransactionState initialState() { return state(INITIAL, INITIAL, List.of(), List.of(), "IDLE"); }

    @PostMapping("/simulations")
    @Operation(summary = "Simular commit e rollback de uma transferência escolar",
        description = "Cada execução parte de três alunos na turma A e histórico vazio. Duas escritas no mesmo banco: mudar turma e registrar transferência. "
            + "Snapshots separam trabalho pendente e estado confirmado. Sem banco real. API retorna 200 para cálculo; resultado didático 200/404/500/503. Configuração inválida retorna 400 real.")
    @ApiResponse(responseCode = "200", description = "Sequência calculada", content = @Content(schema = @Schema(implementation = TransactionRun.class)))
    @ApiResponse(responseCode = "400", description = "Configuração inválida", content = @Content)
    public TransactionRun simulate(@RequestBody TransactionRequest request) {
        if (request == null || request.studentId() == null || request.studentId() <= 0 || request.failure() == null
            || !Set.of("none", "history-write-failed", "database-unavailable").contains(request.failure()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um ID inteiro positivo e uma condição válida.");
        var steps = new ArrayList<TransactionStep>();
        var before = initialState();
        add(steps, "teacher", "request", "idle", null, "A transferência precisa atualizar duas fichas juntas.",
            "Vamos mudar um aluno para a turma B e guardar um registro dessa transferência. As duas tarefas formam uma única operação.",
            "A unidade de trabalho coordena UPDATE em alunos e INSERT em transferencias no mesmo banco.",
            "O aluno começa na turma A e o histórico está vazio. Imagine duas fichas: uma diz a turma atual; a outra registra a transferência. Se só uma delas mudar, os dados deixam de contar a mesma história. Por isso precisamos confirmar as duas juntas.",
            "Cada execução é independente. Não recebe snapshots nem compartilha a sessão de relacionamentos. A cena mostra os dados confirmados, enquanto o inspetor também mostra os dados pendentes da transação.",
            "TransferenciaController.java", 1, "// POST /alunos/{id}/transferencias\nreturn service.transferir(id);", null, before);
        var active = state(INITIAL, INITIAL, List.of(), List.of(), "ACTIVE");
        add(steps, "teacher", "begin", "teacher-to-office", null, "Vou reunir as duas alterações em uma transação.",
            "Transação é um pacote de alterações: ou o pacote inteiro é confirmado, ou suas mudanças são desfeitas.",
            "A chamada ao bean Service passa pelo proxy transacional. O gerenciador inicia a transação antes do método.",
            "O professor representa a aplicação organizando o trabalho. A marca @Transactional indica que este método deve ser executado com controle de transação. Iniciar não muda nenhum aluno de sala e ainda não confirma nada.",
            "A anotação precisa da infraestrutura transacional do Spring e de um gerenciador adequado. Neste exemplo, um Controller chama externamente um Service gerenciado pelo Spring; não é uma chamada interna entre métodos do mesmo objeto. BEGIN é uma representação lógica do início.",
            "TransferenciaService.java", 3, SERVICE, new Sql("BEGIN; -- início lógico ilustrativo", List.of()), active);
        add(steps, "office", "lookup", "idle", null, "Primeiro vou conferir o aluno e a turma de destino.",
            "A secretaria procura os registros. Ainda não existe alteração pendente nem confirmada.",
            "findById carrega Aluno e Turma dentro da unidade de trabalho.",
            "Antes de trocar a turma, precisamos encontrar o aluno e o destino. O fato de a transação estar aberta não garante que todos os dados existam ou que o banco esteja disponível.",
            "A ausência do aluno ou a indisponibilidade interrompe o método. Ainda não houve UPDATE nem INSERT, mas a transação iniciada será encerrada sem confirmação.",
            "TransferenciaService.java", 5, SERVICE, new Sql("SELECT id, nome, turma_id FROM alunos WHERE id = ?", List.of(request.studentId())), active);
        if (request.failure().equals("database-unavailable")) return rollback(steps, 503, "A secretaria está indisponível; nenhuma escrita foi feita.");
        Student student = INITIAL.stream().filter(s -> s.id().equals(request.studentId())).findFirst().orElse(null);
        if (student == null) return rollback(steps, 404, "O aluno não existe; nenhuma escrita foi feita.");
        List<Student> working = INITIAL.stream().map(s -> s.id().equals(student.id()) ? new Student(s.id(), s.name(), 2) : s).toList();
        var changed = state(INITIAL, working, List.of(), List.of(), "ACTIVE");
        add(steps, "office", "update", "idle", null, "A troca de turma está preparada, mas ainda não foi confirmada.",
            "Na área de trabalho, o aluno já aponta para B. Na ficha confirmada e na sala, ele continua em A até o commit.",
            "saveAndFlush envia o UPDATE dentro da transação. Flush não equivale a commit.",
            "A secretaria executou a primeira escrita. Pense em um rascunho que ainda pode ser cancelado. O inspetor separa o trabalho pendente dos registros confirmados. Essa separação é uma explicação visual: o SQL pode já ter sido enviado ao banco e continuar sujeito a rollback.",
            "Aluno.turma foi atualizado e saveAndFlush força a sincronização. Os efeitos ainda pertencem à transação ativa; não são uma confirmação definitiva. A cena usa students, e a área de trabalho usa workingStudents. Não estamos demonstrando leituras concorrentes nem níveis de isolamento.",
            "TransferenciaService.java", 8, SERVICE, new Sql("UPDATE alunos SET turma_id = ? WHERE id = ?", List.of(2, student.id())), changed);
        add(steps, "office", "history-attempt", "idle", null, "Falta registrar o motivo dessa mudança na ficha de transferências.",
            "A segunda escrita deve registrar quem mudou de turma. Só depois poderemos confirmar o pacote inteiro.",
            "O INSERT em transferencias deve participar da mesma transação que o UPDATE.",
            "Atualizar a turma é apenas metade do objetivo. Agora a secretaria tenta registrar aluno, origem e destino na outra tabela. A ficha de histórico ainda está vazia: nesta etapa mostramos a tentativa, não uma gravação concluída.",
            "Não há REQUIRES_NEW nem outro banco neste exemplo. Ambos os repositórios participam da transação iniciada pelo Service. Isso permite desfazer o UPDATE se o segundo acesso falhar.",
            "TransferenciaService.java", 9, SERVICE, null, changed);
        if (request.failure().equals("history-write-failed")) {
            add(steps, "office", "exception", "idle", null, "Falhou o registro do histórico. Não posso confirmar só metade.",
                "Uma falha interrompeu a segunda escrita. A primeira alteração ainda é pendente e precisa ser desfeita.",
                "Uma IllegalStateException (RuntimeException) sai do método transacional. Sob a regra padrão, ela provoca rollback.",
                "O erro aconteceu depois de preparar a troca de turma. A aplicação não deve devolver sucesso nem fingir que o histórico foi registrado. A exceção avisa ao controle de transação que o trabalho não terminou corretamente.",
                "A falha injetada representa uma RuntimeException não suprimida. A regra padrão do Spring não manda fazer rollback para toda checked exception; regras específicas podem ser configuradas. O tratamento HTTP vem depois que a exceção atravessa a fronteira transacional.",
                "HistoricoRepository.java", 1, "// Falha simulada durante a segunda escrita:\nthrow new IllegalStateException(\"Falha ao registrar transferência\");", null, changed);
            return rollback(steps, 500, "Falha ao registrar a transferência. Todas as alterações foram desfeitas.");
        }
        var entry = new TransferRecord(1, student.id(), 1, 2);
        var ready = state(INITIAL, working, List.of(), List.of(entry), "ACTIVE");
        add(steps, "office", "insert", "idle", null, "As duas escritas deram certo. Agora falta confirmar a transação.",
            "A nova turma e o histórico estão pendentes juntos. Executar as duas escritas ainda não é o commit.",
            "O segundo saveAndFlush concluiu o INSERT; o gerenciador ainda precisa confirmar a transação.",
            "A segunda ficha foi preparada. Compare os quadros: existem duas mudanças pendentes e nenhuma confirmada. Se a confirmação ainda falhasse, o usuário não deveria receber sucesso. Este caminho ilustra uma confirmação bem-sucedida.",
            "pendingHistory contém a linha ainda não confirmada. historyRecords continua vazio. A volta normal do método permite ao interceptor tentar o commit antes de entregar o resultado ao chamador.",
            "TransferenciaService.java", 9, SERVICE, new Sql("INSERT INTO transferencias (aluno_id, origem_id, destino_id) VALUES (?, ?, ?)", List.of(student.id(), 1, 2)), ready);
        var committed = state(working, working, List.of(entry), List.of(), "COMMITTED");
        add(steps, "office", "commit", "idle", null, "Commit concluído: a nova turma e o histórico foram confirmados juntos.",
            "Commit é a confirmação do pacote inteiro. Agora a ficha aponta para B e o histórico contém a transferência.",
            "O gerenciador concluiu o COMMIT. UPDATE e INSERT passam ao estado confirmado da simulação.",
            "As duas fichas agora contam a mesma história: o aluno está em B e existe um registro explicando a transferência de A para B. Nenhum outro aluno mudou de turma. O estudante só começará a caminhar na próxima etapa, para representar esse resultado.",
            "O método ilustrativo não chama commit manualmente. O controle declarativo do Spring faz a confirmação na fronteira transacional. Aqui o COMMIT é apenas um comando explicativo, sem conexão real com banco.",
            "GerenciadorTransacional.java", 1, "// Spring confirma a transação antes da resposta de sucesso.", new Sql("COMMIT; -- confirmação lógica ilustrativa", List.of()), committed);
        add(steps, "student", "walk", "student-transfer", new Movement(student.id(), 1, 2), "Tudo foi confirmado. Posso seguir para a sala B.",
            "O estudante caminha porque o pacote inteiro foi confirmado. A animação mostra o resultado, não grava os dados.",
            "A caminhada segue o snapshot COMMITTED e não executa outro UPDATE ou INSERT.",
            "O aluno vai até a carteira da turma B. O vínculo já estava confirmado antes do primeiro passo. No caminho de rollback, esta etapa não existe: o estudante permanece na sala A.",
            "A cena compartilha o relógio e as poses da aula de relacionamentos. Reproduzir ou voltar no histórico não executa operações adicionais nem duplica registros.", null, 0, null, null, committed);
        return finish(steps, committed, 200, "Transferência e histórico confirmados juntos.");
    }

    private TransactionRun rollback(List<TransactionStep> steps, int status, String message) {
        var restored = state(INITIAL, INITIAL, List.of(), List.of(), "ROLLED_BACK");
        add(steps, "office", "rollback", "idle", null, "Rollback: descartei as alterações desta transação.",
            "Rollback cancela as mudanças do pacote. O aluno permanece em A e nenhum histórico novo fica salvo.",
            "O gerenciador reverte a transação; as mudanças de UPDATE e INSERT não são confirmadas.",
            "A secretaria descartou o trabalho pendente e preservou os dados anteriores. Não é um novo pedido para transferir o aluno de volta: a alteração nunca chegou a ser confirmada. Se a falha ocorreu antes da primeira escrita, simplesmente não havia alterações para desfazer.",
            "Rollback afeta as alterações desta transação no banco participante. Não apaga dados anteriores nem desfaz ações externas como um e-mail já enviado. A sequência não simula compensações distribuídas ou isolamento.",
            "GerenciadorTransacional.java", 1, "// Spring desfaz a transação antes do tratamento da resposta de erro.", new Sql("ROLLBACK; -- cancelamento lógico ilustrativo", List.of()), restored);
        return finish(steps, restored, status, message);
    }
    private TransactionRun finish(List<TransactionStep> steps, TransactionState state, int status, String message) {
        add(steps, "teacher", "respond", "office-to-teacher", null, status == 200 ? "Recebi a confirmação completa da transferência." : "A transferência não foi confirmada. O aluno continua na sala A.",
            "A operação didática terminou com HTTP " + status + ". Consulte as duas fichas para conferir o resultado.",
            "A API do simulador retorna HTTP 200 ao calcular; o resultado didático é " + status + ".",
            "A resposta só chega depois da decisão da transação. No sucesso, turma e histórico foram confirmados. Na falha, os registros iniciais foram preservados. Cada novo exemplo começa com os três alunos em A e o histórico vazio para facilitar a comparação.",
            "Um ControllerAdvice poderia traduzir as exceções em respostas fora do método transacional. O status HTTP não provoca o rollback sozinho; a regra transacional aplicada à exceção é que determina o cancelamento.",
            "TransferenciaController.java", 1, "// HTTP " + status + " depois de encerrar a transação.", null, state);
        return new TransactionRun("1.0", List.copyOf(steps), new LessonResponse(status, Map.of("message", message, "transactionStatus", state.transactionStatus())), state);
    }
    private TransactionState state(List<Student> students, List<Student> working, List<TransferRecord> records, List<TransferRecord> pending, String status) {
        return new TransactionState(CLASSES, students, null, working, records, pending, status);
    }
    private void add(List<TransactionStep> steps, String actor, String action, String motion, Movement movement,
        String dialogue, String basic, String technical, String basicHistory, String technicalHistory,
        String file, int line, String source, Sql sql, TransactionState state) {
        steps.add(new TransactionStep(steps.size() + 1, actor, action, motion, movement, dialogue,
            new SchoolSimulationController.SchoolText(basic, technical), new SchoolSimulationController.SchoolText(basicHistory, technicalHistory),
            file == null ? null : new SchoolSimulationController.SchoolCode(file + " (didático)", line, source), sql, state));
    }
}
