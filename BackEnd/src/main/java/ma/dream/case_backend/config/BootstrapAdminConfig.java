package ma.dream.case_backend.config;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.service.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@AllArgsConstructor
@Slf4j
public class BootstrapAdminConfig {

    private final AuthService authService;

    @Bean
    CommandLineRunner bootstrapAdminRunner() {
        return args -> {
            String generatedPassword = authService.initializeBootstrapAdminIfNeeded();
            if (generatedPassword != null) {
                log.warn("Bootstrap admin created. Store this generated password securely: {}", generatedPassword);
            }

            String recognitionClientPassword = authService.initializeBootstrapRecognitionClientIfNeeded();
            if (recognitionClientPassword != null) {
                log.warn("Bootstrap recognition client created. Store this generated password securely: {}", recognitionClientPassword);
            }
        };
    }
}
