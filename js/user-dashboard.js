import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanListContainer = document.getElementById("loanListContainer");

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Safety check for DB initialization
            if (!db) throw new Error("Database not found");

            // Query only loans belonging to this user
            const q = query(collection(db, "loans"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            
            loanListContainer.innerHTML = "";

            if (snapshot.empty) {
                loanListContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#64748b;">No active loans found for your account.</p>`;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const div = document.createElement("div");
                div.className = "loan-item";
                div.innerHTML = `
                    <div>
                        <h4 style="margin:0;">Principal: ₹${data.principal || 0}</h4>
                        <p style="margin:5px 0 0; font-size:13px; color:#64748b;">
                            Interest: ${data.interest || 0}% | Balance: ₹${data.remaining ?? (data.totalPayable || '0')}
                        </p>
                    </div>
                    <div class="status-badge" style="background:#dcfce7; color:#166534; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:700;">
                        ${data.status || 'ACTIVE'}
                    </div>
                `;
                loanListContainer.appendChild(div);
            });

        } catch (error) {
            console.error("Database Error:", error);
            loanListContainer.innerHTML = `<p style="color:#e11d48; text-align:center; padding:20px;">Connection Error: ${error.message}</p>`;
        }
    } else {
        // Redirect to login if session is expired
        window.location.href = "index.html";
    }
});

// Logout Handling
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
}
