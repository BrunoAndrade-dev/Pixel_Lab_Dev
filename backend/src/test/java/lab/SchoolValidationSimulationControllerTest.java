package lab;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SchoolValidationSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new SchoolValidationSimulationController()).build();

    @Test
    void aggregatesFieldErrorsAndStopsBeforeStorageEvenWhenUnavailable() throws Exception {
        JsonNode result = run("create", "{\"student\":\" \",\"subject\":\"\",\"grade\":11}", "database-unavailable");
        assertEquals(400, result.at("/simulatedResponse/status").asInt());
        assertEquals(3, result.at("/simulatedResponse/body/fieldErrors").size());
        assertEquals("student", result.at("/simulatedResponse/body/fieldErrors/0/field").asText());
        assertEquals("subject", result.at("/simulatedResponse/body/fieldErrors/1/field").asText());
        assertEquals("grade", result.at("/simulatedResponse/body/fieldErrors/2/field").asText());
        assertEquals("INVALID_FIELDS", result.at("/simulatedResponse/body/code").asText());
        for (JsonNode step : result.path("steps")) assertNotEquals("office", step.path("actor").asText());
        assertErrorLifecycle(result, "MethodArgumentNotValidException");
    }

    @Test
    void allFieldBoundariesAreExplainedAsLessonErrors() throws Exception {
        for (String input : List.of(
            "{\"student\":null,\"subject\":null,\"grade\":null}",
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":-0.01}",
            "{\"student\":\"" + "A".repeat(121) + "\",\"subject\":\"Matemática\",\"grade\":8}",
            "{\"student\":\"Ana\",\"subject\":\"" + "X".repeat(121) + "\",\"grade\":8}")) {
            JsonNode result = run("create", input, "none");
            assertEquals(400, result.at("/simulatedResponse/status").asInt());
            assertErrorLifecycle(result, "MethodArgumentNotValidException");
        }
        for (int grade : List.of(0, 10)) {
            JsonNode result = run("create", "{\"student\":\"" + "A".repeat(120) + "\",\"subject\":\"Matemática\",\"grade\":" + grade + "}", "none");
            assertEquals(201, result.at("/simulatedResponse/status").asInt());
        }
    }

    @Test
    void distinguishesMissingResourceFromUnavailableStorageWithoutChangingRecords() throws Exception {
        JsonNode missing = run("read", "{\"id\":99}", "none");
        assertEquals(404, missing.at("/simulatedResponse/status").asInt());
        assertEquals("/notas/99", missing.at("/simulatedResponse/body/path").asText());
        assertEquals("GRADE_NOT_FOUND", missing.at("/simulatedResponse/body/code").asText());
        assertTrue(missing.at("/steps/0/state/requestBody").isNull());
        assertErrorLifecycle(missing, "NotaNaoEncontrada");
        for (String operation : List.of("create", "read")) {
            JsonNode unavailable = run(operation, "{\"id\":99,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8}", "database-unavailable");
            assertEquals(503, unavailable.at("/simulatedResponse/status").asInt());
            assertEquals("STORAGE_UNAVAILABLE", unavailable.at("/simulatedResponse/body/code").asText());
            assertErrorLifecycle(unavailable, "SecretariaIndisponivel");
        }
    }

    @Test
    void successfulCreationChangesOnlyTheSaveSnapshotAndReadIsNonMutating() throws Exception {
        String input = "{\"student\":\" Bruno \",\"subject\":\" Programação \",\"grade\":8.5}";
        JsonNode created = run("create", input, "none");
        assertEquals(201, created.at("/simulatedResponse/status").asInt());
        assertEquals(2, created.at("/simulatedResponse/body/id").asInt());
        assertEquals("Bruno", created.at("/simulatedResponse/body/student").asText());
        boolean saved = false;
        for (JsonNode step : created.path("steps")) {
            if (step.path("action").asText().equals("save")) saved = true;
            assertEquals(saved ? 2 : 1, step.at("/state/records").size());
            assertTrue(step.at("/state/exception").isNull());
            assertFalse(step.at("/state/handled").asBoolean());
        }
        assertTrue(saved);
        assertEquals(created, run("create", input, "none"));
        JsonNode read = run("read", "{\"id\":1}", "none");
        assertEquals(200, read.at("/simulatedResponse/status").asInt());
        assertEquals("Ana", read.at("/simulatedResponse/body/student").asText());
        for (JsonNode step : read.path("steps")) assertEquals(read.at("/steps/0/state/records"), step.at("/state/records"));
    }

    @Test
    void badSimulatorConfigurationReturnsRealHttp400() throws Exception {
        for (String body : List.of("null", "{}",
            "{\"operation\":\"delete\",\"inputs\":{},\"failure\":\"none\"}",
            "{\"operation\":\"read\",\"inputs\":{\"id\":0},\"failure\":\"none\"}",
            "{\"operation\":\"read\",\"inputs\":{\"id\":1.5},\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"failure\":\"unknown\"}",
            "{\"operation\":\"create\",\"inputs\":{\"grade\":\"abc\"},\"failure\":\"none\"}")) {
            api.perform(post("/api/school/validation/simulations").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
    }

    private void assertErrorLifecycle(JsonNode run, String exception) {
        boolean raised = false, handled = false;
        int index = 0;
        JsonNode records = run.at("/steps/0/state/records");
        for (JsonNode step : run.path("steps")) {
            assertEquals(++index, step.path("id").asInt());
            if (step.path("action").asText().equals("raise")) raised = true;
            if (step.path("action").asText().equals("handle")) handled = true;
            JsonNode state = step.path("state");
            assertEquals(records, state.path("records"));
            assertEquals(!raised, state.path("exception").isNull());
            if (raised) assertEquals(exception, state.path("exception").asText());
            assertEquals(handled, state.path("handled").asBoolean());
            if (!handled) assertTrue(state.path("responseBody").isNull());
            else assertEquals(run.path("simulatedResponse").path("body"), state.path("responseBody"));
            assertFalse(step.at("/history/basic").asText().isBlank());
            assertFalse(step.at("/history/technical").asText().isBlank());
        }
        assertTrue(raised && handled);
        assertEquals(run.at("/simulatedResponse/status"), run.at("/simulatedResponse/body/status"));
    }

    private JsonNode run(String operation, String inputs, String failure) throws Exception {
        String body = "{\"operation\":\"" + operation + "\",\"inputs\":" + inputs + ",\"failure\":\"" + failure + "\"}";
        return json.readTree(api.perform(post("/api/school/validation/simulations").contentType("application/json").content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
