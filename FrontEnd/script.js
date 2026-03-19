   // ===== ÉLÉMENTS DOM =====
    const attendanceTableBody = document.querySelector("#attendanceTable tbody");
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const shiftFilter = document.getElementById("shiftFilter");
    const checkGateBtn = document.getElementById("checkGateBtn");
    const exportBtn = document.getElementById("exportBtn");
    const addAttendanceBtn = document.getElementById("addAttendanceBtn");
    const selectAllCheckbox = document.getElementById("selectAll");
    const bulkActions = document.getElementById("bulkActions");
    const selectedCount = document.querySelector(".selected-count");
    const markPresentBtn = document.getElementById("markPresentBtn");
    const markAbsentBtn = document.getElementById("markAbsentBtn");
    const currentDateElement = document.getElementById("currentDate");

    const employeesTableBody = document.getElementById('employeesTableBody');
     const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');

// === Global Theme Initialization ===
function applySavedTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
    }
}
document.addEventListener('DOMContentLoaded', applySavedTheme);

// ===== CONSTANTS AND UTILITIES =====
const API_ORIGIN = 'http://localhost:8080';
const TOKEN_STORAGE_KEY = 'authToken';
const USER_STORAGE_KEY = 'authUser';

const Auth = {
    modeLabel: 'JWT backend',
    description: 'Authentification verifiee par le backend Spring Boot avec token Bearer.',
    getStorage: () => localStorage.getItem('rememberMe') === 'true' ? localStorage : sessionStorage,
    getToken: () => localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY),
    getUser: () => {
        const raw = localStorage.getItem(USER_STORAGE_KEY) || sessionStorage.getItem(USER_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    },
    checkLogin: () => Boolean(Auth.getToken()),
    login: async (email, password, remember) => {
        const response = await fetch(`${API_ORIGIN}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(payload.message || 'Authentication failed');
        }

        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        storage.setItem(TOKEN_STORAGE_KEY, payload.accessToken);
        storage.setItem(USER_STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem('rememberMe', remember ? 'true' : 'false');
        localStorage.setItem('username', email);
        otherStorage.removeItem(TOKEN_STORAGE_KEY);
        otherStorage.removeItem(USER_STORAGE_KEY);
        return payload;
    },
    logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        sessionStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    }
};

const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
    const requestUrl = typeof input === 'string' ? input : input.url;
    const shouldAttachToken = requestUrl.startsWith(API_ORIGIN);
    const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined) || {});

    if (shouldAttachToken && !requestUrl.endsWith('/auth/login')) {
        const token = Auth.getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const response = await originalFetch(input, { ...init, headers });
    if (response.status === 401 && !requestUrl.endsWith('/auth/login')) {
        Auth.logout();
    }
    return response;
};

function renderAuthDemoNotice() {
    const badge = document.getElementById('authModeBadge');
    const description = document.getElementById('authModeDescription');
    const securityHint = document.getElementById('authSecurityHint');

    if (badge) {
        badge.textContent = Auth.modeLabel;
    }
    if (description) {
        description.textContent = Auth.description;
    }
    if (securityHint) {
        securityHint.textContent = 'Token Bearer actif';
    }
}

function initLoginClock() {
    const timeElement = document.getElementById('clock-time');
    const dateElement = document.getElementById('clock-date');

    if (!timeElement || !dateElement) {
        return;
    }

    const updateClock = () => {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('fr-FR', { hour12: false });
        dateElement.textContent = now.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    updateClock();
    setInterval(updateClock, 1000);
}

// Add toggle button support
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;
  
    const updateIcon = (theme) => {
      toggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    };
  
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', JSON.stringify(newTheme));
      document.documentElement.setAttribute('data-theme', newTheme);
      document.body.style.backgroundColor = newTheme === 'dark' ? '#1a1a1a' : '#f5f6fa';
  
      document.getElementById('sidebar')?.classList.toggle('dark-theme', newTheme === 'dark');
      document.querySelector('.header')?.classList.toggle('dark-theme', newTheme === 'dark');
      document.getElementById('mainContent')?.classList.toggle('dark-theme', newTheme === 'dark');
  
      updateIcon(newTheme);
  
      document.dispatchEvent(new Event('themeChanged'));
    });
  
    // Set initial icon based on current theme
    const initialTheme = JSON.parse(localStorage.getItem('theme')) || 'light';
    updateIcon(initialTheme);
});

const UI = {
    showNotification: (element, message, type) => {
        if (!element) return;
        element.textContent = message;
        element.className = 'notification ' + type;
        element.style.display = 'block';
        setTimeout(() => element.style.display = 'none', 5000);
    },
    createRipple: (event) => {
        const button = event.currentTarget;
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        
        const circle = document.createElement('span');
        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
        circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
        circle.classList.add('ripple');
        
        const ripple = button.querySelector('.ripple');
        if (ripple) ripple.remove();
        
        button.appendChild(circle);
        setTimeout(() => circle.remove(), 600);
    },
    togglePasswordVisibility: (toggleBtn, passwordInput) => {
        if (!toggleBtn || !passwordInput) return;
        
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
};

// ===== LOGIN PAGE =====
const initLoginPage = () => {
    const loginForm = document.getElementById('login-form');
    const password = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const username = document.getElementById('username');
    const rememberCheckbox = document.getElementById('remember');
    const notification = document.getElementById('notification');
    const modal = document.getElementById('password-reset-modal');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const closeModal = document.querySelector('.close-modal');
    const resetPasswordBtn = document.getElementById('reset-password-btn');
    const resetEmail = document.getElementById('reset-email');

    // Vérifier si déjà connecté
    if (Auth.checkLogin()) {
        window.location.href = 'index.html';
        return;
    }

    renderAuthDemoNotice();
    initLoginClock();

    // Remplir les champs si "Se souvenir de moi"
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    if (rememberMe && username) {
        username.value = localStorage.getItem('username') || '';
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }

    // Gestion de la visibilité du mot de passe
    UI.togglePasswordVisibility(togglePassword, password);

    if (forgotPasswordLink && modal) {
        forgotPasswordLink.addEventListener('click', event => {
            event.preventDefault();
            modal.style.display = 'flex';
        });
    }

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    if (modal) {
        window.addEventListener('click', event => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    if (resetPasswordBtn) {
        resetPasswordBtn.addEventListener('click', async () => {
            if (!resetEmail?.value) {
                UI.showNotification(notification, 'Saisissez une adresse e-mail avant de continuer.', 'error');
                return;
            }

            modal.style.display = 'none';
            UI.showNotification(
                notification,
                'La reinitialisation self-service n est pas encore disponible. Contactez un administrateur.',
                'error'
            );
        });
    }

    // Soumission du formulaire
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const usernameValue = username.value;
            const passwordValue = password.value;
            const remember = rememberCheckbox?.checked || false;

            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) {
                loginBtn.classList.add('loading');
                const btnText = loginBtn.querySelector('.btn-text');
                if (btnText) btnText.textContent = 'Connexion...';
            }

            try {
                await Auth.login(usernameValue, passwordValue, remember);
                UI.showNotification(notification, 'Connexion reussie. Redirection...', 'success');
                setTimeout(() => window.location.href = 'index.html', 700);
            } catch (error) {
                if (loginBtn) {
                    loginBtn.classList.remove('loading');
                    const btnText = loginBtn.querySelector('.btn-text');
                    if (btnText) btnText.textContent = 'Se connecter';
                }
                UI.showNotification(notification, error.message || 'Identifiants invalides.', 'error');
            }
        });
    }

    // Animation et effets
    setTimeout(() => {
        document.querySelector('.login-container')?.classList.add('animate-in');
        document.querySelector('.login-image')?.classList.add('animate-in');
    }, 100);

    document.querySelectorAll('.login-btn').forEach(btn => {
        btn.addEventListener('click', UI.createRipple);
    });
};

// ===== DASHBOARD PAGE =====
const Dashboard = {
    init: () => {
        console.log('[DEBUG] Dashboard.init() called');
        if (!Auth.checkLogin()) {
            console.log('[DEBUG] User not logged in, redirecting');
            window.location.href = 'login.html';
            return;
        }

        console.log('[DEBUG] Dashboard elements:', {
            sidebar: document.getElementById('sidebar'),
            toggleBtn: document.getElementById('sidebarToggle'),
            mainContent: document.querySelector('.main-content')
        });
        if (!Auth.checkLogin()) {
            window.location.href = 'login.html';
            return;
        }

        const dashboard = document.getElementById('dashboardContainer');
        const login = document.getElementById('loginContainer');

        if (dashboard) dashboard.style.display = 'flex';
        if (login) login.style.display = 'none';

        Dashboard.initSidebar();
        Dashboard.loadContent();
    },

    initSidebar: () => {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const mainContent = document.querySelector('.main-content');

        // Toggle sidebar desktop - Conserver uniquement la logique du bouton
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('collapsed');
                
                // Force le redimensionnement du contenu principal
                if (sidebar.classList.contains('collapsed')) {
                    mainContent.style.marginLeft = '60px';
                } else {
                    mainContent.style.marginLeft = '220px';
                }
            });
        }
    
        // Fermer la sidebar en cliquant à l'extérieur (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !e.target.closest('.sidebar-toggle-btn')) {
                sidebar.classList.remove('mobile-open');
            }
        });
    
        // Adaptations mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('mobile-open');
                document.querySelector('.main-content').style.marginLeft = sidebar.classList.contains('collapsed') ? '60px' : '220px';
            }
        });

        // Gestion des sous-menus
        document.querySelectorAll('.dropdown').forEach(dropdown => {
            const dropdownBtn = dropdown.querySelector('.dropdown-btn');
            const submenu = dropdown.querySelector('.submenu');
            
            if (dropdownBtn && submenu) {
                dropdownBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Si la sidebar est réduite, rediriger vers la page
                    if (sidebar.classList.contains('collapsed')) {
                        const href = this.getAttribute('href');
                        if (href) window.location.href = href;
                    } else {
                        // Sinon, toggle le sous-menu
                        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
                    }
                });
            }
        });
    },

    loadContent: () => {
        // Données utilisateurs
        const users = [
            { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
            { id: 2, name: "Jane Smith", email: "jane@example.com", role: "editor" }
        ];

        // Mettre à jour le tableau
        const tableBody = document.getElementById('user-table')?.querySelector('tbody');
        if (tableBody) {
            tableBody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${user.role}">${user.role}</span></td>
                    <td>
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn">Delete</button>
                    </td>
                </tr>
            `).join('');
            document.getElementById('totalUsers').textContent = users.length;
        }

        // Initialiser les graphiques
        Dashboard.initCharts();
        Dashboard.loadRecentActivity();
    

        // Gestion du logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            document.getElementById('logoutBtn').classList.add('clicked');
            setTimeout(Auth.logout, 300);
        });

        // Gestion des clics sur les cartes
        document.querySelectorAll('.analytics-card').forEach(card => {
            card.addEventListener('click', function() {
                if (this.querySelector('.fa-user-clock')) {
                    window.location.href = 'attendance.html';
                }
            });
        });
    },

    initCharts: () => {
        // Graphique des entrées par heure
        const hours = Array.from({length: 24}, (_, i) => i + 'h');
        const entriesData = [5,10,15,20,35,50,70,85,90,80,65,55,45,40,35,30,25,20,15,10,8,5,3,2];

        const entriesCtx = document.getElementById('entriesChart')?.getContext('2d');
        if (entriesCtx) {
            new Chart(entriesCtx, {
                type: 'bar',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Nombre d\'entrées',
                        data: entriesData,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: ctx => `${ctx.parsed.y} entrées`
                            }
                        },
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Nombre d\'entrées' },
                            ticks: { stepSize: 10 }
                        },
                        x: {
                            title: { display: true, text: 'Heures de la journée' }
                        }
                    }
                }
            });
        }

        // Graphique des présences/absences
        const monthlyCtx = document.getElementById('myChart')?.getContext('2d');
        if (monthlyCtx) {
            new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: Array.from({length: 30}, (_, i) => i+1 + ' Juin'),
                    datasets: [
                        {
                            label: 'Présences',
                            data: Array.from({length: 30}, () => Math.floor(Math.random() * 20) + 5),
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            tension: 0.3,
                            fill: true
                        },
                        {
                            label: 'Absences',
                            data: Array.from({length: 30}, () => Math.floor(Math.random() * 5)),
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: { mode: 'index', intersect: false }
                    },
                    scales: {
                        y: { beginAtZero: true, max: 25 }
                    }
                }
            });
        }
        
        // Initialisation des nouveaux graphiques
        initAdditionalCharts();
    },

    loadRecentActivity: () => {
        const activities = [
            { icon: 'fa-user-check', text: 'Ahmed Benali a pointé à 08:12', time: '10 min' },
            { icon: 'fa-user-times', text: 'Fatima Zahra absente aujourd\'hui', time: '1h' },
            { icon: 'fa-edit', text: 'Modification du profil de Karim', time: '2h' },
            { icon: 'fa-door-open', text: 'Pause déjeuner: 35 employés', time: '3h' }
        ];

        const activityList = document.getElementById('recentActivity');
        if (activityList) {
            activityList.innerHTML = activities.map(act => `
                <li>
                    <i class="fas ${act.icon} activity-icon"></i>
                    <span>${act.text}</span>
                    <span class="activity-time">${act.time}</span>
                </li>
            `).join('');
        }

        // Rafraîchissement automatique
        setInterval(() => {
            if (shouldRenderDashboardStats()) {
                fetchEmployeeStats();
            }
        }, 30000);
    }
};

