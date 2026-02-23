import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const loanList = document.getElementById("loanListContainer");

onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            // Only fetch loans where userId matches the logged-in user
            const q = query(collection(db, "loans"), where("userId", "==", user.uid));
            const snapshot = await getDocs(q);
            
            loanList.innerHTML = "";
            
            if (snapshot.empty) {
                loanList.innerHTML = "<p style='text-align:center; padding:20px;'>No active loans found in your records.</p>";
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const div = document.createElement("div");
                div.className = "loan-item";
                div.innerHTML = `
                    <div>
                        <h4 style="margin:0;">Loan Amount: ₹${data.principal || 0} [cite: 71]</h4>
                        <p style="margin:5px 0 0; font-size:13px; color:#64748b;">
                            Interest: ${data.interest || 0}% | Duration: ${data.months || 0} Mo. [cite: 72, 73]
                        </p>
                    </div>
                    <div class="status-badge">ACTIVE</div>
                `;
                loanList.appendChild(div);
            });
        } catch (err) {
            loanList.innerHTML = "<p style='color:red; text-align:center;'>Database Error. Please refresh.</p>";
            console.error(err);
        }
    } else {
        window.location.href = "index.html";
    }
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html");
});
