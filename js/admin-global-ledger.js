import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const ledgerTableBody = document.getElementById("globalLedgerBody");

/**
 * Fetches all transactions and maps User IDs to User Names
 */
async function loadGlobalLedger() {
    try {
        // 1. Get all ledger entries (Newest First)
        const ledgerQuery = query(collection(db, "ledger"), orderBy("date", "desc"));
        const ledgerSnap = await getDocs(ledgerQuery);

        if (ledgerSnap.empty) {
            ledgerTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:40px;">No transactions found.</td></tr>`;
            return;
        }

        ledgerTableBody.innerHTML = "";

        // Use a Map to cache user names (prevents redundant database hits)
        const userCache = new Map();

        for (const ledgerDoc of ledgerSnap.docs) {
            const data = ledgerDoc.data();
            const uId = data.userId;

            // 2. Resolve Name
            let userName = "Unknown User";
            if (userCache.has(uId)) {
                userName = userCache.get(uId);
            } else {
                const userSnap = await getDoc(doc(db, "users", uId));
                if (userSnap.exists()) {
                    userName = userSnap.data().name;
                    userCache.set(uId, userName);
                }
            }

            // 3. Render Row
            const row = document.createElement("tr");
            const formattedDate = data.date ? new Date(data.date.toDate()).toLocaleDateString('en-IN') : "N/A";
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td><strong>${userName}</strong></td>
                <td>${data.note || '-'}</td>
                <td class="amount-cell">₹${Number(data.amount).toLocaleString('en-IN')}</td>
            `;
            ledgerTableBody.appendChild(row);
        }

    } catch (error) {
        console.error("Ledger Error:", error);
        ledgerTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Error loading history: ${error.message}</td></tr>`;
    }
}

// Check Auth and Initialize
onAuthStateChanged(auth, (user) => {
    if (user) loadGlobalLedger();
    else window.location.href = "index.html";
});
