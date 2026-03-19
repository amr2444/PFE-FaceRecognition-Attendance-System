package ma.dream.case_backend.mapper;


import ma.dream.case_backend.dto.UserAppDto;
import ma.dream.case_backend.model.UserApp;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserAppMapper {

    @Mapping(target = "password", ignore = true)
    UserAppDto toUserAppDto(UserApp userApp);

    UserApp toUserApp(UserAppDto userAppDto);

    List<UserAppDto> toUserAppDtos(List<UserApp> userApps);

    List<UserApp> toUserApps(List<UserAppDto> userAppDtos);


}
