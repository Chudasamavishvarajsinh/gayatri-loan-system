import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const statusText = document.getElementById("currentStatusText");
const statusNote = document.getElementById("statusNote");

async function checkAccountStatus(user) {
    try {
        // Checking for any loan record to verify the user
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            statusText.innerText = "Verified Active User";
            statusText.style.color = "#166534";
            statusNote.innerText = "Your account is currently active. You can view your details on the My Dashboard page.";
        } else {
            statusText.innerText = "No Active Records";
            statusText.style.color = "#64748b";
            statusNote.innerText = "We couldn't find an active loan for your account. Please visit Chudasama Baldevsinh at our office for assistance.";
        }
    } catch (error) {
        console.error("Status Error:", error);
        statusText.innerText = "Error Checking Status";
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAccountStatus(user);
    } else {
        window.location.href = "index.html";
    }
});
