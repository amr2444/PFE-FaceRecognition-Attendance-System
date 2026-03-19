package ma.dream.case_backend.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.security")
public class AppSecurityProperties {

    private Jwt jwt = new Jwt();
    private BootstrapAdmin bootstrapAdmin = new BootstrapAdmin();
    private BootstrapRecognitionClient bootstrapRecognitionClient = new BootstrapRecognitionClient();
    private Surface surface = new Surface();

    @Getter
    @Setter
    public static class Jwt {
        private String secret;
        private long expirationMs = 28_800_000;
    }

    @Getter
    @Setter
    public static class BootstrapAdmin {
        private boolean enabled = false;
        private String name = "Local Admin";
        private String email = "admin@local.case";
        private String password;
    }

    @Getter
    @Setter
    public static class BootstrapRecognitionClient {
        private boolean enabled = false;
        private String name = "Face Recognition Client";
        private String email = "face-client@local.case";
        private String password;
    }

    @Getter
    @Setter
    public static class Surface {
        private boolean exposeH2ConsoleWithoutAuth = false;
        private boolean exposeSwaggerWithoutAuth = false;
    }
}
