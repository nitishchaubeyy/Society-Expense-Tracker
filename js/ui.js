// js/ui.js
export const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const showToast = (message, isError = false) => {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    msg.textContent = message;
    toast.className = `fixed bottom-5 left-1/2 -translate-x-1/2 py-3 px-6 rounded-lg shadow-lg z-50 text-white ${isError ? 'bg-red-600' : 'bg-slate-800'}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
};

export const switchTab = (activeTab) => {
    document.querySelectorAll('#detail-tabs button').forEach(btn => {
        const active = btn.dataset.tab === activeTab;
        btn.classList.toggle('tab-active', active);
        btn.classList.toggle('text-gray-500', !active);
    });
    document.querySelectorAll('#tab-content > div').forEach(div => div.classList.toggle('hidden', !div.id.startsWith(activeTab)));
};

export const createModal = (id, title, content) => {
    let modal = document.getElementById(id);
    if (modal) modal.remove();
    modal = document.createElement('div');
    modal.id = id;
    modal.className = 'hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    modal.innerHTML = `<div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">${title}</h3>${content}</div>`;
    document.getElementById('app').appendChild(modal);
    return modal;
};

// --- RENDERERS ---
export const renderDashboardSheets = (sheets) => {
    const grid = document.getElementById('sheets-grid');
    const active = sheets.filter(s => s.status === 'active').sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    grid.innerHTML = '';
    document.getElementById('no-sheets-message').classList.toggle('hidden', active.length > 0);
    active.forEach(s => {
        const div = document.createElement('div');
        div.className = "bg-white p-6 rounded-lg shadow hover:shadow-lg flex flex-col justify-between";
        div.innerHTML = `<div class="cursor-pointer flex-grow sheet-card" data-id="${s.id}" data-name="${s.name}" data-date="${s.createdAt.toMillis()}">
            <h3 class="text-xl font-semibold">${s.name}</h3><p class="text-sm text-slate-400">${s.createdAt.toDate().toLocaleDateString()}</p>
            </div><div class="text-right mt-4"><button data-id="${s.id}" data-name="${s.name}" class="text-sm text-red-500 delete-sheet-btn">Delete</button></div>`;
        grid.appendChild(div);
    });
};

export const renderRecycleBin = (sheets) => {
    const deleted = sheets.filter(s => s.status === 'deleted');
    const container = document.getElementById('sheet-recycle-bin-content');
    if (!container) return;
    container.innerHTML = '';
    if (deleted.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-500 py-8">Recycle bin is empty.</p>';
        return;
    }
    deleted.forEach(s => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-3 border-b";
        div.innerHTML = `<p>${s.name}</p><div>
            <button data-id="${s.id}" class="text-blue-600 font-semibold mr-4 restore-sheet-btn">Restore</button>
            <button data-id="${s.id}" class="text-red-600 font-semibold perm-delete-sheet-btn">Delete Forever</button>
        </div>`;
        container.appendChild(div);
    });
};

export const renderMonthlySummaries = (summaries) => {
    const grid = document.getElementById('monthly-summary-grid');
    grid.innerHTML = '';
    let total = 0;
    summaries.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(s => {
        total += (s.totalCollection - s.totalExpense);
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-lg shadow';
        div.innerHTML = `<h4 class="font-bold text-lg">${s.monthName}</h4>
            <div class="mt-2 text-sm">
                <p class="flex justify-between">Col: <span class="text-green-600 font-semibold">${formatCurrency(s.totalCollection)}</span></p>
                <p class="flex justify-between">Exp: <span class="text-red-600 font-semibold">${formatCurrency(s.totalExpense)}</span></p>
            </div>
            <div class="text-xs text-right mt-3 space-x-2">
                <button data-id="${s.id}" class="text-blue-500 edit-summary-btn">Edit</button>
                <button data-id="${s.id}" data-name="${s.monthName}" class="text-red-500 delete-summary-btn">Delete</button>
            </div>`;
        grid.appendChild(div);
    });
    document.getElementById('no-summary-message').classList.toggle('hidden', summaries.length > 0);
    const balEl = document.getElementById('total-society-balance');
    balEl.textContent = formatCurrency(total);
    balEl.parentElement.className = `p-6 rounded-lg shadow-lg text-white ${total < 0 ? 'bg-red-600' : 'bg-teal-600'}`;
};

