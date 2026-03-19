document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si nous sommes sur la page des employés
    if (!document.getElementById('employeesTableBody')) return;

    // ===== VARIABLES =====
    let currentPage = 1;
    let totalPages = 1;
    let rowsPerPage = 10;
    let currentEmployeeId = null;
    const API_BASE_URL = 'http://localhost:8080/employes';
    const DEFAULT_AVATAR_URL = (name) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Employe')}&background=random`;

    // ===== ÉLÉMENTS DOM =====
    const employeesTableBody = document.getElementById('employeesTableBody');
    const employeeSearch = document.getElementById('employeeSearch');
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    const employeeModal = document.getElementById('employeeModal');
    const viewEmployeeModal = document.getElementById('viewEmployeeModal');
    const closeModal = document.getElementById('closeModal');
    const closeViewModal = document.getElementById('closeViewModal');
    const employeeForm = document.getElementById('employeeForm');
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeViewBtn = document.getElementById('closeViewBtn');
    const editFromViewBtn = document.getElementById('editFromViewBtn');
    const deleteModal = document.getElementById('deleteModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    const deleteEmployeeInfo = document.getElementById('deleteEmployeeInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    const photoPreview = document.getElementById('photoPreview');
    const photoUpload = document.getElementById('photoUpload');
    const photoDataInput = document.getElementById('photoData');

    // ===== INITIALISATION =====
    filterEmployees();
    setupEventListeners();

    // ===== FONCTIONS API =====
    async function filterEmployees() {
        const searchTerm = employeeSearch ? employeeSearch.value.toLowerCase() : '';
        const departmentValue = departmentFilter ? departmentFilter.value : '';
        const statusValue = statusFilter ? statusFilter.value : '';
        
        try {
            let url = `${API_BASE_URL}/?page=${currentPage - 1}&size=${rowsPerPage}`;
            
            // Ajouter les paramètres de filtre
            if (searchTerm) url += `&searchByNom=${searchTerm}`;
            if (departmentValue) url += `&searchByDepartement=${departmentValue}`;
            if (statusValue) url += `&searchByStatus=${statusValue}`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Erreur lors du filtrage des employés');
            }
            const data = await response.json();
            totalPages = Math.max(data.totalPages || 0, 1);

            if (data.totalPages > 0 && currentPage > data.totalPages) {
                currentPage = data.totalPages;
                return filterEmployees();
            }
            
            // Mettre à jour le tableau
            updateEmployeesTable(data.content || []);
            updatePagination(data.totalPages || 0);
        } catch (error) {
            console.error('Erreur:', error);
            employeesTableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="error-message">
                        Erreur lors du chargement des employés. Veuillez réessayer.
                    </td>
                </tr>
            `;
        }
    }

    function updateEmployeesTable(employees) {
        if (!employees.length) {
            employeesTableBody.innerHTML = `
                <tr>
                    <td colspan="10">Aucun employe trouve.</td>
                </tr>
            `;
            return;
        }

        const rows = employees.map(employee => `
            <tr>
                <td>${employee.nom}</td>
                <td>${employee.role || '-'}</td>
                <td>${employee.departement || '-'}</td>
                <td>${employee.mobile || '-'}</td>
                <td>${employee.dateEmbauche || '-'}</td>
                <td>${employee.email || '-'}</td>
                <td>${employee.genre || '-'}</td>
                <td>${employee.adresse || '-'}</td>
                <td>
                    <span class="status-badge ${getStatusClass(employee.statut)}">
                        ${employee.statut}
                    </span>
                </td>
                
                <td class="action-cell">
                    <button class="action-btn view-btn" title="Voir" onclick="viewEmployee(${employee.employeeId})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit-btn" title="Modifier" onclick="editEmployee(${employee.employeeId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Supprimer" onclick="openDeleteConfirmation(${employee.employeeId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        employeesTableBody.innerHTML = rows;
    }

    function getStatusClass(status) {
        if (status === 'ACTIF') return 'status-active';
        if (status === 'EN_CONGE') return 'status-leave';
        if (status === 'INACTIF') return 'status-inactive';
        return '';
    }

    function getEmployeePhotoUrl(employee) {
        if (employee && employee.photo && employee.photo.startsWith('data:image')) {
            return employee.photo;
        }

        return DEFAULT_AVATAR_URL(employee?.nom || 'Employe');
    }

    function updatePagination(apiTotalPages) {
        totalPages = Math.max(apiTotalPages || 0, 1);
        pageNumbers.textContent = `${currentPage} / ${totalPages}`;
        
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    // ===== GESTION DES PAGES =====
    function goToPage(pageNum) {
        currentPage = pageNum;
        filterEmployees();
    }
    
    function goToPrevPage() {
        if (currentPage > 1) {
            currentPage--;
            filterEmployees();
        }
    }
    
    function goToNextPage() {
        // On ne connaît pas le total de pages sans requête, donc on suppose qu'il y a une page suivante
        if (currentPage < totalPages) {
            currentPage++;
            filterEmployees();
        }
    }

    // ===== GESTION DES ÉVÉNEMENTS =====
    function resetAndFilterEmployees() {
        currentPage = 1;
        filterEmployees();
    }

    function setupEventListeners() {
        if (employeeSearch) employeeSearch.addEventListener('input', debounce(resetAndFilterEmployees, 300));
        if (departmentFilter) departmentFilter.addEventListener('change', resetAndFilterEmployees);
        if (statusFilter) statusFilter.addEventListener('change', resetAndFilterEmployees);
        
        if (addEmployeeBtn) addEmployeeBtn.addEventListener('click', openAddEmployeeModal);
        if (closeModal) closeModal.addEventListener('click', closeEmployeeModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeEmployeeModal);
        
        if (closeViewModal) closeViewModal.addEventListener('click', closeViewEmployeeModal);
        if (closeViewBtn) closeViewBtn.addEventListener('click', closeViewEmployeeModal);
        if (editFromViewBtn) editFromViewBtn.addEventListener('click', editCurrentEmployeeFromView);
        
        if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeDeleteConfirmation);
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
        if (employeeForm) employeeForm.addEventListener('submit', saveEmployee);
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteEmployee);
        
        if (prevPageBtn) prevPageBtn.addEventListener('click', goToPrevPage);
        if (nextPageBtn) nextPageBtn.addEventListener('click', goToNextPage);
        
        if (photoUpload) photoUpload.addEventListener('change', handlePhotoUpload);
    }

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    // ===== GESTION DES MODALES =====
    function openAddEmployeeModal() {
        modalTitle.textContent = 'Ajouter un employé';
        employeeForm.reset();
        photoDataInput.value = '';
        currentEmployeeId = null;
        photoPreview.src = DEFAULT_AVATAR_URL('Nouvel Employe');
        employeeModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeEmployeeModal() {
        employeeModal.style.display = 'none';
        document.body.style.overflow = '';
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    }

    function closeViewEmployeeModal() {
        viewEmployeeModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    function editCurrentEmployeeFromView() {
        closeViewEmployeeModal();
        editEmployee(currentEmployeeId);
    }

    window.openDeleteConfirmation = function(id) {
        // Pour afficher les infos de l'employé à supprimer, on doit d'abord les récupérer
        fetchEmployeeDetails(id).then(employee => {
            if (!employee) return;
            
            currentEmployeeId = id;
            
            deleteEmployeeInfo.innerHTML = `
                <p><strong>Nom:</strong> ${employee.nom}</p>
                <p><strong>Rôle:</strong> ${employee.role}</p>
                <p><strong>Département:</strong> ${employee.departement}</p>
            `;
            
            deleteModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
    };

    function closeDeleteConfirmation() {
        deleteModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // ===== OPÉRATIONS CRUD =====
    async function fetchEmployeeDetails(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données de l\'employé');
            return null;
        }
    }

    async function addEmployee(employeeData) {
        try {
            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });
            
            if (!response.ok) throw new Error('Erreur lors de l\'ajout');
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    async function updateEmployee(id, employeeData) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(employeeData)
            });
            
            if (!response.ok) throw new Error('Erreur lors de la mise à jour');
            return await response.json();
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    async function deleteEmployeeFromAPI(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            return true;
        } catch (error) {
            console.error('Erreur:', error);
            throw error;
        }
    }

    // ===== GESTION DES FORMULAIRES =====
    async function saveEmployee(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const employeeData = {
            nom: document.getElementById('name').value,
            role: document.getElementById('role').value,
            departement: document.getElementById('department').value,
            mobile: document.getElementById('mobile').value,
            dateEmbauche: document.getElementById('joiningDate').value,
            email: document.getElementById('email').value,
            genre: document.getElementById('gender').value,
            adresse: document.getElementById('address').value,
            photo: photoDataInput.value || null,
            statut: document.getElementById('status').value
        };
        
        try {
            if (currentEmployeeId) {
                await updateEmployee(currentEmployeeId, employeeData);
                alert('Employé modifié avec succès!');
            } else {
                await addEmployee(employeeData);
                alert('Employé ajouté avec succès!');
            }
            
            await filterEmployees();
            closeEmployeeModal();
        } catch (error) {
            alert('Une erreur est survenue: ' + error.message);
        }
    }

    function validateForm() {
        let isValid = true;
        const requiredFields = ['name', 'role', 'department', 'mobile', 'joiningDate', 'email', 'gender', 'status'];
        
        requiredFields.forEach(field => {
            const input = document.getElementById(field);
            const errorElement = document.getElementById(`${field}Error`);
            
            if (!input.value.trim()) {
                errorElement.textContent = 'Ce champ est obligatoire';
                isValid = false;
            } else {
                errorElement.textContent = '';
            }
        });
        
        // Validation email
        const emailInput = document.getElementById('email');
        const emailError = document.getElementById('emailError');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (emailInput.value && !emailRegex.test(emailInput.value)) {
            emailError.textContent = 'Format d\'email invalide';
            isValid = false;
        }
        
        // Validation téléphone
        const mobileInput = document.getElementById('mobile');
        const mobileError = document.getElementById('mobileError');
        const phoneRegex = /^[0-9]{10}$/;
        
        if (mobileInput.value && !phoneRegex.test(mobileInput.value)) {
            mobileError.textContent = 'Format de téléphone invalide (10 chiffres)';
            isValid = false;
        }
        
        return isValid;
    }

    async function deleteEmployee() {
        if (!currentEmployeeId) return;
        
        try {
            await deleteEmployeeFromAPI(currentEmployeeId);
            alert('Employé supprimé avec succès!');
            await filterEmployees();
            closeDeleteConfirmation();
        } catch (error) {
            alert('Une erreur est survenue lors de la suppression: ' + error.message);
        }
    }

    // ===== FONCTIONS GLOBALES =====
    window.editEmployee = async function(id) {
        try {
            const employee = await fetchEmployeeDetails(id);
            if (!employee) return;
            
            modalTitle.textContent = 'Modifier un employé';
            document.getElementById('name').value = employee.nom;
            document.getElementById('role').value = employee.role;
            document.getElementById('department').value = employee.departement;
            document.getElementById('mobile').value = employee.mobile;
            document.getElementById('joiningDate').value = employee.dateEmbauche;
            document.getElementById('email').value = employee.email;
            document.getElementById('gender').value = employee.genre;
            document.getElementById('address').value = employee.adresse || '';
            document.getElementById('status').value = employee.statut;
            
            photoDataInput.value = employee.photo || '';
            photoPreview.src = getEmployeePhotoUrl(employee);
            
            currentEmployeeId = employee.employeeId;
            employeeModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données de l\'employé');
        }
    };

    window.viewEmployee = async function(id) {
        try {
            const employee = await fetchEmployeeDetails(id);
            if (!employee) return;
            
            document.getElementById('viewName').textContent = employee.nom;
            document.getElementById('viewRole').textContent = employee.role;
            
            const statusBadge = document.getElementById('viewStatus');
            statusBadge.textContent = employee.statut;
            statusBadge.className = 'status-badge ' + getStatusClass(employee.statut);
            
            document.getElementById('viewPhoto').src = getEmployeePhotoUrl(employee);
            document.getElementById('viewGender').textContent = employee.genre;
            document.getElementById('viewMobile').textContent = employee.mobile;
            document.getElementById('viewEmail').textContent = employee.email;
            document.getElementById('viewAddress').textContent = employee.adresse || '-';
            document.getElementById('viewDepartment').textContent = employee.departement;
            
            const joiningDate = new Date(employee.dateEmbauche);
            document.getElementById('viewJoiningDate').textContent = joiningDate.toLocaleDateString('fr-FR');
            
            currentEmployeeId = employee.employeeId;
            viewEmployeeModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données de l\'employé');
        }
    };

    function handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Veuillez sélectionner une image.');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            alert('La taille de l\'image ne doit pas dépasser 2MB.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            photoPreview.src = event.target.result;
            photoDataInput.value = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});
