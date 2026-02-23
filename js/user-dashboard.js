import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanListContainer = document.getElementById("loanListContainer");

// Main function to load active loans
async function loadDashboardData(user) {
    try {
        // Query only loans belonging to the logged-in user
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        loanListContainer.innerHTML = "";
        
        if (snapshot.empty) {
            loanListContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; color: #64748b;">
                    <p>No active loans found in your records.</p>
                    <p style="font-size: 12px;">Contact the administrator to open a new loan account.</p>
                </div>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const loanItem = document.createElement("div");
            loanItem.className = "loan-item";
            
            // Render the principal and remaining balance
            loanItem.innerHTML = `
                <div class="loan-info">
                    <h4>Principal: ₹${data.principal || 0}</h4>
                    <p>Remaining Balance: ₹${data.remaining !== undefined ? data.remaining : (data.totalPayable || 'N/A')}</p>
                    <p style="font-size: 11px; margin-top: 4px;">Date Issued: ${data.date || 'N/A'}</p>
                </div>
                <div class="status-badge">
                    ${data.status || 'Active'}
                </div>
            `;
            loanListContainer.appendChild(loanItem);
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        loanListContainer.innerHTML = "<p style='text-align:center; color:red; padding:20px;'>Error connecting to database. Please refresh.</p>";
    }
}

// Authentication Watcher
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadDashboardData(user);
    } else {
        // If not logged in, force redirect to login page
        window.location.href = "index.html";
    }
});

// Logout Logic
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch((err) => {
            alert("Error logging out: " + err.message);
        });
    });
}
