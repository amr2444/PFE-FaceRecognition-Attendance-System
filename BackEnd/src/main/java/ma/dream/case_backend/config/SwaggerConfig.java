package ma.dream.case_backend.config;

import io.swagger.v3.oas.models.Components;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;

import java.util.List;

@Configuration
public class SwaggerConfig {

    public static final String BEARER_SECURITY_SCHEME = "bearerAuth";

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local development")
                ))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SECURITY_SCHEME,
                                new SecurityScheme()
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT Bearer token returned by /auth/login")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SECURITY_SCHEME))
                .info(new Info()
                        .title("FaceRecognition Attendance API")
                        .description("API REST pour la gestion des employes, des presences et des evenements de reconnaissance faciale")
                        .version("1.0.0")
                        .contact(new Contact().name("EL BELLAOUI Amr")));
    }

}
