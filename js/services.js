// js/services.js
import { db } from './config.js';
import { collection, addDoc, deleteDoc, doc, updateDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const DataService = {
    async addExpense(data) { return await addDoc(collection(db, 'expenses'), data); },
    async deleteExpense(id) { return await deleteDoc(doc(db, 'expenses', id)); },
    async addCollection(data) { return await addDoc(collection(db, 'maintenance'), data); },
    async addResident(data) { return await addDoc(collection(db, 'residents'), data); },
    async updateResident(id, data) { return await updateDoc(doc(db, 'residents', id), data); }, // Fixed: Added this
    async deleteResident(id) { return await deleteDoc(doc(db, 'residents', id)); },
    async addSheet(data) { return await addDoc(collection(db, 'expense_sheets'), data); },
    async updateSheet(id, data) { return await updateDoc(doc(db, 'expense_sheets', id), data); },
    async addSummary(data) { return await addDoc(collection(db, 'monthly_summary'), data); },
    async updateSummary(id, data) { return await updateDoc(doc(db, 'monthly_summary', id), data); },
    async deleteSummary(id) { return await deleteDoc(doc(db, 'monthly_summary', id)); }
};