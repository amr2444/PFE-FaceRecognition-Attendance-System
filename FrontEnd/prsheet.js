document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the presence sheet page
    if (!document.getElementById('attendanceTable')) return;

    // ===== VARIABLES =====
    let employees = [];
    let holidays = [];
    let attendanceData = {};
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    // ===== DOM ELEMENTS =====
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const searchBtn = document.getElementById('searchBtn');
    const yearTag = document.getElementById('yearTag');
    const monthTag = document.getElementById('monthTag');
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    const exportPdfBtn = document.getElementById('exportPdf');
    const exportExcelBtn = document.getElementById('exportExcel');
    const printBtn = document.getElementById('printBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // ===== INITIALIZATION =====
    initializeData();
    setupEventListeners();

    // ===== FUNCTIONS =====

    // Initialize data
    function initializeData() {
        // Set default values for year and month selects
        yearSelect.value = "2025";  // Défini à 2025 comme demandé
        monthSelect.value = "3";    // Défini à Mars (3) comme demandé
        
        // Update filter tags
        updateFilterTags();
        
        // Load employees from localStorage or use sample data
        loadEmployees();
        
        // Load holidays (sample data)
        loadHolidays();
        
        // Generate attendance data
        generateAttendanceData();
        
        // Render attendance table
        renderAttendanceTable();
    }

    // Set up event listeners
    function setupEventListeners() {
        searchBtn.addEventListener('click', handleSearch);
        exportPdfBtn.addEventListener('click', exportToPdf);
        exportExcelBtn.addEventListener('click', exportToExcel);
        printBtn.addEventListener('click', printTable);
        
        // Ensure the page title remains visible when sidebar is toggled
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', function() {
                document.querySelector('.page-title').style.opacity = '1';
            });
        }
    }

    // Load employees
    function loadEmployees() {
        const storedEmployees = localStorage.getItem('employees');
        
        if (storedEmployees) {
            employees = JSON.parse(storedEmployees);
        } else {
            // Sample data if no stored employees
            employees = [
                {
                    id: 1,
                    name: "ElBellaoui Amr ",
                    role: "Technicien",
                    department: "bureaux",
                    photo: "1.jpg"
                },
                {
                    id: 2,
                    name: "Ahmed",
                    role: "Agent de sécurité",
                    department: "Sécurité",
                    photo: "https://randomuser.me/api/portraits/women/12.jpg"
                },
                {
                    id: 3,
                    name: "mouad",
                    role: "Responsable accueil",
                    department: "Accueil",
                    photo: "https://randomuser.me/api/portraits/men/13.jpg"
                },
                {
                    id: 4,
                    name: "douaa Mansouri",
                    role: "Administratrice",
                    department: "Administration",
                    photo: "https://randomuser.me/api/portraits/women/14.jpg"
                },
                {
                    id: 5,
                    name: "elon Musk",
                    role: "Agent d'entretien",
                    department: "Entretien",
                    photo: "https://randomuser.me/api/portraits/men/15.jpg"
                },
                {
                    id: 6,
                    name: "marouan",
                    role: "Responsable Accueil",
                    department: "Accueil",
                    photo: "https://randomuser.me/api/portraits/women/16.jpg"
                },
                {
                    id: 7,
                    name: "Youssef Berrada",
                    role: "Technicien Maintenance",
                    department: "Technique",
                    photo: "https://randomuser.me/api/portraits/men/17.jpg"
                },
                {
                    id: 8,
                    name: "Leila Mansouri",
                    role: "Responsable Sécurité",
                    department: "Sécurité",
                    photo: "https://randomuser.me/api/portraits/women/18.jpg"
                },
                {
                    id: 9,
                    name: "Rachid El Fassi",
                    role: "Administrateur Système",
                    department: "Administration",
                    photo: "https://randomuser.me/api/portraits/men/19.jpg"
                },
                {
                    id: 10,
                    name: "Amina Ziani",
                    role: "Responsable Entretien",
                    department: "Entretien",
                    photo: "https://randomuser.me/api/portraits/women/20.jpg"
                }
            ];
        }
    }

    // Load holidays
    function loadHolidays() {
        // Sample holidays for Morocco in 2025
        holidays = [
            { date: '2025-01-01', name: "Nouvel An" },
            { date: '2025-01-11', name: "Manifeste de l'Indépendance" },
            { date: '2025-03-03', name: "Fête Nationale" }, // Ajouté pour Mars 2025
            { date: '2025-03-21', name: "Journée Internationale" }, // Ajouté pour Mars 2025
            { date: '2025-05-01', name: "Fête du Travail" },
            { date: '2025-07-30', name: "Fête du Trône" },
            { date: '2025-08-14', name: "Fête de l'Allégeance Oued Eddahab" },
            { date: '2025-08-20', name: "Révolution du Roi et du Peuple" },
            { date: '2025-08-21', name: "Fête de la Jeunesse" },
            { date: '2025-11-06', name: "Marche Verte" },
            { date: '2025-11-18', name: "Fête de l'Indépendance" }
        ];
    }

    // Generate random attendance data
    function generateAttendanceData() {
        showLoading();
        
        attendanceData = {};
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = new Date();
        
        // For each employee
        employees.forEach(employee => {
            attendanceData[employee.id] = {};
            
            // For each day in the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dateString = formatDate(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isHoliday = holidays.some(h => h.date === dateString);
                const isFuture = date > today;
                
                let status;
                
                if (isWeekend) {
                    status = 'weekend';
                } else if (isHoliday) {
                    status = 'holiday';
                } else if (isFuture) {
                    status = 'future';
                } else {
                    // Random status for past days
                    const rand = Math.random();
                    if (rand < 0.8) {
                        status = 'present';
                    } else if (rand < 0.9) {
                        status = 'absent';
                    } else {
                        status = 'leave';
                    }
                }
                
                attendanceData[employee.id][day] = status;
            }
        });
        
        setTimeout(() => {
            hideLoading();
        }, 500);
    }

    // Render attendance table
    function renderAttendanceTable() {
        const year = parseInt(yearSelect.value);
        const month = parseInt(monthSelect.value);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Generate table header
        let headerRow = '<tr><th class="employee-name">Employé</th>';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateString = formatDate(date);
            const isHoliday = holidays.some(h => h.date === dateString);
            
            let headerClass = 'day-header';
            if (isWeekend) headerClass += ' weekend';
            if (isHoliday) headerClass += ' holiday';
            
            headerRow += `<th class="${headerClass}">${day}</th>`;
        }
        
        headerRow += '</tr>';
        tableHeader.innerHTML = headerRow;
        
        // Generate table body
        let bodyRows = '';
        
        employees.forEach(employee => {
            let row = `
                <tr>
                    <td class="employee-name employee-cell">
                        <img src="${employee.photo || 'https://via.placeholder.com/30'}" alt="${employee.name}" class="employee-photo">
                        <span>${employee.name}</span>
                    </td>
            `;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const status = attendanceData[employee.id][day];
                let statusText = '';
                
                switch (status) {
                    case 'present':
                        statusText = 'P';
                        break;
                    case 'absent':
                        statusText = 'A';
                        break;
                    case 'leave':
                        statusText = 'L';
                        break;
                    case 'weekend':
                        statusText = 'W';
                        break;
                    case 'holiday':
                        statusText = 'H';
                        break;
                    case 'future':
                        statusText = '-';
                        break;
                }
                
                row += `<td class="${status}"><span class="attendance-status ${status}">${statusText}</span></td>`;
            }
            
            row += '</tr>';
            bodyRows += row;
        });
        
        tableBody.innerHTML = bodyRows;
    }

    // Handle search button click
    function handleSearch() {
        showLoading();
        
        // Update filter tags
        updateFilterTags();
        
        // Generate new attendance data
        generateAttendanceData();
        
        // Render attendance table
        renderAttendanceTable();
    }

    // Update filter tags
    function updateFilterTags() {
        const year = yearSelect.value;
        const month = monthSelect.options[monthSelect.selectedIndex].text;
        
        yearTag.textContent = year;
        monthTag.textContent = month;
    }

    // Export to PDF
    function exportToPdf() {
        alert('Fonctionnalité d\'exportation PDF à implémenter');
        // In a real application, you would use a library like jsPDF
    }

    // Export to Excel
    function exportToExcel() {
        alert('Fonctionnalité d\'exportation Excel à implémenter');
        // In a real application, you would use a library like SheetJS
    }

    // Print table
    function printTable() {
        window.print();
    }

    // Show loading overlay
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    // Hide loading overlay
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // Format date to YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});