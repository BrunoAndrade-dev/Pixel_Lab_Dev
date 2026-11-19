package lab;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.isIn;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AiSimulationControllerTest {
    @Autowired
    MockMvc api;

    @Autowired
    AiSimulationController controller;

    @Test
    void listsBothScenariosAndRejectsInvalidRequests() throws Exception {
        api.perform(get("/api/ia/scenarios"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id").value(contains("biblioteca", "hamburgueria")));
        run("{}").andExpect(status().isBadRequest());
        run("{\"scenario\":\"outro\"}").andExpect(status().isBadRequest());
        run("{\"scenario\":\"hamburgueria\",\"sourceAvailable\":false}").andExpect(status().isBadRequest());
    }

    @Test
    void libraryAnswersFromEvidenceOrReportsThatItCouldNotConfirm() throws Exception {
        run("{\"scenario\":\"biblioteca\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.agent").value(isIn(new String[]{"codex", "claude-code"})))
            .andExpect(jsonPath("$.steps[*].movement").value(contains("stay", "to-source", "consult", "return")))
            .andExpect(jsonPath("$.steps[2].observations[1].value").value(containsString("503 Service Unavailable")))
            .andExpect(jsonPath("$.outcome.summary").value(containsString("503 em simulatedResponse.status")))
            .andExpect(jsonPath("$.outcome.summary").value(containsString("HTTP 200")));
        run("{\"scenario\":\"biblioteca\",\"sourceAvailable\":false}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.steps[2].observations[1].value").value("Fonte indisponível"))
            .andExpect(jsonPath("$.outcome.summary").value(not(containsString("503"))));
    }

    @Test
    void restaurantUsesTheSameKitchenAndTicketForBothPrompts() throws Exception {
        run("{\"scenario\":\"hamburgueria\"}")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.agent").value(isIn(new String[]{"codex", "claude-code"})))
            .andExpect(jsonPath("$.steps[*].actor").value(contains(
                "vague", "assistant", "vague", "assistant", "grill", "fry", "assembly", "assistant",
                "detailed", "assistant", "grill", "fry", "assembly", "assistant", "assistant")))
            .andExpect(jsonPath("$.outcome.orders[*].clarificationTurns").value(contains(1, 0)));
        var orders = controller.simulate(new AiSimulationController.AiRequest("hamburgueria", null)).outcome().orders();
        assertEquals(orders.get(0).ticket(), orders.get(1).ticket());
    }

    private ResultActions run(String body) throws Exception {
        return api.perform(post("/api/ia/simulations").contentType(MediaType.APPLICATION_JSON).content(body));
    }
}
