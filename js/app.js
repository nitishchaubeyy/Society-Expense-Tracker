// js/app.js
import { auth, db } from './config.js';
import { DataService } from './services.js';
import * as UI from './ui.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let state = { residents: [], sheets: [], summaries: [], collections: [], expenses: [], currentSheetId: null, currentSheetName: null, currentSheetDate: null, activeStatusFilter: 'all', editingResidentId: null };

// --- THEME & AUTH ---
function initTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    toggleBtn?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
    });
}
initTheme();

onAuthStateChanged(auth, user => {
    const loading = document.getElementById('loading');
    const authC = document.getElementById('auth-container');
    const contentC = document.getElementById('content-container');
    if (loading) loading.style.display = 'none';
    if (user) {
        authC?.classList.add('hidden'); contentC?.classList.remove('hidden');
        document.getElementById('welcomeMessage').textContent = `Welcome, ${user.email}`;
        initGlobal();
    } else {
        authC?.classList.remove('hidden'); contentC?.classList.add('hidden');
    }
});

function initGlobal() {
    onSnapshot(collection(db, 'expense_sheets'), s => { state.sheets = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderDashboardSheets(state.sheets); });
    onSnapshot(collection(db, 'residents'), s => { state.residents = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderResidentsTable(state.residents); populateFlatDropdown(); if(state.currentSheetId) UI.renderStatus(state.residents, state.collections, state.activeStatusFilter); });
    onSnapshot(collection(db, 'monthly_summary'), s => { state.summaries = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderMonthlySummaries(state.summaries); });
}

function initSheet(id) {
    onSnapshot(query(collection(db, 'expenses'), where('sheetId', '==', id)), s => { state.expenses = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderExpenses(state.expenses); updateSheetSummary(); });
    onSnapshot(query(collection(db, 'maintenance'), where('sheetId', '==', id)), s => { state.collections = s.docs.map(d => ({id: d.id, ...d.data()})); UI.renderCollections(state.collections); UI.renderStatus(state.residents, state.collections, state.activeStatusFilter); updateSheetSummary(); });
}

