// js/app.js
import { auth, db } from './config.js';
import { DataService } from './services.js';
import * as UI from './ui.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let state = { 
    residents: [], sheets: [], summaries: [], collections: [], expenses: [], 
    currentSheetId: null, currentSheetName: null, currentSheetDate: null, 
    activeStatusFilter: 'all', editResId: null 
};

// --- AUTHENTICATION ENGINE ---
onAuthStateChanged(auth, user => {
    const loading = document.getElementById('loading');
    const authBox = document.getElementById('auth-container');
    const contentBox = document.getElementById('content-container');

    if (loading) loading.style.display = 'none';

    if (user) {
        console.log("Auth Success: Loading Dashboard...");
        authBox.classList.add('hidden');
        contentBox.classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.email}`;
        initGlobal(); // Immediate call to load data
    } else {
        console.log("No User: Showing Login");
        authBox.classList.remove('hidden');
        contentBox.classList.add('hidden');
    }
});

// --- CORE DATA LISTENERS ---
function initGlobal() {
    // 1. Listen for Finance Sheets
    onSnapshot(collection(db, 'expense_sheets'), s => {
        state.sheets = s.docs.map(d => ({id: d.id, ...d.data()}));
        console.log("Sheets loaded:", state.sheets.length);
        UI.renderDashboardSheets(state.sheets);
    });

    // 2. Listen for Residents
    onSnapshot(collection(db, 'residents'), s => {
        state.residents = s.docs.map(d => ({id: d.id, ...d.data()}));
        console.log("Residents loaded:", state.residents.length);
        UI.renderResidentsTable(state.residents);
        populateFlatDropdown();
        if(state.currentSheetId) UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
    });

    // 3. Listen for Monthly Summaries
    onSnapshot(collection(db, 'monthly_summary'), s => {
        state.summaries = s.docs.map(d => ({id: d.id, ...d.data()}));
        console.log("Summaries loaded:", state.summaries.length);
        UI.renderMonthlySummaries(state.summaries);
    });
}

function initSheet(id) {
    // Expenses
    onSnapshot(query(collection(db, 'expenses'), where('sheetId', '==', id)), s => {
        state.expenses = s.docs.map(d => ({id: d.id, ...d.data()}));
        UI.renderExpenses(state.expenses);
        updateSheetSummary();
    });

    // Collections
    onSnapshot(query(collection(db, 'maintenance'), where('sheetId', '==', id)), s => {
        state.collections = s.docs.map(d => ({id: d.id, ...d.data()}));
        UI.renderCollections(state.collections);
        UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
        updateSheetSummary();
    });
}

// --- LOGIC & HELPERS ---
async function updateSheetSummary() {
    const opening = await calculateOpening();
    const colTotal = state.collections.reduce((a, b) => a + b.amount, 0);
    const expTotal = state.expenses.reduce((a, b) => a + b.amount, 0);
    document.getElementById('opening-balance').textContent = UI.formatCurrency(opening);
    document.getElementById('total-collected').textContent = UI.formatCurrency(colTotal);
    document.getElementById('total-expenses').textContent = UI.formatCurrency(expTotal);
    document.getElementById('closing-balance').textContent = UI.formatCurrency(opening + colTotal - expTotal);
}

async function calculateOpening() {
    const prev = state.sheets.filter(s => s.status === 'active' && s.createdAt.toMillis() < state.currentSheetDate);
    if (prev.length === 0) return 0;
    const ids = prev.map(s => s.id);
    const [cSnap, eSnap] = await Promise.all([
        getDocs(query(collection(db, 'maintenance'), where('sheetId', 'in', ids))),
        getDocs(query(collection(db, 'expenses'), where('sheetId', 'in', ids)))
    ]);
    let t = 0; cSnap.forEach(d => t += d.data().amount); eSnap.forEach(d => t -= d.data().amount);
    return t;
}

function populateFlatDropdown() {
    const sel = document.getElementById('m-flat');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Flat</option>';
    state.residents.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.flatNo; opt.textContent = `${r.flatNo} - ${r.ownerName}`;
        sel.appendChild(opt);
    });
}

// --- MASTER CLICK LISTENER (Event Delegation) ---
document.addEventListener('click', async e => {
    const t = e.target;

    // Navigation: Back
    if (t.closest('#back-to-dashboard-from-detail') || t.closest('#back-to-dashboard-from-residents')) {
        location.reload(); return;
    }

    // Navigation: Tabs
    const tabBtn = t.closest('[data-tab]');
    if (tabBtn) { UI.switchTab(tabBtn.dataset.tab); return; }

    // Navigation: Filters
    if (t.dataset.filter) {
        state.activeStatusFilter = t.dataset.filter;
        document.querySelectorAll('#status-filters button').forEach(b => {
            b.className = b.dataset.filter === state.activeStatusFilter ? 'bg-blue-500 text-white px-3 py-1 rounded text-sm' : 'bg-gray-200 px-3 py-1 rounded text-sm';
        });
        UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
        return;
    }

    // Action: Open Sheet
    const sc = t.closest('.sheet-card');
    if (sc && !t.closest('.delete-sheet-btn')) {
        state.currentSheetId = sc.dataset.id;
        state.currentSheetName = sc.dataset.name;
        state.currentSheetDate = parseInt(sc.dataset.date);
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('detail-view').classList.remove('hidden');
        document.getElementById('header-title').textContent = `Sheet: ${sc.dataset.name}`;
        initSheet(sc.dataset.id); UI.switchTab('status'); return;
    }

    // Action: Manage Residents
    if (t.id === 'manage-residents-btn') {
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('residents-view').classList.remove('hidden');
        return;
    }

    // Excel Export
    if (t.id === 'export-excel-btn') {
        UI.exportToExcel(state.currentSheetName, state.residents, state.collections, state.expenses);
    }

    // Modals
    if (t.id === 'open-create-sheet-modal') {
        const m = UI.createModal('cs', 'New Sheet', `<form id="f"><input id="sn" placeholder="e.g. Feb 2026" required class="w-full border p-2 mb-4 rounded"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">CREATE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSheet({name: sn.value, createdAt: new Date(), status: 'active'}); m.remove(); };
    }

    if (t.id === 'open-sheet-recycle-bin-modal') {
        UI.createModal('r-bin', 'Recycle Bin', `<div id="sheet-recycle-bin-content" class="mb-4"></div><button class="bg-gray-200 w-full py-2 rounded" data-close>Close</button>`);
        UI.renderRecycleBin(state.sheets);
    }

    if (t.id === 'open-add-month-modal') {
        const m = UI.createModal('as', 'Add Summary', `<form id="f"><input id="n" placeholder="Month Name" required class="w-full border p-2 mb-2 rounded"><input id="c" type="number" placeholder="Col" required class="w-full border p-2 mb-2"><input id="x" type="number" placeholder="Exp" required class="w-full border p-2 mb-4"><div class="flex gap-2"><button type="button" class="bg-gray-200 w-full py-2 rounded" data-close>CANCEL</button><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">SAVE</button></div></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSummary({monthName: n.value, totalCollection: parseFloat(c.value), totalExpense: parseFloat(x.value), createdAt: new Date()}); m.remove(); };
    }

    // Dynamic Edits/Deletes
    if (t.closest('.edit-summary-btn')) {
        const btn = t.closest('.edit-summary-btn');
        const s = state.summaries.find(x => x.id === btn.dataset.id);
        const m = UI.createModal('es', 'Edit Summary', `<form id="f"><input id="en" value="${s.monthName}" required class="w-full border p-2 mb-2 rounded"><input id="ec" type="number" value="${s.totalCollection}" required class="w-full border p-2 mb-2"><input id="ex" type="number" value="${s.totalExpense}" required class="w-full border p-2 mb-4"><div class="flex gap-2"><button type="button" class="bg-gray-200 w-full py-2 rounded" data-close>CANCEL</button><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">UPDATE</button></div></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.updateSummary(s.id, {monthName: en.value, totalCollection: parseFloat(ec.value), totalExpense: parseFloat(ex.value)}); m.remove(); };
    }

    if (t.closest('.delete-sheet-btn')) if(confirm("Bin?")) await DataService.updateSheet(t.closest('.delete-sheet-btn').dataset.id, {status: 'deleted'});
    if (t.closest('.delete-resident-btn')) if(confirm("Delete?")) await DataService.deleteResident(t.closest('.delete-resident-btn').dataset.id);
    if (t.closest('.delete-expense-btn')) if(confirm("Delete?")) await DataService.deleteExpense(t.closest('.delete-expense-btn').dataset.id);
    if (t.closest('.delete-summary-btn')) if(confirm("Delete?")) await DataService.deleteSummary(t.closest('.delete-summary-btn').dataset.id);
    if (t.closest('.restore-sheet-btn')) await DataService.updateSheet(t.closest('.restore-sheet-btn').dataset.id, {status: 'active'});

    if (t.matches('[data-close]')) { const mod = t.closest('.fixed'); if(mod) mod.remove(); }
    if (t.id === 'logoutButton') signOut(auth);
});

