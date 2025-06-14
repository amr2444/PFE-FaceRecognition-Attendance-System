package ma.dream.case_backend.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.dream.case_backend.config.Messages;
import ma.dream.case_backend.dto.UserAppDto;
import ma.dream.case_backend.exceptions.TechnicalException;
import ma.dream.case_backend.mapper.UserAppMapper;
import ma.dream.case_backend.model.UserApp;
import ma.dream.case_backend.repository.UserAppRepository;
import ma.dream.case_backend.util.constants.GlobalConstants;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class UserAppService {

    private final UserAppRepository userAppRepository;
    private final UserAppMapper userAppMapper;
    private final EntityManager entityManager;
    private final Messages messages;


    public UserApp createUserApp(UserAppDto userAppDto) {
        UserApp userApp = userAppMapper.toUserApp(userAppDto);

        userApp.setCreationDate(LocalDateTime.now());
        userApp.setLastUpdateDate(LocalDateTime.now());

        return userAppRepository.save(userApp);
    }

    public Page<UserAppDto> getAllUserApps(int page, int size, String searchByName, String searchByEmail) {
        log.debug("Start service Get UserApp page: {} size: {} searchByName: {} searchEmail: {} ", page, size, searchByName, searchByEmail);
        Pageable pageable = PageRequest.of(page, size);
        Page<UserApp> userApps;

        if (searchByName != null || searchByEmail != null ) {
            userApps = filterUserApps(searchByName, searchByEmail, pageable);
        } else {
            userApps = userAppRepository.findAll(pageable);
        }

        List<UserAppDto> userAppDtos = userApps.getContent().stream()
                .map(userAppMapper::toUserAppDto)
                .toList();
        log.debug("End service getUserAppByCriteria ");
        return new PageImpl<>(userAppDtos, pageable, userApps.getTotalElements());
    }

    private Page<UserApp> filterUserApps(String searchByName, String searchByEmail, Pageable pageable) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
        CriteriaQuery<UserApp> criteriaQuery = criteriaBuilder.createQuery(UserApp.class);
        Root<UserApp> root = criteriaQuery.from(UserApp.class);

        Predicate predicate = buildPredicate(criteriaBuilder, root, searchByName, searchByEmail);
        criteriaQuery.where(predicate);

        TypedQuery<UserApp> typedQuery = entityManager.createQuery(criteriaQuery);
        long totalCount = typedQuery.getResultList().size();
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<UserApp> resultList = typedQuery.getResultList();

        return new PageImpl<>(resultList, pageable, totalCount);
    }

    private Predicate buildPredicate(CriteriaBuilder criteriaBuilder, Root<UserApp> root,
                                     String searchByName, String searchByEmail) {
        Predicate predicate = criteriaBuilder.conjunction();

        if (searchByName != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("name")),
                    "%" + searchByName.toLowerCase() + "%"));
        }

        if (searchByEmail != null) {
            predicate = criteriaBuilder.and(predicate, criteriaBuilder.like(criteriaBuilder.lower(root.get("email")),
                    "%" + searchByEmail.toLowerCase() + "%"));
        }

        return predicate;
    }

    public UserAppDto updateUserApp(Long id, UserAppDto userAppDto) throws TechnicalException {
        log.debug("Start service update userApp id {}", id);
        UserApp userApp = userAppRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));

        userApp.setName(userAppDto.getName());
        userApp.setEmail(userAppDto.getEmail());

        userApp.setLastUpdateDate(LocalDateTime.now(ZoneOffset.UTC));
        log.debug("End service update UserApp  with id {}, UserApp {}", id, userAppDto);
        return userAppMapper.toUserAppDto(userAppRepository.save(userApp));
    }

    public UserAppDto getUserAppById(Long id) throws TechnicalException {
        log.debug("Start service get UserApp By Id {}", id);
        return userAppRepository.findById(id)
                .map(userAppMapper::toUserAppDto)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
    }

    public void deleteUserApp(Long id) throws TechnicalException {
        log.debug("Start service delete UserApp By Id {}", id);
        if (id == null) {
            throw new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND));
        }
        UserApp userApp = userAppRepository.findById(id)
                .orElseThrow(() -> new TechnicalException(messages.get(GlobalConstants.CASE_NOT_FOUND)));
        userAppRepository.delete(userApp);
        log.debug("End service delete UserApp By Id {}", id);
    }


    public long getTotalUserApps() {
        return userAppRepository.count();
    }


}
