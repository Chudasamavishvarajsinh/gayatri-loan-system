import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanListContainer = document.getElementById("loanListContainer");

// Ensure the code runs ONLY after the page is ready
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Logged in as:", user.uid);
        try {
            // CRITICAL: Ensure 'userId' field in Firestore matches exactly
            const loanRef = collection(db, "loans");
            const q = query(loanRef, where("userId", "==", user.uid));
            
            const snapshot = await getDocs(q);
            loanListContainer.innerHTML = "";

            if (snapshot.empty) {
                loanListContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #64748b;">
                        <p>No active records found for your account.</p>
                    </div>`;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const loanItem = document.createElement("div");
                loanItem.className = "loan-item";
                loanItem.innerHTML = `
                    <div class="loan-info">
                        <h4>Principal: ₹${data.principal || 0}</h4>
                        <p>Remaining: ₹${data.remaining ?? (data.totalPayable || 'N/A')}</p>
                    </div>
                    <div class="status-badge">ACTIVE</div>
                `;
                loanListContainer.appendChild(loanItem);
            });
        } catch (error) {
            console.error("Database Error:", error);
            // This is the red text you saw - I've added more detail to help us debug
            loanListContainer.innerHTML = `
                <div style="text-align: center; color: #e11d48; padding: 20px;">
                    <p><strong>Database Connection Error</strong></p>
                    <p style="font-size: 12px;">Please check if your Firestore Rules allow reading.</p>
                </div>`;
        }
    } else {
        window.location.href = "index.html";
    }
});

// Logout handling
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html");
});
