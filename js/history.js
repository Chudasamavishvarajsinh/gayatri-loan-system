import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const historyTable = document.getElementById("historyTable");

async function loadLedger(user) {
    try {
        if (!db) throw new Error("Database not initialized");

        // 1. Fetch loans first to get labels (Principal amounts)
        const loansQ = query(collection(db, "loans"), where("userId", "==", user.uid));
        const loansSnap = await getDocs(loansQ);
        const loansMap = {};
        loansSnap.forEach(doc => { loansMap[doc.id] = doc.data().principal; });

        // 2. Fetch ledger entries as defined in your DATABASE STRUCTURE
        const ledgerQ = query(collection(db, "ledger"), where("userId", "==", user.uid));
        const ledgerSnap = await getDocs(ledgerQ);
        
        historyTable.innerHTML = "";

        if (ledgerSnap.empty) {
            historyTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#64748b;">No payment history found.</td></tr>`;
            return;
        }

        let payments = [];
        ledgerSnap.forEach(doc => { payments.push({ id: doc.id, ...doc.data() }); });

        // Sort by date (Newest first)
        payments.sort((a, b) => new Date(b.date) - new Date(a.date));

        payments.forEach(payment => {
            const dateObj = new Date(payment.date);
            const loanLabel = loansMap[payment.loanId] ? `Loan (₹${loansMap[payment.loanId]})` : "Active Loan";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td class="amount-cell">+ ₹${payment.amount || 0}</td>
                <td>
                    <span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:6px; font-weight:700; font-size:11px;">
                        SUCCESS
                    </span>
                </td>
                <td>
                    <div style="font-weight:600;">${loanLabel}</div>
                    <div style="font-size:11px; color:#94a3b8;">Ref: ${payment.id.substring(0,8)}</div>
                </td>
                <td class="date-cell">
                    <div style="font-weight:600;">${dateObj.toLocaleDateString('en-IN')}</div>
                    <div style="font-size:12px; color:#64748b;">${dateObj.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}</div>
                </td>
            `;
            historyTable.appendChild(row);
        });

    } catch (error) {
        console.error("Ledger Error:", error);
        historyTable.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Failed to load ledger: ${error.message}</td></tr>`;
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadLedger(user);
    } else {
        window.location.href = "index.html";
    }
});

// Logout handling
document.getElementById("logoutBtn")?.addEventListener("click", () => {
    signOut(auth).then(() => window.location.href = "index.html");
});
