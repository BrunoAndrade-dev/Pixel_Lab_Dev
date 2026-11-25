package lab;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SchoolSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new SchoolSimulationController()).build();

    @Test
    void followsCreateReadUpdateDeleteAndDoesNotReuseDeletedIds() throws Exception {
        JsonNode initial = json.readTree("{\"records\":[],\"nextId\":1}");
        JsonNode create = run("create", "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8.5}", initial, "none");
        assertEquals(201, create.at("/simulatedResponse/status").asInt());
        assertEquals("1.0", create.path("schemaVersion").asText());
        assertEquals(1, create.at("/simulatedResponse/body/id").asInt());
        assertEquals(2, create.at("/finalState/nextId").asInt());
        assertEquals(0, create.at("/steps/0/state/records").size());
        assertTrue(create.path("steps").findValuesAsText("motion").contains("exam-to-teacher"));
        assertMutationStartsAt(create, "create", 1);

        JsonNode read = run("read", "{\"id\":1}", create.path("finalState"), "none");
        assertEquals(200, read.at("/simulatedResponse/status").asInt());
        assertEquals(8.5, read.at("/simulatedResponse/body/grade").asDouble());
        assertEquals(create.path("finalState"), read.path("finalState"));
        assertTrue(read.at("/steps/0/state/requestBody").isNull());

        JsonNode update = run("update", "{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":9}", read.path("finalState"), "none");
        assertEquals(200, update.at("/simulatedResponse/status").asInt());
        assertEquals(1, update.at("/simulatedResponse/body/id").asInt());
        assertEquals(9, update.at("/simulatedResponse/body/grade").asInt());
        assertEquals(8.5, update.at("/steps/0/state/records/0/grade").asDouble());
        assertEquals(2, update.at("/finalState/nextId").asInt());

        JsonNode delete = run("delete", "{\"id\":1}", update.path("finalState"), "none");
        assertEquals(204, delete.at("/simulatedResponse/status").asInt());
        assertTrue(delete.at("/simulatedResponse/body").isNull());
        assertEquals(0, delete.at("/finalState/records").size());
        assertEquals(2, delete.at("/finalState/nextId").asInt());
        assertEquals(1, delete.at("/steps/0/state/records").size());
        assertMutationStartsAt(delete, "delete", 0);

        JsonNode recreated = run("create", "{\"student\":\"João\",\"subject\":\"Física\",\"grade\":10}", delete.path("finalState"), "none");
        assertEquals(2, recreated.at("/simulatedResponse/body/id").asInt());
        assertEquals(3, recreated.at("/finalState/nextId").asInt());
        // Revisão usa snapshots: o resultado anterior não é alterado por uma nova execução.
        assertEquals(8.5, create.at("/finalState/records/0/grade").asDouble());
    }

    @Test
    void validationStopsBeforeOfficeAndPreservesAllSnapshots() throws Exception {
        JsonNode state = stateWithOneGrade();
        for (String fields : List.of(
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":11}",
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":-0.1}",
            "{\"student\":\" \",\"subject\":\"Matemática\",\"grade\":8}",
            "{\"student\":\"Ana\",\"subject\":\" \",\"grade\":8}",
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":null}")) {
            JsonNode run = run("create", fields, state, "none");
            assertEquals(400, run.at("/simulatedResponse/status").asInt());
            assertEquals(state, run.path("finalState"));
            for (JsonNode step : run.path("steps")) {
                assertNotEquals("office", step.path("actor").asText());
                assertEquals(state.path("records"), step.at("/state/records"));
            }
        }
        // PUT completo: omitir os outros campos não transforma a atualização em PATCH.
        JsonNode partialUpdate = run("update", "{\"id\":1,\"grade\":9}", state, "none");
        assertEquals(400, partialUpdate.at("/simulatedResponse/status").asInt());
        assertEquals(state, partialUpdate.path("finalState"));
    }

    @Test
    void unknownIdsAndDatabaseFailuresNeverChangeSessionState() throws Exception {
        JsonNode state = stateWithOneGrade();
        for (String operation : List.of("read", "update", "delete")) {
            String inputs = "{\"id\":99,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":9}";
            JsonNode missing = run(operation, inputs, state, "none");
            assertEquals(404, missing.at("/simulatedResponse/status").asInt());
            assertEquals(state, missing.path("finalState"));
        }
        for (String operation : List.of("create", "read", "update", "delete")) {
            JsonNode unavailable = run(operation, "{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":9}", state, "database-unavailable");
            assertEquals(503, unavailable.at("/simulatedResponse/status").asInt());
            assertEquals(state, unavailable.path("finalState"));
            for (JsonNode step : unavailable.path("steps")) assertEquals(state.path("records"), step.at("/state/records"));
        }
    }

    @Test
    void acceptsGradeBoundariesAndDeterministicallyExplainsEveryStep() throws Exception {
        JsonNode empty = json.readTree("{\"records\":[],\"nextId\":1}");
        for (int grade : List.of(0, 10)) {
            JsonNode run = run("create", "{\"student\":\" Ana \",\"subject\":\" Matemática \",\"grade\":" + grade + "}", empty, "none");
            assertEquals(201, run.at("/simulatedResponse/status").asInt());
            assertEquals("Ana", run.at("/simulatedResponse/body/student").asText());
            int id = 1;
            for (JsonNode step : run.path("steps")) {
                assertEquals(id++, step.path("id").asInt());
                assertTrue(step.at("/history/basic").asText().length() > step.at("/caption/basic").asText().length());
                assertFalse(step.at("/history/technical").asText().isBlank());
                assertTrue(step.path("state").has("requestBody"));
                assertTrue(step.path("state").has("nextId"));
            }
        }
        String inputs = "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8.5}";
        assertEquals(run("create", inputs, empty, "none"), run("create", inputs, empty, "none"));
    }

    @Test
    void rejectsInvalidSimulatorConfigurationInsteadOfRepresentingItAsLessonHttp() throws Exception {
        for (String invalid : List.of(
            "{}", "null",
            "{\"operation\":\"patch\",\"inputs\":{},\"records\":[],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"read\",\"inputs\":{},\"records\":[],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"read\",\"inputs\":{\"id\":0},\"records\":[],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"read\",\"inputs\":{\"id\":1.5},\"records\":[],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[],\"nextId\":1.5,\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[],\"nextId\":0,\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[null],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[],\"nextId\":1,\"failure\":\"unknown\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8}],\"nextId\":1,\"failure\":\"none\"}",
            "{\"operation\":\"create\",\"inputs\":{},\"records\":[{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8},{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8}],\"nextId\":2,\"failure\":\"none\"}")) {
            api.perform(post("/api/school/simulations").contentType("application/json").content(invalid)).andExpect(status().isBadRequest());
        }
        api.perform(get("/api/school/scenarios")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value("school-grades"));
    }

    private JsonNode stateWithOneGrade() throws Exception {
        return json.readTree("{\"records\":[{\"id\":1,\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8.5}],\"nextId\":2}");
    }
    private JsonNode run(String operation, String inputs, JsonNode state, String failure) throws Exception {
        ObjectNode request = json.createObjectNode();
        request.put("operation", operation); request.set("inputs", json.readTree(inputs));
        request.set("records", state.path("records")); request.set("nextId", state.path("nextId")); request.put("failure", failure);
        String result = api.perform(post("/api/school/simulations").contentType("application/json").content(json.writeValueAsString(request)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(result);
    }
    private void assertMutationStartsAt(JsonNode result, String action, int expectedRows) {
        boolean committed = false;
        for (JsonNode step : result.path("steps")) {
            if (step.path("action").asText().equals(action)) committed = true;
            assertEquals(committed ? expectedRows : result.at("/steps/0/state/records").size(), step.at("/state/records").size());
        }
        assertTrue(committed);
    }
}
