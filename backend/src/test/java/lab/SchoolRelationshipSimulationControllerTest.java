package lab;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SchoolRelationshipSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new SchoolRelationshipSimulationController()).build();

    @Test
    void initialStateHasTwoClassesAndThreeDifferentStudentsInA() throws Exception {
        JsonNode initial = json.readTree(api.perform(get("/api/school/relationships/state")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals(2, initial.path("classes").size());
        assertEquals(3, initial.path("students").size());
        for (JsonNode student : initial.path("students")) assertEquals(1, student.path("classId").asInt());
    }

    @Test
    void changesOnlyTheSelectedForeignKeyAndWalksAfterCommit() throws Exception {
        JsonNode run = run("transfer", 3, 2, initialStudents(), "none");
        assertEquals(200, run.at("/simulatedResponse/status").asInt());
        assertEquals(3, run.at("/simulatedResponse/body/id").asInt());
        assertEquals("Carlos", run.at("/simulatedResponse/body/name").asText());
        boolean confirmed = false;
        int commits = 0, walks = 0;
        for (JsonNode step : run.path("steps")) {
            if (step.path("action").asText().equals("commit")) { confirmed = true; commits++; }
            if (step.path("action").asText().equals("walk")) { assertTrue(confirmed); walks++; }
            for (JsonNode student : step.at("/state/students")) assertEquals(confirmed && student.path("id").asInt() == 3 ? 2 : 1, student.path("classId").asInt());
            assertFalse(step.at("/history/basic").asText().isBlank());
            assertFalse(step.at("/history/technical").asText().isBlank());
        }
        assertEquals(1, commits); assertEquals(1, walks);
        assertEquals(1, run.at("/steps/0/state/students/2/classId").asInt());
        assertEquals(2, run.at("/finalState/students/2/classId").asInt());
        JsonNode back = run("transfer", 3, 1, run.at("/finalState/students"), "none");
        assertEquals(1, back.at("/finalState/students/2/classId").asInt());
    }

    @Test
    void readsEmptyOrPopulatedClassWithoutMutatingLinks() throws Exception {
        JsonNode empty = run("read", 3, 2, initialStudents(), "none");
        assertEquals(200, empty.at("/simulatedResponse/status").asInt());
        assertTrue(empty.at("/simulatedResponse/body").isEmpty());
        JsonNode transfer = run("transfer", 3, 2, initialStudents(), "none");
        JsonNode a = run("read", 3, 1, transfer.at("/finalState/students"), "none");
        JsonNode b = run("read", 3, 2, transfer.at("/finalState/students"), "none");
        assertEquals(2, a.at("/simulatedResponse/body").size());
        assertEquals(1, b.at("/simulatedResponse/body").size());
        assertEquals(transfer.at("/finalState/students"), a.at("/finalState/students"));
        assertEquals(transfer.at("/finalState/students"), b.at("/finalState/students"));
    }

    @Test
    void missingDestinationStudentAndUnavailableStoragePreserveEverySnapshot() throws Exception {
        for (String operation : List.of("transfer", "read")) {
            assertPreserved(run(operation, 3, 99, initialStudents(), "none"), 404);
            assertPreserved(run(operation, 3, 2, initialStudents(), "database-unavailable"), 503);
        }
        assertPreserved(run("transfer", 99, 2, initialStudents(), "none"), 404);
        JsonNode noOp = run("transfer", 3, 1, initialStudents(), "none");
        assertPreserved(noOp, 200);
        assertEquals(noOp, run("transfer", 3, 1, initialStudents(), "none"));
    }

    @Test
    void rejectsBadIdsSnapshotsAndOptionsAsRealApiErrors() throws Exception {
        String valid = "{\"operation\":\"transfer\",\"studentId\":3,\"classId\":2,\"students\":" + initialStudents() + ",\"failure\":\"none\"}";
        for (String body : List.of("null", "{}", valid.replace("\"classId\":2", "\"classId\":0"),
            valid.replace("\"studentId\":3", "\"studentId\":1.5"), valid.replace("\"transfer\"", "\"delete\""),
            valid.replace("\"none\"", "\"wrong\""), valid.replace("\"Carlos\"", "\"Outro aluno\""),
            valid.replace("\"id\":3", "\"id\":2"), valid.replace("\"classId\":1", "\"classId\":99"))) {
            api.perform(post("/api/school/relationships/simulations").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
    }

    private void assertPreserved(JsonNode run, int status) throws Exception {
        assertEquals(status, run.at("/simulatedResponse/status").asInt());
        for (JsonNode step : run.path("steps")) {
            assertEquals(initialStudents(), step.at("/state/students"));
            assertNotEquals("student-transfer", step.path("motion").asText());
        }
    }
    private JsonNode initialStudents() throws Exception {
        return json.readTree("[{\"id\":1,\"name\":\"Bruno\",\"classId\":1},{\"id\":2,\"name\":\"Júlio\",\"classId\":1},{\"id\":3,\"name\":\"Carlos\",\"classId\":1}]");
    }
    private JsonNode run(String operation, int studentId, int classId, JsonNode students, String failure) throws Exception {
        String body = "{\"operation\":\"" + operation + "\",\"studentId\":" + studentId + ",\"classId\":" + classId + ",\"students\":" + students + ",\"failure\":\"" + failure + "\"}";
        return json.readTree(api.perform(post("/api/school/relationships/simulations").contentType("application/json").content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
