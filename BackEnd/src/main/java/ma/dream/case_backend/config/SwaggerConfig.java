package ma.dream.case_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Case Management API")
                        .description("API pour la gestion des cases")
                        .version("1.0.0")
                        .contact(new Contact().name("Soumaya Hamzaoui")));
    }

}
