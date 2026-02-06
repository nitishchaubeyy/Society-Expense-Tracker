// js/ui.js
export const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const showToast = (m, isErr = false) => {
    const t = document.getElementById('toast');
    document.getElementById('toast-message').textContent = m;
    t.className = `fixed bottom-5 left-1/2 -translate-x-1/2 py-3 px-6 rounded shadow-lg z-50 text-white transition-transform ${isErr ? 'bg-red-600' : 'bg-slate-800'}`;
    t.classList.remove('translate-y-[200%]');
    setTimeout(() => t.classList.add('translate-y-[200%]'), 3000);
};

export const createModal = (id, title, content) => {
    let m = document.getElementById(id); if (m) m.remove();
    m = document.createElement('div');
    m.id = id; 
    m.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50';
    m.innerHTML = `
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border dark:border-slate-700">
            <button class="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-white" data-close>&times;</button>
            <h3 class="text-xl font-bold mb-4 dark:text-white">${title}</h3>
            <div class="dark:text-slate-200">${content}</div>
        </div>`;
    document.getElementById('app').appendChild(m); 
    return m;
};

export const switchTab = (tab) => {
    document.querySelectorAll('#detail-tabs button').forEach(b => {
        const active = b.dataset.tab === tab;
        b.className = `py-4 px-1 border-b-2 font-bold text-sm ${active ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-slate-400'}`;
    });
    document.querySelectorAll('#tab-content > div').forEach(d => d.classList.toggle('hidden', !d.id.startsWith(tab)));
};

// --- DASHBOARD RENDERERS ---
export const renderDashboardSheets = (s) => {
    const grid = document.getElementById('sheets-grid'); if(!grid) return;
    grid.innerHTML = '';
    const active = s.filter(x => x.status === 'active').sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    active.forEach(sheet => {
        const d = document.createElement('div'); 
        d.className = "bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer sheet-card hover:border-blue-400 dark:hover:border-blue-500 transition-all";
        d.dataset.id = sheet.id; d.dataset.name = sheet.name; d.dataset.date = sheet.createdAt.toMillis();
        d.innerHTML = `
            <h3 class="font-bold text-xl dark:text-white">${sheet.name}</h3>
            <p class="text-sm text-gray-400 dark:text-slate-400">${sheet.createdAt.toDate().toLocaleDateString()}</p>
            <div class="text-right mt-4"><button data-id="${sheet.id}" class="text-red-500 dark:text-red-400 text-xs font-bold delete-sheet-btn hover:underline">DELETE</button></div>`;
        grid.appendChild(d);
    });
};

export const renderMonthlySummaries = (summaries) => {
    const grid = document.getElementById('monthly-summary-grid'); if(!grid) return;
    grid.innerHTML = '';
    let total = 0;
    summaries.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(s => {
        total += (s.totalCollection - s.totalExpense);
        const div = document.createElement('div'); 
        div.className = 'bg-white dark:bg-slate-800 p-4 rounded shadow-sm border dark:border-slate-700';
        div.innerHTML = `
            <h4 class="font-bold text-lg dark:text-white">${s.monthName}</h4>
            <div class="mt-2 text-sm space-y-1">
                <p class="flex justify-between text-green-600 dark:text-green-400 font-medium">Col: <span>${formatCurrency(s.totalCollection)}</span></p>
                <p class="flex justify-between text-red-600 dark:text-red-400 font-medium">Exp: <span>${formatCurrency(s.totalExpense)}</span></p>
            </div>
            <div class="flex gap-4 mt-4 border-t dark:border-slate-700 pt-3">
                <button data-id="${s.id}" class="text-blue-600 dark:text-blue-400 text-xs font-bold edit-summary-btn">EDIT</button>
                <button data-id="${s.id}" class="text-red-500 dark:text-red-400 text-xs font-bold delete-summary-btn">DELETE</button>
            </div>`;
        grid.appendChild(div);
    });
    document.getElementById('total-society-balance').textContent = formatCurrency(total);
};

// --- DATA LOG RENDERERS ---
export const renderResidentsTable = (res) => {
    const body = document.getElementById('residents-table-body'); if(!body) return;
    body.innerHTML = '';
    res.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const row = body.insertRow();
        row.className = "hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors";
        row.innerHTML = `
            <td class="p-3 text-slate-700 dark:text-slate-300 font-bold">${r.flatNo}</td>
            <td class="p-3 font-medium dark:text-white">${r.ownerName}</td>
            <td class="p-3 dark:text-slate-200">${formatCurrency(r.maintAmount)}</td>
            <td class="p-3 text-sm dark:text-slate-400">${r.status || 'Sold'}</td>
            <td class="p-3 text-center space-x-3">
                <button data-id="${r.id}" class="text-blue-600 dark:text-blue-400 font-bold text-xs edit-resident-btn">EDIT</button>
                <button data-id="${r.id}" class="text-red-500 dark:text-red-400 font-bold text-xs delete-resident-btn">DELETE</button>
            </td>`;
    });
};

export const renderRecycleBin = (s) => {
    const container = document.getElementById('r-bin-content');
    if (!container) return;
    const deleted = s.filter(x => x.status === 'deleted');
    container.innerHTML = deleted.length === 0 ? '<p class="text-center py-8 text-slate-500">Recycle bin is empty.</p>' : '';
    deleted.forEach(x => {
        const d = document.createElement('div'); 
        d.className = "flex justify-between items-center p-3 border-b dark:border-slate-700";
        d.innerHTML = `<span class="dark:text-white font-medium">${x.name}</span>
            <button data-id="${x.id}" class="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold restore-sheet-btn">RESTORE</button>`;
        container.appendChild(d);
    });
};

