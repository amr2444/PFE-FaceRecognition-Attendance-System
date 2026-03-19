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
    const rawTheme = localStorage.getItem('theme');
    const theme = rawTheme ? JSON.parse(rawTheme) : 'light';
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

function ensureToastContainer() {
    let container = document.getElementById('app-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'app-toast-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '12px';
        container.style.zIndex = '3000';
        document.body.appendChild(container);
    }

    return container;
}

const Auth = {
    modeLabel: 'Connexion securisee',
    description: 'Acces protege au centre de supervision des presences et de la reconnaissance faciale.',
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

function getThemePreference() {
    const rawTheme = localStorage.getItem('theme');
    return rawTheme ? JSON.parse(rawTheme) : 'light';
}

function applyThemePreference(theme = getThemePreference()) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('compact-tables', JSON.parse(localStorage.getItem('compactTables') || 'false'));
}

function getBooleanPreference(key, defaultValue = false) {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : defaultValue;
}

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
        securityHint.textContent = 'Acces protege';
    }
}

function initSidebarNavigation() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        return;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const attendancePages = ['attendance.html', 'empAtt.html', 'prsheet.html'];

    document.querySelectorAll('.menu li').forEach((li) => {
        const directLink = li.querySelector(':scope > a');
        if (!directLink) {
            return;
        }

            const href = directLink.getAttribute('href');
            const isAttendanceParent = directLink.classList.contains('dropdown-btn');

        if (isAttendanceParent) {
            const submenu = li.querySelector('.submenu');
            const hasActiveChild = attendancePages.includes(currentPage);
            li.classList.toggle('active-parent', hasActiveChild);
            if (submenu && hasActiveChild && !sidebar.classList.contains('collapsed')) {
                submenu.style.display = 'block';
            }
            return;
        }

        li.classList.toggle('active', href === currentPage);
    });

    document.querySelectorAll('.dropdown-btn').forEach((btn) => {
        const submenu = btn.nextElementSibling;
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            if (!submenu) {
                window.location.href = btn.getAttribute('href') || 'attendance.html';
                return;
            }

            if (sidebar.classList.contains('collapsed') || window.innerWidth <= 768 || currentPage !== 'attendance.html') {
                window.location.href = btn.getAttribute('href') || 'attendance.html';
                return;
            }

            submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        });
    });
}

function hydrateUserProfile() {
    const user = Auth.getUser();
    if (!user) {
        return;
    }

    document.querySelectorAll('[data-auth-name]').forEach((node) => {
        node.textContent = user.name || user.email || 'Utilisateur';
    });

    document.querySelectorAll('[data-auth-role]').forEach((node) => {
        node.textContent = user.role || 'ADMIN';
    });
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

document.addEventListener('DOMContentLoaded', hydrateUserProfile);
document.addEventListener('DOMContentLoaded', () => applyThemePreference());
document.addEventListener('themeChanged', () => applyThemePreference());

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
    },
    notify: (message, type = 'info') => {
        if (!message) return;

        const container = ensureToastContainer();
        const toast = document.createElement('div');
        const palette = {
            success: { bg: '#e7f8ef', border: '#20a464', text: '#145236' },
            error: { bg: '#fdecec', border: '#d64545', text: '#7a1f1f' },
            info: { bg: '#edf5ff', border: '#3578e5', text: '#173f82' },
            warning: { bg: '#fff6e5', border: '#db8b00', text: '#7a5200' }
        };
        const tone = palette[type] || palette.info;

        toast.textContent = message;
        toast.style.minWidth = '260px';
        toast.style.maxWidth = '360px';
        toast.style.padding = '14px 16px';
        toast.style.borderRadius = '14px';
        toast.style.border = `1px solid ${tone.border}`;
        toast.style.background = tone.bg;
        toast.style.color = tone.text;
        toast.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.14)';
        toast.style.fontSize = '0.95rem';
        toast.style.lineHeight = '1.4';
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-8px)';
        toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px)';
            setTimeout(() => toast.remove(), 220);
        }, 4000);

        if (type === 'success' && getBooleanPreference('recognitionSound', true)) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = 784;
                gain.gain.value = 0.015;
                oscillator.connect(gain);
                gain.connect(audioContext.destination);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.08);
            } catch (error) {
                // Ignore audio failures silently.
            }
        }
    }
};

