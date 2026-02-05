// js/app.js
import { auth, db } from './config.js';
import { DataService } from './services.js';
import * as UI from './ui.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { onSnapshot, collection, query, where, getDocs, doc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- GLOBAL STATE ---
let state = { 
    residents: [], sheets: [], summaries: [], collections: [], expenses: [], 
    currentSheetId: null, currentSheetName: null, currentSheetDate: null, 
    activeStatusFilter: 'all', editingResidentId: null, editingSummaryId: null
};

// --- AUTHENTICATION ---
onAuthStateChanged(auth, user => {
    document.getElementById('loading').style.display = 'none';
    const authC = document.getElementById('auth-container');
    const contentC = document.getElementById('content-container');
    if (user) {
        authC.classList.add('hidden'); contentC.classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.email}`;
        initGlobalListeners();
    } else {
        authC.classList.remove('hidden'); contentC.classList.add('hidden');
    }
});

// --- GLOBAL REAL-TIME LISTENERS ---
function initGlobalListeners() {
    // 1. Listen for Finance Sheets
    onSnapshot(collection(db, 'expense_sheets'), s => { 
        state.sheets = s.docs.map(d => ({id: d.id, ...d.data()})); 
        UI.renderDashboardSheets(state.sheets); 
    });
    // 2. Listen for Residents
    onSnapshot(collection(db, 'residents'), s => { 
        state.residents = s.docs.map(d => ({id: d.id, ...d.data()})); 
        UI.renderResidents(state.residents); 
        populateFlatDropdown(); 
    });
    // 3. Listen for Monthly High-Level Summaries
    onSnapshot(collection(db, 'monthly_summary'), s => { 
        state.summaries = s.docs.map(d => ({id: d.id, ...d.data()})); 
        UI.renderMonthlySummaries(state.summaries); 
    });
}

// --- SHEET-SPECIFIC LISTENERS ---
function initSheetData(id) {
    // Listen for current sheet expenses
    onSnapshot(query(collection(db, 'expenses'), where('sheetId', '==', id)), s => {
        state.expenses = s.docs.map(d => ({id: d.id, ...d.data()}));
        UI.renderExpenses(state.expenses); 
        updateSheetSummary();
    });
    // Listen for current sheet maintenance collections
    onSnapshot(query(collection(db, 'maintenance'), where('sheetId', '==', id)), s => {
        state.collections = s.docs.map(d => ({id: d.id, ...d.data()}));
        UI.renderCollections(state.collections);
        UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
        updateSheetSummary();
    });
}

// --- CALCULATION LOGIC ---
async function updateSheetSummary() {
    const opening = await calculateOpening();
    const collected = state.collections.reduce((a, b) => a + b.amount, 0);
    const expenses = state.expenses.reduce((a, b) => a + b.amount, 0);
    const closing = opening + collected - expenses;
    
    document.getElementById('opening-balance').textContent = UI.formatCurrency(opening);
    document.getElementById('total-collected').textContent = UI.formatCurrency(collected);
    document.getElementById('total-expenses').textContent = UI.formatCurrency(expenses);
    const closingEl = document.getElementById('closing-balance');
    closingEl.textContent = UI.formatCurrency(closing);
    document.getElementById('balance-card').className = `p-6 rounded-lg ${closing < 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`;
}

async function calculateOpening() {
    const prev = state.sheets.filter(s => s.status === 'active' && s.createdAt.toMillis() < state.currentSheetDate);
    if (prev.length === 0) return 0;
    const ids = prev.map(s => s.id);
    const [cSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, 'maintenance'), where('sheetId', 'in', ids))),
        getDocs(query(collection(db, 'expenses'), where('sheetId', 'in', ids)))
    ]);
    let cTotal = 0, eTotal = 0;
    cSnap.forEach(d => cTotal += d.data().amount);
    eSnap.forEach(d => eTotal += d.data().amount);
    return cTotal - eTotal;
}

function populateFlatDropdown() {
    const sel = document.getElementById('m-flat'); if(!sel) return;
    sel.innerHTML = '<option value="">Select a Flat</option>';
    state.residents.filter(r => (r.status || 'Sold') === 'Sold').sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const opt = document.createElement('option'); opt.value = r.flatNo; opt.textContent = `${r.flatNo} - ${r.ownerName}`; sel.appendChild(opt);
    });
}

// --- EXCEL EXPORT HANDLER ---
async function handleExport() {
    try {
        UI.showToast("Preparing Excel...");
        const opening = await calculateOpening(); 
        UI.exportToExcel(
            state.currentSheetName,
            opening,
            state.collections,
            state.expenses
        );
        UI.showToast("Export Successful!");
    } catch (error) {
        console.error("Export failed:", error);
        UI.showToast("Export Failed", true);
    }
}

// --- EVENT DELEGATION (CLICKS) ---
document.addEventListener('click', async e => {
    const target = e.target;

    // Navigation: Enter Sheet
    const sc = target.closest('.sheet-card');
    if (sc) {
        state.currentSheetId = sc.dataset.id; 
        state.currentSheetName = sc.dataset.name; 
        state.currentSheetDate = parseInt(sc.dataset.date);
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('detail-view').classList.remove('hidden');
        document.getElementById('header-title').textContent = `Sheet: ${sc.dataset.name}`;
        UI.switchTab('status'); initSheetData(sc.dataset.id);
    }

    // Navigation: Back Buttons
    if (target.id?.includes('back-to-dashboard')) {
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('detail-view').classList.add('hidden');
        document.getElementById('residents-view').classList.add('hidden');
        document.getElementById('header-title').textContent = "Finance Dashboard";
    }

    // Navigation: Residents View
    if (target.id === 'manage-residents-btn') {
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('residents-view').classList.remove('hidden');
        document.getElementById('header-title').textContent = "Manage Residents";
    }

    // Modal Closing
    if (target.matches('[data-close]')) {
        target.closest('.fixed').classList.add('hidden');
    }

    // Sheet CRUD
    if (target.id === 'open-create-sheet-modal') {
        const m = UI.createModal('create-sheet-modal', 'Create New Finance Sheet', `
            <form id="cs-form">
                <input type="text" id="sn" placeholder="e.g., Oct 2025" required class="w-full border p-2 mb-4 rounded">
                <div class="flex justify-end gap-3">
                    <button type="button" class="bg-slate-200 py-2 px-4 rounded" data-close>Cancel</button>
                    <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded">Create</button>
                </div>
            </form>`);
        m.classList.remove('hidden');
        m.querySelector('form').onsubmit = async (ev) => {
            ev.preventDefault();
            await DataService.addSheet({ name: document.getElementById('sn').value, createdAt: new Date(), status: 'active' });
            m.classList.add('hidden');
            UI.showToast("Sheet Created");
        };
    }

    if (target.matches('.delete-sheet-btn')) {
        const {id, name} = target.dataset;
        if(confirm(`Move "${name}" to recycle bin?`)) {
            await DataService.updateSheet(id, { status: 'deleted' });
            UI.showToast("Moved to Bin");
        }
    }

    // Recycle Bin Logic
    if (target.id === 'open-sheet-recycle-bin-modal') {
        const m = UI.createModal('recycle-bin-modal', 'Sheet Recycle Bin', `
            <div id="sheet-recycle-bin-content" class="max-h-60 overflow-y-auto mb-4"></div>
            <div class="flex justify-end">
                <button type="button" class="bg-slate-200 py-2 px-4 rounded" data-close>Close</button>
            </div>`);
        UI.renderRecycleBin(state.sheets);
        m.classList.remove('hidden');
    }

    if (target.matches('.restore-sheet-btn')) {
        await DataService.updateSheet(target.dataset.id, { status: 'active' });
        UI.renderRecycleBin(state.sheets);
        UI.showToast("Sheet Restored");
    }

    if (target.matches('.perm-delete-sheet-btn')) {
        if(confirm("Permanently delete this sheet and all its data?")) {
            await DataService.permanentDeleteSheet(target.dataset.id);
            UI.renderRecycleBin(state.sheets);
            UI.showToast("Permanently Deleted", true);
        }
    }

    // Monthly Summary CRUD
    if (target.id === 'open-add-month-modal') {
        const m = UI.createModal('add-summary-modal', 'Add Month Summary', `
            <form id="summ-form">
                <input type="text" id="sm-name" placeholder="Month Name" required class="w-full border p-2 mb-2 rounded">
                <input type="number" id="sm-col" placeholder="Total Collection" required class="w-full border p-2 mb-2 rounded">
                <input type="number" id="sm-exp" placeholder="Total Expense" required class="w-full border p-2 mb-4 rounded">
                <div class="flex justify-end gap-3">
                    <button type="button" class="bg-slate-200 py-2 px-4 rounded" data-close>Cancel</button>
                    <button type="submit" class="bg-green-600 text-white py-2 px-4 rounded">Save</button>
                </div>
            </form>`);
        m.classList.remove('hidden');
        m.querySelector('form').onsubmit = async (ev) => {
            ev.preventDefault();
            await DataService.addSummary({
                monthName: document.getElementById('sm-name').value,
                totalCollection: parseFloat(document.getElementById('sm-col').value),
                totalExpense: parseFloat(document.getElementById('sm-exp').value),
                createdAt: new Date()
            });
            m.classList.add('hidden');
            UI.showToast("Summary Added");
        };
    }

    if (target.matches('.edit-summary-btn')) {
        const s = state.summaries.find(x => x.id === target.dataset.id);
        const m = UI.createModal('edit-summary-modal', 'Edit Summary', `
            <form id="edit-summ-form">
                <input type="text" id="esm-name" value="${s.monthName}" required class="w-full border p-2 mb-2 rounded">
                <input type="number" id="esm-col" value="${s.totalCollection}" required class="w-full border p-2 mb-2 rounded">
                <input type="number" id="esm-exp" value="${s.totalExpense}" required class="w-full border p-2 mb-4 rounded">
                <div class="flex justify-end gap-3">
                    <button type="button" class="bg-slate-200 py-2 px-4 rounded" data-close>Cancel</button>
                    <button type="submit" class="bg-blue-600 text-white py-2 px-4 rounded">Update</button>
                </div>
            </form>`);
        m.classList.remove('hidden');
        m.querySelector('form').onsubmit = async (ev) => {
            ev.preventDefault();
            await DataService.updateSummary(s.id, {
                monthName: document.getElementById('esm-name').value,
                totalCollection: parseFloat(document.getElementById('esm-col').value),
                totalExpense: parseFloat(document.getElementById('esm-exp').value)
            });
            m.classList.add('hidden');
            UI.showToast("Summary Updated");
        };
    }

    if (target.matches('.delete-summary-btn')) {
        if(confirm(`Delete summary for ${target.dataset.name}?`)) {
            await DataService.deleteSummary(target.dataset.id);
            UI.showToast("Summary Deleted", true);
        }
    }

    // Tabs & Status Filters
    if (target.dataset.tab) UI.switchTab(target.dataset.tab);
    if (target.dataset.filter) {
        state.activeStatusFilter = target.dataset.filter;
        document.querySelectorAll('#status-filters button').forEach(b => {
            b.className = b.dataset.filter === state.activeStatusFilter ? 'bg-blue-500 text-white px-3 py-1 text-sm rounded' : 'bg-gray-200 px-3 py-1 text-sm rounded';
        });
        UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
    }

    // General Row Deletes
    if (target.matches('.delete-expense-btn')) {
        if(confirm("Delete expense?")) await DataService.deleteExpense(target.dataset.id);
    }
    
    // Exports
    if (target.id === 'export-excel-btn') handleExport();
    
    // Auth Logout
    if (target.id === 'logoutButton') signOut(auth);
});

// --- FORM SUBMIT HANDLERS ---
document.getElementById('resident-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = { 
        flatNo: document.getElementById('r-flat').value, 
        ownerName: document.getElementById('r-name').value, 
        maintAmount: parseFloat(document.getElementById('r-amount').value), 
        status: document.getElementById('r-status').value 
    };
    await DataService.addResident(data); e.target.reset(); UI.showToast("Resident Added");
});

document.getElementById('maintenance-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addCollection({
        date: document.getElementById('m-date').value, flatNo: document.getElementById('m-flat').value,
        ownerName: document.getElementById('m-name').value, amount: parseFloat(document.getElementById('m-amount').value),
        mode: document.getElementById('m-mode').value, sheetId: state.currentSheetId
    });
    e.target.reset(); UI.showToast("Collection Logged");
});

document.getElementById('expense-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addExpense({
        date: document.getElementById('e-date').value, amount: parseFloat(document.getElementById('e-amount').value),
        description: document.getElementById('e-desc').value, sheetId: state.currentSheetId
    });
    e.target.reset(); UI.showToast("Expense Logged");
});

document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value); }
    catch (err) { document.getElementById('authError').textContent = "Login Failed"; }
};