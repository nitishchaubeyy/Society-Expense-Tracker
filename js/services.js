import { db } from './config.js';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const DataService = {
    // EXPENSES
    async addExpense(data) { return await addDoc(collection(db, 'expenses'), data); },
    async deleteExpense(id) { return await deleteDoc(doc(db, 'expenses', id)); },
    
    // COLLECTIONS
    async addCollection(data) { return await addDoc(collection(db, 'maintenance'), data); },
    async deleteCollection(id) { return await deleteDoc(doc(db, 'maintenance', id)); },

    // RESIDENTS
    async addResident(data) { return await addDoc(collection(db, 'residents'), data); },
    async updateResident(id, data) { return await updateDoc(doc(db, 'residents', id), data); },
    async deleteResident(id) { return await deleteDoc(doc(db, 'residents', id)); },

    // SHEETS
    async addSheet(data) { return await addDoc(collection(db, 'expense_sheets'), data); },
    async updateSheet(id, data) { return await updateDoc(doc(db, 'expense_sheets', id), data); },
    
    // SUMMARIES
    async addSummary(data) { return await addDoc(collection(db, 'monthly_summary'), data); },
    async updateSummary(id, data) { return await updateDoc(doc(db, 'monthly_summary', id), data); },
    async deleteSummary(id) { return await deleteDoc(doc(db, 'monthly_summary', id)); },

    // RECYCLE BIN
    async permanentDeleteSheet(id) {
        const batch = writeBatch(db);
        const expDocs = await getDocs(query(collection(db, 'expenses'), where('sheetId', '==', id)));
        const mainDocs = await getDocs(query(collection(db, 'maintenance'), where('sheetId', '==', id)));
        expDocs.forEach(d => batch.delete(d.ref));
        mainDocs.forEach(d => batch.delete(d.ref));
        batch.delete(doc(db, 'expense_sheets', id));
        return await batch.commit();
    }
};