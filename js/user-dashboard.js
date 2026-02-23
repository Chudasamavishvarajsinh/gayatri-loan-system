import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanListContainer = document.getElementById("loanListContainer");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("System: User authenticated:", user.uid);
        try {
            // Attempt to fetch loans
            const q = query(collection(db, "loans"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            
            loanListContainer.innerHTML = "";

            if (snapshot.empty) {
                console.log("System: No loans found for this UID.");
                loanListContainer.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #64748b;">
                        <p>No active loan records found.</p>
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
                        <p>Balance: ₹${data.remaining ?? (data.totalPayable || '0')}</p>
                    </div>
                    <div class="status-badge" style="background:#dcfce7; color:#166534; padding:5px 10px; border-radius:5px;">
                        ${data.status || 'ACTIVE'}
                    </div>
                `;
                loanListContainer.appendChild(loanItem);
            });
            console.log("System: Dashboard loaded successfully.");

        } catch (error) {
            console.error("Detailed Database Error:", error);
            loanListContainer.innerHTML = `
                <div style="text-align: center; color: #e11d48; padding: 20px;">
                    <p><strong>Connection Error</strong></p>
                    <p style="font-size: 12px;">Error Code: ${error.code || 'Unknown'}</p>
                    <p style="font-size: 11px;">Check console (F12) for details.</p>
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
