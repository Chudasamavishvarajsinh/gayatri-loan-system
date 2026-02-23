import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const statusText = document.getElementById("currentStatusText");
const statusNote = document.getElementById("statusNote");

async function checkAccountStatus(user) {
    try {
        // Look for active loans or applications
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            statusText.innerText = "Verified Active User";
            statusText.style.color = "#166534";
            statusNote.innerText = "Your account is in good standing. You can view all active details on your main dashboard.";
        } else {
            statusText.innerText = "No Active Loan";
            statusText.style.color = "#64748b";
            statusNote.innerText = "We couldn't find an active loan for this account. If you just applied, please visit our office for approval.";
        }
    } catch (error) {
        statusText.innerText = "Error Loading Status";
        console.error(error);
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAccountStatus(user);
    } else {
        window.location.href = "index.html";
    }
});
