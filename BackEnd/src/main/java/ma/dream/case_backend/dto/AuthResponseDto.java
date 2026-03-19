package ma.dream.case_backend.dto;

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
public class AuthResponseDto {

    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private Long userId;
    private String name;
    private String email;
    private UserRole role;
}
