package ma.dream.case_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.dream.case_backend.enums.StatutPresence;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class PresenceStatutCountDto {

    private StatutPresence statut;
    private long count;

}