const AppApi = {
    origin: API_ORIGIN,
    buildUrl: (path) => path.startsWith('http') ? path : `${API_ORIGIN}${path}`,
    async parseError(response, fallbackMessage = 'Une erreur est survenue.') {
        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }

        if (payload?.validationErrors) {
            const firstValidationError = Object.values(payload.validationErrors)[0];
            if (firstValidationError) {
                return new Error(firstValidationError);
            }
        }

        return new Error(payload?.message || fallbackMessage);
    },
    async json(path, init = {}, fallbackMessage = 'Une erreur est survenue.') {
        const response = await fetch(AppApi.buildUrl(path), init);
        if (!response.ok) {
            throw await AppApi.parseError(response, fallbackMessage);
        }
        if (response.status === 204) {
            return null;
        }
        return response.json();
    },
    async blob(path, init = {}, fallbackMessage = 'Une erreur est survenue.') {
        const response = await fetch(AppApi.buildUrl(path), init);
        if (!response.ok) {
            throw await AppApi.parseError(response, fallbackMessage);
        }
        return { blob: await response.blob(), response };
    },
    get(path, fallbackMessage) {
        return AppApi.json(path, { method: 'GET' }, fallbackMessage);
    },
    post(path, body, fallbackMessage) {
        return AppApi.json(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }, fallbackMessage);
    },
    put(path, body, fallbackMessage) {
        return AppApi.json(path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }, fallbackMessage);
    },
    delete(path, fallbackMessage) {
        return AppApi.json(path, { method: 'DELETE' }, fallbackMessage);
    }
};

