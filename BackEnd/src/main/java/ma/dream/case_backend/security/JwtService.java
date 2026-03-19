package ma.dream.case_backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.model.UserApp;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
@Slf4j
public class JwtService {

    private final AppSecurityProperties securityProperties;
    private final Environment environment;

    @Getter
    private SecretKey signingKey;

    public JwtService(AppSecurityProperties securityProperties, Environment environment) {
        this.securityProperties = securityProperties;
        this.environment = environment;
    }

    @PostConstruct
    void init() {
        String configuredSecret = securityProperties.getJwt().getSecret();
        if (configuredSecret == null || configuredSecret.isBlank()) {
            if (!environment.acceptsProfiles(Profiles.of("dev", "test"))) {
                throw new IllegalStateException("APP_JWT_SECRET is required outside dev/test profiles");
            }

            byte[] randomBytes = new byte[64];
            new SecureRandom().nextBytes(randomBytes);
            configuredSecret = Base64.getEncoder().encodeToString(randomBytes);
            log.warn("APP_JWT_SECRET is not configured. Using an ephemeral JWT signing key for local/test runtime only.");
        }
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(configuredSecret));
    }

    public String generateToken(UserApp user) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(securityProperties.getJwt().getExpirationMs());

        return Jwts.builder()
                .subject(user.getEmail())
                .claim("role", user.getRole().name())
                .claim("userId", user.getUserAppId())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, String expectedUsername) {
        Claims claims = parseClaims(token);
        return expectedUsername.equalsIgnoreCase(claims.getSubject()) &&
                claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
