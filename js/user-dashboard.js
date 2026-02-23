import { auth, db } from "./firebase-config.js"; [cite: 147]
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; [cite: 147]

async function loadUserDashboard() {
    const loanContainer = document.getElementById("loans");
    
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Fetch loans belonging only to this user
            const q = query(collection(db, "loans"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q); [cite: 148]
            
            loanContainer.innerHTML = "";
            
            if (snapshot.empty) {
                loanContainer.innerHTML = "<p style='text-align:center;'>No active loans found.</p>"; [cite: 149]
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const loanItem = document.createElement("div");
                loanItem.className = "loan-item";
                loanItem.innerHTML = `
                    <div class="loan-info">
                        <h4>Loan Amount: ₹${data.principal}</h4>
                        <p>Remaining Balance: ₹${data.remaining || data.totalPayable}</p>
                    </div>
                    <div class="status-badge status-active">
                        ${data.status || 'Active'}
                    </div>
                `;
                loanContainer.appendChild(loanItem);
            });
        } else {
            window.location.href = "index.html";
        }
    });
}

window.logout = () => {
    auth.signOut().then(() => {
        window.location.href = "index.html";
    });
};

document.addEventListener("DOMContentLoaded", loadUserDashboard);
