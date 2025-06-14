document.addEventListener("DOMContentLoaded", function () {
    // Vérifier si l'utilisateur est connecté
    checkLoginStatus();

    // ===== VARIABLES =====
    let employees = [];
    let attendances = [];
    let selectedEmployeeId = null;
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

    // ===== FONCTIONS =====

    // Vérifier si l'utilisateur est connecté
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const loginContainer = document.getElementById("loginContainer");
        const dashboardContainer = document.getElementById("dashboardContainer");
        
        if (isLoggedIn) {
            loginContainer.style.display = "none";
            dashboardContainer.style.display = "flex";
        } else {
            loginContainer.style.display = "flex";
            dashboardContainer.style.display = "none";
        }
    }

    // Initialiser les données
    function initializeData() {
        // Récupérer les employés depuis localStorage
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
            employees = JSON.parse(storedEmployees);
        } else {
            // Générer des données d'exemple si aucun employé n'est trouvé
            employees = generateSampleEmployees();
            localStorage.setItem("employees", JSON.stringify(employees));
        }

        // Récupérer les présences depuis localStorage
        const storedAttendances = localStorage.getItem("attendance");
        if (storedAttendances) {
            attendances = JSON.parse(storedAttendances);
        }
    }

    // Générer des données d'exemple pour les employés
    function generateSampleEmployees() {
        const departments = ["IT", "RH", "Finance", "Marketing", "Production"];
        const joiningDates = [
            "01/01/2020", "15/03/2020", "10/06/2020", "22/09/2020", "05/12/2020",
            "18/02/2021", "30/04/2021", "12/07/2021", "25/10/2021", "08/01/2022"
        ];

        return [
            { id: 1, name: "Ahmed Benali", department: "IT", joiningDate: "01/01/2020", photo: "https://randomuser.me/api/portraits/men/1.jpg" },
            { id: 2, name: "Fatima Zahra", department: "RH", joiningDate: "15/03/2020", photo: "https://randomuser.me/api/portraits/women/1.jpg" },
            { id: 3, name: "Karim Idrissi", department: "Finance", joiningDate: "10/06/2020", photo: "https://randomuser.me/api/portraits/men/2.jpg" },
            { id: 4, name: "Nadia Mansouri", department: "Marketing", joiningDate: "22/09/2020", photo: "https://randomuser.me/api/portraits/women/2.jpg" },
            { id: 5, name: "Omar Tazi", department: "Production", joiningDate: "05/12/2020", photo: "https://randomuser.me/api/portraits/men/3.jpg" },
            { id: 6, name: "Samira Alaoui", department: "IT", joiningDate: "18/02/2021", photo: "https://randomuser.me/api/portraits/women/3.jpg" },
            { id: 7, name: "Youssef Benjelloun", department: "RH", joiningDate: "30/04/2021", photo: "https://randomuser.me/api/portraits/men/4.jpg" },
            { id: 8, name: "Leila Haddad", department: "Finance", joiningDate: "12/07/2021", photo: "https://randomuser.me/api/portraits/women/4.jpg" },
            { id: 9, name: "Rachid Moussaoui", department: "Marketing", joiningDate: "25/10/2021", photo: "https://randomuser.me/api/portraits/men/5.jpg" },
            { id: 10, name: "Amina Berrada", department: "Production", joiningDate: "08/01/2022", photo: "https://randomuser.me/api/portraits/women/5.jpg" },
            { id: 11, name: "Hassan Ouazzani", department: "IT", joiningDate: "20/03/2022", photo: "https://randomuser.me/api/portraits/men/6.jpg" }
        ];
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
            localStorage.setItem("isLoggedIn", "false");
            window.location.href = "index.html";
        });

        // Écouteur pour le formulaire de connexion
        document.getElementById("loginForm").addEventListener("submit", function(e) {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            
            // Vérification simple (à remplacer par une vérification réelle)
            if (email === "admin@example.com" && password === "password") {
                localStorage.setItem("isLoggedIn", "true");
                checkLoginStatus();
            } else {
                alert("Email ou mot de passe incorrect!");
            }
        });

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
    function searchEmployee() {
        const searchTerm = employeeSearchInput.value.toLowerCase().trim();
        
        if (!searchTerm) {
            alert("Veuillez entrer un nom d'employé à rechercher.");
            return;
        }
        
        // Rechercher l'employé par nom
        const foundEmployee = employees.find(emp => 
            emp.name.toLowerCase().includes(searchTerm)
        );
        
        if (foundEmployee) {
            selectedEmployeeId = foundEmployee.id;
            displayEmployeeInfo(foundEmployee);
            calculateEmployeeStats(foundEmployee.id);
            displayEmployeeAttendance(foundEmployee.id);
            
            // Afficher la section d'informations et masquer le message
            employeeInfoSection.classList.remove('hidden');
            noEmployeeMessage.classList.add('hidden');
        } else {
            alert("Aucun employé trouvé avec ce nom.");
        }
    }

    // Afficher les informations de l'employé
    function displayEmployeeInfo(employee) {
        employeePhoto.src = employee.photo || 'https://via.placeholder.com/100';
        employeeName.textContent = employee.name;
        employeeDepartment.textContent = employee.department || 'Non spécifié';
        employeeId.textContent = `EMP-${String(employee.id).padStart(3, '0')}`;
        employeeJoiningDate.textContent = employee.joiningDate || 'Non spécifié';
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
            if (att.totalHours) {
                const hoursMatch = att.totalHours.match(/(\d+)h(?:(\d+)m)?/);
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
            if (att.breakTime) {
                totalBreakMinutes += 60; // 1 heure de pause par défaut
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
            const attendance = attendances.find(att => 
                att.employeeId === employeeId && att.date === dateString
            );
            
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
                if (attendance.status === 'Présent') {
                    statusClass = 'status-present';
                    statusText = 'Présent';
                } else if (attendance.status === 'Absent') {
                    statusClass = 'status-absent';
                    statusText = 'Absent';
                } else if (attendance.status === 'En pause') {
                    statusClass = 'status-pause';
                    statusText = 'En pause';
                } else if (attendance.status === 'Terminé') {
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
                <td>${attendance ? attendance.lastOut || '-' : '-'}</td>
                <td>${attendance ? attendance.totalHours || '0h' : '0h'}</td>
                <td>${attendance ? attendance.shift || '-' : '-'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td class="action-cell">
                    ${attendance ? `
                        <button class="action-btn edit-btn" title="Modifier" onclick="editEmployeeAttendance(${attendance.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" title="Supprimer" onclick="deleteEmployeeAttendance(${attendance.id})">
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
        if (confirm("Êtes-vous sûr de vouloir supprimer cet enregistrement de présence ?")) {
            // Supprimer la présence
            attendances = attendances.filter(att => att.id !== attendanceId);
            
            // Sauvegarder dans localStorage
            localStorage.setItem("attendance", JSON.stringify(attendances));
            
            // Mettre à jour l'affichage
            if (selectedEmployeeId) {
                calculateEmployeeStats(selectedEmployeeId);
                displayEmployeeAttendance(selectedEmployeeId);
            }
        }
    };

    // Fonction pour ajouter une présence (sera appelée depuis le HTML)
    window.addEmployeeAttendance = function(employeeId, date) {
        // Rediriger vers la page de présence générale avec les paramètres pour ajouter
        window.location.href = `attendance.html?add=true&employeeId=${employeeId}&date=${date}`;
    };
});