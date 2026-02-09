// js/ui.js
export const formatCurrency = (a) => `₹${Number(a || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export const showToast = (m, isErr = false) => {
    const t = document.getElementById('toast');
    const msg = document.getElementById('toast-message');
    if (!t || !msg) return;
    msg.textContent = m;
    t.className = `fixed bottom-5 left-1/2 -translate-x-1/2 py-3 px-6 rounded shadow-lg z-50 text-white transition-transform ${isErr ? 'bg-red-600' : 'bg-slate-800'}`;
    t.classList.remove('translate-y-[200%]');
    setTimeout(() => t.classList.add('translate-y-[200%]'), 4000); // Extended visibility
};

export const createModal = (id, title, content) => {
    let m = document.getElementById(id); if (m) m.remove();
    m = document.createElement('div');
    m.id = id; m.className = 'fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50';
    m.innerHTML = `<div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border dark:border-slate-700">
        <button class="absolute top-2 right-4 text-2xl text-gray-400" data-close>&times;</button>
        <h3 class="text-xl font-bold mb-4 dark:text-white">${title}</h3><div id="${id}-content">${content}</div></div>`;
    document.getElementById('app').appendChild(m); return m;
};

export const switchTab = (tab) => {
    document.querySelectorAll('#detail-tabs button').forEach(b => {
        const active = b.dataset.tab === tab;
        b.className = `py-4 px-1 border-b-2 font-bold text-sm ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`;
    });
    const contents = document.querySelectorAll('#tab-content > div');
    contents.forEach(d => d.classList.toggle('hidden', !d.id.startsWith(tab)));
};

export const renderDashboardSheets = (s) => {
    const grid = document.getElementById('sheets-grid'); if(!grid) return;
    grid.innerHTML = '';
    s.filter(x => x.status === 'active').sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(sheet => {
        const d = document.createElement('div'); d.className = "bg-white dark:bg-slate-800 p-6 rounded shadow border dark:border-slate-700 cursor-pointer sheet-card";
        d.dataset.id = sheet.id; d.dataset.name = sheet.name; d.dataset.date = sheet.createdAt.toMillis();
        d.innerHTML = `<h3 class="font-bold text-lg dark:text-white">${sheet.name}</h3><p class="text-xs text-gray-400">${sheet.createdAt.toDate().toLocaleDateString()}</p>
        <button data-id="${sheet.id}" class="mt-4 text-red-500 text-xs font-bold delete-sheet-btn">DELETE</button>`;
        grid.appendChild(d);
    });
};

export const renderMonthlySummaries = (summaries) => {
    const grid = document.getElementById('monthly-summary-grid'); if(!grid) return;
    grid.innerHTML = '';
    let runningTotal = 0;
    summaries.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis()).forEach(s => {
        runningTotal += (Number(s.totalCollection) - Number(s.totalExpense));
        const div = document.createElement('div'); div.className = 'bg-white dark:bg-slate-800 p-4 rounded border dark:border-slate-700';
        div.innerHTML = `<h4 class="font-bold dark:text-white">${s.monthName}</h4>
            <div class="text-sm mt-1">
                <p class="text-green-600 font-medium">Collection: ${formatCurrency(s.totalCollection)}</p>
                <p class="text-red-600 font-medium">Expenses: ${formatCurrency(s.totalExpense)}</p>
            </div>
            <div class="flex gap-2 mt-4 pt-2 border-t dark:border-slate-700"><button data-id="${s.id}" class="text-blue-600 text-[10px] font-bold edit-summary-btn uppercase">Edit</button>
            <button data-id="${s.id}" class="text-red-500 text-[10px] font-bold delete-summary-btn uppercase ml-auto">Delete</button></div>`;
        grid.appendChild(div);
    });
    const balanceEl = document.getElementById('total-society-balance');
    if (balanceEl) balanceEl.textContent = formatCurrency(runningTotal);
};

export const renderResidentsTable = (res) => {
    const body = document.getElementById('residents-table-body'); if(!body) return;
    body.innerHTML = '';
    res.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 font-bold dark:text-white">${r.flatNo}</td><td class="p-3 dark:text-slate-300">${r.ownerName}</td><td class="p-3 dark:text-slate-300">${formatCurrency(r.maintAmount)}</td>
        <td class="p-3 text-right"><button data-id="${r.id}" class="text-blue-600 font-bold text-xs edit-resident-btn uppercase">Edit</button>
        <button data-id="${r.id}" class="text-red-500 font-bold text-xs delete-resident-btn ml-3 uppercase">Delete</button></td>`;
    });
};

