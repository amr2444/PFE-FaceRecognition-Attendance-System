document.addEventListener('DOMContentLoaded', async function() {
    if (!document.getElementById('attendanceTable')) return;

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

    let employees = [];
    let presences = [];
    let holidays = [];
    let attendanceData = {};

    yearSelect.value = String(new Date().getFullYear());
    monthSelect.value = String(new Date().getMonth() + 1);
    loadHolidays();
    bindEvents();
    await refreshSheet();

    function bindEvents() {
        searchBtn.addEventListener('click', refreshSheet);
        exportPdfBtn.addEventListener('click', () => window.print());
        printBtn.addEventListener('click', () => window.print());
        exportExcelBtn.addEventListener('click', exportToCsv);
    }

    async function refreshSheet() {
        showLoading();
        updateFilterTags();

        try {
            const [employeesData, presencesData] = await Promise.all([
                AppApi.get('/employes/find/all', 'Impossible de charger les employes.'),
                AppApi.get('/presences/?page=0&size=1000', 'Impossible de charger les presences.')
            ]);

            employees = employeesData || [];
            presences = presencesData.content || [];
            buildAttendanceData();
            renderAttendanceTable();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="32" class="empty-state">${error.message || 'Impossible de charger la feuille de presence.'}</td></tr>`;
        } finally {
            hideLoading();
        }
    }

    function buildAttendanceData() {
        attendanceData = {};
        const year = parseInt(yearSelect.value, 10);
        const month = parseInt(monthSelect.value, 10);
        const daysInMonth = new Date(year, month, 0).getDate();
        const today = new Date();

        employees.forEach((employee) => {
            attendanceData[employee.employeeId] = {};

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month - 1, day);
                const dateString = formatDate(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const isHoliday = holidays.some((holiday) => holiday.date === dateString);
                const isFuture = date > today;

                let status = 'absent';

                if (isWeekend) {
                    status = 'weekend';
                } else if (isHoliday) {
                    status = 'holiday';
                } else if (isFuture) {
                    status = 'future';
                } else {
                    const presence = presences.find((item) => {
                        const creationDate = item.creationDate ? new Date(item.creationDate) : null;
                        return item.employeeId === employee.employeeId && creationDate && creationDate.toISOString().split('T')[0] === dateString;
                    });

                    if (presence) {
                        status = presence.statut === 'ABSENT' ? 'absent' : 'present';
                    }
                }

                attendanceData[employee.employeeId][day] = status;
            }
        });
    }

    function renderAttendanceTable() {
        const year = parseInt(yearSelect.value, 10);
        const month = parseInt(monthSelect.value, 10);
        const daysInMonth = new Date(year, month, 0).getDate();

        let headerRow = '<tr><th class="employee-name">Employe</th>';
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isHoliday = holidays.some((holiday) => holiday.date === formatDate(date));
            let headerClass = 'day-header';
            if (isWeekend) headerClass += ' weekend';
            if (isHoliday) headerClass += ' holiday';
            headerRow += `<th class="${headerClass}">${day}</th>`;
        }
        headerRow += '</tr>';
        tableHeader.innerHTML = headerRow;

        tableBody.innerHTML = employees.map((employee) => {
            let row = `
                <tr>
                    <td class="employee-name employee-cell">
                        <img src="${employee.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nom || 'Employe')}`}" alt="${employee.nom}" class="employee-photo">
                        <span>${employee.nom}</span>
                    </td>`;

            for (let day = 1; day <= daysInMonth; day++) {
                const status = attendanceData[employee.employeeId][day];
                const statusText = status === 'present' ? 'P' : status === 'absent' ? 'A' : status === 'holiday' ? 'H' : status === 'weekend' ? 'W' : '-';
                row += `<td class="${status}"><span class="attendance-status ${status}">${statusText}</span></td>`;
            }

            row += '</tr>';
            return row;
        }).join('');
    }

    function updateFilterTags() {
        yearTag.textContent = yearSelect.value;
        monthTag.textContent = monthSelect.options[monthSelect.selectedIndex].text;
    }

    function exportToCsv() {
        const rows = Array.from(document.querySelectorAll('#attendanceTable tr')).map((row) =>
            Array.from(row.querySelectorAll('th, td')).map((cell) => `"${(cell.textContent || '').trim().replace(/"/g, '""')}"`).join(',')
        );

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `feuille_presence_${yearSelect.value}_${monthSelect.value}.csv`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        AppUI.notify('Export CSV genere avec succes.', 'success');
    }

    function loadHolidays() {
        holidays = [
            { date: '2026-01-01', name: 'Nouvel An' },
            { date: '2026-01-11', name: 'Manifeste de l Indépendance' },
            { date: '2026-05-01', name: 'Fete du Travail' },
            { date: '2026-07-30', name: 'Fete du Trone' },
            { date: '2026-11-18', name: 'Fete de l Indépendance' }
        ];
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});