// --- CALCS & HELPERS ---
async function updateSheetSummary() {
    const opening = await calculateOpening();
    const colTotal = state.collections.reduce((a, b) => a + b.amount, 0);
    const expTotal = state.expenses.reduce((a, b) => a + b.amount, 0);
    const oEl = document.getElementById('opening-balance'); const cEl = document.getElementById('total-collected'); const eEl = document.getElementById('total-expenses'); const bEl = document.getElementById('closing-balance');
    if (oEl) oEl.textContent = UI.formatCurrency(opening); if (cEl) cEl.textContent = UI.formatCurrency(colTotal); if (eEl) eEl.textContent = UI.formatCurrency(expTotal); if (bEl) bEl.textContent = UI.formatCurrency(opening + colTotal - expTotal);
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

// --- MASTER CLICK LISTENER ---
document.addEventListener('click', async e => {
    const t = e.target;
    const sc = t.closest('.sheet-card');

    if (t.closest('#back-to-dashboard-from-detail') || t.closest('#back-to-dashboard-from-residents')) { location.reload(); return; }
    if (sc && !t.closest('.delete-sheet-btn')) {
        state.currentSheetId = sc.dataset.id; state.currentSheetName = sc.dataset.name; state.currentSheetDate = parseInt(sc.dataset.date);
        document.getElementById('dashboard-view')?.classList.add('hidden'); document.getElementById('detail-view')?.classList.remove('hidden');
        document.getElementById('header-title').textContent = `Sheet: ${sc.dataset.name}`;
        initSheet(sc.dataset.id); UI.switchTab('status'); return;
    }

    const tabBtn = t.closest('[data-tab]'); if (tabBtn) { UI.switchTab(tabBtn.dataset.tab); return; }
    if (t.dataset.filter) {
        state.activeStatusFilter = t.dataset.filter;
        document.querySelectorAll('#status-filters button').forEach(b => b.className = b.dataset.filter === state.activeStatusFilter ? 'bg-blue-500 text-white px-3 py-1 rounded text-sm' : 'bg-gray-200 dark:bg-slate-700 px-3 py-1 rounded text-sm');
        UI.renderStatus(state.residents, state.collections, state.activeStatusFilter); return;
    }

    if (t.id === 'manage-residents-btn') { document.getElementById('dashboard-view')?.classList.add('hidden'); document.getElementById('residents-view')?.classList.remove('hidden'); return; }
    if (t.id === 'open-sheet-recycle-bin-modal') { UI.createModal('r-bin', 'Recycle Bin', `<div id="r-bin-content" class="mb-4"></div><button class="bg-gray-200 dark:bg-slate-700 w-full py-2 rounded" data-close>CLOSE</button>`); UI.renderRecycleBin(state.sheets); return; }

    const editResBtn = t.closest('.edit-resident-btn');
    if (editResBtn) {
        const r = state.residents.find(x => x.id === editResBtn.dataset.id);
        if (r) { state.editingResidentId = r.id; document.getElementById('r-flat').value = r.flatNo; document.getElementById('r-name').value = r.ownerName; document.getElementById('r-amount').value = r.maintAmount; document.getElementById('resident-submit-btn').textContent = "Update"; document.getElementById('cancel-edit-btn')?.classList.remove('hidden'); }
    }

    if (t.id === 'open-create-sheet-modal') {
        const m = UI.createModal('cs', 'New Sheet', `<form id="f"><input id="sn" placeholder="e.g. Feb 2026" required class="w-full border p-2 mb-4 dark:bg-slate-700 rounded"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">CREATE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSheet({name: sn.value, createdAt: new Date(), status: 'active'}); m.remove(); };
    }

    if (t.id === 'open-add-month-modal') {
        const m = UI.createModal('as', 'Add Summary', `<form id="f"><input id="n" placeholder="Month Name" required class="w-full border p-2 mb-2 dark:bg-slate-700 rounded"><input id="c" type="number" placeholder="Col" required class="w-full border p-2 mb-2 dark:bg-slate-700 rounded"><input id="x" type="number" placeholder="Exp" required class="w-full border p-2 mb-4 dark:bg-slate-700 rounded"><div class="flex gap-2"><button type="button" class="bg-gray-200 w-full py-2 rounded" data-close>CANCEL</button><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">SAVE</button></div></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.addSummary({monthName: n.value, totalCollection: parseFloat(c.value), totalExpense: parseFloat(x.value), createdAt: new Date()}); m.remove(); };
    }

    if (t.closest('.edit-summary-btn')) {
        const s = state.summaries.find(x => x.id === t.closest('.edit-summary-btn').dataset.id);
        const m = UI.createModal('es', 'Edit Summary', `<form id="f"><input id="en" value="${s.monthName}" required class="w-full border p-2 mb-2 rounded dark:bg-slate-700"><input id="ec" type="number" value="${s.totalCollection}" required class="w-full border p-2 mb-2 rounded dark:bg-slate-700"><input id="ex" type="number" value="${s.totalExpense}" required class="w-full border p-2 mb-4 rounded dark:bg-slate-700"><button type="submit" class="bg-blue-600 text-white w-full py-2 rounded font-bold">UPDATE</button></form>`);
        m.querySelector('form').onsubmit = async ev => { ev.preventDefault(); await DataService.updateSummary(s.id, {monthName: en.value, totalCollection: parseFloat(ec.value), totalExpense: parseFloat(ex.value)}); m.remove(); };
    }

    if (t.closest('.delete-sheet-btn')) if(confirm("Bin?")) await DataService.updateSheet(t.closest('.delete-sheet-btn').dataset.id, {status: 'deleted'});
    if (t.closest('.restore-sheet-btn')) { await DataService.updateSheet(t.closest('.restore-sheet-btn').dataset.id, {status: 'active'}); UI.renderRecycleBin(state.sheets); }
    if (t.closest('.delete-resident-btn')) if(confirm("Delete?")) await DataService.deleteResident(t.closest('.delete-resident-btn').dataset.id);
    if (t.closest('.delete-expense-btn')) if(confirm("Delete?")) await DataService.deleteExpense(t.closest('.delete-expense-btn').dataset.id);
    if (t.closest('.delete-summary-btn')) if(confirm("Delete?")) await DataService.deleteSummary(t.closest('.delete-summary-btn').dataset.id);
    if (t.id === 'export-excel-btn') UI.exportToExcel(state.currentSheetName, state.residents, state.collections, state.expenses);
    if (t.matches('[data-close]')) { const mod = t.closest('.fixed'); if(mod) mod.remove(); }
    if (t.id === 'logoutButton') signOut(auth);
});

// --- FORMS ---
document.getElementById('resident-form')?.addEventListener('submit', async e => {
    e.preventDefault(); const d = { flatNo: r_flat.value, ownerName: r_name.value, maintAmount: parseFloat(r_amount.value), status: r_status.value };
    if(state.editingResidentId) { await DataService.updateResident(state.editingResidentId, d); state.editingResidentId = null; resident_submit_btn.textContent = "Add"; }
    else await DataService.addResident(d); e.target.reset(); UI.showToast("Success");
});

document.getElementById('m-flat')?.addEventListener('change', e => {
    const res = state.residents.find(r => r.flatNo === e.target.value);
    if(res) { m_name.value = res.ownerName; m_amount.value = res.maintAmount; }
});

document.getElementById('maintenance-form')?.addEventListener('submit', async e => {
    e.preventDefault(); await DataService.addCollection({date: m_date.value, flatNo: m_flat.value, ownerName: m_name.value, amount: parseFloat(m_amount.value), mode: m_mode.value, sheetId: state.currentSheetId}); e.target.reset(); UI.showToast("Logged");
});

document.getElementById('expense-form')?.addEventListener('submit', async e => {
    e.preventDefault(); await DataService.addExpense({date: e_date.value, amount: parseFloat(e_amount.value), description: e_desc.value, sheetId: state.currentSheetId}); e.target.reset(); UI.showToast("Logged");
});

const loginF = document.getElementById('loginForm');
if (loginF) { loginF.onsubmit = async e => { e.preventDefault(); try { await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value); } catch (err) { authError.textContent = "Failed"; } }; }