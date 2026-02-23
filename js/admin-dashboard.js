import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanListContainer = document.getElementById("loanListContainer");

/**
 * Main dashboard logic for authenticated users
 * Follows the "User Panel" responsibilities: viewing personal loans and status.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Safety check to ensure the database is initialized
            if (!db) throw new Error("Database not found");

            // Query loans collection where 'userId' matches current authenticated user.
            const q = query(collection(db, "loans"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            
            loanListContainer.innerHTML = "";

            if (snapshot.empty) {
                loanListContainer.innerHTML = `
                    <p style="text-align:center; padding:20px; color:#64748b;">
                        No active loan records found.
                    </p>`;
                return;
            }

            // Loop through each loan document found for this user
            snapshot.forEach((doc) => {
                const data = doc.data();
                const div = document.createElement("div");
                div.className = "loan-item";

                // Map data to the fields defined in your DATABASE STRUCTURE:
                // - principal
                // - remainingAmount
                // - status
                // - totalWithInterest
                div.innerHTML = `
                    <div class="loan-info">
                        <h4>Principal: ₹${data.principal || 0}</h4>
                        <p>
                            Outstanding: <strong>₹${data.remainingAmount ?? 0}</strong> | 
                            Total Payable: ₹${data.totalWithInterest || 'N/A'}
                        </p>
                        <p style="font-size:11px; margin-top:5px;">Interest Rate: ${data.interestRate}%</p>
                    </div>
                    <div class="status-badge ${data.status === 'active' ? 'status-active' : 'status-closed'}">
                        ${(data.status || 'active').toUpperCase()}
                    </div>
                `;
                loanListContainer.appendChild(div);
            });

        } catch (error) {
            console.error("Dashboard Error:", error);
            loanListContainer.innerHTML = `
                <div style="text-align:center; color:#e11d48; padding:20px;">
                    <p><strong>Database Error</strong></p>
                    <p style="font-size:12px;">${error.message}</p>
                </div>`;
        }
    } else {
        // Force redirect to login if session is invalid 
        window.location.href = "index.html";
    }
});

// Logout handling 
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
}