export const renderResidents = (residents) => {
    const body = document.getElementById('residents-table-body');
    body.innerHTML = '';
    residents.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3">${r.flatNo}</td><td class="p-3">${r.ownerName}</td><td class="p-3">${formatCurrency(r.maintAmount)}</td>
        <td class="p-3">${r.status || 'Sold'}</td><td class="p-3 text-center">
        <button data-id="${r.id}" class="text-blue-500 edit-resident-btn">Edit</button>
        <button data-id="${r.id}" class="text-red-500 ml-3 delete-resident-btn">Delete</button></td>`;
    });
};

export const renderExpenses = (expenses) => {
    const body = document.getElementById('expense-log-table');
    body.innerHTML = '';
    expenses.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(e => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 text-sm">${new Date(e.date + 'T00:00:00').toLocaleDateString('en-GB')}</td>
        <td class="p-3 text-sm">${e.description}</td><td class="p-3 text-sm font-medium">${formatCurrency(e.amount)}</td>
        <td class="p-3 text-center"><button data-id="${e.id}" class="text-red-500 delete-expense-btn">Delete</button></td>`;
    });
    document.getElementById('no-expenses-message').classList.toggle('hidden', expenses.length > 0);
};

export const renderCollections = (collections) => {
    const body = document.getElementById('collection-log-table');
    body.innerHTML = '';
    collections.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(c => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 text-sm">${new Date(c.date + 'T00:00:00').toLocaleDateString('en-GB')}</td>
        <td class="p-3 text-sm">${c.flatNo} - ${c.ownerName}</td><td class="p-3 text-sm font-medium">${formatCurrency(c.amount)}</td><td class="p-3 text-sm">${c.mode}</td>`;
    });
    document.getElementById('no-collections-message').classList.toggle('hidden', collections.length > 0);
};

export const renderStatus = (residents, collections, filter) => {
    const body = document.getElementById('payment-status-table');
    const paidSet = new Set(collections.map(c => c.flatNo));
    body.innerHTML = '';
    residents.filter(r => {
        const paid = paidSet.has(r.flatNo);
        if (filter === 'pending') return (r.status || 'Sold') === 'Sold' && !paid;
        if (filter === 'paid') return (r.status || 'Sold') === 'Sold' && paid;
        return true;
    }).sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const paid = paidSet.has(r.flatNo);
        const row = body.insertRow();
        const statusHTML = (r.status || 'Sold') === 'Sold' 
            ? `<span class="px-2 py-1 text-xs font-semibold rounded-full ${paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${paid ? 'Paid' : 'Pending'}</span>`
            : `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">N/A</span>`;
        row.innerHTML = `<td class="p-3">${r.flatNo}</td><td class="p-3">${r.ownerName}</td><td class="p-3">${statusHTML}</td>`;
    });
};

// js/ui.js

export const exportToExcel = (sheetName, opening, collections, expenses) => {
    const totalCollected = collections.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, i) => s + i.amount, 0);
    const closing = opening + totalCollected - totalExpenses;
    
    const wb = XLSX.utils.book_new();
    const currencyFormat = '"₹"#,##0.00';
    const headerStyle = { font: { bold: true } };

    // 1. Summary Sheet
    const summaryData = [
        [`Financial Summary: ${sheetName}`],
        [],
        ['Category', 'Amount'],
        ['Opening Balance', opening],
        ['Total Collected', totalCollected],
        ['Total Expenses', totalExpenses],
        ['Closing Balance', closing]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // 2. Collections Sheet
    const maintHeaders = ['Date', 'Flat No.', 'Owner Name', 'Amount', 'Mode'];
    const maintData = collections.map(i => [
        new Date(i.date + 'T00:00:00').toLocaleDateString('en-GB'), 
        i.flatNo, i.ownerName, i.amount, i.mode
    ]);
    const wsMaint = XLSX.utils.aoa_to_sheet([maintHeaders, ...maintData]);
    XLSX.utils.book_append_sheet(wb, wsMaint, 'Collections');

    // 3. Expenses Sheet
    const expHeaders = ['Date', 'Description', 'Amount'];
    const expData = expenses.map(i => [
        new Date(i.date + 'T00:00:00').toLocaleDateString('en-GB'), 
        i.description, i.amount
    ]);
    const wsExp = XLSX.utils.aoa_to_sheet([expHeaders, ...expData]);
    XLSX.utils.book_append_sheet(wb, wsExp, 'Expenses');

    // Download
    XLSX.writeFile(wb, `${sheetName.replace(/\s+/g, '_')}_Report.xlsx`);
};