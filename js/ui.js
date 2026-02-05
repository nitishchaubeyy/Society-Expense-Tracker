// js/ui.js
export const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const showToast = (m, isErr = false) => {
    const t = document.getElementById('toast');
    document.getElementById('toast-message').textContent = m;
    t.className = `fixed bottom-5 left-1/2 -translate-x-1/2 py-3 px-6 rounded shadow-lg z-50 text-white transition-transform ${isErr ? 'bg-red-600' : 'bg-slate-800'}`;
    t.classList.remove('translate-y-[200%]');
    setTimeout(() => t.classList.add('translate-y-[200%]'), 3000);
};

export const switchTab = (tab) => {
    document.querySelectorAll('#detail-tabs button').forEach(b => {
        const active = b.dataset.tab === tab;
        b.classList.toggle('tab-active', active); b.classList.toggle('text-gray-500', !active);
    });
    document.querySelectorAll('#tab-content > div').forEach(d => d.classList.toggle('hidden', !d.id.startsWith(tab)));
};

export const createModal = (id, title, content) => {
    let m = document.getElementById(id); if (m) m.remove();
    m = document.createElement('div');
    m.id = id; m.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50';
    m.innerHTML = `<div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"><button class="absolute top-2 right-4 text-2xl text-gray-400" data-close>&times;</button><h3 class="text-xl font-semibold mb-4">${title}</h3>${content}</div>`;
    document.getElementById('app').appendChild(m); return m;
};

// --- RENDERERS ---
export const renderDashboardSheets = (s) => {
    const grid = document.getElementById('sheets-grid'); if(!grid) return;
    grid.innerHTML = '';
    s.filter(x => x.status === 'active').forEach(sheet => {
        const d = document.createElement('div'); d.className = "bg-white p-6 rounded shadow cursor-pointer sheet-card";
        d.dataset.id = sheet.id; d.dataset.name = sheet.name; d.dataset.date = sheet.createdAt.toMillis();
        d.innerHTML = `<h3 class="font-bold text-lg">${sheet.name}</h3><p class="text-xs text-gray-400">${sheet.createdAt.toDate().toLocaleDateString()}</p>
        <button data-id="${sheet.id}" class="mt-4 text-red-500 text-xs delete-sheet-btn font-bold">DELETE</button>`;
        grid.appendChild(d);
    });
};

export const renderMonthlySummaries = (s) => {
    const grid = document.getElementById('monthly-summary-grid'); if(!grid) return;
    grid.innerHTML = '';
    let total = 0;
    s.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(x => {
        total += (x.totalCollection - x.totalExpense);
        const d = document.createElement('div'); d.className = "bg-white p-4 rounded shadow border";
        d.innerHTML = `<h4 class="font-bold text-lg">${x.monthName}</h4>
        <p class="text-green-600 text-sm">Col: ${formatCurrency(x.totalCollection)}</p>
        <p class="text-red-600 text-sm">Exp: ${formatCurrency(x.totalExpense)}</p>
        <div class="flex gap-4 mt-4 pt-2 border-t"><button data-id="${x.id}" class="text-blue-600 text-xs font-bold edit-summary-btn">EDIT</button>
        <button data-id="${x.id}" class="text-red-500 text-xs font-bold delete-summary-btn">DELETE</button></div>`;
        grid.appendChild(d);
    });
    document.getElementById('total-society-balance').textContent = formatCurrency(total);
};