// Dropdown Match
document.getElementById('m-flat')?.addEventListener('change', e => {
    const res = state.residents.find(r => r.flatNo === e.target.value);
    if(res) { document.getElementById('m-name').value = res.ownerName; document.getElementById('m-amount').value = res.maintAmount; }
});

// Forms
document.getElementById('resident-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addResident({flatNo: document.getElementById('r-flat').value, ownerName: document.getElementById('r-name').value, maintAmount: parseFloat(document.getElementById('r-amount').value), status: document.getElementById('r-status').value});
    e.target.reset(); UI.showToast("Success");
});

document.getElementById('maintenance-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addCollection({date: document.getElementById('m-date').value, flatNo: document.getElementById('m-flat').value, ownerName: document.getElementById('m-name').value, amount: parseFloat(document.getElementById('m-amount').value), mode: document.getElementById('m-mode').value, sheetId: state.currentSheetId});
    e.target.reset(); UI.showToast("Logged");
});

document.getElementById('expense-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addExpense({date: document.getElementById('e-date').value, amount: parseFloat(document.getElementById('e-amount').value), description: document.getElementById('e-desc').value, sheetId: state.currentSheetId});
    e.target.reset(); UI.showToast("Logged");
});

document.getElementById('loginForm').onsubmit = async (e) => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value); } catch (err) { authError.textContent = "Login Failed"; }
};