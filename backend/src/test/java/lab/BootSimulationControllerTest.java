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

class BootSimulationControllerTest {
    private final ObjectMapper json = new ObjectMapper();
    private final MockMvc api = MockMvcBuilders.standaloneSetup(new BootSimulationController()).build();
    private final String food = "{\"meatPoint\":\"bem passado\",\"salad\":false,\"accompaniment\":\"sem acompanhamento\",\"drink\":\"água\"}";

    @Test
    void exactOrderPreservesFoodChoicesPageHttpAndDatabaseConfiguration() throws Exception {
        JsonNode simple = run("simple", "none");
        JsonNode full = run("complete", "none");
        for (JsonNode run : List.of(simple, full)) {
            JsonNode order = run.at("/finalState/order");
            String exact = order.path("exactOrder").asText();
            assertTrue(exact.contains("bem passado, sem salada, acompanhamento: sem acompanhamento, bebida: água"));
            assertTrue(exact.contains("/pedidos"));
            assertTrue(exact.contains("GET /api/pedidos"));
            assertEquals(exact, run.at("/steps/0/dialogue").asText());
            assertTrue(run.at("/steps/0/history/basic").asText().contains(exact));
            for (JsonNode step : run.path("steps")) assertEquals(order, step.at("/state/order"));
            assertEquals("ORDER", run.at("/steps/0/document").asText());
            assertEquals(json.readTree(food), order.path("food"));
        }
        assertEquals(1, simple.at("/finalState/order/table").asInt());
        assertEquals(1, simple.at("/finalState/order/libraries").size());
        assertFalse(simple.at("/finalState/order/properties").has("spring.datasource.url"));
        assertEquals(2, full.at("/finalState/order/table").asInt());
        assertEquals(4, full.at("/finalState/order/libraries").size());
        assertTrue(full.at("/finalState/order/exactOrder").asText().contains("jdbc:h2:mem:pedidos"));
        assertEquals("", full.at("/finalState/order/properties/spring.datasource.password").asText());
        assertEquals("create-drop", full.at("/finalState/order/properties/spring.jpa.hibernate.ddl-auto").asText());
    }

    @Test
    void dependenciesAreAvailableBeforeTheirConsumersAndHttpWaitsForReady() throws Exception {
        for (String profile : List.of("simple", "complete")) {
            JsonNode run = run(profile, "none");
            assertEquals("READY", run.at("/startupResult/status").asText());
            JsonNode repo = action(run, "repository"), service = action(run, "service"), controller = action(run, "controller");
            assertTrue(repo.path("id").asInt() < service.path("id").asInt());
            assertTrue(service.path("id").asInt() < controller.path("id").asInt());
            assertEquals("pedidoRepository", bean(service, "pedidoService").at("/dependencies/0").asText());
            assertEquals("pedidoService", bean(controller, "pedidoController").at("/dependencies/0").asText());
            assertTrue(action(run, "ready").path("id").asInt() < action(run, "http-request").path("id").asInt());
            assertTrue(action(run, "http-request").at("/state/httpResult").isNull());
            assertEquals(200, action(run, "http-response").at("/state/httpResult/status").asInt());
            assertEquals("GET", run.at("/finalState/httpResult/method").asText());
            assertEquals("DELIVERED", run.at("/finalState/startupStatus").asText());
            assertEquals("DELIVERY", action(run, "delivery").path("document").asText());
            assertEquals(run.at("/finalState/delivery/exactSummary").asText(), action(run, "delivery").path("dialogue").asText());
            assertEquals(profile.equals("simple") ? 3 : 6, run.at("/finalState/beans").size());
        }
    }

    @Test
    void missingBeanFailsBothProfilesWithoutDeliveryOrFakeHttpResponse() throws Exception {
        for (String profile : List.of("simple", "complete")) {
            JsonNode run = run(profile, "missing-repository");
            assertFailed(run);
            assertTrue(run.at("/startupResult/message").asText().contains("PedidoRepository"));
            assertTrue(run.at("/finalState/beans").isEmpty());
        }
    }

    @Test
    void badDatabaseAppearsOnOrderAndStopsBeforeBusinessComponents() throws Exception {
        JsonNode run = run("complete", "invalid-database");
        assertFailed(run);
        assertEquals("jdbc:invalido:pedidos", run.at("/finalState/order/properties/spring.datasource.url").asText());
        assertTrue(run.at("/steps/0/dialogue").asText().contains("jdbc:invalido:pedidos"));
        for (JsonNode step : run.path("steps")) assertTrue(step.at("/state/beans").isEmpty());
    }

    @Test
    void repeatedRunsAreIndependentAndEveryStepHasBothExplanationLevels() throws Exception {
        JsonNode first = run("simple", "none");
        run("complete", "none"); run("simple", "missing-repository");
        assertEquals(first, run("simple", "none"));
        for (JsonNode step : first.path("steps")) {
            for (String text : List.of("dialogue", "caption/basic", "caption/technical", "history/basic", "history/technical", "code/source"))
                assertFalse(step.at("/" + text).asText().isBlank());
            if (!step.path("action").asText().equals("delivery")) assertTrue(step.at("/state/delivery").isNull());
        }
    }

    @Test
    void invalidConfigurationIsAnActualApiError() throws Exception {
        for (String body : List.of("null", "{}", "{\"profile\":\"other\",\"failure\":\"none\",\"food\":" + food + "}",
            "{\"profile\":\"simple\",\"failure\":\"invalid-database\",\"food\":" + food + "}",
            "{\"profile\":\"complete\",\"failure\":\"other\",\"food\":" + food + "}",
            "{\"profile\":\"simple\",\"failure\":\"none\",\"food\":" + food.replace("água", "desconhecida") + "}")) {
            api.perform(post("/api/boot/simulations").contentType("application/json").content(body)).andExpect(status().isBadRequest());
        }
        api.perform(get("/api/boot/scenarios")).andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value("boot-restaurant"));
    }
    private void assertFailed(JsonNode run) {
        assertEquals("FAILED", run.at("/startupResult/status").asText());
        assertEquals("FAILED", run.at("/finalState/startupStatus").asText());
        for (JsonNode step : run.path("steps")) {
            assertTrue(step.at("/state/delivery").isNull());
            assertTrue(step.at("/state/httpResult").isNull());
            assertNotEquals("delivery", step.path("action").asText());
        }
    }
    private JsonNode action(JsonNode run, String action) {
        for (JsonNode step : run.path("steps")) if (step.path("action").asText().equals(action)) return step;
        throw new AssertionError(action);
    }
    private JsonNode bean(JsonNode step, String id) {
        for (JsonNode bean : step.at("/state/beans")) if (bean.path("id").asText().equals(id)) return bean;
        throw new AssertionError(id);
    }
    private JsonNode run(String profile, String failure) throws Exception {
        return json.readTree(api.perform(post("/api/boot/simulations").contentType("application/json")
            .content("{\"profile\":\"" + profile + "\",\"failure\":\"" + failure + "\",\"food\":" + food + "}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }
}