// Initialisation des nouveaux graphiques
function initAdditionalCharts() {
    // Données pour le graphique de répartition des emplois par genre
    const genderData = {
        labels: [
            'Femmes - Administration',
            'Hommes - Administration',
            'Femmes - Technique',
            'Hommes - Technique',
            'Femmes - Management',
            'Hommes - Management'
        ],
        datasets: [{
            data: [120, 80, 60, 140, 40, 60],
            backgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FF9F9F',
                '#4BC0C0',
                '#FF99CC',
                '#9AD0F5'
            ],
            hoverBackgroundColor: [
                '#FF6384',
                '#36A2EB',
                '#FF9F9F',
                '#4BC0C0',
                '#FF99CC',
                '#9AD0F5'
            ]
        }]
    };

    // Données pour le graphique de rapport de présence
    const attendanceData = {
        labels: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
        datasets: [{
            label: 'Taux de présence (%)',
            data: [92, 96, 88, 85, 78],
            backgroundColor: [
                '#27ae60',
                '#2ecc71',
                '#f39c12',
                '#e67e22',
                '#e74c3c'
            ],
            borderColor: [
                '#27ae60',
                '#2ecc71',
                '#f39c12',
                '#e67e22',
                '#e74c3c'
            ],
            borderWidth: 1
        }]
    };

    // Commentaires pour le rapport de présence
    const attendanceComments = [
        { day: 'Lundi', comment: 'Bon taux de présence', color: '#27ae60' },
        { day: 'Mardi', comment: 'Excellent taux de présence', color: '#2ecc71' },
        { day: 'Mercredi', comment: 'Présence en baisse', color: '#f39c12' },
        { day: 'Jeudi', comment: 'Attention, taux faible', color: '#e67e22' },
        { day: 'Vendredi', comment: 'Taux critique', color: '#e74c3c' }
    ];

    // Initialiser le graphique de répartition des emplois par genre
    const genderCtx = document.getElementById('genderDistributionChart')?.getContext('2d');
    if (genderCtx) {
        new Chart(genderCtx, {
            type: 'doughnut',
            data: genderData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} employés (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // Initialiser le graphique de rapport de présence
    const attendanceCtx = document.getElementById('attendanceReportChart')?.getContext('2d');
    if (attendanceCtx) {
        new Chart(attendanceCtx, {
            type: 'bar',
            data: attendanceData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Taux de présence (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Jours de la semaine'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Taux de présence: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });

        // Ajouter les commentaires
        const commentsContainer = document.getElementById('attendanceComments');
        if (commentsContainer) {
            commentsContainer.innerHTML = attendanceComments.map(item => `
                <li class="flex items-center gap-2">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${item.color};"></span>
                    <span><strong>${item.day}:</strong> ${item.comment}</span>
                </li>
            `).join('');
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const dropdownBtns = document.querySelectorAll(".dropdown-btn");
  
    dropdownBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault(); // Empêche le comportement par défaut du lien
        const submenu = btn.nextElementSibling;
        submenu.style.display = (submenu.style.display === "block") ? "none" : "block";
      });
    });
});

// ===== DRAG AND DROP =====
const DragDrop = {
    allowDrop: e => e.preventDefault(),
    drag: e => {
        e.dataTransfer.setData("text", e.target.id);
        e.target.classList.add('dragging');
    },
    drop: e => {
        e.preventDefault();
        const data = e.dataTransfer.getData("text");
        const draggedElement = document.getElementById(data);
        
        if (draggedElement && e.target.classList.contains("task-column")) {
            draggedElement.classList.remove('dragging');
            e.target.appendChild(draggedElement);
            draggedElement.classList.add('task-dropped');
            setTimeout(() => draggedElement.classList.remove('task-dropped'), 300);
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.login-page')) {
        initLoginPage();
    } else if (document.getElementById('dashboardContainer')) {
        Dashboard.init();
    }

    // Initialiser le drag and drop si nécessaire
    document.querySelectorAll('.task-column').forEach(col => {
        col.addEventListener('dragover', DragDrop.allowDrop);
        col.addEventListener('drop', DragDrop.drop);
    });
    document.querySelectorAll('.task').forEach(task => {
        task.addEventListener('dragstart', DragDrop.drag);
    });
});

document.addEventListener("DOMContentLoaded", function() {
    const sidebar = document.getElementById('sidebar');
    const currentPage = window.location.pathname.split("/").pop();
    
    // Gestion du clic sur le menu Attendance
    document.querySelector('.dropdown-btn')?.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (sidebar.classList.contains('collapsed')) {
            // Si sidebar fermée, rediriger vers attendance.html
            window.location.href = 'attendance.html';
        } else {
            // Si sidebar ouverte, toggle le submenu
            const submenu = this.nextElementSibling;
            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Gestion de la sélection active
    document.querySelectorAll('.menu li').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            const href = link.getAttribute('href');
            
            // Si on est dans une page enfant
            if (currentPage === 'attendance.html' || currentPage === 'empAtt.html') {
                if (href === 'attendance.html') {
                    li.classList.add('active-parent');
                }
                if (href === currentPage) {
                    li.classList.add('active');
                }
            }
        }
    });
});

