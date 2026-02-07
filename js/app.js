// js/app.js
import { auth, db } from './config.js';
import { DataService } from './services.js';
import * as UI from './ui.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let state = { residents: [], sheets: [], summaries: [], collections: [], expenses: [], currentSheetId: null, currentSheetName: null, currentSheetDate: null, activeStatusFilter: 'all', editingResidentId: null };

// --- VIEW MANAGEMENT ---
function renderView(viewId) {
    ['dashboard-view', 'residents-view', 'detail-view'].forEach(v => {
        const el = document.getElementById(v); if (el) el.classList.toggle('hidden', v !== viewId);
    });
}
function navigateTo(viewId) {
    history.pushState({ viewId }, '', `#${viewId}`); renderView(viewId);
}
window.addEventListener('popstate', (e) => {
    const viewId = (e.state && e.state.viewId) ? e.state.viewId : 'dashboard-view'; renderView(viewId);
});

// --- AUTH ---
onAuthStateChanged(auth, user => {
    document.getElementById('loading').style.display = 'none';
    if (user) {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('content-container').classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Admin: ${user.email}`;
        history.replaceState({ viewId: 'dashboard-view' }, '', '#dashboard-view');
        renderView('dashboard-view');
        initGlobal();
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('content-container').classList.add('hidden');
    }
});

function initGlobal() {
    onSnapshot(collection(db, 'expense_sheets'), s => { state.sheets = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderDashboardSheets(state.sheets); });
    onSnapshot(collection(db, 'residents'), s => { 
        state.residents = s.docs.map(d => ({id: d.id, ...d.data()})); 
        UI.renderResidentsTable(state.residents); populateFlatDropdown(); 
        if(state.currentSheetId) UI.renderStatus(state.residents, state.collections, state.activeStatusFilter);
    });
    onSnapshot(collection(db, 'monthly_summary'), s => { state.summaries = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderMonthlySummaries(state.summaries); });
}

function initSheet(id) {
    onSnapshot(query(collection(db, 'expenses'), where('sheetId', '==', id)), s => { state.expenses = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderExpenses(state.expenses); updateSheetSummary(); });
    onSnapshot(query(collection(db, 'maintenance'), where('sheetId', '==', id)), s => { 
        state.collections = s.docs.map(d => ({id: d.id, ...d.data()})); 
        UI.renderCollections(state.collections); UI.renderStatus(state.residents, state.collections, state.activeStatusFilter); updateSheetSummary(); 
    });
}

// --- FINANCIALS ---
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
    const [cSnap, eSnap] = await Promise.all([getDocs(query(collection(db, 'maintenance'), where('sheetId', 'in', ids))), getDocs(query(collection(db, 'expenses'), where('sheetId', 'in', ids)))]);
    let t = 0; cSnap.forEach(d => t += d.data().amount); eSnap.forEach(d => t -= d.data().amount); return t;
}

function populateFlatDropdown() {
    const sel = document.getElementById('m-flat'); if (!sel) return;
    sel.innerHTML = '<option value="">Select Flat</option>';
    state.residents.sort((a,b) => a.flatNo.localeCompare(b.flatNo)).forEach(r => {
        const opt = document.createElement('option'); opt.value = r.flatNo; opt.textContent = `${r.flatNo} - ${r.ownerName}`; sel.appendChild(opt);
    });
}

// --- MASTER CLICK HANDLER ---
document.addEventListener('click', async e => {
    const t = e.target;
    if (t.closest('#back-to-dashboard-from-detail') || t.closest('#back-to-dashboard-from-residents')) { history.back(); return; }
    
    if (t.closest('#theme-toggle')) {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light'; return;
    }

    const sc = t.closest('.sheet-card');
    if (sc && !t.closest('.delete-sheet-btn')) {
        state.currentSheetId = sc.dataset.id; state.currentSheetName = sc.dataset.name; state.currentSheetDate = parseInt(sc.dataset.date);
        navigateTo('detail-view');
        document.getElementById('header-title').textContent = `Sheet: ${sc.dataset.name}`;
        initSheet(sc.dataset.id); UI.switchTab('status'); return;
    }

    if (t.dataset.tab) { UI.switchTab(t.dataset.tab); return; }
    if (t.id === 'manage-residents-btn') { navigateTo('residents-view'); return; }
    if (t.id === 'open-sheet-recycle-bin-modal') { UI.createModal('r-bin', 'Bin History', `<div id="r-bin-content"></div>`); UI.renderRecycleBin(state.sheets); return; }

    // Deletes
    if (t.closest('.delete-collection-btn')) if(confirm("Delete Log?")) await DataService.deleteCollection(t.closest('.delete-collection-btn').dataset.id);
    if (t.closest('.delete-expense-btn')) if(confirm("Delete Log?")) await DataService.deleteExpense(t.closest('.delete-expense-btn').dataset.id);
    if (t.closest('.delete-sheet-btn')) if(confirm("Move to Bin?")) await DataService.updateSheet(t.closest('.delete-sheet-btn').dataset.id, {status: 'deleted'});
    if (t.closest('.restore-sheet-btn')) { await DataService.updateSheet(t.closest('.restore-sheet-btn').dataset.id, {status: 'active'}); UI.renderRecycleBin(state.sheets); }
    if (t.closest('.delete-resident-btn')) if(confirm("Delete Resident?")) await DataService.deleteResident(t.closest('.delete-resident-btn').dataset.id);
    if (t.closest('.delete-summary-btn')) if(confirm("Delete Summary?")) await DataService.deleteSummary(t.closest('.delete-summary-btn').dataset.id);

    // Edit Resident Populator
    if (t.closest('.edit-resident-btn')) {
        const r = state.residents.find(x => x.id === t.closest('.edit-resident-btn').dataset.id);
        if (r) { state.editingResidentId = r.id; document.getElementById('r-flat').value = r.flatNo; document.getElementById('r-name').value = r.ownerName; document.getElementById('r-amount').value = r.maintAmount; document.getElementById('resident-submit-btn').textContent = "Update"; document.getElementById('cancel-edit-btn').classList.remove('hidden'); }
    }
    if (t.id === 'cancel-edit-btn') { state.editingResidentId = null; document.getElementById('resident-form').reset(); t.classList.add('hidden'); document.getElementById('resident-submit-btn').textContent = "Add"; }

    // Summary Actions
    if (t.closest('.edit-summary-btn')) {
        const s = state.summaries.find(x => x.id === t.closest('.edit-summary-btn').dataset.id);
        const m = UI.createModal('es', 'Edit Summary', `<form id="f-sum"><input id="en" value="${s.monthName}" required class="w-full border p-2 mb-2 rounded dark:bg-slate-700 dark:text-white"><input id="ec" type="number" value="${s.totalCollection}" required class="w-full border p-2 mb-2 rounded dark:bg-slate-700 dark:text-white"><input id="ex" type="number" value="${s.totalExpense}" required class="w-full border p-2 mb-4 rounded dark:bg-slate-700 dark:text-white"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">UPDATE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.updateSummary(s.id, {monthName: document.getElementById('en').value, totalCollection: parseFloat(document.getElementById('ec').value), totalExpense: parseFloat(document.getElementById('ex').value)}); m.remove(); };
    }

    if (t.id === 'export-excel-btn') UI.exportToExcel(state.currentSheetName, state.residents, state.collections, state.expenses);
    if (t.id === 'export-pdf-btn') UI.exportToPDF(state.currentSheetName);
    if (t.id === 'export-image-btn') UI.exportToImage(state.currentSheetName);

    if (t.dataset.filter) {
        document.querySelectorAll('#status-filters button').forEach(b => b.className = b.dataset.filter === t.dataset.filter ? 'bg-blue-500 text-white px-3 py-1 text-xs rounded' : 'bg-gray-200 dark:bg-slate-700 px-3 py-1 text-xs rounded');
        UI.renderStatus(state.residents, state.collections, t.dataset.filter);
    }

    if (t.id === 'open-create-sheet-modal') {
        const m = UI.createModal('cs', 'New Sheet', `<form id="f"><input id="sn" required placeholder="e.g. Feb 2026" class="w-full border p-2 mb-4 dark:bg-slate-700 rounded dark:text-white"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">CREATE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSheet({name: document.getElementById('sn').value, createdAt: new Date(), status: 'active'}); m.remove(); };
    }
    
    // Monthly Summary Modal with requested Placeholders
    if (t.id === 'open-add-month-modal') {
        const m = UI.createModal('as', 'New Summary', `<form id="f"><input id="n" placeholder="Month" required class="w-full border p-2 mb-2 dark:bg-slate-700 rounded dark:text-white"><input id="c" type="number" placeholder="Collection" required class="w-full border p-2 mb-2 dark:bg-slate-700 rounded dark:text-white"><input id="x" type="number" placeholder="Expense" required class="w-full border p-2 mb-4 dark:bg-slate-700 rounded dark:text-white"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">SAVE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSummary({monthName: document.getElementById('n').value, totalCollection: parseFloat(document.getElementById('c').value), totalExpense: parseFloat(document.getElementById('x').value), createdAt: new Date()}); m.remove(); };
    }

    if (t.id === 'logoutButton') signOut(auth);
    if (t.matches('[data-close]')) { const mod = t.closest('.fixed'); if(mod) mod.remove(); }
});

// --- FORM HANDLING ---
document.getElementById('resident-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const d = { flatNo: document.getElementById('r-flat').value, ownerName: document.getElementById('r-name').value, maintAmount: parseFloat(document.getElementById('r-amount').value), status: document.getElementById('r-status').value };
    if (state.editingResidentId) { await DataService.updateResident(state.editingResidentId, d); state.editingResidentId = null; document.getElementById('resident-submit-btn').textContent = "Add"; document.getElementById('cancel-edit-btn').classList.add('hidden'); }
    else await DataService.addResident(d); e.target.reset(); UI.showToast("Success");
});