export const renderStatus = (res, coll, filter) => {
    const body = document.getElementById('payment-status-table'); if(!body) return;
    body.innerHTML = '';
    const paidSet = new Set(coll.map(c => c.flatNo.toString().trim()));
    res.filter(r => {
        const isPaid = paidSet.has(r.flatNo.toString().trim());
        if (filter === 'pending') return !isPaid;
        if (filter === 'paid') return isPaid;
        return true;
    }).forEach(r => {
        const isPaid = paidSet.has(r.flatNo.toString().trim());
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 font-bold dark:text-white">${r.flatNo}</td><td class="p-3 dark:text-slate-300">${r.ownerName}</td>
        <td class="p-3"><span class="px-2 py-1 rounded text-white text-[10px] font-bold" style="background-color:${isPaid ? '#228B22' : '#FF0000'}">${isPaid ? 'Paid' : 'Pending'}</span></td>`;
    });
};

export const renderExpenses = (e) => {
    const body = document.getElementById('expense-log-table'); if(!body) return;
    body.innerHTML = '';
    e.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 dark:text-slate-300">${x.date}</td><td class="p-3 dark:text-slate-200">${x.description}</td><td class="p-3 font-bold dark:text-white">${formatCurrency(x.amount)}</td>
        <td class="p-3 text-right"><button data-id="${x.id}" class="text-red-500 text-[10px] font-bold delete-expense-btn uppercase">Delete</button></td>`;
    });
};

export const renderCollections = (c) => {
    const body = document.getElementById('collection-log-table'); if(!body) return;
    body.innerHTML = '';
    c.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(x => {
        const row = body.insertRow();
        row.innerHTML = `<td class="p-3 dark:text-slate-300">${x.date}</td><td class="p-3 dark:text-slate-200">${x.flatNo} - ${x.ownerName}</td><td class="p-3 font-bold text-green-600">${formatCurrency(x.amount)}</td>
        <td class="p-3 text-right"><button data-id="${x.id}" class="text-red-500 text-[10px] font-bold delete-collection-btn uppercase">Delete</button></td>`;
    });
};

export const renderRecycleBin = (s) => {
    const container = document.getElementById('r-bin-content'); if (!container) return;
    const deleted = s.filter(x => x.status === 'deleted');
    container.innerHTML = deleted.length === 0 ? '<p class="text-center py-8 text-slate-500">Bin is empty.</p>' : '';
    deleted.forEach(x => {
        const d = document.createElement('div'); d.className = "flex justify-between items-center p-3 border-b dark:border-slate-700";
        d.innerHTML = `<span class="dark:text-white font-medium">${x.name}</span><button data-id="${x.id}" class="text-blue-600 font-bold text-xs restore-sheet-btn uppercase">Restore</button>`;
        container.appendChild(d);
    });
};

// --- EXPORTS ---

