import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

async function loadUserDashboard() {
    const loanContainer = document.getElementById("loans");
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Fetch only loans matching the logged-in user's UID
                const q = query(collection(db, "loans"), where("userId", "==", user.uid));
                const snapshot = await getDocs(q);
                
                loanContainer.innerHTML = "";
                
                if (snapshot.empty) {
                    loanContainer.innerHTML = "<p style='text-align:center; padding: 20px;'>No active loans found.</p>";
                    return;
                }

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const loanItem = document.createElement("div");
                    loanItem.className = "loan-item";
                    
                    // Display principal amount and remaining balance if available [cite: 70, 71]
                    loanItem.innerHTML = `
                        <div class="loan-info">
                            <h4>Loan Amount: ₹${data.principal || 0}</h4>
                            <p>Remaining: ₹${data.remaining !== undefined ? data.remaining : (data.totalPayable || 'N/A')}</p>
                        </div>
                        <div class="status-badge status-active">
                            ${data.status || 'Active'}
                        </div>
                    `;
                    loanContainer.appendChild(loanItem);
                });
            } catch (error) {
                console.error("Error loading loans:", error);
                loanContainer.innerHTML = "<p style='text-align:center; color:red;'>Error loading data.</p>";
            }
        } else {
            // Redirect to login if not authenticated [cite: 11]
            window.location.href = "index.html";
        }
    });
}

// Handle Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).then(() => {
            window.location.href = "index.html";
        });
    });
}

document.addEventListener("DOMContentLoaded", loadUserDashboard);
