// js/services.js
import { db } from './config.js';
import { collection, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const DataService = {
    // Expense Operations
    async addExpense(data) { return await addDoc(collection(db, 'expenses'), data); },
    async deleteExpense(id) { return await deleteDoc(doc(db, 'expenses', id)); },

    // Maintenance/Collection Operations
    async addCollection(data) { return await addDoc(collection(db, 'maintenance'), data); },
    async deleteCollection(id) { return await deleteDoc(doc(db, 'maintenance', id)); }, // This was missing!

    // Resident Database Operations
    async addResident(data) { return await addDoc(collection(db, 'residents'), data); },
    async updateResident(id, data) { return await updateDoc(doc(db, 'residents', id), data); },
    async deleteResident(id) { return await deleteDoc(doc(db, 'residents', id)); },

    // Sheet Management
    async addSheet(data) { return await addDoc(collection(db, 'expense_sheets'), data); },
    async updateSheet(id, data) { return await updateDoc(doc(db, 'expense_sheets', id), data); },

    // Monthly Dashboard Summaries
    async addSummary(data) { return await addDoc(collection(db, 'monthly_summary'), data); },
    async updateSummary(id, data) { return await updateDoc(doc(db, 'monthly_summary', id), data); },
    async deleteSummary(id) { return await deleteDoc(doc(db, 'monthly_summary', id)); }
};