export const exportToExcel = (sheetName, residents, collections, expenses) => {
    const wb = XLSX.utils.book_new();
    const paidMap = new Map(collections.map(c => [c.flatNo.toString().trim(), c]));
    
    // --- APPEALING COLOR PALETTE ---
    const colors = {
        yellowHeader: "FFFF00", 
        blueSubHeader: "4472C4", 
        greenPaid: "29B92C",   
        redPending: "FF4D4D",  
        lightGray: "F2F2F2",
        whiteText: "FFFFFF",
        blackText: "000000"
    };

    // --- STYLING DEFINITIONS ---
    const sFloor = { fill: { fgColor: { rgb: colors.yellowHeader } }, font: { bold: true }, alignment: { horizontal: "center" }, border: { outline: true, top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };
    const sSubHeader = { fill: { fgColor: { rgb: colors.blueSubHeader } }, font: { color: { rgb: colors.whiteText }, bold: true }, border: { outline: true, top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };
    const sPaid = { fill: { fgColor: { rgb: colors.greenPaid } }, font: { bold: true, color: { rgb: colors.whiteText } }, border: { outline: true, top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} }, alignment: { horizontal: "center" } };
    const sPending = { fill: { fgColor: { rgb: colors.redPending } }, border: { outline: true, top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };
    const sBorder = { border: { top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };
    const sSummary = { fill: { fgColor: { rgb: colors.lightGray } }, font: { bold: true }, border: { top: {style: "thin"}, bottom: {style: "thin"}, left: {style: "thin"}, right: {style: "thin"} } };
    
    const sGrandPaid = { fill: { fgColor: { rgb: colors.greenPaid } }, font: { color: { rgb: colors.whiteText }, bold: true }, border: { outline: true, top: {style: "medium"}, bottom: {style: "medium"}, left: {style: "medium"}, right: {style: "medium"} } };
    const sGrandPending = { fill: { fgColor: { rgb: colors.redPending } }, font: { color: { rgb: colors.whiteText }, bold: true }, border: { outline: true, top: {style: "medium"}, bottom: {style: "medium"}, left: {style: "medium"}, right: {style: "medium"} } };

    const wsMain = {};
    const floors = {}; 
    residents.forEach(r => { 
        const f = r.flatNo.charAt(0); 
        if(!floors[f]) floors[f] = []; 
        floors[f].push(r); 
    });

    let grandPaidCount = 0;
    let grandPendingCount = 0;
    let grandTotalPaidAmt = 0;
    let grandTotalPendingAmt = 0;
    
    wsMain['!merges'] = [];

    // --- DRAWING THE BLOCKS ---
    Object.keys(floors).sort().forEach((fKey, index) => {
        const col = (index % 4) * 5; 
        const rowStart = Math.floor(index / 4) * 12; 
        
        wsMain[XLSX.utils.encode_cell({r:rowStart, c:col})] = {v: `Floor ${fKey}`, s: sFloor};
        wsMain['!merges'].push({s:{r:rowStart, c:col}, e:{r:rowStart, c:col+3}});
        
        ["Room Number", "Owner Name", "Amount Paid (₹)", "Remarks"].forEach((h, i) => {
            wsMain[XLSX.utils.encode_cell({r:rowStart+1, c:col+i})] = {v:h, s:sSubHeader};
        });

        let floorAmt = 0;
        let floorPendCount = 0;

        floors[fKey].forEach((res, rIdx) => {
            const r = rowStart + 2 + rIdx;
            const pay = paidMap.get(res.flatNo.toString().trim());
            
            wsMain[XLSX.utils.encode_cell({r, c:col})] = {v: res.flatNo, s: sBorder};
            wsMain[XLSX.utils.encode_cell({r, c:col+1})] = {v: res.ownerName, s: sBorder};
            
            if(pay) {
                wsMain[XLSX.utils.encode_cell({r, c:col+2})] = {v: pay.amount, s: sPaid};
                wsMain[XLSX.utils.encode_cell({r, c:col+3})] = {v: "Paid", s: sBorder};
                floorAmt += pay.amount;
                grandTotalPaidAmt += pay.amount;
                grandPaidCount++;
            } else {
                wsMain[XLSX.utils.encode_cell({r, c:col+2})] = {v: "", s: sPending};
                wsMain[XLSX.utils.encode_cell({r, c:col+3})] = {v: res.status === 'Sold' ? 'Pending' : 'Unsold', s: sBorder};
                grandTotalPendingAmt += res.maintAmount;
                floorPendCount++;
                grandPendingCount++;
            }
        });

        const summaryRow = rowStart + 9;
        wsMain[XLSX.utils.encode_cell({r: summaryRow, c: col})] = {v: "Total", s: sSummary};
        wsMain[XLSX.utils.encode_cell({r: summaryRow, c: col+2})] = {v: floorAmt, s: sSummary};
        wsMain[XLSX.utils.encode_cell({r: summaryRow, c: col+3})] = {v: `Pending ${floorPendCount.toString().padStart(2, '0')}`, s: sSummary};
    });

    // --- POSITIONED GRAND TOTAL SECTION ---
    // Row 13 (index 12 is 3 cells below Floor 4 summary)
    // Column P (index 15 is 1 cell adjacent to Floor 7)
    const gtRow = 13; 
    const gtCol = 15;

    // Total Paid
    wsMain[XLSX.utils.encode_cell({r: gtRow, c: gtCol})] = {v: "Total Paid", s: sGrandPaid};
    wsMain[XLSX.utils.encode_cell({r: gtRow, c: gtCol+1})] = {v: grandPaidCount, s: sGrandPaid};
    wsMain[XLSX.utils.encode_cell({r: gtRow, c: gtCol+2})] = {v: `₹${grandTotalPaidAmt}`, s: sGrandPaid};

    // Total Remaining (Separated by 1 Row)
    wsMain[XLSX.utils.encode_cell({r: gtRow+2, c: gtCol})] = {v: "Total Rema", s: sGrandPending};
    wsMain[XLSX.utils.encode_cell({r: gtRow+2, c: gtCol+1})] = {v: grandPendingCount, s: sGrandPending};
    wsMain[XLSX.utils.encode_cell({r: gtRow+2, c: gtCol+2})] = {v: `₹${grandTotalPendingAmt}`, s: sGrandPending};

    wsMain['!ref'] = "A1:S50"; // Optimized print area
    wsMain['!cols'] = Array(20).fill({wch: 15});
    XLSX.utils.book_append_sheet(wb, wsMain, "Maintenance");

    const wsExp = XLSX.utils.json_to_sheet(expenses.map(e => ({ Date: e.date, Description: e.description, Amount: e.amount })));
    XLSX.utils.book_append_sheet(wb, wsExp, "Expenses");

    XLSX.writeFile(wb, `${sheetName}_Report.xlsx`);
};

export const exportToPDF = async (sheetName) => {
    const { jsPDF } = window.jspdf; const doc = new jsPDF('p', 'mm', 'a4');
    const capture = async (id, title, page) => {
        if (page > 1) doc.addPage();
        doc.setFontSize(16); doc.text(title, 105, 15, { align: "center" });
        const canvas = await html2canvas(document.getElementById(id), { scale: 2 });
        doc.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 25, 190, (canvas.height * 190) / canvas.width);
    };
    switchTab('status'); await capture('status-tab', `Maintenance: ${sheetName}`, 1);
    switchTab('expenses'); await capture('expenses-tab', `Expenses: ${sheetName}`, 2);
    doc.save(`${sheetName}_Report.pdf`); switchTab('status');
};

export const exportToImage = async (sheetName) => {
    const capture = async (id, name) => {
        const canvas = await html2canvas(document.getElementById(id), { scale: 2 });
        const link = document.createElement('a'); link.download = `${sheetName}_${name}.png`; link.href = canvas.toDataURL(); link.click();
    };
    switchTab('status'); await capture('status-tab', 'Maintenance');
    switchTab('expenses'); await capture('expenses-tab', 'Expenses');
    switchTab('status');
};