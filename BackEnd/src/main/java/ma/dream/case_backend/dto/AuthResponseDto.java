package ma.dream.case_backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.UserRole;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Authentication response containing the JWT access token and current user information")
public class AuthResponseDto {

    @Schema(example = "eyJhbGciOiJIUzI1NiJ9...")
    private String accessToken;

    @Schema(example = "Bearer")
    private String tokenType;

    @Schema(example = "3600")
    private long expiresIn;

    @Schema(example = "1")
    private Long userId;

    @Schema(example = "Admin")
    private String name;

    @Schema(example = "admin@example.com")
    private String email;

    @Schema(example = "ADMIN")
    private UserRole role;
}
