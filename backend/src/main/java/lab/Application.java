package lab;

import java.util.Set;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.models.media.ComposedSchema;
import io.swagger.v3.oas.models.media.Schema;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@OpenAPIDefinition(info = @Info(
    title = "NARA Lab",
    version = "1.0.0",
    description = "Consulte o catálogo e gere demonstrações interativas. Os status do cadastro didático aparecem em simulatedResponse."
))
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    /** Descreve o trecho de código como uma alternativa entre o objeto e o valor JSON nulo. */
    @Bean
    OpenApiCustomizer nullableStepCode() {
        return spec -> {
            Schema<?> step = spec.getComponents().getSchemas().get("Step");
            var code = step.getProperties().get("code");
            var absent = new Schema<>();
            absent.setTypes(Set.of("null"));
            step.addProperty("code", new ComposedSchema().addOneOfItem(code).addOneOfItem(absent));
        };
    }
}
