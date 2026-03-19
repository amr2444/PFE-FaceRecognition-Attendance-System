// attendance.js
document.addEventListener("DOMContentLoaded", function () {
    // Configuration de base
    const API_BASE_URL = 'http://localhost:8080/presences';
    const API_BASE_URL_Employee = 'http://localhost:8080/employes/find/all';
    const DEFAULT_ITEMS_PER_PAGE = 10;
    
    // Éléments DOM
    const domElements = {
        tableBody: document.querySelector("#attendanceTable tbody"),
        searchInput: document.getElementById("searchInput"),
        statusFilter: document.getElementById("statusFilter"),
        shiftFilter: document.getElementById("shiftFilter"),
        pageInfo: document.getElementById("pageInfo"),
        prevPageBtn: document.getElementById("prevPage"),
        nextPageBtn: document.getElementById("nextPage"),
        itemsPerPageSelect: document.getElementById("itemsPerPageSelect"),
        addAttendanceBtn: document.getElementById("addAttendanceBtn"),
        exportBtn: document.getElementById("exportBtn"),
        checkGateBtn: document.getElementById("checkGateBtn"),
        selectAllCheckbox: document.getElementById("selectAll"),
        bulkActions: document.getElementById("bulkActions"),
        selectedCount: document.querySelector(".selected-count"),
        markPresentBtn: document.getElementById("markPresentBtn"),
        markAbsentBtn: document.getElementById("markAbsentBtn"),
        currentDateElement: document.getElementById("currentDate"),
        attendanceModal: document.getElementById("attendanceModal"),
        closeModal: document.getElementById("closeModal"),
        attendanceForm: document.getElementById("attendanceForm"),
        modalTitle: document.getElementById("modalTitle"),
        saveBtn: document.getElementById("saveBtn"),
        cancelBtn: document.getElementById("cancelBtn"),
        deleteModal: document.getElementById("deleteModal"),
        closeDeleteModal: document.getElementById("closeDeleteModal"),
        cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
        confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),
        deleteAttendanceInfo: document.getElementById("deleteAttendanceInfo")
    };

    // État de l'application
    let appState = {
        currentPage: 1,
        itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
        totalElements: 0,
        totalPages: 1,
        selectedAttendances: new Set(),
        currentAttendanceId: null,
        filteredAttendances : []
    };

    // Initialisation
    function init() {
        setupEventListeners();
        displayCurrentDate();
        loadAttendances();
    }

    function setupEventListeners() {
        // Écouteurs pour les filtres
        if (domElements.searchInput) {
            domElements.searchInput.addEventListener('input', debounce(filterAttendances, 300));
        }
        
        if (domElements.statusFilter) {
            domElements.statusFilter.addEventListener('change', filterAttendances);
        }
        
        if (domElements.shiftFilter) {
            domElements.shiftFilter.addEventListener('change', filterAttendances);
        }

        // Pagination
        if (domElements.prevPageBtn) {
            domElements.prevPageBtn.addEventListener('click', () => changePage(appState.currentPage - 1));
        }
        
        if (domElements.nextPageBtn) {
            domElements.nextPageBtn.addEventListener('click', () => changePage(appState.currentPage + 1));
        }
        
        if (domElements.itemsPerPageSelect) {
            domElements.itemsPerPageSelect.addEventListener('change', function() {
                appState.itemsPerPage = parseInt(this.value);
                appState.currentPage = 1;
                resetSelection();
                loadAttendances();
            });
        }

        // Boutons d'action
        if (domElements.addAttendanceBtn) {
            domElements.addAttendanceBtn.addEventListener('click', openAddAttendanceModal);
        }
        
        if (domElements.exportBtn) {
            domElements.exportBtn.addEventListener('click', exportAttendances);
        }
        
        if (domElements.checkGateBtn) {
            domElements.checkGateBtn.addEventListener('click', openCheckingGate);
        }

        // Sélection multiple
        if (domElements.selectAllCheckbox) {
            domElements.selectAllCheckbox.addEventListener('change', toggleSelectAll);
        }
        
        if (domElements.markPresentBtn) {
            domElements.markPresentBtn.addEventListener('click', () => bulkUpdateStatus('PRESENT'));
        }
        
        if (domElements.markAbsentBtn) {
            domElements.markAbsentBtn.addEventListener('click', () => bulkUpdateStatus('ABSENT'));
        }

        // Modals
        if (domElements.closeModal) {
            domElements.closeModal.addEventListener('click', closeAttendanceModal);
        }
        
        if (domElements.cancelBtn) {
            domElements.cancelBtn.addEventListener('click', closeAttendanceModal);
        }
        
        if (domElements.closeDeleteModal) {
            domElements.closeDeleteModal.addEventListener('click', closeDeleteConfirmation);
        }
        
        if (domElements.cancelDeleteBtn) {
            domElements.cancelDeleteBtn.addEventListener('click', closeDeleteConfirmation);
        }

        // Formulaires
        if (domElements.attendanceForm) {
            domElements.attendanceForm.addEventListener('submit', saveAttendance);
        }
        
        if (domElements.confirmDeleteBtn) {
            domElements.confirmDeleteBtn.addEventListener('click', deleteAttendance);
        }
    }

    async function loadAttendances() {
        try {
            const params = new URLSearchParams({
                page: appState.currentPage - 1,
                size: appState.itemsPerPage,
                ...(domElements.searchInput?.value && { searchByNom: domElements.searchInput.value }),
                ...(domElements.statusFilter?.value && { searchByStatus: domElements.statusFilter.value }),
                ...(domElements.shiftFilter?.value && { searchByShift: domElements.shiftFilter.value })
            });

            const response = await fetch(`${API_BASE_URL}/?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            appState.totalElements = data.totalElements;
            appState.totalPages = data.totalPages;
            
            updateAttendancesTable(data.content || []);
            updatePaginationControls();
            
        } catch (error) {
            console.error("Erreur lors du chargement des présences:", error);
            showError("Erreur lors du chargement des données. Veuillez réessayer.");
        }
    }

    function updateAttendancesTable(attendances) {
        if (!domElements.tableBody) return;

        if (!attendances.length) {
            domElements.tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="error-message">Aucune presence trouvee.</td>
                </tr>
            `;
            updateSelectAllCheckbox();
            return;
        }
        
        domElements.tableBody.innerHTML = attendances.map(attendance => `
            <tr>
                <td class="checkbox-cell">
                    <input type="checkbox"
                           class="attendance-checkbox"
                           data-id="${attendance.presenceJourId}"
                           ${appState.selectedAttendances.has(attendance.presenceJourId) ? 'checked' : ''}>
                </td>
                <td>${attendance.employeeName || '-'}</td>
                <td>${formatTime(attendance.firstIn)}</td>
                <td>${formatTime(attendance.breakTime)}</td>
                <td>${formatTime(attendance.lastOut)}</td>
                <td>${formatDuration(attendance.totalHeures)}</td>
                <td>
                    <span class="status-badge ${getStatusClass(attendance.statut)}">
                        ${formatStatus(attendance.statut)}
                    </span>
                </td>
                <td>${attendance.shift || '-'}</td>
                <td class="action-cell">
                    <button class="action-btn edit-btn" 
                            onclick="editAttendance(${attendance.presenceJourId})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" 
                            onclick="openDeleteConfirmation(${attendance.presenceJourId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const id = parseInt(this.getAttribute('data-id'));
                if (this.checked) {
                    appState.selectedAttendances.add(id);
                } else {
                    appState.selectedAttendances.delete(id);
                }
                updateBulkActions();
            });
        });

        updateSelectAllCheckbox();
    }

    function updatePaginationControls() {
        if (!domElements.pageInfo || !domElements.prevPageBtn || !domElements.nextPageBtn) return;
        
        domElements.pageInfo.textContent = `Page ${appState.currentPage} sur ${appState.totalPages} (${appState.totalElements} éléments)`;
        domElements.prevPageBtn.disabled = appState.currentPage === 1;
        domElements.nextPageBtn.disabled = appState.currentPage === appState.totalPages;
    }

    function updateBulkActions() {
        if (!domElements.bulkActions || !domElements.selectedCount) return;
        
        const count = appState.selectedAttendances.size;
        
        if (count > 0) {
            domElements.bulkActions.classList.add('visible');
            domElements.selectedCount.textContent = `${count} sélectionné(s)`;
        } else {
            domElements.bulkActions.classList.remove('visible');
        }
        
        updateSelectAllCheckbox();
    }

    function updateSelectAllCheckbox() {
        if (!domElements.selectAllCheckbox) return;
        
        const checkboxes = document.querySelectorAll('.attendance-checkbox');
        const checkedCount = document.querySelectorAll('.attendance-checkbox:checked').length;
        
        if (checkboxes.length > 0 && checkedCount === checkboxes.length) {
            domElements.selectAllCheckbox.checked = true;
            domElements.selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === 0) {
            domElements.selectAllCheckbox.checked = false;
            domElements.selectAllCheckbox.indeterminate = false;
        } else {
            domElements.selectAllCheckbox.indeterminate = true;
        }
    }

    function toggleSelectAll() {
        const isChecked = domElements.selectAllCheckbox.checked;
        
        document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
            checkbox.checked = isChecked;
            const id = parseInt(checkbox.getAttribute('data-id'));
            
            if (isChecked) {
                appState.selectedAttendances.add(id);
            } else {
                appState.selectedAttendances.delete(id);
            }
        });
        
        updateBulkActions();
    }

    function changePage(newPage) {
        if (newPage < 1 || newPage > appState.totalPages) return;
        
        appState.currentPage = newPage;
        resetSelection();
        loadAttendances();
    }

    function filterAttendances() {
        appState.currentPage = 1;
        resetSelection();
        loadAttendances();
    }

    async function bulkUpdateStatus(status) {
        if (appState.selectedAttendances.size === 0) return;
        
        if (!confirm(`Êtes-vous sûr de vouloir marquer ${appState.selectedAttendances.size} employé(s) comme "${status}" ?`)) {
            return;
        }
        
        try {
            const attendances = await Promise.all(
                Array.from(appState.selectedAttendances).map(id => fetchAttendanceDetails(id))
            );

            const updates = attendances.map(attendance =>
                updateAttendance(attendance.presenceJourId, {
                    employeeId: attendance.employeeId,
                    firstIn: attendance.firstIn || null,
                    breakTime: attendance.breakTime || null,
                    lastOut: attendance.lastOut || null,
                    statut: status,
                    shift: attendance.shift || '',
                    note: attendance.note || ''
                })
            );
            
            await Promise.all(updates);
            loadAttendances();
            resetSelection();
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour groupée:', error);
            alert('Une erreur est survenue lors de la mise à jour groupée');
        }
    }

   async function exportAttendances() {
    try {
        const params = new URLSearchParams({
            format: 'csv',
            exportAll: 'true',
            ...(domElements.searchInput?.value && { searchByNom: domElements.searchInput.value }),
            ...(domElements.statusFilter?.value && { searchByStatus: domElements.statusFilter.value }),
            ...(domElements.shiftFilter?.value && { searchByShift: domElements.shiftFilter.value })
        });

        const response = await fetch(`${API_BASE_URL}/export?${params.toString()}`);

        if (!response.ok) {
            throw new Error('Erreur lors de l\'export des presences');
        }

        const blob = await response.blob();
        const link = document.createElement('a');
        const urlObject = URL.createObjectURL(blob);
        const contentDisposition = response.headers.get('Content-Disposition') || '';
        const fileNameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
        const fileName = fileNameMatch ? fileNameMatch[1] : `presences_${new Date().toISOString().split('T')[0]}.csv`;

        link.href = urlObject;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(urlObject), 100);
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Une erreur est survenue lors de l\'export: ' + error.message);
    }
   }

    async function openAddAttendanceModal() {
    if (!domElements.modalTitle || !domElements.attendanceForm) return;
    
    domElements.modalTitle.textContent = 'Ajouter une présence';
    domElements.attendanceForm.reset();
    document.getElementById('attendanceId').value = '';
    
    const employeeNameContainer = document.querySelector('.form-group:first-child');
    if (employeeNameContainer) {
        employeeNameContainer.innerHTML = `
            <label for="employeeSelect">Employé</label>
            <select id="employeeSelect" name="employeeSelect" required>
                <option value="">-- Sélectionner un employé --</option>
                <!-- Options seront ajoutées dynamiquement -->
            </select>
            <span id="employeeSelectError" class="error-message"></span>
        `;
        
        try {
            // Récupération des employés depuis l'API
            const response = await fetch('http://localhost:8080/employes/find/all');
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des employés');
            }
            const employees = await response.json();
            
            const select = document.getElementById('employeeSelect');
            
            // Filtrer pour n'afficher que les employés ACTIFs (si nécessaire)
            const activeEmployees = employees.filter(emp => emp.statut === 'ACTIF');
            
            // Ajouter les options au select
            activeEmployees.forEach(employee => {
                const option = document.createElement('option');
                option.value = employee.employeeId;
                option.textContent = employee.nom;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Erreur:', error);
            // Vous pourriez afficher un message d'erreur à l'utilisateur ici
        }
    }
    
    document.getElementById('shift').value = 'Matin';
    document.getElementById('status').value = 'PRESENT';
    appState.currentAttendanceId = null;
    
    if (domElements.attendanceModal) {
        domElements.attendanceModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

    function closeAttendanceModal() {
        if (domElements.attendanceModal) {
            domElements.attendanceModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    async function saveAttendance(e) {
        e.preventDefault();

        const isNewAttendance = appState.currentAttendanceId === null;
        let employeeId, employeeName, employeePhoto;

        if (isNewAttendance) {
            const employeeSelect = document.getElementById('employeeSelect');
            if (!employeeSelect || !employeeSelect.value) {
                const errorElement = document.getElementById('employeeSelectError');
                if (errorElement) errorElement.textContent = 'Veuillez sélectionner un employé';
                return;
            }
            
            employeeId = parseInt(employeeSelect.value);
            employeeName = employeeSelect.options[employeeSelect.selectedIndex].text;

            
        }

        const attendanceData = {
           employeeId: isNewAttendance ? employeeId : '',
            firstIn: document.getElementById('firstIn').value,
            breakTime: document.getElementById('breakTime').value,
            lastOut: document.getElementById('lastOut').value,
            statut: document.getElementById('status').value,
            shift: document.getElementById('shift').value,
            note: document.getElementById('notes').value,
        };
        
        try {
            if (appState.currentAttendanceId) {
                await updateAttendance(appState.currentAttendanceId, attendanceData);
                alert('Présence modifiée avec succès!');
            } else {
                await addAttendance(attendanceData);
                alert('Présence ajoutée avec succès!');
            }
            
            loadAttendances();
            closeAttendanceModal();
        } catch (error) {
            alert('Une erreur est survenue: ' + error.message);
        }
    }

    async function addAttendance(attendanceData) {
        const response = await fetch(`${API_BASE_URL}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de l\'ajout');
        return await response.json();
    }

    async function updateAttendance(id, attendanceData) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceData)
        });
        
        if (!response.ok) throw new Error('Erreur lors de la mise à jour');
        return await response.json();
    }

    async function fetchAttendanceDetails(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        if (!response.ok) throw new Error('Erreur lors de la recuperation des donnees');
        return await response.json();
    }

    async function deleteAttendance() {
        if (!appState.currentAttendanceId) return;
        
        try {
            await deleteAttendanceFromAPI(appState.currentAttendanceId);
            alert('Présence supprimée avec succès!');
            loadAttendances();
            closeDeleteConfirmation();
        } catch (error) {
            alert('Une erreur est survenue lors de la suppression: ' + error.message);
        }
    }

    async function deleteAttendanceFromAPI(id) {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        return true;
    }

    function closeDeleteConfirmation() {
        if (domElements.deleteModal) {
            domElements.deleteModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Fonctions utilitaires
    function formatTime(timeStr) {
        return timeStr ? timeStr.substring(0, 5) : '-';
    }

    function formatDuration(durationStr) {
        if (!durationStr) return '-';
        const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!matches) return '-';
        
        const hours = matches[1] ? parseInt(matches[1]) : 0;
        const minutes = matches[2] ? parseInt(matches[2]) : 0;
        
        if (hours === 0 && minutes === 0) return '0h';
        return `${hours}h${minutes > 0 ? minutes : ''}`;
    }

    function formatStatus(status) {
        if (!status) return '-';
        return status.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }

    function getStatusClass(status) {
        if (status === 'PRESENT') return 'status-present';
        if (status === 'ABSENT') return 'status-absent';
        if (status === 'EN_PAUSE') return 'status-pause';
        if (status === 'TERMINE') return 'status-finished';
        return '';
    }

    function debounce(func, timeout = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function displayCurrentDate() {
        if (!domElements.currentDateElement) return;
        
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        domElements.currentDateElement.textContent = today.toLocaleDateString('fr-FR', options);
    }

    function showError(message) {
        if (!domElements.tableBody) return;
        
        domElements.tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="error-message">${message}</td>
            </tr>
        `;
    }

    function resetSelection() {
        appState.selectedAttendances.clear();
        updateBulkActions();
    }

    // Fonctions globales
    window.editAttendance = async function(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            
            const attendance = await fetchAttendanceDetails(id);
            
            if (!domElements.modalTitle || !domElements.attendanceForm) return;
            
            domElements.modalTitle.textContent = 'Modifier la présence';
            
            const employeeNameContainer = document.querySelector('.form-group:first-child');
            if (employeeNameContainer) {
                employeeNameContainer.innerHTML = `
                    <label for="employeeName">Employé</label>
                    <input type="text" id="employeeName" disabled>
                `;
            }
            
            document.getElementById('attendanceId').value = attendance.presenceJourId;
            document.getElementById('employeeName').value = attendance.employeeName;
            document.getElementById('firstIn').value = formatTime(attendance.firstIn) || '';
            document.getElementById('breakTime').value = formatTime(attendance.breakTime) || '';
            document.getElementById('lastOut').value = formatTime(attendance.lastOut) || '';
            document.getElementById('status').value = attendance.statut || '';
            document.getElementById('shift').value = attendance.shift || '';
            document.getElementById('notes').value = attendance.note || '';
            
            appState.currentAttendanceId = attendance.presenceJourId;
            
            if (domElements.attendanceModal) {
                domElements.attendanceModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données de présence');
        }
    };

    window.openDeleteConfirmation = async function(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Erreur lors de la récupération des données');
            
            const attendance = await fetchAttendanceDetails(id);
            
            appState.currentAttendanceId = id;
            
            if (domElements.deleteAttendanceInfo) {
                domElements.deleteAttendanceInfo.innerHTML = `
                    <p><strong>Employé:</strong> ${attendance.employeeName || '-'}</p>
                    <p><strong>Total heures:</strong> ${formatDuration(attendance.totalHeures) || '-'}</p>
                    <p><strong>Status:</strong> ${formatStatus(attendance.statut) || '-'}</p>
                `;
            }
            
            if (domElements.deleteModal) {
                domElements.deleteModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données de présence');
        }
    };

    // Initialiser l'application
    init();
});