// Gestion des menus et submenus
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname.split("/").pop();
    const sidebar = document.getElementById('sidebar');

    // Gestion de la sélection active
    document.querySelectorAll('.menu li').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            const href = link.getAttribute('href');
            const isActive = href === currentPage;
            
            // Gestion des sous-menus
            if (li.classList.contains('dropdown')) {
                const submenu = li.querySelector('.submenu');
                const hasActiveChild = [...submenu.querySelectorAll('a')]
                    .some(a => a.href === window.location.href);

                // Ouvrir le submenu si on est sur une page enfant
                if (hasActiveChild && !sidebar.classList.contains('collapsed')) {
                    submenu.style.display = 'block';
                    li.classList.add('active-parent');
                }
            }

            // Appliquer la classe active
            li.classList.toggle('active', isActive);
        }
    });

    // Gestion du clic sur les dropdowns
    document.querySelectorAll('.dropdown-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const submenu = this.nextElementSibling;
            
            if (sidebar.classList.contains('collapsed')) {
                window.location.href = this.href;
            } else {
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
});

// Ajouter ceci à la fin de script.js
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }

    if (document.getElementById('todayAttendance')) {
        fetchEmployeeStats();
    }
});

function shouldRenderDashboardStats() {
    return Boolean(
        document.getElementById('todayAttendance') &&
        document.getElementById('absentCount') &&
        document.getElementById('activeEmployees') &&
        document.querySelector('.cards#employeesTableBody')
    );
}

