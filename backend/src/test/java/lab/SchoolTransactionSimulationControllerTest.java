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

class SchoolTransactionSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new SchoolTransactionSimulationController()).build();

    @Test
    void beginsWithThreeStudentsInAAndNoTransfers() throws Exception {
        JsonNode initial = initial();
        assertEquals(2, initial.path("classes").size());
        assertEquals(3, initial.path("students").size());
        assertEquals("IDLE", initial.path("transactionStatus").asText());
        assertEquals(initial.path("students"), initial.path("workingStudents"));
        assertTrue(initial.path("historyRecords").isEmpty());
        assertTrue(initial.path("pendingHistory").isEmpty());
        for (JsonNode student : initial.path("students")) assertEquals(1, student.path("classId").asInt());
    }

    @Test
    void commitsBothWritesAndMovesOnlyTheSelectedStudentAfterCommit() throws Exception {
        for (int studentId = 1; studentId <= 3; studentId++) {
            JsonNode run = run(studentId, "none");
            assertEquals(200, run.at("/simulatedResponse/status").asInt());
            JsonNode update = action(run, "update");
            assertEquals(initial().path("students"), update.at("/state/students"));
            assertEquals(2, update.at("/state/workingStudents/" + (studentId - 1) + "/classId").asInt());
            assertTrue(update.at("/state/historyRecords").isEmpty());
            JsonNode insert = action(run, "insert");
            assertEquals(1, insert.at("/state/pendingHistory").size());
            assertTrue(insert.at("/state/historyRecords").isEmpty());
            JsonNode commit = action(run, "commit");
            assertEquals("COMMITTED", commit.at("/state/transactionStatus").asText());
            assertEquals(1, commit.at("/state/historyRecords").size());
            assertTrue(commit.at("/state/pendingHistory").isEmpty());
            assertEquals(studentId, commit.at("/state/historyRecords/0/studentId").asInt());
            for (JsonNode student : commit.at("/state/students")) {
                assertEquals(student.path("id").asInt() == studentId ? 2 : 1, student.path("classId").asInt());
            }
            JsonNode walk = action(run, "walk");
            assertTrue(commit.path("id").asInt() < walk.path("id").asInt());
            assertEquals(studentId, walk.at("/movement/studentId").asInt());
            assertEquals(1, walk.at("/movement/fromClassId").asInt());
            assertEquals(2, walk.at("/movement/toClassId").asInt());
            assertEquals(commit.path("state"), run.path("finalState"));
            for (JsonNode step : run.path("steps")) {
                if (step.path("id").asInt() < commit.path("id").asInt())
                    assertEquals(initial().path("students"), step.at("/state/students"));
            }
        }
    }

    @Test
    void failureOnSecondWriteRollsBackTheFirstWithoutMovingOrCreatingHistory() throws Exception {
        JsonNode run = run(3, "history-write-failed");
        assertEquals(500, run.at("/simulatedResponse/status").asInt());
        assertEquals(2, action(run, "exception").at("/state/workingStudents/2/classId").asInt());
        assertTrue(action(run, "update").at("/sql/statement").asText().startsWith("UPDATE"));
        assertEquals("ROLLED_BACK", action(run, "rollback").at("/state/transactionStatus").asText());
        assertEquals(initial().path("students"), run.at("/finalState/students"));
        assertEquals(initial().path("students"), run.at("/finalState/workingStudents"));
        for (JsonNode step : run.path("steps")) {
            assertEquals(initial().path("students"), step.at("/state/students"));
            assertTrue(step.at("/state/historyRecords").isEmpty());
            assertTrue(step.at("/state/pendingHistory").isEmpty());
            assertNotEquals("student-transfer", step.path("motion").asText());
            assertNotEquals("commit", step.path("action").asText());
        }
    }

    @Test
    void earlyFailuresPreserveAllRecordsAndPerformNoWrites() throws Exception {
        for (JsonNode run : List.of(run(3, "database-unavailable"), run(99, "none"))) {
            int expected = run.at("/simulatedResponse/status").asInt();
            assertTrue(expected == 404 || expected == 503);
            assertEquals(initial().path("students"), run.at("/finalState/students"));
            for (JsonNode step : run.path("steps")) {
                assertEquals(initial().path("students"), step.at("/state/workingStudents"));
                assertNotEquals("update", step.path("action").asText());
                assertNotEquals("student-transfer", step.path("motion").asText());
            }
        }
    }

    @Test
    void executionsAreDeterministicIndependentAndEveryStepExplainsItsEffect() throws Exception {
        JsonNode first = run(2, "none");
        run(2, "history-write-failed");
        assertEquals(first, run(2, "none"));
        assertEquals(initial().path("students"), first.at("/steps/0/state/students"));
        assertTrue(first.at("/steps/0/state/historyRecords").isEmpty());
        for (JsonNode step : first.path("steps")) {
            for (String text : List.of("dialogue", "caption/basic", "caption/technical", "history/basic", "history/technical"))
                assertFalse(step.at("/" + text).asText().isBlank());
        }
    }

    @Test
    void malformedConfigurationIsAnActualHttp400() throws Exception {
        for (String body : List.of("null", "{}", "{\"studentId\":0,\"failure\":\"none\"}",
            "{\"studentId\":1.5,\"failure\":\"none\"}", "{\"studentId\":1,\"failure\":\"unknown\"}",
            "{\"studentId\":-1,\"failure\":\"none\"}")) {
            api.perform(post("/api/school/transactions/simulations").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
    }
    private JsonNode action(JsonNode run, String action) {
        for (JsonNode step : run.path("steps")) if (step.path("action").asText().equals(action)) return step;
        throw new AssertionError("Etapa ausente: " + action);
    }
    private JsonNode initial() throws Exception {
        return json.readTree(api.perform(get("/api/school/transactions/state")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
    private JsonNode run(int studentId, String failure) throws Exception {
        return json.readTree(api.perform(post("/api/school/transactions/simulations").contentType("application/json")
            .content("{\"studentId\":" + studentId + ",\"failure\":\"" + failure + "\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