document.getElementById('m-flat')?.addEventListener('change', e => {
    const res = state.residents.find(r => r.flatNo === e.target.value);
    if(res) { document.getElementById('m-name').value = res.ownerName; document.getElementById('m-amount').value = res.maintAmount; }
});

document.getElementById('maintenance-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const flatSelected = document.getElementById('m-flat').value.toString().trim();
    // DUPLICATE CHECK TRIGGER
    const existing = state.collections.find(c => c.flatNo.toString().trim() === flatSelected);
    if (existing) {
        UI.showToast(`Error: ${flatSelected} already logged in this sheet!`, true);
        return;
    }
    await DataService.addCollection({ date: document.getElementById('m-date').value, flatNo: flatSelected, ownerName: document.getElementById('m-name').value, amount: parseFloat(document.getElementById('m-amount').value), mode: document.getElementById('m-mode').value, sheetId: state.currentSheetId });
    e.target.reset(); UI.showToast("Payment Logged");
});

document.getElementById('expense-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    await DataService.addExpense({ date: document.getElementById('e-date').value, amount: parseFloat(document.getElementById('e-amount').value), description: document.getElementById('e-desc').value, sheetId: state.currentSheetId });
    e.target.reset(); UI.showToast("Logged");
});

document.getElementById('loginForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try { await signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value); } catch (err) { document.getElementById('authError').textContent = "Login Failed"; }
});