async function fetchEmployeeStats() {
    if (!shouldRenderDashboardStats()) {
        return null;
    }

    try {
        const cardsContainer = document.querySelector('.cards#employeesTableBody');
        const todayAttendance = document.getElementById('todayAttendance');
        const absentCount = document.getElementById('absentCount');
        const activeEmployees = document.getElementById('activeEmployees');

        const [statusResponse, totalResponse, attendanceResponse] = await Promise.all([
            fetch('http://localhost:8080/employes/count-by-statut/all'),
            fetch('http://localhost:8080/employes/count'),
            fetch('http://localhost:8080/presences/statuts/today')
        ]);

        if (!statusResponse.ok || !totalResponse.ok || !attendanceResponse.ok) {
            throw new Error('Network response was not ok');
        }

        const [stats, totalEmployees, attendanceStats] = await Promise.all([
            statusResponse.json(),
            totalResponse.json(),
            attendanceResponse.json()
        ]);

        const totalActif = stats.find(item => item.statut === 'ACTIF')?.count || 0;
        const totalEnConge = stats.find(item => item.statut === 'EN_CONGE')?.count || 0;
        const totalInactif = stats.find(item => item.statut === 'INACTIF')?.count || 0;
        const todayPresent = attendanceStats
            .filter(item => ['PRESENT', 'EN_PAUSE', 'TERMINE'].includes(item.statut))
            .reduce((acc, item) => acc + item.count, 0);
        const todayAbsent = attendanceStats.find(item => item.statut === 'ABSENT')?.count || 0;

        cardsContainer.innerHTML = `
                
               <div class="card">
                        <h3>Total des Employes</h3>
                        <p>${totalEmployees}</p>
                    </div>
                    <div class="card">
                        <h3>Employes en conge</h3>
                        <p>${totalEnConge}</p>
                    </div>
                    <div class="card">
                        <h3>Employes inactifs</h3>
                        <p>${totalInactif}</p>
                    </div>
            `;

        todayAttendance.textContent = `${todayPresent}/${totalEmployees}`;
        absentCount.textContent = `${todayAbsent}`;
        activeEmployees.textContent = `${totalActif}`;
        return { stats, totalEmployees, attendanceStats };
        
    } catch (error) {
        console.error('Error fetching employee stats:', error);
        return null;
    }
}
