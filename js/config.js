import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC-ndIaiKx734_YbuL6-W8j9F3Jw2uX7Qw",
    authDomain: "society-expense-tracker.firebaseapp.com",
    projectId: "society-expense-tracker",
    storageBucket: "society-expense-tracker.appspot.com",
    messagingSenderId: "909500443985",
    appId: "1:909500443985:web:488dead071c81fb73bb770"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);