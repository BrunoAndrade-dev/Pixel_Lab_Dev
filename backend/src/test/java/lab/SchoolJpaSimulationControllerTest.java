package lab;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SchoolJpaSimulationControllerTest {
    @Autowired
    MockMvc api;

    @Test
    void savesANoteAndLoadsItInAnotherContextWithoutRewritingTheTable() throws Exception {
        simulate("8.5", "none")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.steps[*].action").value(contains("prepare", "validate", "map-entity", "save",
                "commit", "open-read-session", "find-by-id", "read-result")))
            .andExpect(jsonPath("$.steps[2].state.entity.id").value(nullValue()))
            .andExpect(jsonPath("$.steps[3].state.rows").isEmpty())
            .andExpect(jsonPath("$.steps[4].state.rows[0].aluno").value("Ana"))
            .andExpect(jsonPath("$.steps[4].state.rows[0].disciplina").value("Matemática"))
            .andExpect(jsonPath("$.steps[4].state.rows[0].nota").value(8.5))
            .andExpect(jsonPath("$.steps[4].state.writeResponse.status").value(201))
            .andExpect(jsonPath("$.steps[4].sql.parameters").value(contains("Ana", "Matemática", 8.5)))
            .andExpect(jsonPath("$.steps[5].state.session").value("read"))
            .andExpect(jsonPath("$.steps[5].state.entity").value(nullValue()))
            .andExpect(jsonPath("$.steps[5].state.rows[0].id").value(1))
            .andExpect(jsonPath("$.steps[6].sql.parameters").value(contains(1)))
            .andExpect(jsonPath("$.steps[7].state.rows.length()").value(1))
            .andExpect(jsonPath("$.steps[7].state.entity.id").value(1))
            .andExpect(jsonPath("$.steps[7].state.readResponse.status").value(200))
            .andExpect(jsonPath("$.simulatedResponse.body.grade").value(8.5));

        simulate("7", "none").andExpect(status().isOk())
            .andExpect(jsonPath("$.steps[0].state.rows").isEmpty())
            .andExpect(jsonPath("$.simulatedResponse.body.id").value(1))
            .andExpect(jsonPath("$.simulatedResponse.body.grade").value(7));
    }

    @Test
    void invalidInputStopsBeforeMappingAndUnavailableDatabaseNeverOpensAReadSession() throws Exception {
        simulate("11", "database-unavailable")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.steps[*].action").value(contains("prepare", "validate", "write-error")))
            .andExpect(jsonPath("$.simulatedResponse.status").value(400));
        simulate("8.5", "database-unavailable")
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.steps[4].state.entity.id").value(nullValue()))
            .andExpect(jsonPath("$.steps[4].state.rows").isEmpty())
            .andExpect(jsonPath("$.steps[4].state.lookupId").value(nullValue()))
            .andExpect(jsonPath("$.steps[4].state.readResponse").value(nullValue()))
            .andExpect(jsonPath("$.simulatedResponse.status").value(503));
    }

    @Test
    void advertisesTheScenarioAndRejectsInvalidSimulationConfiguration() throws Exception {
        api.perform(get("/api/school/scenarios")).andExpect(status().isOk())
            .andExpect(jsonPath("$[*].id").value(hasItem("school-jpa")));
        simulate("8.5", "unknown").andExpect(status().isBadRequest());
    }

    private ResultActions simulate(String grade, String failure) throws Exception {
        return api.perform(post("/api/school/jpa/simulations").contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"inputs":{"student":"Ana","subject":"Matemática","grade":%s},"failure":"%s"}
                """.formatted(grade, failure)));
    }
}
