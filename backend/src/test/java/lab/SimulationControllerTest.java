package lab;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SimulationControllerTest {
    final MockMvc api = MockMvcBuilders.standaloneSetup(new SimulationController()).build();

    @Test
    void simulatesAllBranchesWithoutSharingState() throws Exception {
        simulate(10, "none", 201, 1);
        simulate(0, "none", 400, 0);
        simulate(10, "database-unavailable", 503, 0);
    }

    private void simulate(int price, String failure, int expected, int rows) throws Exception {
        String input = """
            {"scenario":"create-product","inputs":{"name":"Livro","price":%d},"failure":"%s"}
            """.formatted(price, failure);
        api.perform(post("/api/simulations").contentType("application/json").content(input))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.simulatedResponse.status").value(expected))
            .andExpect(jsonPath("$.steps[0].state.products.length()").value(0))
            .andExpect(jsonPath("$.steps[-1].state.products.length()").value(rows));
    }

    @Test
    void rejectsInvalidConfigurationAndListsTheLesson() throws Exception {
        api.perform(post("/api/simulations").contentType("application/json").content("{}"))
            .andExpect(status().isBadRequest());
        api.perform(get("/api/scenarios")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value("create-product"));
    }
}
