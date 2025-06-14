package ma.dream.case_backend.dto;


import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAppDto {

    private Long userAppId;
    private String name;
    private String email;

}
