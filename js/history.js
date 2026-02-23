import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const historyTable = document.getElementById("historyTable");

async function loadHistory(user) {
    try {
        if (!db) throw new Error("Database connection failed");

        // Fetch all loans associated with this User ID
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        historyTable.innerHTML = "";
        
        if (snapshot.empty) {
            historyTable.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px; color:#64748b;">No payment history records found.</td></tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");
            
            // principal, status, meetingDate, and date are pulled from Firestore
            row.innerHTML = `
                <td>₹${data.principal || 0}</td>
                <td>
                    <span style="color: ${data.status === 'Paid' ? '#166534' : '#2563eb'}; font-weight: 700;">
                        ${data.status || 'Active'}
                    </span>
                </td>
                <td>${data.meetingDate || 'Not Fixed'}</td>
                <td>${data.date || 'N/A'}</td>
            `;
            historyTable.appendChild(row);
        });
    } catch (error) {
        console.error("History Error:", error);
        historyTable.innerHTML = "<tr><td colspan='4' style='text-align:center; color:red;'>Error loading history.</td></tr>";
    }
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadHistory(user);
    } else {
        window.location.href = "index.html";
    }
});
