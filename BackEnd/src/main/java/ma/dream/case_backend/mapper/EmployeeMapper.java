package ma.dream.case_backend.mapper;


import ma.dream.case_backend.dto.EmployeeDto;
import ma.dream.case_backend.model.Employee;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    EmployeeDto toEmployeeDto(Employee employee);

    Employee toEmployee(EmployeeDto employeeDto);

    List<EmployeeDto> toEmployeeDtos(List<Employee> employees);

    List<Employee> toEmployees(List<EmployeeDto> employeeDtos);
}
