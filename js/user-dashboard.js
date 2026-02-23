import { auth, db } from "./firebase-config.js";
import { doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// UI Elements
const userNameDisplay = document.getElementById("userName");
const userRemaining = document.getElementById("userRemaining");
const userPrincipal = document.getElementById("userPrincipal");
const userPaid = document.getElementById("userPaid");
const logoutBtn = document.getElementById("logoutBtn");

/**
 * Fetches the logged-in user's profile and active loan details
 */
async function loadUserData(user) {
    try {
        // 1. Fetch User Profile for the Welcome Name
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
            userNameDisplay.innerText = `Welcome, ${userSnap.data().name}!`;
        }

        // 2. Fetch Active Loan associated with this User UID
        const q = query(collection(db, "loans"), where("userId", "==", user.uid), where("status", "==", "active"));
        const loanSnap = await getDocs(q);

        if (!loanSnap.empty) {
            const loanData = loanSnap.docs[0].data();
            
            // Calculate totals
            const remaining = loanData.remainingAmount || 0;
            const totalWithInterest = loanData.totalWithInterest || 0;
            const paidSoFar = totalWithInterest - remaining;

            // Update UI
            userRemaining.innerText = `₹${remaining.toLocaleString('en-IN')}`;
            userPrincipal.innerText = `₹${loanData.principal.toLocaleString('en-IN')}`;
            userPaid.innerText = `₹${paidSoFar.toLocaleString('en-IN')}`;
        } else {
            // No active loan found
            userRemaining.innerText = "₹0";
            document.getElementById("loanStatusBadge").innerText = "NO ACTIVE LOAN";
            document.getElementById("loanStatusBadge").style.color = "#64748b";
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Authentication Check
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadUserData(user);
    } else {
        // Not logged in, redirect to login page
        window.location.href = "index.html";
    }
});

// Logout Handling
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});
