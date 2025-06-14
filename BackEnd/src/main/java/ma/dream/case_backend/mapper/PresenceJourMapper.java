package ma.dream.case_backend.mapper;


import ma.dream.case_backend.dto.PresenceJourDto;
import ma.dream.case_backend.model.PresenceJour;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PresenceJourMapper {

    @Mapping(source = "employee.employeeId", target = "employeeId")
    @Mapping(source = "employee.nom", target = "employeeName")
    PresenceJourDto toPresenceJourDto(PresenceJour presenceJour);

    @Mapping(source = "employeeId", target = "employee.employeeId")
    @Mapping(source = "employeeName", target = "employee.nom")
    PresenceJour toPresenceJour(PresenceJourDto presenceJourDto);

    List<PresenceJourDto> toPresenceJourDtos(List<PresenceJour> presenceJours);

    List<PresenceJour> toPresenceJours(List<PresenceJourDto> presenceJourDtos);


}
