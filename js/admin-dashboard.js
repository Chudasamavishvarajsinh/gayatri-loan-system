import { auth, db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// UI Elements
const statUsers = document.getElementById("stat-totalUsers");
const statActive = document.getElementById("stat-activeLoans");
const statClosed = document.getElementById("stat-closedLoans");
const statOutstanding = document.getElementById("stat-outstanding");
const logoutBtn = document.getElementById("logoutBtn");

/**
 * Calculates and updates dashboard statistics
 */
async function loadDashboardStats() {
    try {
        // 1. Get Total Users
        const usersSnap = await getDocs(collection(db, "users"));
        statUsers.innerText = usersSnap.size;

        // 2. Get Loan Stats
        const loansSnap = await getDocs(collection(db, "loans"));
        
        let activeCount = 0;
        let closedCount = 0;
        let totalOutstanding = 0;

        loansSnap.forEach((doc) => {
            const data = doc.data();
            
            if (data.status === "active") {
                activeCount++;
                // Add up the remaining amount for active loans
                totalOutstanding += Number(data.remainingAmount || 0);
            } else if (data.status === "closed") {
                closedCount++;
            }
        });

        // Update UI
        statActive.innerText = activeCount;
        statClosed.innerText = closedCount;
        statOutstanding.innerText = totalOutstanding.toLocaleString('en-IN');

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Security Check: Ensure only Admin can view this page
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Verify if UID exists in admins collection
        const adminSnap = await getDocs(query(collection(db, "admins"), where("__name__", "==", user.uid)));
        if (adminSnap.empty) {
            // Not an admin, kick to user page
            window.location.href = "user.html";
        } else {
            // Authorized Admin, load the data
            loadDashboardStats();
        }
    } else {
        // Not logged in
        window.location.href = "index.html";
    }
});

// Logout Logic
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});
