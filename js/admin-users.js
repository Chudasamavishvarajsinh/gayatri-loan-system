import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const userTableBody = document.getElementById("userTableBody");

/**
 * Fetches all users from the 'users' collection and displays them in the table.
 */
async function fetchAllUsers() {
    try {
        // Query users collection, ordered by name
        const q = query(collection(db, "users"), orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        
        userTableBody.innerHTML = "";

        if (querySnapshot.empty) {
            userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:30px;">No customers found.</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const user = doc.data();
            const userId = doc.id;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>
                    <span class="user-name">${user.name || 'N/A'}</span>
                    <span class="user-email">${user.email}</span>
                </td>
                <td>${user.phone || 'N/A'}</td>
                <td style="max-width: 250px; font-size: 12px; color: #64748b;">
                    ${user.address || 'No address provided'}
                </td>
                <td>
                    <button class="btn-view" onclick="window.location.href='admin_user_details.html?id=${userId}'">
                        View History
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        userTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Error: ${error.message}</td></tr>`;
    }
}

// Security & Initialization
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchAllUsers();
    } else {
        window.location.href = "index.html";
    }
});
