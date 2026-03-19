document.addEventListener('DOMContentLoaded', () => {
    // Éléments du DOM
    const themeOptions = document.querySelectorAll('.theme-option');
    const emailNotifications = document.getElementById('emailNotifications');
    const pushNotifications = document.getElementById('pushNotifications');
    const twoFactorAuth = document.getElementById('twoFactorAuth');
    
    // Éléments pour le changement de mot de passe
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const passwordRequirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const passwordChangeNotification = document.getElementById('passwordChangeNotification');
    
    // Initialisation du thème
    initTheme();
    
    // Vérifier si le mot de passe a été modifié depuis la page de login
    checkPasswordChanged();
    
    // Gestion des événements
    setupEventListeners();
    
    // Fonction d'initialisation du thème
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        
        // Mettre en surbrillance l'option sélectionnée (seulement sur la page des paramètres)
        const activeThemeOption = document.querySelector(`.theme-option[data-theme="${savedTheme}"]`);
        if (activeThemeOption) {
            activeThemeOption.classList.add('active');
        }
        
        // Initialiser les switches (seulement sur la page des paramètres)
        if (emailNotifications || pushNotifications || twoFactorAuth) {
            initSwitches();
        }
    }
    
    // Fonction pour définir les écouteurs d'événements
    function setupEventListeners() {
        // Gestion du changement de thème (seulement sur la page des paramètres)
        if (themeOptions.length > 0) {
            themeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const theme = option.dataset.theme;
                    setTheme(theme);
                    savePreference('theme', theme);
                    
                    // Mettre à jour la sélection visuelle
                    themeOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                    
                    // Synchroniser avec le switch de thème global si existant
                    syncGlobalThemeSwitch(theme);
                });
            });
        }
        
        // Gestion des switches de paramètres (seulement sur la page des paramètres)
        [emailNotifications, pushNotifications, twoFactorAuth].forEach(switchElement => {
            if (switchElement) {
                switchElement.addEventListener('change', () => {
                    savePreference(switchElement.id, switchElement.checked);
                });
            }
        });
        
        // Gestion du changement de mot de passe
        if (newPassword) {
            newPassword.addEventListener('input', checkPasswordStrength);
        }
        
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', handlePasswordChange);
        }
        
        // Gestion des boutons pour afficher/masquer les mots de passe
        if (togglePasswordButtons) {
            togglePasswordButtons.forEach(button => {
                button.addEventListener('click', togglePasswordVisibility);
            });
        }
    }
    
    // Fonction pour initialiser les switches
    function initSwitches() {
        if (emailNotifications) emailNotifications.checked = getPreference('emailNotifications', true);
        if (pushNotifications) pushNotifications.checked = getPreference('pushNotifications', true);
        if (twoFactorAuth) twoFactorAuth.checked = getPreference('twoFactorAuth', false);
    }
    
    // Fonction pour définir le thème
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Mettre à jour le background du body selon le thème
        document.body.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f5f6fa';
        
        // Mettre à jour la classe du sidebar si nécessaire
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            if (theme === 'dark') {
                sidebar.classList.add('dark-theme');
            } else {
                sidebar.classList.remove('dark-theme');
            }
        }
        
        // Mettre à jour d'autres éléments selon le thème
        updateElementsForTheme(theme);
    }
    
    // Fonction pour mettre à jour d'autres éléments selon le thème
    function updateElementsForTheme(theme) {
        // Mettre à jour les cartes
        const cards = document.querySelectorAll('.card');
        if (cards.length > 0) {
            cards.forEach(card => {
                if (theme === 'dark') {
                    card.classList.add('dark-theme');
                } else {
                    card.classList.remove('dark-theme');
                }
            });
        }
        
        // Mettre à jour l'en-tête
        const header = document.querySelector('.header');
        if (header) {
            if (theme === 'dark') {
                header.classList.add('dark-theme');
            } else {
                header.classList.remove('dark-theme');
            }
        }
        
        // Mettre à jour le contenu principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            if (theme === 'dark') {
                mainContent.classList.add('dark-theme');
            } else {
                mainContent.classList.remove('dark-theme');
            }
        }
    }
    
    // Fonction pour synchroniser avec le switch global
    function syncGlobalThemeSwitch(theme) {
        const globalThemeSwitcher = document.getElementById('theme-switcher');
        if (globalThemeSwitcher) {
            globalThemeSwitcher.checked = theme === 'dark';
        }
    }
    
    // Fonction pour sauvegarder une préférence
    function savePreference(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        
        // Si c'est le thème qui change, déclencher un event personnalisé
        if (key === 'theme') {
            document.dispatchEvent(new CustomEvent('themeChanged', { detail: value }));
        }
    }
    
    // Fonction pour récupérer une préférence
    function getPreference(key, defaultValue) {
        const value = localStorage.getItem(key);
        return value !== null ? JSON.parse(value) : defaultValue;
    }
    
    // Écouter les changements de thème depuis d'autres pages
    document.addEventListener('themeChanged', (e) => {
        setTheme(e.detail);
        
        // Mettre à jour la sélection visuelle (seulement sur la page des paramètres)
        if (themeOptions.length > 0) {
            themeOptions.forEach(opt => opt.classList.remove('active'));
            const activeOption = document.querySelector(`.theme-option[data-theme="${e.detail}"]`);
            if (activeOption) {
                activeOption.classList.add('active');
            }
        }
    });
    
    // Ajouter des styles CSS pour le thème sombre
    function addDarkThemeStyles() {
        // Vérifier si les styles existent déjà
        if (!document.getElementById('dark-theme-styles')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'dark-theme-styles';
            styleElement.textContent = `
                html[data-theme="dark"] {
                    --bg-color: #1a1a1a;
                    --text-color: #f5f6fa;
                    --card-bg: #2a2a2a;
                    --border-color: #444;
                    --sidebar-bg: #222;
                    --menu-hover: #333;
                    --shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    --shadow-strong: 0 10px 25px rgba(0, 0, 0, 0.4);
                }
                
                html[data-theme="dark"] .card {
                    background-color: var(--card-bg);
                    color: var(--text-color);
                }
                
                html[data-theme="dark"] .header {
                    background-color: var(--card-bg);
                    color: var(--text-color);
                }
                
                html[data-theme="dark"] .sidebar {
                    background-color: var(--sidebar-bg);
                }
                
                html[data-theme="dark"] .main-content {
                    background-color: var(--bg-color);
                    color: var(--text-color);
                }
                
                html[data-theme="dark"] input,
                html[data-theme="dark"] select,
                html[data-theme="dark"] textarea {
                    background-color: #333;
                    color: #f5f6fa;
                    border-color: #444;
                }
                
                html[data-theme="dark"] table th,
                html[data-theme="dark"] table td {
                    border-color: #444;
                }
                
                html[data-theme="dark"] .activity-feed,
                html[data-theme="dark"] .chart-container {
                    background-color: var(--card-bg);
                    color: var(--text-color);
                }
            `;
            document.head.appendChild(styleElement);
        }
    }
    
    // Ajouter les styles CSS pour le thème sombre
    addDarkThemeStyles();
    
    // Fonction pour vérifier si le mot de passe a été modifié depuis la page de login
    function checkPasswordChanged() {
        const passwordChanged = localStorage.getItem('passwordChanged');
        
        if (passwordChanged === 'true' && passwordChangeNotification) {
            showNotification('Votre mot de passe a été modifié récemment. Vous pouvez le mettre à jour ici.', 'info');
            localStorage.removeItem('passwordChanged'); // Réinitialiser l'indicateur
        }
    }
    
    // Fonction pour vérifier la force du mot de passe
    function checkPasswordStrength() {
        if (!newPassword || !strengthBar || !strengthText) return;
        
        const password = newPassword.value;
        let strength = 0;
        let status = '';
        
        // Vérifier les critères
        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);
        
        // Mettre à jour les indicateurs visuels
        updateRequirement(passwordRequirements.length, hasLength);
        updateRequirement(passwordRequirements.uppercase, hasUppercase);
        updateRequirement(passwordRequirements.lowercase, hasLowercase);
        updateRequirement(passwordRequirements.number, hasNumber);
        updateRequirement(passwordRequirements.special, hasSpecial);
        
        // Calculer la force
        if (hasLength) strength += 1;
        if (hasUppercase) strength += 1;
        if (hasLowercase) strength += 1;
        if (hasNumber) strength += 1;
        if (hasSpecial) strength += 1;
        
        // Mettre à jour la barre de force
        strengthBar.className = 'strength-bar';
        
        if (password.length === 0) {
            strengthBar.style.width = '0';
            strengthText.textContent = 'Force du mot de passe';
        } else if (strength <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Faible';
            strengthText.style.color = 'var(--danger-color)';
        } else if (strength <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Moyen';
            strengthText.style.color = 'var(--secondary-color)';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Fort';
            strengthText.style.color = 'var(--success-color)';
        }
    }
    
    // Fonction pour mettre à jour les indicateurs de critères
    function updateRequirement(element, isValid) {
        if (!element) return;
        
        const icon = element.querySelector('i');
        if (icon) {
            if (isValid) {
                icon.className = 'fas fa-check';
                element.style.opacity = '1';
            } else {
                icon.className = 'fas fa-times';
                element.style.opacity = '0.7';
            }
        }
    }
    
    // Fonction pour gérer le changement de mot de passe
    async function handlePasswordChange() {
        if (!currentPassword || !newPassword || !confirmPassword) return;
        
        const current = currentPassword.value;
        const newPass = newPassword.value;
        const confirm = confirmPassword.value;
        
        // Vérifier si les champs sont remplis
        if (!current || !newPass || !confirm) {
            showNotification('Veuillez remplir tous les champs.', 'error');
            return;
        }
        
        // Vérifier si les nouveaux mots de passe correspondent
        if (newPass !== confirm) {
            showNotification('Les nouveaux mots de passe ne correspondent pas.', 'error');
            return;
        }
        
        // Vérifier la force du mot de passe
        const hasLength = newPass.length >= 8;
        const hasUppercase = /[A-Z]/.test(newPass);
        const hasLowercase = /[a-z]/.test(newPass);
        const hasNumber = /[0-9]/.test(newPass);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPass);
        
        if (!hasLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
            showNotification('Le mot de passe ne répond pas aux exigences de sécurité.', 'error');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: current,
                    newPassword: newPass
                })
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => ({}));
                throw new Error(payload.message || 'Impossible de mettre a jour le mot de passe.');
            }

            showNotification('Votre mot de passe a ete mis a jour avec succes.', 'success');
        } catch (error) {
            showNotification(error.message || 'Impossible de mettre a jour le mot de passe.', 'error');
            return;
        }
        
        // Réinitialiser les champs
        currentPassword.value = '';
        newPassword.value = '';
        confirmPassword.value = '';
        
        // Réinitialiser les indicateurs
        strengthBar.style.width = '0';
        strengthBar.className = 'strength-bar';
        strengthText.textContent = 'Force du mot de passe';
        
        Object.values(passwordRequirements).forEach(element => {
            if (element) {
                const icon = element.querySelector('i');
                if (icon) {
                    icon.className = 'fas fa-times';
                }
                element.style.opacity = '0.7';
            }
        });
    }
    
    // Fonction pour afficher/masquer le mot de passe
    function togglePasswordVisibility(e) {
        const button = e.currentTarget;
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
    
    // Fonction pour afficher une notification
    function showNotification(message, type) {
        if (!passwordChangeNotification) return;
        
        passwordChangeNotification.textContent = message;
        passwordChangeNotification.className = 'notification ' + type;
        passwordChangeNotification.style.display = 'block';
        
        // Masquer après 5 secondes
        setTimeout(() => {
            passwordChangeNotification.style.display = 'none';
        }, 5000);
    }
});
