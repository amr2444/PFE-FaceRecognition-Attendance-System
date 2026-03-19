document.addEventListener("DOMContentLoaded", function () {
    // Vérifier si l'utilisateur est connecté
    if (!checkLoginStatus()) {
        return;
    }

    // ===== VARIABLES =====
    let employees = [];
    let attendances = [];
    let selectedEmployeeId = null;
    let selectedEmployee = null;
    let currentWeekStart = new Date();
    
    // Régler le début de la semaine au lundi
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart = new Date(currentWeekStart.setDate(diff));
    
    // ===== ÉLÉMENTS DOM =====
    const employeeSearchInput = document.getElementById("employeeSearchInput");
    const searchEmployeeBtn = document.getElementById("searchEmployeeBtn");
    const employeeInfoSection = document.getElementById("employeeInfoSection");
    const noEmployeeMessage = document.getElementById("noEmployeeMessage");
    const employeePhoto = document.getElementById("employeePhoto");
    const employeeName = document.getElementById("employeeName");
    const employeeDepartment = document.getElementById("employeeDepartment");
    const employeeId = document.getElementById("employeeId");
    const employeeJoiningDate = document.getElementById("employeeJoiningDate");
    const avgWorkingHours = document.getElementById("avgWorkingHours");
    const avgInTime = document.getElementById("avgInTime");
    const avgOutTime = document.getElementById("avgOutTime");
    const avgBreakTime = document.getElementById("avgBreakTime");
    const prevWeekBtn = document.getElementById("prevWeekBtn");
    const nextWeekBtn = document.getElementById("nextWeekBtn");
    const currentWeekDisplay = document.getElementById("currentWeekDisplay");
    const employeeAttendanceTableBody = document.getElementById("employeeAttendanceTableBody");
    const currentDateElement = document.getElementById("currentDate");

    // ===== INITIALISATION =====
    initializeData();
    setupEventListeners();
    displayCurrentDate();
    updateWeekDisplay();
    hydrateFromQueryParams();

    // ===== FONCTIONS =====

    // Vérifier si l'utilisateur est connecté
    function checkLoginStatus() {
        const loginContainer = document.getElementById("loginContainer");
        const dashboardContainer = document.getElementById("dashboardContainer");

        if (typeof Auth === "undefined" || !Auth.checkLogin()) {
            window.location.href = "login.html";
            return false;
        }

        if (loginContainer) {
            loginContainer.style.display = "none";
        }
        if (dashboardContainer) {
            dashboardContainer.style.display = "flex";
        }

        return true;
    }

    // Initialiser les données
    function initializeData() {
        employees = [];
        attendances = [];
    }

    function hydrateFromQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const employeeQuery = params.get('employee');
        if (employeeQuery) {
            employeeSearchInput.value = employeeQuery;
            searchEmployee();
        }
    }

    // Configurer les écouteurs d'événements
    function setupEventListeners() {
        // Recherche d'employé
        searchEmployeeBtn.addEventListener('click', searchEmployee);
        employeeSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchEmployee();
            }
        });

        // Navigation entre les semaines
        prevWeekBtn.addEventListener('click', () => changeWeek(-1));
        nextWeekBtn.addEventListener('click', () => changeWeek(1));

        // Écouteur pour le bouton de déconnexion
        document.getElementById("logoutBtn").addEventListener("click", function() {
            if (typeof Auth !== "undefined") {
                Auth.logout();
            } else {
                window.location.href = "login.html";
            }
        });

        // Écouteur pour le formulaire de connexion
        const loginForm = document.getElementById("loginForm");
        if (loginForm) {
            loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            try {
            await Auth.login(email, password, false);
            checkLoginStatus();
            } catch (error) {
                AppUI.notify(error.message || "Email ou mot de passe incorrect!", 'error');
            }
            });
        }

        // Écouteur pour le bouton de toggle de la sidebar
        document.getElementById("sidebarToggle").addEventListener("click", function() {
            document.getElementById("sidebar").classList.toggle("collapsed");
            document.getElementById("mainContent").classList.toggle("expanded");
        });
    }

    // Afficher la date actuelle
    function displayCurrentDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = today.toLocaleDateString('fr-FR', options);
    }

    // Rechercher un employé
    async function searchEmployee() {
        const searchTerm = employeeSearchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            AppUI.notify("Veuillez entrer un nom d'employe a rechercher.", 'warning');
            return;
        }
        try {
            const employeePage = await AppApi.get(`/employes/?page=0&size=20&searchByNom=${encodeURIComponent(searchTerm)}`, "Impossible de rechercher l'employe.");
            const foundEmployee = (employeePage.content || [])[0];

            if (foundEmployee) {
                selectedEmployeeId = foundEmployee.employeeId;
                selectedEmployee = foundEmployee;
                employees = employeePage.content || [];
                attendances = await fetchEmployeeAttendances(foundEmployee.nom);
                displayEmployeeInfo(foundEmployee);
                calculateEmployeeStats(foundEmployee.employeeId);
                displayEmployeeAttendance(foundEmployee.employeeId);
            
                employeeInfoSection.classList.remove('hidden');
                noEmployeeMessage.classList.add('hidden');
            } else {
                AppUI.notify("Aucun employe trouve avec ce nom.", 'warning');
                employeeInfoSection.classList.add('hidden');
                noEmployeeMessage.classList.remove('hidden');
            }
        } catch (error) {
            AppUI.notify(error.message || "Impossible de rechercher l'employe.", 'error');
        }
    }

    async function fetchEmployeeAttendances(employeeName) {
        const data = await AppApi.get(`/presences/?page=0&size=200&searchByNom=${encodeURIComponent(employeeName)}`, 'Impossible de charger les presences de l\'employe.');
        return data.content || [];
    }

    // Afficher les informations de l'employé
    function displayEmployeeInfo(employee) {
        employeePhoto.src = employee.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(employee.nom || 'Employe');
        employeeName.textContent = employee.nom;
        employeeDepartment.textContent = employee.departement || 'Non specifie';
        employeeId.textContent = `EMP-${String(employee.employeeId).padStart(3, '0')}`;
        employeeJoiningDate.textContent = employee.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : 'Non specifie';
    }

    // Calculer les statistiques de l'employé
    function calculateEmployeeStats(employeeId) {
        // Filtrer les présences de l'employé
        const employeeAttendances = attendances.filter(att => att.employeeId === employeeId);
        
        if (employeeAttendances.length === 0) {
            // Aucune donnée de présence, afficher des valeurs par défaut
            avgWorkingHours.textContent = "N/A";
            avgInTime.textContent = "N/A";
            avgOutTime.textContent = "N/A";
            avgBreakTime.textContent = "N/A";
            return;
        }
        
        // Calculer les moyennes
        let totalWorkingMinutes = 0;
        let totalInTimeMinutes = 0;
        let totalOutTimeMinutes = 0;
        let totalBreakMinutes = 0;
        let countWithWorkingHours = 0;
        let countWithInTime = 0;
        let countWithOutTime = 0;
        let countWithBreakTime = 0;
        
        employeeAttendances.forEach(att => {
            // Heures de travail
            if (att.totalHeures) {
                const hoursMatch = formatDuration(att.totalHeures).match(/(\d+)h\s?(?:(\d+)m)?/);
                if (hoursMatch) {
                    const hours = parseInt(hoursMatch[1]) || 0;
                    const minutes = parseInt(hoursMatch[2]) || 0;
                    totalWorkingMinutes += hours * 60 + minutes;
                    countWithWorkingHours++;
                }
            }
            
            // Heure d'arrivée
            if (att.firstIn) {
                const [hours, minutes] = att.firstIn.split(':').map(Number);
                totalInTimeMinutes += hours * 60 + minutes;
                countWithInTime++;
            }
            
            // Heure de départ
            if (att.lastOut) {
                const [hours, minutes] = att.lastOut.split(':').map(Number);
                totalOutTimeMinutes += hours * 60 + minutes;
                countWithOutTime++;
            }
            
            // Temps de pause (supposé être 1h par défaut)
            if (att.breakTime && att.resumeTime) {
                const [breakHours, breakMinutes] = att.breakTime.split(':').map(Number);
                const [resumeHours, resumeMinutes] = att.resumeTime.split(':').map(Number);
                totalBreakMinutes += ((resumeHours * 60 + resumeMinutes) - (breakHours * 60 + breakMinutes));
                countWithBreakTime++;
            }
        });
        
        // Calculer les moyennes et formater les résultats
        if (countWithWorkingHours > 0) {
            const avgWorkingMinutes = Math.round(totalWorkingMinutes / countWithWorkingHours);
            const hours = Math.floor(avgWorkingMinutes / 60);
            const minutes = avgWorkingMinutes % 60;
            avgWorkingHours.textContent = `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
        } else {
            avgWorkingHours.textContent = "N/A";
        }
        
        if (countWithInTime > 0) {
            const avgInMinutes = Math.round(totalInTimeMinutes / countWithInTime);
            const hours = Math.floor(avgInMinutes / 60);
            const minutes = avgInMinutes % 60;
            avgInTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
            avgInTime.textContent = "N/A";
        }
        
        if (countWithOutTime > 0) {
            const avgOutMinutes = Math.round(totalOutTimeMinutes / countWithOutTime);
            const hours = Math.floor(avgOutMinutes / 60);
            const minutes = avgOutMinutes % 60;
            avgOutTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else {
            avgOutTime.textContent = "N/A";
        }
        
        if (countWithBreakTime > 0) {
            const avgBreakMinutes = Math.round(totalBreakMinutes / countWithBreakTime);
            const hours = Math.floor(avgBreakMinutes / 60);
            const minutes = avgBreakMinutes % 60;
            avgBreakTime.textContent = `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
        } else {
            avgBreakTime.textContent = "N/A";
        }
    }

    // Changer de semaine
    function changeWeek(direction) {
        // Ajouter ou soustraire 7 jours
        currentWeekStart.setDate(currentWeekStart.getDate() + (direction * 7));
        updateWeekDisplay();
        
        // Si un employé est sélectionné, mettre à jour son tableau de présence
        if (selectedEmployeeId) {
            displayEmployeeAttendance(selectedEmployeeId);
        }
    }

    // Mettre à jour l'affichage de la semaine
    function updateWeekDisplay() {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const formatDate = (date) => {
            const day = date.getDate();
            const month = date.toLocaleString('fr-FR', { month: 'long' });
            return `${day} ${month}`;
        };
        
        currentWeekDisplay.textContent = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)} ${currentWeekStart.getFullYear()}`;
    }

    // Afficher les présences de l'employé pour la semaine actuelle
    function displayEmployeeAttendance(employeeId) {
        // Vider le tableau
        employeeAttendanceTableBody.innerHTML = '';
        
        // Créer un tableau pour les 7 jours de la semaine
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(currentWeekStart);
            day.setDate(day.getDate() + i);
            weekDays.push(day);
        }
        
        // Pour chaque jour de la semaine
        weekDays.forEach(day => {
            const dateString = day.toISOString().split('T')[0];
            
            // Chercher la présence pour ce jour
            const attendance = attendances.find(att => {
                const creationDate = att.creationDate ? new Date(att.creationDate) : null;
                return att.employeeId === employeeId && creationDate && creationDate.toISOString().split('T')[0] === dateString;
            });
            
            // Créer une ligne pour ce jour
            const row = document.createElement('tr');
            
            // Formater la date
            const formattedDate = day.toLocaleDateString('fr-FR', { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
            });
            
            // Déterminer la classe de statut
            let statusClass = '';
            let statusText = 'Non enregistré';
            
            if (attendance) {
                if (attendance.statut === 'PRESENT') {
                    statusClass = 'status-present';
                    statusText = 'Présent';
                } else if (attendance.statut === 'ABSENT') {
                    statusClass = 'status-absent';
                    statusText = 'Absent';
                } else if (attendance.statut === 'EN_PAUSE') {
                    statusClass = 'status-pause';
                    statusText = 'En pause';
                } else if (attendance.statut === 'TERMINE') {
                    statusClass = 'status-finished';
                    statusText = 'Terminé';
                }
            }
            
            // Vérifier si c'est un weekend
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const rowClass = isWeekend ? 'weekend-row' : '';
            
            row.className = rowClass;
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${attendance ? attendance.firstIn || '-' : '-'}</td>
                <td>${attendance ? attendance.breakTime || '-' : '-'}</td>
                <td>${attendance ? attendance.resumeTime || '-' : '-'}</td>
                <td>${attendance ? attendance.lastOut || '-' : '-'}</td>
                <td>${attendance ? formatDuration(attendance.totalHeures) || '0h' : '0h'}</td>
                <td>${attendance ? attendance.shift || '-' : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-cell">
                    ${attendance ? `
                        <button class="action-btn edit-btn" title="Modifier" onclick="editEmployeeAttendance(${attendance.presenceJourId})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Supprimer" onclick="deleteEmployeeAttendance(${attendance.presenceJourId})">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : `
                        <button class="action-btn add-btn" title="Ajouter" onclick="addEmployeeAttendance(${employeeId}, '${dateString}')">
                            <i class="fas fa-plus"></i>
                        </button>
                    `}
                </td>
            `;
            
            employeeAttendanceTableBody.appendChild(row);
        });
    }

    // Fonction pour modifier une présence (sera appelée depuis le HTML)
    window.editEmployeeAttendance = function(attendanceId) {
        // Rediriger vers la page de présence générale avec l'ID de la présence à modifier
        window.location.href = `attendance.html?edit=${attendanceId}`;
    };

    // Fonction pour supprimer une présence (sera appelée depuis le HTML)
    window.deleteEmployeeAttendance = function(attendanceId) {
        if (!confirm("Etes-vous sur de vouloir supprimer cet enregistrement de presence ?")) {
            return;
        }

        AppApi.delete(`/presences/${attendanceId}`, 'Impossible de supprimer cette presence.')
            .then(async () => {
                if (selectedEmployee) {
                    attendances = await fetchEmployeeAttendances(selectedEmployee.nom);
                }
                if (selectedEmployeeId) {
                    calculateEmployeeStats(selectedEmployeeId);
                    displayEmployeeAttendance(selectedEmployeeId);
                }
                AppUI.notify('Presence supprimee avec succes.', 'success');
            })
            .catch(error => AppUI.notify(error.message || 'Impossible de supprimer cette presence.', 'error'));
    };

    // Fonction pour ajouter une présence (sera appelée depuis le HTML)
    window.addEmployeeAttendance = function(employeeId, date) {
        // Rediriger vers la page de présence générale avec les paramètres pour ajouter
        window.location.href = `attendance.html?add=true&employeeId=${employeeId}&date=${date}`;
    };

    function formatDuration(durationStr) {
        if (!durationStr) return '0h';
        const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (!matches) return '0h';

        const hours = matches[1] ? parseInt(matches[1], 10) : 0;
        const minutes = matches[2] ? parseInt(matches[2], 10) : 0;
        return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
});
