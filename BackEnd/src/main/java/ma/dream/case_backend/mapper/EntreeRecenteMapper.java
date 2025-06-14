package ma.dream.case_backend.mapper;


import ma.dream.case_backend.dto.EntreeRecenteDto;
import ma.dream.case_backend.model.EntreeRecente;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EntreeRecenteMapper {

    @Mapping(source = "employee.employeeId", target = "employeeId")
    EntreeRecenteDto toEntreeRecenteDto(EntreeRecente entreeRecente);

    @Mapping(source = "employeeId", target = "employee.employeeId")
    EntreeRecente toEntreeRecente(EntreeRecenteDto entreeRecenteDto);

    List<EntreeRecenteDto> toEntreeRecenteDtos(List<EntreeRecente> entreeRecentes);

    List<EntreeRecente> toEntreeRecentes(List<EntreeRecenteDto> entreeRecenteDtos);

}