export const renderResidentsTable = (res) => {
    const body = document.getElementById('residents-table-body'); if(!body) return;
    body.innerHTML = '';
    res.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 text-sm">${r.flatNo}</td><td class="p-3 font-medium">${r.ownerName}</td>
        <td class="p-3 text-sm">${formatCurrency(r.maintAmount)}</td><td class="p-3 text-sm">${r.status || 'Sold'}</td>
        <td class="p-3 text-right"><button data-id="${r.id}" class="text-blue-600 edit-resident-btn text-xs font-bold mr-2">EDIT</button>
        <button data-id="${r.id}" class="text-red-500 delete-resident-btn text-xs font-bold">DELETE</button></td>`;
    });
};

export const renderRecycleBin = (s) => {
    const b = document.getElementById('sheet-recycle-bin-content'); if(!b) return;
    b.innerHTML = '';
    s.filter(x => x.status === 'deleted').forEach(x => {
        const d = document.createElement('div'); d.className = "flex justify-between p-3 border-b items-center";
        d.innerHTML = `<span>${x.name}</span><button data-id="${x.id}" class="text-blue-600 font-bold text-xs restore-sheet-btn">RESTORE</button>`;
        b.appendChild(d);
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
        row.innerHTML = `<td class="p-3 text-sm">${r.flatNo}</td><td class="p-3 font-medium text-sm">${r.ownerName}</td>
        <td class="p-3"><span class="px-2 py-1 rounded text-white text-[10px] font-bold" style="background-color:${paid ? '#228B22' : '#FF0000'}">${paid ? 'Paid' : 'Pending'}</span></td>`;
    });
};

export const renderExpenses = (e) => {
    const b = document.getElementById('expense-log-table'); if(!b) return;
    b.innerHTML = '';
    e.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const r = b.insertRow();
        r.innerHTML = `<td class="p-3 text-xs">${x.date}</td><td class="p-3 text-xs">${x.description}</td><td class="p-3 text-xs font-bold">${formatCurrency(x.amount)}</td>
        <td class="p-3 text-right"><button data-id="${x.id}" class="text-red-500 font-bold text-[10px] delete-expense-btn">DELETE</button></td>`;
    });
};

export const renderCollections = (c) => {
    const b = document.getElementById('collection-log-table'); if(!b) return;
    b.innerHTML = '';
    c.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const r = b.insertRow();
        r.innerHTML = `<td class="p-3 text-xs">${x.date}</td><td class="p-3 text-xs">${x.flatNo} - ${x.ownerName}</td><td class="p-3 text-xs font-bold text-green-600">${formatCurrency(x.amount)}</td><td class="p-3 text-[10px] text-gray-400 uppercase">${x.mode}</td>`;
    });
};

// --- MASTER EXCEL ---
export const exportToExcel = (sheetName, residents, collections, expenses) => {
    const wb = XLSX.utils.book_new();
    const ws = {}; const paidMap = new Map(collections.map(c => [c.flatNo.toString().trim(), c]));
    const sPaid = { fill: { fgColor: { rgb: "228B22" } }, font: { color: { rgb: "FFFFFF" } }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
    const sFloor = { fill: { fgColor: { rgb: "FFFF00" } }, font: { bold: true }, alignment: { horizontal: "center" }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
    const sBlue = { fill: { fgColor: { rgb: "2F75B5" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
    const sRed = { fill: { fgColor: { rgb: "FF0000" } }, font: { color: { rgb: "FFFFFF" } }, border: { top: {style: "thin"}, bottom: {style: "thin"} } };
    const sBorder = { border: { top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };

    const floors = {};
    residents.forEach(r => { const f = r.flatNo.replace(/\D/g, '').substring(0,1) || "0"; if(!floors[f]) floors[f] = []; floors[f].push(r); });

    ws['!merges'] = [];
    Object.keys(floors).sort().forEach((fKey, index) => {
        const col = (index % 4) * 5; const rowStart = Math.floor(index / 4) * 15;
        ws[XLSX.utils.encode_cell({r:rowStart, c:col})] = {v: `Floor ${fKey}`, s: sFloor};
        ws['!merges'].push({s:{r:rowStart, c:col}, e:{r:rowStart, c:col+3}});
        ["Room", "Owner", "Amount Paid", "Status"].forEach((h, i) => ws[XLSX.utils.encode_cell({r:rowStart+1, c:col+i})] = {v: h, s: sBlue});
        floors[fKey].forEach((res, rIdx) => {
            const r = rowStart + 2 + rIdx; const pay = paidMap.get(res.flatNo.toString().trim());
            ws[XLSX.utils.encode_cell({r, c: col})] = {v: res.flatNo, s: sBorder};
            ws[XLSX.utils.encode_cell({r, c: col+1})] = {v: res.ownerName, s: sBorder};
            const style = pay ? sPaid : sRed;
            ws[XLSX.utils.encode_cell({r, c: col+2})] = {v: pay ? pay.amount : 0, s: style};
            ws[XLSX.utils.encode_cell({r, c: col+3})] = {v: pay ? "Paid" : "Pending", s: style};
        });
    });
    ws['!ref'] = "A1:Z100"; ws['!cols'] = Array(26).fill({wch: 12});
    XLSX.utils.book_append_sheet(wb, ws, "Maintenance");
    XLSX.writeFile(wb, `${sheetName}_Report.xlsx`);
};