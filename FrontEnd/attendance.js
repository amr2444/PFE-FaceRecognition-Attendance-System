document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_PAGE_SIZE = 10;
    const STANDARD_DAY_MINUTES = 480;
    const LATE_THRESHOLD_MINUTES = 9 * 60;

    const dom = {
        tableBody: document.getElementById('attendanceTableBody'),
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        shiftFilter: document.getElementById('shiftFilter'),
        countBadge: document.getElementById('attendanceCountBadge'),
        pageBadge: document.getElementById('attendancePageBadge'),
        pageInfo: document.getElementById('pageInfo'),
        itemsPerPage: document.getElementById('itemsPerPageSelect'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        addBtn: document.getElementById('addAttendanceBtn'),
        exportBtn: document.getElementById('exportBtn'),
        selectAll: document.getElementById('selectAll'),
        bulkActions: document.getElementById('bulkActions'),
        selectedCount: document.querySelector('.selected-count'),
        bulkExportBtn: document.getElementById('bulkExportBtn'),
        markPresentBtn: document.getElementById('markPresentBtn'),
        markAbsentBtn: document.getElementById('markAbsentBtn'),
        bulkDeleteBtn: document.getElementById('bulkDeleteBtn'),
        sortButtons: [...document.querySelectorAll('.sort-button')],
        dateLabel: document.getElementById('attendanceDateLabel'),
        kpiPresent: document.getElementById('kpiPresentCount'),
        kpiLate: document.getElementById('kpiLateCount'),
        kpiBreak: document.getElementById('kpiBreakCount'),
        kpiAbsent: document.getElementById('kpiAbsentCount'),
        drawer: document.getElementById('attendanceModal'),
        modalTitle: document.getElementById('modalTitle'),
        closeDrawerBtn: document.getElementById('closeModal'),
        form: document.getElementById('attendanceForm'),
        attendanceId: document.getElementById('attendanceId'),
        employeeSlot: document.querySelector('.employee-slot'),
        attendanceDate: document.getElementById('attendanceDate'),
        shift: document.getElementById('shift'),
        status: document.getElementById('status'),
        firstIn: document.getElementById('firstIn'),
        breakTime: document.getElementById('breakTime'),
        resumeTime: document.getElementById('resumeTime'),
        lastOut: document.getElementById('lastOut'),
        notes: document.getElementById('notes'),
        cancelBtn: document.getElementById('cancelBtn'),
        deleteModal: document.getElementById('deleteModal'),
        deleteInfo: document.getElementById('deleteAttendanceInfo'),
        closeDeleteModalBtn: document.getElementById('closeDeleteModal'),
        cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
        confirmDeleteBtn: document.getElementById('confirmDeleteBtn')
    };

    const state = {
        currentPage: 1,
        itemsPerPage: parseInt(dom.itemsPerPage?.value || `${DEFAULT_PAGE_SIZE}`, 10),
        totalElements: 0,
        totalPages: 1,
        attendances: [],
        employees: [],
        selectedIds: new Set(),
        sortKey: 'lastOut',
        sortDirection: 'desc',
        deleteTargetId: null,
        editingAttendance: null
    };

    init();

    async function init() {
        bindEvents();
        initRipples();
        hydrateDateLabel();
        renderSkeletonRows();
        await Promise.all([loadAttendances(), loadKpis()]);
        await handlePageIntent();
    }

    function bindEvents() {
        dom.searchInput?.addEventListener('input', debounce(resetAndReload, 220));
        dom.statusFilter?.addEventListener('change', resetAndReload);
        dom.shiftFilter?.addEventListener('change', resetAndReload);
        dom.itemsPerPage?.addEventListener('change', () => {
            state.itemsPerPage = parseInt(dom.itemsPerPage.value, 10) || DEFAULT_PAGE_SIZE;
            resetAndReload();
        });
        dom.prevPage?.addEventListener('click', () => changePage(state.currentPage - 1));
        dom.nextPage?.addEventListener('click', () => changePage(state.currentPage + 1));
        dom.addBtn?.addEventListener('click', () => openDrawer());
        dom.exportBtn?.addEventListener('click', exportAllAttendances);

        dom.selectAll?.addEventListener('change', toggleSelectAll);
        dom.bulkExportBtn?.addEventListener('click', exportSelectedAttendances);
        dom.markPresentBtn?.addEventListener('click', () => bulkUpdateStatus('PRESENT'));
        dom.markAbsentBtn?.addEventListener('click', () => bulkUpdateStatus('ABSENT'));
        dom.bulkDeleteBtn?.addEventListener('click', bulkDeleteAttendances);

        dom.sortButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const key = button.dataset.sort;
                if (!key) return;
                state.sortDirection = state.sortKey === key && state.sortDirection === 'asc' ? 'desc' : 'asc';
                state.sortKey = key;
                syncSortButtons();
                renderTable();
            });
        });

        dom.tableBody?.addEventListener('change', handleTableSelection);
        dom.tableBody?.addEventListener('click', handleTableActions);

        dom.closeDrawerBtn?.addEventListener('click', closeDrawer);
        dom.cancelBtn?.addEventListener('click', closeDrawer);
        dom.drawer?.addEventListener('click', (event) => {
            if (event.target === dom.drawer) closeDrawer();
        });
        dom.form?.addEventListener('submit', saveAttendance);

        dom.closeDeleteModalBtn?.addEventListener('click', closeDeleteModal);
        dom.cancelDeleteBtn?.addEventListener('click', closeDeleteModal);
        dom.confirmDeleteBtn?.addEventListener('click', confirmDelete);
        dom.deleteModal?.addEventListener('click', (event) => {
            if (event.target === dom.deleteModal) closeDeleteModal();
        });
    }

    async function loadAttendances() {
        renderSkeletonRows();
        try {
            const data = await AppApi.get(`/presences/?${buildQueryParams().toString()}`, 'Erreur lors du chargement des presences.');
            state.attendances = Array.isArray(data?.content) ? data.content : [];
            state.totalElements = Number(data?.totalElements || 0);
            state.totalPages = Math.max(Number(data?.totalPages || 1), 1);
            syncVisibleSelection();
            syncSortButtons();
            renderTable();
            updateMeta();
            updatePagination();
        } catch (error) {
            renderMessageState('Chargement impossible', error?.message || 'Impossible de charger les presences.', 'fa-triangle-exclamation', 'Recharger', () => loadAttendances());
            clearSelection();
        }
    }

    async function loadKpis() {
        try {
            const [counts, allAttendances] = await Promise.all([
                AppApi.get('/presences/statuts/today', 'Erreur KPI presences.'),
                fetchAllAttendances()
            ]);
            const map = new Map((counts || []).map((item) => [item.statut, Number(item.count || 0)]));
            dom.kpiPresent.textContent = String((map.get('PRESENT') || 0) + (map.get('TERMINE') || 0));
            dom.kpiBreak.textContent = String(map.get('EN_PAUSE') || 0);
            dom.kpiAbsent.textContent = String(map.get('ABSENT') || 0);
            dom.kpiLate.textContent = String(allAttendances.filter(isLateAttendance).length);
        } catch (error) {
            console.error('KPI load failed:', error);
        }
    }

    async function fetchAllAttendances() {
        const first = await AppApi.get('/presences/?page=0&size=100', 'Erreur lors du chargement complet des presences.');
        const items = Array.isArray(first?.content) ? [...first.content] : [];
        const totalPages = Math.max(Number(first?.totalPages || 1), 1);
        for (let page = 1; page < totalPages; page += 1) {
            const next = await AppApi.get(`/presences/?page=${page}&size=100`, 'Erreur lors du chargement complet des presences.');
            if (Array.isArray(next?.content)) items.push(...next.content);
        }
        return items;
    }

    function buildQueryParams() {
        const params = new URLSearchParams({
            page: String(Math.max(state.currentPage - 1, 0)),
            size: String(state.itemsPerPage)
        });
        if (dom.searchInput?.value.trim()) params.set('searchByNom', dom.searchInput.value.trim());
        if (dom.statusFilter?.value) params.set('searchByStatus', dom.statusFilter.value);
        if (dom.shiftFilter?.value) params.set('searchByShift', dom.shiftFilter.value);
        return params;
    }

    function renderTable() {
        const rows = getSortedAttendances();
        if (!rows.length) {
            renderMessageState(
                'Aucune presence a afficher',
                'Essayez un autre filtre ou ajoutez une presence manuelle pour alimenter le suivi journalier.',
                'fa-layer-group',
                'Ajouter une presence',
                () => openDrawer()
            );
            updateBulkActions();
            return;
        }

        dom.tableBody.innerHTML = rows.map((attendance, index) => renderRow(attendance, index)).join('');
        updateSelectAllState();
        updateBulkActions();
    }

    function renderRow(attendance, index) {
        const id = Number(attendance.presenceJourId);
        const visualStatus = getVisualStatus(attendance);
        const totalMinutes = durationToMinutes(attendance.totalHeures);
        const progress = Math.max(0, Math.min(100, Math.round((totalMinutes / STANDARD_DAY_MINUTES) * 100)));

        return `
            <tr style="animation-delay:${Math.min(index * 50, 280)}ms">
                <td class="checkbox-cell"><input type="checkbox" class="attendance-checkbox" data-id="${id}" ${state.selectedIds.has(id) ? 'checked' : ''}></td>
                <td>
                    <div class="employee-cell">
                        <div class="employee-avatar">${escapeHtml(getInitials(attendance.employeeName))}</div>
                        <div class="employee-meta">
                            <span class="employee-name">${escapeHtml(attendance.employeeName || 'Employe inconnu')}</span>
                            <span class="employee-subline">ID ${escapeHtml(String(attendance.employeeId || '-'))}</span>
                        </div>
                    </div>
                </td>
                <td><span class="time-cell">${escapeHtml(formatTime(attendance.firstIn))}</span></td>
                <td><span class="time-cell">${escapeHtml(formatTime(attendance.breakTime))}</span></td>
                <td><span class="time-cell">${escapeHtml(formatTime(attendance.resumeTime))}</span></td>
                <td><span class="time-cell">${escapeHtml(formatTime(attendance.lastOut))}</span></td>
                <td class="hours-cell">
                    <div class="hours-stack">
                        <div class="hours-label">
                            <span class="hours-value">${escapeHtml(formatDuration(attendance.totalHeures))}</span>
                            <span class="hours-target">${totalMinutes}/${STANDARD_DAY_MINUTES} min</span>
                        </div>
                        <div class="hours-progress"><span style="width:${progress}%"></span></div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${getStatusClass(visualStatus)}">
                        <i class="fas ${getStatusIcon(visualStatus)}"></i>
                        ${escapeHtml(getStatusLabel(visualStatus))}
                    </span>
                </td>
                <td><span class="shift-chip">${escapeHtml(normalizeShift(attendance.shift))}</span></td>
                <td class="action-cell">
                    <button type="button" class="action-btn" data-action="edit" data-id="${id}" aria-label="Modifier"><i class="fas fa-pen"></i></button>
                    <button type="button" class="action-btn delete-btn" data-action="delete" data-id="${id}" aria-label="Supprimer"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    function renderSkeletonRows() {
        dom.tableBody.innerHTML = Array.from({ length: Math.max(state.itemsPerPage, 5) }, () => `
            <tr class="skeleton-row">
                <td><div class="skeleton-block"></div></td>
                <td><div class="skeleton-block" style="width:170px;"></div></td>
                <td><div class="skeleton-block" style="width:52px;"></div></td>
                <td><div class="skeleton-block" style="width:52px;"></div></td>
                <td><div class="skeleton-block" style="width:52px;"></div></td>
                <td><div class="skeleton-block" style="width:52px;"></div></td>
                <td><div class="skeleton-block" style="width:128px;"></div></td>
                <td><div class="skeleton-block" style="width:92px;"></div></td>
                <td><div class="skeleton-block" style="width:76px;"></div></td>
                <td><div class="skeleton-block" style="width:70px;"></div></td>
            </tr>
        `).join('');
    }

    function renderMessageState(title, message, icon, buttonLabel, onClick) {
        dom.tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="10">
                    <div class="table-empty">
                        <div class="table-empty-illustration"><i class="fas ${icon}"></i></div>
                        <h3>${escapeHtml(title)}</h3>
                        <p>${escapeHtml(message)}</p>
                        <button type="button" class="table-empty-btn" id="tableStateActionBtn">
                            <i class="fas fa-plus"></i>
                            <span>${escapeHtml(buttonLabel)}</span>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById('tableStateActionBtn')?.addEventListener('click', onClick);
        updateMeta();
        updatePagination();
    }

    function getSortedAttendances() {
        const factor = state.sortDirection === 'asc' ? 1 : -1;
        return [...state.attendances].sort((a, b) => {
            const left = getComparable(a, state.sortKey);
            const right = getComparable(b, state.sortKey);
            if (left === right) return 0;
            if (left === null || left === '' || left === -1) return 1;
            if (right === null || right === '' || right === -1) return -1;
            if (typeof left === 'string' && typeof right === 'string') {
                return left.localeCompare(right, 'fr', { sensitivity: 'base' }) * factor;
            }
            return (left > right ? 1 : -1) * factor;
        });
    }

    function getComparable(attendance, key) {
        if (key === 'employeeName') return (attendance.employeeName || '').toLowerCase();
        if (['firstIn', 'breakTime', 'resumeTime', 'lastOut'].includes(key)) return timeToMinutes(attendance[key]);
        if (key === 'totalHeures') return durationToMinutes(attendance.totalHeures);
        if (key === 'visualStatus') return getVisualStatus(attendance);
        if (key === 'shift') return normalizeShift(attendance.shift).toLowerCase();
        return attendance[key];
    }

    function handleTableSelection(event) {
        const checkbox = event.target.closest('.attendance-checkbox');
        if (!checkbox) return;
        const id = Number(checkbox.dataset.id);
        checkbox.checked ? state.selectedIds.add(id) : state.selectedIds.delete(id);
        updateSelectAllState();
        updateBulkActions();
    }

    function handleTableActions(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const id = Number(button.dataset.id);
        if (button.dataset.action === 'edit') openDrawer(id);
        if (button.dataset.action === 'delete') openDeleteModal(id);
    }

    function toggleSelectAll() {
        const checked = Boolean(dom.selectAll?.checked);
        state.attendances.forEach((attendance) => {
            const id = Number(attendance.presenceJourId);
            checked ? state.selectedIds.add(id) : state.selectedIds.delete(id);
        });
        renderTable();
    }

    function updateSelectAllState() {
        if (!dom.selectAll) return;
        const ids = state.attendances.map((item) => Number(item.presenceJourId));
        const selected = ids.filter((id) => state.selectedIds.has(id)).length;
        dom.selectAll.checked = ids.length > 0 && selected === ids.length;
        dom.selectAll.indeterminate = selected > 0 && selected < ids.length;
    }

    function updateBulkActions() {
        const count = state.selectedIds.size;
        if (dom.selectedCount) dom.selectedCount.textContent = `${count} selectionne(s)`;
        dom.bulkActions?.classList.toggle('visible', count > 0);
    }

    function updateMeta() {
        if (dom.countBadge) dom.countBadge.textContent = `${state.totalElements} enregistrements`;
        if (dom.pageBadge) {
            const from = state.totalElements ? ((state.currentPage - 1) * state.itemsPerPage) + 1 : 0;
            const to = state.totalElements ? from + state.attendances.length - 1 : 0;
            dom.pageBadge.textContent = `${from}-${to} / ${state.totalElements}`;
        }
    }

    function updatePagination() {
        if (dom.pageInfo) dom.pageInfo.textContent = `Page ${state.currentPage} sur ${state.totalPages}`;
        if (dom.prevPage) dom.prevPage.disabled = state.currentPage <= 1;
        if (dom.nextPage) dom.nextPage.disabled = state.currentPage >= state.totalPages;
    }

    async function openDrawer(attendanceId = null) {
        try {
            state.editingAttendance = null;
            if (attendanceId) {
                const attendance = await AppApi.get(`/presences/${attendanceId}`, 'Erreur lors du chargement de la presence.');
                state.editingAttendance = attendance;
                fillDrawerForEdit(attendance);
            } else {
                await ensureEmployeesLoaded();
                fillDrawerForCreate();
            }
            dom.drawer?.classList.add('open');
            document.body.style.overflow = 'hidden';
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible d ouvrir le formulaire de presence.', 'error');
        }
    }

    function closeDrawer() {
        dom.drawer?.classList.remove('open');
        if (dom.deleteModal?.style.display !== 'block') document.body.style.overflow = '';
        dom.form?.reset();
        state.editingAttendance = null;
    }

    async function ensureEmployeesLoaded() {
        if (state.employees.length) return state.employees;
        const employees = await AppApi.get('/employes/find/all', 'Erreur lors du chargement des employes.');
        state.employees = (employees || []).filter((item) => item.statut === 'ACTIF');
        return state.employees;
    }

    function fillDrawerForCreate(prefill = {}) {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Ajouter une presence';
        dom.attendanceId.value = '';
        renderEmployeeSelect(prefill.employeeId || '');
        dom.attendanceDate.value = prefill.date || dateInputValue(new Date());
        dom.shift.value = normalizeShift(prefill.shift || 'Matin');
        dom.status.value = prefill.status || 'PRESENT';
        dom.firstIn.value = prefill.firstIn || '';
        dom.breakTime.value = prefill.breakTime || '';
        dom.resumeTime.value = prefill.resumeTime || '';
        dom.lastOut.value = prefill.lastOut || '';
        dom.notes.value = prefill.note || '';
    }

    function fillDrawerForEdit(attendance) {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Modifier la presence';
        dom.attendanceId.value = String(attendance.presenceJourId);
        dom.employeeSlot.innerHTML = `
            <label for="employeeReadonly">Employe</label>
            <input type="text" id="employeeReadonly" value="${escapeHtml(attendance.employeeName || 'Employe')}" readonly>
        `;
        dom.attendanceDate.value = (attendance.creationDate || '').slice(0, 10) || dateInputValue(new Date());
        dom.shift.value = normalizeShift(attendance.shift);
        dom.status.value = attendance.statut || 'PRESENT';
        dom.firstIn.value = timeInputValue(attendance.firstIn);
        dom.breakTime.value = timeInputValue(attendance.breakTime);
        dom.resumeTime.value = timeInputValue(attendance.resumeTime);
        dom.lastOut.value = timeInputValue(attendance.lastOut);
        dom.notes.value = attendance.note || '';
    }

    function renderEmployeeSelect(selectedId) {
        const options = state.employees.map((employee) => `
            <option value="${employee.employeeId}" ${String(employee.employeeId) === String(selectedId) ? 'selected' : ''}>
                ${escapeHtml(employee.nom || `Employe #${employee.employeeId}`)}
            </option>
        `).join('');
        dom.employeeSlot.innerHTML = `
            <label for="employeeSelect">Employe</label>
            <select id="employeeSelect" required>
                <option value="">Selectionner un employe</option>
                ${options}
            </select>
        `;
    }

    async function saveAttendance(event) {
        event.preventDefault();
        const employeeId = state.editingAttendance?.employeeId || Number(document.getElementById('employeeSelect')?.value || 0);
        if (!employeeId) {
            AppUI.notify('Selectionnez un employe avant d enregistrer.', 'warning');
            return;
        }

        const payload = {
            employeeId,
            firstIn: dom.firstIn.value || null,
            breakTime: dom.breakTime.value || null,
            resumeTime: dom.resumeTime.value || null,
            lastOut: dom.lastOut.value || null,
            statut: dom.status.value || 'PRESENT',
            shift: normalizeShift(dom.shift.value),
            note: dom.notes.value.trim()
        };

        try {
            if (state.editingAttendance) {
                await AppApi.put(`/presences/${state.editingAttendance.presenceJourId}`, payload, 'Erreur lors de la mise a jour.');
                AppUI.notify('Presence mise a jour avec succes.', 'success');
            } else {
                await AppApi.post('/presences/', payload, 'Erreur lors de la creation.');
                AppUI.notify('Presence ajoutee avec succes.', 'success');
            }
            closeDrawer();
            clearQueryParams();
            clearSelection();
            await Promise.all([loadAttendances(), loadKpis()]);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible d enregistrer la presence.', 'error');
        }
    }

    async function openDeleteModal(attendanceId) {
        try {
            const attendance = await AppApi.get(`/presences/${attendanceId}`, 'Erreur lors du chargement de la presence.');
            state.deleteTargetId = attendanceId;
            dom.deleteInfo.innerHTML = `
                <p><strong>Employe:</strong> ${escapeHtml(attendance.employeeName || 'Employe')}</p>
                <p><strong>Status:</strong> ${escapeHtml(getStatusLabel(getVisualStatus(attendance)))}</p>
                <p><strong>Total:</strong> ${escapeHtml(formatDuration(attendance.totalHeures))}</p>
            `;
            dom.deleteModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible de preparer la suppression.', 'error');
        }
    }

    async function confirmDelete() {
        if (!state.deleteTargetId) return;
        try {
            await AppApi.delete(`/presences/${state.deleteTargetId}`, 'Erreur lors de la suppression.');
            state.selectedIds.delete(state.deleteTargetId);
            AppUI.notify('Presence supprimee avec succes.', 'success');
            closeDeleteModal();
            await Promise.all([loadAttendances(), loadKpis()]);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible de supprimer la presence.', 'error');
        }
    }

    function closeDeleteModal() {
        if (dom.deleteModal) dom.deleteModal.style.display = 'none';
        if (!dom.drawer?.classList.contains('open')) document.body.style.overflow = '';
        state.deleteTargetId = null;
    }

    async function bulkUpdateStatus(status) {
        if (!state.selectedIds.size) return AppUI.notify('Selectionnez au moins une ligne.', 'warning');
        try {
            const details = await Promise.all([...state.selectedIds].map((id) => AppApi.get(`/presences/${id}`, 'Erreur presence detail.')));
            await Promise.all(details.map((attendance) => AppApi.put(`/presences/${attendance.presenceJourId}`, {
                employeeId: attendance.employeeId,
                firstIn: timeApiValue(attendance.firstIn),
                breakTime: timeApiValue(attendance.breakTime),
                resumeTime: timeApiValue(attendance.resumeTime),
                lastOut: timeApiValue(attendance.lastOut),
                statut: status,
                shift: normalizeShift(attendance.shift),
                note: attendance.note || ''
            }, 'Erreur mise a jour groupee.')));
            clearSelection();
            AppUI.notify(`Selection mise a jour vers ${getStatusLabel(status)}.`, 'success');
            await Promise.all([loadAttendances(), loadKpis()]);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible de mettre a jour la selection.', 'error');
        }
    }

    async function bulkDeleteAttendances() {
        if (!state.selectedIds.size) return AppUI.notify('Selectionnez au moins une ligne.', 'warning');
        if (!window.confirm(`Supprimer ${state.selectedIds.size} presence(s) selectionnee(s) ?`)) return;
        try {
            await Promise.all([...state.selectedIds].map((id) => AppApi.delete(`/presences/${id}`, 'Erreur suppression groupee.')));
            clearSelection();
            AppUI.notify('Selection supprimee avec succes.', 'success');
            await Promise.all([loadAttendances(), loadKpis()]);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible de supprimer la selection.', 'error');
        }
    }

    async function exportAllAttendances() {
        try {
            const result = await AppApi.blob(`/presences/export?${buildExportParams(true).toString()}`, {}, 'Erreur lors de l export CSV.');
            downloadBlob(result.blob, result.response, `presences-${dateInputValue(new Date())}.csv`);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible d exporter les presences.', 'error');
        }
    }

    async function exportSelectedAttendances() {
        if (!state.selectedIds.size) return AppUI.notify('Selectionnez au moins une ligne.', 'warning');
        try {
            const details = await Promise.all([...state.selectedIds].map((id) => AppApi.get(`/presences/${id}`, 'Erreur presence detail.')));
            const blob = new Blob([buildCsv(details)], { type: 'text/csv;charset=utf-8;' });
            downloadBlob(blob, null, `presences-selection-${dateInputValue(new Date())}.csv`);
        } catch (error) {
            AppUI.notify(error?.message || 'Impossible d exporter la selection.', 'error');
        }
    }

    function buildExportParams(exportAll) {
        const params = new URLSearchParams({ format: 'csv', exportAll: String(exportAll) });
        if (dom.searchInput?.value.trim()) params.set('searchByNom', dom.searchInput.value.trim());
        if (dom.statusFilter?.value) params.set('searchByStatus', dom.statusFilter.value);
        if (dom.shiftFilter?.value) params.set('searchByShift', dom.shiftFilter.value);
        if (!exportAll) {
            params.set('page', String(Math.max(state.currentPage - 1, 0)));
            params.set('size', String(state.itemsPerPage));
        }
        return params;
    }

    function buildCsv(rows) {
        const headers = ['Employe', 'First In', 'Break', 'Resume', 'Last Out', 'Total Heures', 'Status', 'Shift', 'Note'];
        const lines = rows.map((item) => [
            item.employeeName || '',
            formatTime(item.firstIn),
            formatTime(item.breakTime),
            formatTime(item.resumeTime),
            formatTime(item.lastOut),
            formatDuration(item.totalHeures),
            getStatusLabel(getVisualStatus(item)),
            normalizeShift(item.shift),
            item.note || ''
        ]);
        return [headers, ...lines].map((line) => line.map(csvEscape).join(',')).join('\r\n');
    }

    async function handlePageIntent() {
        const params = new URLSearchParams(window.location.search);
        if (params.get('edit')) return openDrawer(Number(params.get('edit')));
        if (params.get('add') !== 'true') return;
        await ensureEmployeesLoaded();
        fillDrawerForCreate({ employeeId: params.get('employeeId') || '', date: params.get('date') || dateInputValue(new Date()) });
        dom.drawer?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function changePage(page) {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        clearSelection();
        loadAttendances();
    }

    function resetAndReload() {
        state.currentPage = 1;
        clearSelection();
        loadAttendances();
    }

    function clearSelection() {
        state.selectedIds.clear();
        updateBulkActions();
        updateSelectAllState();
    }

    function syncVisibleSelection() {
        const visibleIds = new Set(state.attendances.map((item) => Number(item.presenceJourId)));
        [...state.selectedIds].forEach((id) => {
            if (!visibleIds.has(id)) state.selectedIds.delete(id);
        });
    }

    function syncSortButtons() {
        dom.sortButtons.forEach((button) => {
            const active = button.dataset.sort === state.sortKey;
            button.classList.toggle('active', active);
            button.classList.toggle('desc', active && state.sortDirection === 'desc');
        });
    }

    function initRipples() {
        document.addEventListener('click', (event) => {
            const button = event.target.closest('.header-btn, .bulk-action-btn, .pagination-btn, .table-empty-btn, .action-btn');
            if (!button) return;
            const rect = button.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            ripple.className = 'attendance-ripple';
            ripple.style.width = `${size}px`;
            ripple.style.height = `${size}px`;
            ripple.style.left = `${event.clientX - rect.left - (size / 2)}px`;
            ripple.style.top = `${event.clientY - rect.top - (size / 2)}px`;
            button.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 520);
        });
    }

    function hydrateDateLabel() {
        if (dom.dateLabel) {
            dom.dateLabel.textContent = `Flux du ${new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })} - supervision en temps reel des entrees, pauses et sorties.`;
        }
    }

    function getVisualStatus(attendance) {
        if (attendance.statut === 'ABSENT') return 'ABSENT';
        if (attendance.statut === 'EN_PAUSE') return 'EN_PAUSE';
        if (isLateAttendance(attendance)) return 'LATE';
        return attendance.statut || 'PRESENT';
    }

    function isLateAttendance(attendance) {
        return attendance?.statut !== 'ABSENT' && timeToMinutes(attendance?.firstIn) > LATE_THRESHOLD_MINUTES;
    }

    function getStatusLabel(status) {
        return {
            PRESENT: 'Present',
            ABSENT: 'Absent',
            EN_PAUSE: 'En pause',
            TERMINE: 'Termine',
            LATE: 'En retard'
        }[status] || 'Present';
    }

    function getStatusClass(status) {
        return {
            PRESENT: 'status-present',
            ABSENT: 'status-absent',
            EN_PAUSE: 'status-break',
            TERMINE: 'status-finished',
            LATE: 'status-late'
        }[status] || 'status-present';
    }

    function getStatusIcon(status) {
        return {
            PRESENT: 'fa-circle-check',
            ABSENT: 'fa-circle-xmark',
            EN_PAUSE: 'fa-mug-hot',
            TERMINE: 'fa-flag-checkered',
            LATE: 'fa-clock'
        }[status] || 'fa-circle-check';
    }

    function normalizeShift(shift) {
        const value = String(shift || '').trim().toLowerCase();
        if (value === 'apres-midi' || value === 'après-midi') return 'Apres-midi';
        if (value === 'soir') return 'Soir';
        return 'Matin';
    }

    function formatTime(value) {
        if (!value) return '--:--';
        if (typeof value === 'string') return value.slice(0, 5);
        if (typeof value === 'object' && typeof value.hour === 'number') {
            return `${String(value.hour).padStart(2, '0')}:${String(value.minute || 0).padStart(2, '0')}`;
        }
        return '--:--';
    }

    function timeInputValue(value) {
        const formatted = formatTime(value);
        return formatted === '--:--' ? '' : formatted;
    }

    function timeApiValue(value) {
        const formatted = formatTime(value);
        return formatted === '--:--' ? null : formatted;
    }

    function timeToMinutes(value) {
        const formatted = formatTime(value);
        if (formatted === '--:--') return -1;
        const [hours, minutes] = formatted.split(':').map(Number);
        return (hours * 60) + minutes;
    }

    function durationToMinutes(value) {
        if (!value || typeof value !== 'string') return 0;
        const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
        if (!match) return 0;
        return (Number(match[1] || 0) * 60) + Number(match[2] || 0) + Math.round(Number(match[3] || 0) / 60);
    }

    function formatDuration(value) {
        const minutes = durationToMinutes(value);
        const hours = Math.floor(minutes / 60);
        return `${hours}h${String(minutes % 60).padStart(2, '0')}`;
    }

    function dateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getInitials(name) {
        return String(name || 'Employe')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }

    function csvEscape(value) {
        return `"${String(value ?? '').replace(/"/g, '""')}"`;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function downloadBlob(blob, response, fallbackName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const disposition = response?.headers?.get?.('Content-Disposition') || '';
        const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
        a.href = url;
        a.download = match?.[1] || fallbackName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 200);
    }

    function clearQueryParams() {
        const url = new URL(window.location.href);
        url.search = '';
        window.history.replaceState({}, '', url.toString());
    }

    function debounce(fn, delay = 200) {
        let timerId = 0;
        return (...args) => {
            window.clearTimeout(timerId);
            timerId = window.setTimeout(() => fn(...args), delay);
        };
    }
});
