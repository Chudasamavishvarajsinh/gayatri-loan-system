import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const historyTable = document.getElementById("historyTable");

// Function to fetch and display the loan archive
async function loadHistory(user) {
    try {
        // Query to get all loans for the logged-in user
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        historyTable.innerHTML = "";
        
        if (snapshot.empty) {
            historyTable.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 30px; color: #64748b;">
                        No transaction history found.
                    </td>
                </tr>`;
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");
            
            // Populate the table cells with database fields
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
            historyTable.innerHTML += row.outerHTML;
        });
    } catch (error) {
        console.error("History Error:", error);
        historyTable.innerHTML = "<tr><td colspan='4' style='text-align:center; color:red;'>Failed to load history data.</td></tr>";
    }
}

// Ensure the user is logged in before fetching data
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadHistory(user);
    } else {
        window.location.href = "index.html";
    }
});
