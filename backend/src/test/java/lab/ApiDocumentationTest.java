package lab;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiDocumentationTest {
    @Autowired
    MockMvc api;

    @Test
    void publishesTheSwaggerUiAndSimulationContract() throws Exception {
        api.perform(get("/swagger-ui/index.html"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("Swagger UI")));

        String post = "$.paths['/api/simulations'].post";
        String module = "Módulo backend\\Springboot";
        api.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.info.title").value("NARA Lab"))
            .andExpect(jsonPath("$.tags[*].name").value(containsInAnyOrder(module, "Módulo — Inteligência Artificial")))
            .andExpect(jsonPath("$.tags[?(@.name == 'Módulo — Inteligência Artificial')].description").isNotEmpty())
            .andExpect(jsonPath("$.paths['/api/scenarios'].get.tags[0]").value(module))
            .andExpect(jsonPath(post + ".tags[0]").value(module))
            .andExpect(jsonPath("$.paths['/api/scenarios'].get.responses['200']").exists())
            .andExpect(jsonPath("$.paths['/api/ia/scenarios'].get.tags[0]").value("Módulo — Inteligência Artificial"))
            .andExpect(jsonPath("$.paths['/api/ia/simulations'].post.tags[0]").value("Módulo — Inteligência Artificial"))
            .andExpect(jsonPath("$.paths['/api/school/simulations'].post.tags[0]").value(module))
            .andExpect(jsonPath("$.paths['/api/school/scenarios'].get.tags[0]").value(module))
            .andExpect(jsonPath("$.paths['/api/school/simulations'].post.responses.keys()").value(containsInAnyOrder("200", "400")))
            .andExpect(jsonPath(post + ".responses.keys()").value(containsInAnyOrder("200", "400")))
            .andExpect(jsonPath(post + ".requestBody.required").value(true))
            .andExpect(jsonPath(post + ".requestBody.content['application/json'].examples.keys()")
                .value(containsInAnyOrder("Cadastro válido", "Preço inválido", "Banco indisponível")))
            .andExpect(jsonPath("$.components.schemas.Response.properties.status.type").value("integer"))
            .andExpect(jsonPath("$.components.schemas.Response.properties.body.oneOf.length()").value(2))
            .andExpect(jsonPath("$.components.schemas.Step.properties.code.oneOf[0]['$ref']")
                .value("#/components/schemas/Code"))
            .andExpect(jsonPath("$.components.schemas.Step.properties.code.oneOf[1].type").value("null"));
    }
}
