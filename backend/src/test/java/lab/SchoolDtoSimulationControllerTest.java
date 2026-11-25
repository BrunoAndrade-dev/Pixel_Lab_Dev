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

class SchoolDtoSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new SchoolDtoSimulationController()).build();

    @Test
    void mapsDistinctContractsAndRevealsSnapshotsOnlyWhenReady() throws Exception {
        JsonNode result = run("{\"student\":\" Ana \",\"subject\":\" Matemática \",\"grade\":8.5}", "none");
        assertEquals(201, result.at("/simulatedResponse/status").asInt());
        JsonNode output = result.at("/simulatedResponse/body");
        assertEquals(4, output.size());
        assertEquals(1, output.path("id").asInt());
        assertEquals("Ana", output.path("student").asText());
        assertFalse(output.has("internalNote"));
        assertFalse(output.has("createdBy"));
        boolean mapped = false, saved = false, projected = false;
        int id = 0;
        for (JsonNode step : result.path("steps")) {
            assertEquals(++id, step.path("id").asInt());
            String action = step.path("action").asText();
            if (action.equals("map-entity")) mapped = true;
            if (action.equals("persist-entity")) saved = true;
            if (action.equals("map-output")) projected = true;
            JsonNode state = step.path("state");
            assertEquals(!mapped, state.path("entity").isNull());
            assertEquals(saved, state.path("persisted").asBoolean());
            assertEquals(!projected, state.path("outputDto").isNull());
            if (mapped) {
                assertEquals(saved ? 1 : 0, state.at("/entity/id").asInt());
                assertEquals("professor-demo", state.at("/entity/createdBy").asText());
                assertFalse(state.at("/entity/internalNote").asText().isBlank());
            }
            if (projected) assertEquals(output, state.path("outputDto"));
            assertFalse(step.at("/history/basic").asText().isBlank());
            assertFalse(step.at("/history/technical").asText().isBlank());
        }
        assertTrue(mapped && saved && projected);
        // O snapshot inicial permanece sem entidade mesmo após concluir a execução.
        assertTrue(result.at("/steps/0/state/entity").isNull());
    }

    @Test
    void inputCannotChooseIdentityOrInternalFields() throws Exception {
        JsonNode result = run("{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8,\"id\":99,\"createdBy\":\"cliente\",\"internalNote\":\"alterada\"}", "none");
        JsonNode finalState = result.path("steps").get(result.path("steps").size() - 1).path("state");
        assertEquals(3, finalState.path("inputDto").size());
        assertEquals(1, finalState.at("/entity/id").asInt());
        assertEquals("professor-demo", finalState.at("/entity/createdBy").asText());
        assertNotEquals("alterada", finalState.at("/entity/internalNote").asText());
        assertEquals(4, finalState.path("outputDto").size());
    }

    @Test
    void invalidBusinessInputsStopBeforeEntityAndOffice() throws Exception {
        for (String fields : List.of(
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":11}",
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":-1}",
            "{\"student\":\" \",\"subject\":\"Matemática\",\"grade\":8}",
            "{\"student\":\"Ana\",\"subject\":\" \",\"grade\":8}",
            "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":null}")) {
            JsonNode result = run(fields, "none");
            assertEquals(400, result.at("/simulatedResponse/status").asInt());
            for (JsonNode step : result.path("steps")) {
                assertNotEquals("office", step.path("actor").asText());
                assertTrue(step.at("/state/entity").isNull());
                assertTrue(step.at("/state/outputDto").isNull());
                assertFalse(step.at("/state/persisted").asBoolean());
            }
        }
    }

    @Test
    void databaseFailureKeepsDraftButNeverSavesOrIssuesReport() throws Exception {
        JsonNode result = run("{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":8}", "database-unavailable");
        assertEquals(503, result.at("/simulatedResponse/status").asInt());
        JsonNode finalState = result.path("steps").get(result.path("steps").size() - 1).path("state");
        assertEquals(0, finalState.at("/entity/id").asInt());
        assertFalse(finalState.path("persisted").asBoolean());
        for (JsonNode step : result.path("steps")) assertTrue(step.at("/state/outputDto").isNull());
    }

    @Test
    void boundariesAreValidAndRunsAreIndependentAndDeterministic() throws Exception {
        for (int grade : List.of(0, 10)) {
            String input = "{\"student\":\"Ana\",\"subject\":\"Matemática\",\"grade\":" + grade + "}";
            JsonNode first = run(input, "none");
            assertEquals(201, first.at("/simulatedResponse/status").asInt());
            assertEquals(first, run(input, "none"));
            assertEquals(1, first.at("/simulatedResponse/body/id").asInt());
        }
    }

    @Test
    void simulatorConfigurationErrorsUseRealHttp400() throws Exception {
        for (String body : List.of("null", "{}", "{\"inputs\":{},\"failure\":\"wrong\"}", "{\"inputs\":null,\"failure\":\"none\"}")) {
            api.perform(post("/api/school/dto/simulations").contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        }
    }

    private JsonNode run(String inputs, String failure) throws Exception {
        String body = "{\"inputs\":" + inputs + ",\"failure\":\"" + failure + "\"}";
        String response = api.perform(post("/api/school/dto/simulations").contentType("application/json").content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return json.readTree(response);
    }
}
