import { auth, db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// UI Elements from status.html
const statusIndicator = document.getElementById("statusIndicator");
const currentStatusText = document.getElementById("currentStatusText");
const statusNote = document.getElementById("statusNote");
const lastUpdatedTime = document.getElementById("lastUpdatedTime");

/**
 * Checks the 'loans' collection to verify the user's standing.
 */
async function checkAccountStatus(user) {
    try {
        if (!db) throw new Error("Database connection failed");

        // Set the current time for the "Last updated" footer
        const now = new Date();
        lastUpdatedTime.innerText = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // Query for loans matching the user's UID 
        const q = query(collection(db, "loans"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            // No records found for this user
            statusIndicator.innerText = "!";
            statusIndicator.style.background = "#fef3c7";
            statusIndicator.style.color = "#92400e";
            currentStatusText.innerText = "No Active Records";
            statusNote.innerText = "We couldn't find any loan records for your account. Please contact Chudasama Baldevsinh at +91 9924232759 if you believe this is an error.";
            return;
        }

        let hasActiveLoan = false;
        snapshot.forEach((doc) => {
            if (doc.data().status === "active") {
                hasActiveLoan = true;
            }
        });

        if (hasActiveLoan) {
            // User has at least one active loan 
            statusIndicator.innerText = "✓";
            statusIndicator.style.background = "#dcfce7";
            statusIndicator.style.color = "#166534";
            currentStatusText.innerText = "Verified Active User";
            statusNote.innerText = "Your account is in good standing. You currently have at least one active loan being tracked in our system.";
        } else {
            // User has loans, but they are all closed 
            statusIndicator.innerText = "✓";
            statusIndicator.style.background = "#d1fae5";
            statusIndicator.style.color = "#065f46";
            currentStatusText.innerText = "All Loans Closed";
            statusNote.innerText = "All your previous loan records are marked as closed. Thank you for your timely payments!";
        }

    } catch (error) {
        console.error("Status Check Error:", error);
        currentStatusText.innerText = "Sync Error";
        statusNote.innerText = "We encountered an error while fetching your status. Please try refreshing the page.";
    }
}

// Authentication Guard
onAuthStateChanged(auth, (user) => {
    if (user) {
        checkAccountStatus(user);
    } else {
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
