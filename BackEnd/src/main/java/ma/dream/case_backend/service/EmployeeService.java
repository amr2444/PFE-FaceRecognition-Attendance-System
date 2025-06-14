package ma.dream.case_backend.service;


import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.config.Messages;
import ma.dream.case_backend.dto.EmployeeDto;
import ma.dream.case_backend.dto.EmployeeStatutCountDto;
import ma.dream.case_backend.enums.StatutEmploye;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.mapper.EmployeeMapper;
import ma.dream.case_backend.model.Employee;
import ma.dream.case_backend.repository.EmployeRepository;
import ma.dream.case_backend.util.constants.GlobalConstants;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeRepository employeRepository;
    private final EmployeeMapper employeeMapper;
    private final EntityManager entityManager;
    private final Messages messages;


    public Employee createEmployee(EmployeeDto employeeDto) {
        Employee employeeEntity = employeeMapper.toEmployee(employeeDto);

        employeeEntity.setCreationDate(LocalDateTime.now());
        employeeEntity.setLastUpdateDate(LocalDateTime.now());

        return employeRepository.save(employeeEntity);
    }

    public Page<EmployeeDto> getAllEmployees(int page, int size, String searchByNom, String searchByDepartement, String searchByStatus, String sortBy, String direction) {
        log.debug("Start service Get Employees page: {} size: {} sortBy: {} direction: {} searchByNom: {} searchByDepartement: {} searchByStatus: {}",
                page, size, sortBy, direction, searchByNom, searchByDepartement, searchByStatus);

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Employee> employees;

        if (searchByNom != null || searchByDepartement != null || searchByStatus != null) {
            employees = filterEmployees(searchByNom, searchByDepartement, searchByStatus, pageable);
        } else {
            employees = employeRepository.findAll(pageable);
        }

        List<EmployeeDto> employeeDtos = employees.getContent().stream()
                .map(employeeMapper::toEmployeeDto)
                .toList();
        log.debug("End service getEmployeeByCriteria ");
        return new PageImpl<>(employeeDtos, pageable, employees.getTotalElements());
    }

    private Page<Employee> filterEmployees(String searchByNom, String searchByDepartement, String searchByStatus, Pageable pageable) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Employee> cq = cb.createQuery(Employee.class);
        Root<Employee> root = cq.from(Employee.class);

        Predicate predicate = buildPredicate(cb, root, searchByNom, searchByDepartement, searchByStatus);
        cq.where(predicate);

        if (!pageable.getSort().isEmpty()) {
            List<Order> orders = new ArrayList<>();
            for (Sort.Order order : pageable.getSort()) {
                Path<Object> path = root.get(order.getProperty());
                orders.add(order.isAscending() ? cb.asc(path) : cb.desc(path));
            }
            cq.orderBy(orders);
        }

        TypedQuery<Employee> typedQuery = entityManager.createQuery(cq);
        long totalCount = typedQuery.getResultList().size();

        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Employee> resultList = typedQuery.getResultList();

        return new PageImpl<>(resultList, pageable, totalCount);
    }

    private Predicate buildPredicate(CriteriaBuilder criteriaBuilder, Root<Employee> root,
                                     String searchByNom, String searchBDepartement, String searchByStatus) {
        Predicate predicate = criteriaBuilder.conjunction();

        if (searchByNom != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("nom")),
                    "%" + searchByNom.toLowerCase() + "%"));
        }

        if (searchBDepartement != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("departement")),
                    "%" + searchBDepartement.toLowerCase() + "%"));
        }
        if (searchByStatus != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("statut")),
                    "%" + searchByStatus.toLowerCase() + "%"));
        }

        return predicate;
    }


    public List<EmployeeDto> findAllEmployees() {
        return employeRepository.findAll()
                .stream()
                .map(employeeMapper::toEmployeeDto)
                .collect(Collectors.toList());
    }

    public EmployeeDto updateEmployee(Long id, EmployeeDto employeeDto) throws TechnicalException {
        log.debug("Start service update employee id {}", id);
        Employee employee = employeRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));

        employee.setNom(employeeDto.getNom());
        employee.setRole(employeeDto.getRole());
        employee.setDepartement(employeeDto.getDepartement());
        employee.setMobile(employeeDto.getMobile());
        employee.setDateEmbauche(employeeDto.getDateEmbauche());
        employee.setEmail(employeeDto.getEmail());
        employee.setGenre(employeeDto.getGenre());
        employee.setAdresse(employeeDto.getAdresse());
        employee.setStatut(employeeDto.getStatut());

        employee.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
        log.debug("End service update employee  with id {}, employee {}", id, employeeDto);
        return employeeMapper.toEmployeeDto(employeRepository.save(employee));
    }

    public EmployeeDto getEmployeeById(Long id) throws TechnicalException {
        log.debug("Start service get employee By Id {}", id);
        return employeRepository.findById(id)
                .map(employeeMapper::toEmployeeDto)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
    }

    public void deleteEmployee(Long id) throws TechnicalException {
        log.debug("Start service delete employee By Id {}", id);
        if (id == null) {
            throw new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND));
        }
        Employee employee = employeRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
        employeRepository.delete(employee);
        log.debug("End service delete employee By Id {}", id);
    }

    public List<EmployeeStatutCountDto> countEmployeesByStatut() {
        List<Object[]> results = employeRepository.countEmployeesByStatut();

        return results.stream()
                .map(row -> new EmployeeStatutCountDto((StatutEmploye) row[0], (Long) row[1]))
                .collect(Collectors.toList());
    }

    public long getTotalEmployees() {
        return employeRepository.count();
    }



}