window.AppApi = AppApi;
window.AppUI = UI;

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
    charts: {
        entries: null,
        gender: null,
        attendance: null
    },
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
        initSidebarNavigation();
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

    },

    loadContent: () => {
        hydrateUserProfile();
        Dashboard.setLoadingState(true);
        Dashboard.initCharts();
        Dashboard.loadRecentActivity();
        fetchEmployeeStats();
    

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

    setLoadingState: (isLoading) => {
        ['employeesTableBody', 'entriesChart', 'genderDistributionChart', 'attendanceReportChart', 'recentActivity']
            .forEach((id) => document.getElementById(id)?.closest('.card, .chart-container, .activity-feed, .cards')?.classList.toggle('is-loading', isLoading));
    },

    initCharts: () => {
        const entriesCtx = document.getElementById('entriesChart')?.getContext('2d');
        if (entriesCtx && !Dashboard.charts.entries) {
            Dashboard.charts.entries = new Chart(entriesCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Nombre d\'entrées',
                        data: [],
                        backgroundColor: 'rgba(15, 106, 67, 0.68)',
                        borderRadius: 12,
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
        
        // Initialisation des nouveaux graphiques
        initAdditionalCharts();
    },

    loadRecentActivity: () => {
        const activityList = document.getElementById('recentActivity');
        fetchRecentEntries(activityList);

        // Rafraîchissement automatique
        setInterval(() => {
            if (shouldRenderDashboardStats()) {
                fetchEmployeeStats();
            }
        }, getBooleanPreference('autoRefreshDashboard', true) ? 30000 : 600000);
    }
};

// Initialisation des nouveaux graphiques
function initAdditionalCharts() {
    const genderCtx = document.getElementById('genderDistributionChart')?.getContext('2d');
    if (genderCtx && !Dashboard.charts.gender) {
        Dashboard.charts.gender = new Chart(genderCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#d6a44d', '#0f6a43', '#d96c6c', '#4b7fd6', '#8f63d9'],
                    borderWidth: 0
                }]
            },
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

    const attendanceCtx = document.getElementById('attendanceReportChart')?.getContext('2d');
    if (attendanceCtx && !Dashboard.charts.attendance) {
        Dashboard.charts.attendance = new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Volume',
                    data: [],
                    backgroundColor: ['#0f6a43', '#d6a44d', '#c84f4f', '#4b7fd6'],
                    borderRadius: 12,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nombre d employes'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Statuts du jour'
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
    }
}

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
    } else {
        initSidebarNavigation();
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
        const activeEmployeesTrend = document.getElementById('activeEmployeesTrend');
        const todayAttendanceTrend = document.getElementById('todayAttendanceTrend');
        const absentCountTrend = document.getElementById('absentCountTrend');

        const [statusStats, totalEmployees, attendanceStats, allEmployees, recentEntries] = await Promise.all([
            AppApi.get('/employes/count-by-statut/all', 'Impossible de charger les statuts employes.'),
            AppApi.get('/employes/count', 'Impossible de charger le nombre total d employes.'),
            AppApi.get('/presences/statuts/today', 'Impossible de charger les statuts de presence du jour.'),
            AppApi.get('/employes/find/all', 'Impossible de charger les employes.'),
            AppApi.get('/face-recognition/recent-entries?limit=10', 'Impossible de charger les entrees recentes.')
        ]);

        const totalActif = statusStats.find(item => item.statut === 'ACTIF')?.count || 0;
        const totalEnConge = statusStats.find(item => item.statut === 'EN_CONGE')?.count || 0;
        const totalInactif = statusStats.find(item => item.statut === 'INACTIF')?.count || 0;
        const todayPresent = attendanceStats
            .filter(item => ['PRESENT', 'EN_PAUSE', 'TERMINE'].includes(item.statut))
            .reduce((acc, item) => acc + item.count, 0);
        const todayAbsent = attendanceStats.find(item => item.statut === 'ABSENT')?.count || 0;
        const genderCounts = allEmployees.reduce((acc, employee) => {
            const key = employee.genre || 'Non precise';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const hourlyEntries = buildHourlyEntries(recentEntries);

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

        if (activeEmployeesTrend) {
            activeEmployeesTrend.textContent = `${Math.round((totalActif / Math.max(totalEmployees, 1)) * 100)}% du total`;
            activeEmployeesTrend.className = 'card-trend up';
        }
        if (todayAttendanceTrend) {
            todayAttendanceTrend.textContent = `${Math.round((todayPresent / Math.max(totalEmployees, 1)) * 100)}% presents`; 
            todayAttendanceTrend.className = 'card-trend neutral';
        }
        if (absentCountTrend) {
            absentCountTrend.textContent = `${Math.round((todayAbsent / Math.max(totalEmployees, 1)) * 100)}% absents`;
            absentCountTrend.className = todayAbsent > 0 ? 'card-trend down' : 'card-trend up';
        }

        updateEntriesChart(hourlyEntries);
        updateGenderChart(genderCounts, totalEmployees);
        updateAttendanceReport(attendanceStats, totalEmployees);
        Dashboard.setLoadingState(false);

        return { statusStats, totalEmployees, attendanceStats, allEmployees, recentEntries };
        
    } catch (error) {
        console.error('Error fetching employee stats:', error);
        Dashboard.setLoadingState(false);
        return null;
    }
}

function buildHourlyEntries(entries) {
    const buckets = new Map();
    entries.forEach((entry) => {
        const hour = (entry.heure || '').split(':')[0];
        if (!hour) {
            return;
        }
        const label = `${hour}h`;
        buckets.set(label, (buckets.get(label) || 0) + 1);
    });
    return Array.from(buckets.entries());
}

function updateEntriesChart(hourlyEntries) {
    if (!Dashboard.charts.entries) {
        return;
    }
    Dashboard.charts.entries.data.labels = hourlyEntries.map(([label]) => label);
    Dashboard.charts.entries.data.datasets[0].data = hourlyEntries.map(([, count]) => count);
    Dashboard.charts.entries.update();
    document.getElementById('entriesChart')?.closest('.chart-container')?.classList.add('canvas-ready');
}

function updateGenderChart(genderCounts, totalEmployees) {
    if (!Dashboard.charts.gender) {
        return;
    }

    const labels = Object.keys(genderCounts);
    const values = Object.values(genderCounts);
    Dashboard.charts.gender.data.labels = labels;
    Dashboard.charts.gender.data.datasets[0].data = values;
    Dashboard.charts.gender.update();
    document.getElementById('genderDistributionChart')?.closest('.chart-container')?.classList.add('canvas-ready');

    const genderStatsGrid = document.getElementById('genderStatsGrid');
    if (genderStatsGrid) {
        genderStatsGrid.innerHTML = labels.map((label, index) => `
            <div class="gender-stat-item">
                <div class="stat-label">
                    <span class="color-dot" style="background-color: ${Dashboard.charts.gender.data.datasets[0].backgroundColor[index % Dashboard.charts.gender.data.datasets[0].backgroundColor.length]};"></span>
                    <span>${label}</span>
                </div>
                <div class="stat-value">${values[index]} (${Math.round((values[index] / Math.max(totalEmployees, 1)) * 100)}%)</div>
            </div>
        `).join('');
    }

    const femaleTotal = labels.filter((label) => /femme/i.test(label)).reduce((acc, label) => acc + (genderCounts[label] || 0), 0);
    const maleTotal = labels.filter((label) => /homme/i.test(label)).reduce((acc, label) => acc + (genderCounts[label] || 0), 0);
    const unknownTotal = totalEmployees - femaleTotal - maleTotal;

    document.getElementById('femaleSummary').textContent = `${femaleTotal} (${Math.round((femaleTotal / Math.max(totalEmployees, 1)) * 100)}%)`;
    document.getElementById('maleSummary').textContent = `${maleTotal + unknownTotal} (${Math.round(((maleTotal + unknownTotal) / Math.max(totalEmployees, 1)) * 100)}%)`;
}

function updateAttendanceReport(attendanceStats, totalEmployees) {
    if (!Dashboard.charts.attendance) {
        return;
    }

    const labels = attendanceStats.map((item) => item.statut);
    const values = attendanceStats.map((item) => item.count);
    Dashboard.charts.attendance.data.labels = labels;
    Dashboard.charts.attendance.data.datasets[0].data = values;
    Dashboard.charts.attendance.update();
    document.getElementById('attendanceReportChart')?.closest('.chart-container')?.classList.add('canvas-ready');

    const commentsContainer = document.getElementById('attendanceComments');
    if (commentsContainer) {
        commentsContainer.innerHTML = attendanceStats.map((item) => `
            <li class="flex items-center gap-2">
                <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: #0f6a43;"></span>
                <span><strong>${item.statut}:</strong> ${item.count} employes (${Math.round((item.count / Math.max(totalEmployees, 1)) * 100)}%)</span>
            </li>
        `).join('');
    }
}

async function fetchRecentEntries(activityList) {
    const entriesTableBody = document.querySelector('#recentEntriesTable tbody');

    try {
        const entries = await AppApi.get('/face-recognition/recent-entries?limit=5', 'Impossible de charger les entrees recentes.');

        if (entriesTableBody) {
            entriesTableBody.innerHTML = entries.map((entry) => `
                <tr>
                    <td>
                        <div class="employee-cell">
                            <img src="${entry.employeePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.employeeName || 'Employe')}`}" alt="${entry.employeeName || 'Employe'}" class="employee-photo">
                            <span>${entry.employeeName || 'Employe'}</span>
                        </div>
                    </td>
                    <td>${(entry.heure || '').slice(0, 5) || '--:--'}</td>
                    <td>${entry.portail || 'Porte Principale'}</td>
                </tr>
            `).join('') || '<tr><td colspan="3">Aucune entree recente.</td></tr>';
        }

        if (activityList) {
            activityList.innerHTML = entries.map((entry) => `
                <li>
                    <i class="fas fa-door-open activity-icon"></i>
                    <span>${entry.employeeName || 'Employe'} a ete reconnu a ${(entry.heure || '').slice(0, 5) || '--:--'} via ${entry.portail || 'Porte Principale'}</span>
                    <span class="activity-time">${entry.date || ''}</span>
                </li>
            `).join('') || '<li><span>Aucune activite recente disponible.</span></li>';
        }
    } catch (error) {
        if (entriesTableBody) {
            entriesTableBody.innerHTML = '<tr><td colspan="3">Impossible de charger les entrees recentes.</td></tr>';
        }
        if (activityList) {
            activityList.innerHTML = '<li><span>Impossible de charger l activite recente.</span></li>';
        }
    }
}