export const renderStatus = (res, coll, filter) => {
    const body = document.getElementById('payment-status-table'); if(!body) return;
    body.innerHTML = '';
    const paidSet = new Set(coll.map(c => c.flatNo.toString().trim()));
    res.filter(r => {
        const paid = paidSet.has(r.flatNo.toString().trim());
        if (filter === 'pending') return !paid;
        if (filter === 'paid') return paid;
        return true;
    }).forEach(r => {
        const paid = paidSet.has(r.flatNo.toString().trim());
        const row = body.insertRow();
        row.innerHTML = `
            <td class="p-3 text-slate-700 dark:text-slate-300 font-bold">${r.flatNo}</td>
            <td class="p-3 font-medium dark:text-white">${r.ownerName}</td>
            <td class="p-3"><span class="px-3 py-1 rounded text-white text-[10px] font-bold" style="background-color:${paid ? '#228B22' : '#FF0000'}">${paid ? 'Paid' : 'Pending'}</span></td>`;
    });
};

export const renderExpenses = (e) => {
    const body = document.getElementById('expense-log-table'); if(!body) return;
    body.innerHTML = '';
    e.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 text-sm dark:text-slate-300">${x.date}</td><td class="p-3 text-sm dark:text-slate-200">${x.description}</td>
            <td class="p-3 font-bold dark:text-white">${formatCurrency(x.amount)}</td>
            <td class="p-3 text-right"><button data-id="${x.id}" class="text-red-500 font-bold text-[10px] delete-expense-btn">DELETE</button></td>`;
    });
};

export const renderCollections = (c) => {
    const body = document.getElementById('collection-log-table'); if(!body) return;
    body.innerHTML = '';
    c.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 text-sm dark:text-slate-300">${x.date}</td><td class="p-3 text-sm dark:text-slate-200">${x.flatNo} - ${x.ownerName}</td>
            <td class="p-3 font-bold text-green-600 dark:text-green-400">${formatCurrency(x.amount)}</td><td class="p-3 text-[10px] text-slate-400 uppercase">${x.mode}</td>`;
    });
};

// --- 2-SHEET EXCEL ENGINE ---
export const exportToExcel = (sheetName, residents, collections, expenses) => {
    try {
        const wb = XLSX.utils.book_new();
        const wsMain = {}; const wsExp = {};
        const sPaid = { fill: { fgColor: { rgb: "228B22" } }, font: { color: { rgb: "FFFFFF" } }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
        const sFloor = { fill: { fgColor: { rgb: "FFFF00" } }, font: { bold: true }, alignment: { horizontal: "center" }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
        const sBlue = { fill: { fgColor: { rgb: "2F75B5" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
        const sRed = { fill: { fgColor: { rgb: "FF0000" } }, font: { color: { rgb: "FFFFFF" } }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
        const sBorder = { border: { top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };

        const paidMap = new Map(collections.map(c => [c.flatNo.toString().trim(), c]));
        const floors = {};
        residents.forEach(r => { const f = r.flatNo.replace(/\D/g, '').substring(0,1) || "0"; if(!floors[f]) floors[f] = []; floors[f].push(r); });

        wsMain['!merges'] = [];
        Object.keys(floors).sort().forEach((fKey, index) => {
            const col = (index % 4) * 5; const rowStart = Math.floor(index / 4) * 15;
            wsMain[XLSX.utils.encode_cell({r:rowStart, c:col})] = {v: `Floor ${fKey}`, s: sFloor};
            wsMain['!merges'].push({s:{r:rowStart, c:col}, e:{r:rowStart, c:col+3}});
            ["Room", "Owner", "Amount Paid", "Status"].forEach((h, i) => wsMain[XLSX.utils.encode_cell({r:rowStart+1, c:col+i})] = {v: h, s: sBlue});
            floors[fKey].forEach((res, rIdx) => {
                const r = rowStart + 2 + rIdx; const pay = paidMap.get(res.flatNo.toString().trim());
                wsMain[XLSX.utils.encode_cell({r, c: col})] = {v: res.flatNo, s: sBorder};
                wsMain[XLSX.utils.encode_cell({r, c: col+1})] = {v: res.ownerName, s: sBorder};
                const style = pay ? sPaid : sRed;
                wsMain[XLSX.utils.encode_cell({r, c: col+2})] = {v: pay ? pay.amount : 0, s: style};
                wsMain[XLSX.utils.encode_cell({r, c: col+3})] = {v: pay ? "Paid" : "Pending", s: style};
            });
        });
        wsMain['!ref'] = "A1:Z100"; wsMain['!cols'] = Array(26).fill({wch: 12});
        XLSX.utils.book_append_sheet(wb, wsMain, "Maintenance");

        ["Date", "Description", "Amount"].forEach((h, i) => wsExp[XLSX.utils.encode_cell({r:0, c:i})] = {v:h, s:sBlue});
        expenses.sort((a,b) => new Date(a.date) - new Date(b.date)).forEach((e, i) => {
            const r = i + 1;
            wsExp[XLSX.utils.encode_cell({r, c:0})] = {v: e.date, s: sBorder};
            wsExp[XLSX.utils.encode_cell({r, c:1})] = {v: e.description, s: sBorder};
            wsExp[XLSX.utils.encode_cell({r, c:2})] = {v: e.amount, s: sBorder};
        });
        wsExp['!ref'] = `A1:C${expenses.length + 1}`; wsExp['!cols'] = [{wch:15}, {wch:40}, {wch:15}];
        XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

        XLSX.writeFile(wb, `${sheetName}_Report.xlsx`);
        showToast("Excel Exported (2 Sheets)");
    } catch (err) { showToast("Export Failed", true); }
};