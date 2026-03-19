document.addEventListener('DOMContentLoaded', () => {
    const themeOptions = document.querySelectorAll('.theme-option');
    const passwordChangeNotification = document.getElementById('passwordChangeNotification');
    const currentPassword = document.getElementById('currentPassword');
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const switches = [
        { id: 'emailNotifications', defaultValue: true, successMessage: 'Notifications par email mises a jour.' },
        { id: 'pushNotifications', defaultValue: true, successMessage: 'Notifications push mises a jour.' },
        { id: 'recognitionSound', defaultValue: true, successMessage: 'Retour sonore de reconnaissance mis a jour.' },
        { id: 'autoRefreshDashboard', defaultValue: true, successMessage: 'Rafraichissement automatique du dashboard mis a jour.' },
        { id: 'compactTables', defaultValue: false, successMessage: 'Affichage compact des tableaux mis a jour.' }
    ];
    const requirements = {
        length: document.getElementById('length'),
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        number: document.getElementById('number'),
        special: document.getElementById('special')
    };

    initThemeOptions();
    initPreferences();
    initPasswordForm();

    function initThemeOptions() {
        const currentTheme = getTheme();
        highlightTheme(currentTheme);

        themeOptions.forEach((option) => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme || 'light';
                localStorage.setItem('theme', JSON.stringify(theme));
                document.documentElement.setAttribute('data-theme', theme);
                document.body.classList.toggle('dark-theme', theme === 'dark');
                highlightTheme(theme);
                document.dispatchEvent(new Event('themeChanged'));
                showNotification('Theme applique avec succes.', 'success');
            });
        });
    }

    function initPreferences() {
        switches.forEach(({ id, defaultValue, successMessage }) => {
            const input = document.getElementById(id);
            if (!input) {
                return;
            }

            input.checked = readPreference(id, defaultValue);

            if (id === 'compactTables') {
                document.body.classList.toggle('compact-tables', input.checked);
            }

            input.addEventListener('change', () => {
                savePreference(id, input.checked);

                if (id === 'compactTables') {
                    document.body.classList.toggle('compact-tables', input.checked);
                }

                showNotification(successMessage, 'success');
            });
        });
    }

    function initPasswordForm() {
        togglePasswordButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const input = button.previousElementSibling;
                const icon = button.querySelector('i');
                if (!input || !icon) {
                    return;
                }

                const nextType = input.type === 'password' ? 'text' : 'password';
                input.type = nextType;
                icon.className = nextType === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        });

        newPassword?.addEventListener('input', updatePasswordStrength);

        changePasswordBtn?.addEventListener('click', async () => {
            const current = currentPassword?.value?.trim() || '';
            const nextPassword = newPassword?.value || '';
            const confirmation = confirmPassword?.value || '';

            if (!current || !nextPassword || !confirmation) {
                showNotification('Veuillez remplir tous les champs.', 'error');
                return;
            }

            if (nextPassword !== confirmation) {
                showNotification('Les nouveaux mots de passe ne correspondent pas.', 'error');
                return;
            }

            const passwordChecks = evaluatePassword(nextPassword);
            if (!Object.values(passwordChecks).every(Boolean)) {
                showNotification('Le mot de passe ne repond pas encore aux exigences.', 'error');
                return;
            }

            try {
                changePasswordBtn.disabled = true;
                await AppApi.post('/auth/change-password', {
                    currentPassword: current,
                    newPassword: nextPassword
                }, 'Impossible de mettre a jour le mot de passe.');

                currentPassword.value = '';
                newPassword.value = '';
                confirmPassword.value = '';
                updatePasswordStrength();
                showNotification('Votre mot de passe a ete mis a jour avec succes.', 'success');
            } catch (error) {
                showNotification(error.message || 'Impossible de mettre a jour le mot de passe.', 'error');
            } finally {
                changePasswordBtn.disabled = false;
            }
        });

        updatePasswordStrength();
    }

    function getTheme() {
        const raw = localStorage.getItem('theme');
        return raw ? JSON.parse(raw) : 'light';
    }

    function highlightTheme(theme) {
        themeOptions.forEach((option) => {
            option.classList.toggle('active', option.dataset.theme === theme);
        });
    }

    function readPreference(key, defaultValue) {
        const rawValue = localStorage.getItem(key);
        return rawValue !== null ? JSON.parse(rawValue) : defaultValue;
    }

    function savePreference(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function evaluatePassword(value) {
        return {
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            lowercase: /[a-z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[^A-Za-z0-9]/.test(value)
        };
    }

    function updatePasswordStrength() {
        if (!newPassword || !strengthBar || !strengthText) {
            return;
        }

        const checks = evaluatePassword(newPassword.value || '');
        const score = Object.values(checks).filter(Boolean).length;

        Object.entries(requirements).forEach(([key, element]) => {
            if (!element) {
                return;
            }

            const icon = element.querySelector('i');
            element.style.opacity = checks[key] ? '1' : '0.65';
            if (icon) {
                icon.className = checks[key] ? 'fas fa-check' : 'fas fa-times';
            }
        });

        strengthBar.className = 'strength-bar';

        if (!newPassword.value) {
            strengthBar.style.width = '0';
            strengthText.textContent = 'Force du mot de passe';
            strengthText.style.color = '';
            return;
        }

        strengthBar.style.width = `${score * 20}%`;

        if (score <= 2) {
            strengthBar.classList.add('weak');
            strengthText.textContent = 'Faible';
            strengthText.style.color = 'var(--danger-color)';
        } else if (score <= 4) {
            strengthBar.classList.add('medium');
            strengthText.textContent = 'Moyen';
            strengthText.style.color = 'var(--secondary-color)';
        } else {
            strengthBar.classList.add('strong');
            strengthText.textContent = 'Fort';
            strengthText.style.color = 'var(--success-color)';
        }
    }

    function showNotification(message, type) {
        if (passwordChangeNotification) {
            passwordChangeNotification.textContent = message;
            passwordChangeNotification.className = `notification ${type}`;
            passwordChangeNotification.style.display = 'block';
            setTimeout(() => {
                passwordChangeNotification.style.display = 'none';
            }, 4200);
        }

        if (typeof AppUI !== 'undefined') {
            AppUI.notify(message, type === 'error' ? 'error' : 'success');
        }
    }
});
