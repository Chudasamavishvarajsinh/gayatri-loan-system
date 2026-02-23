import { auth, db } from "./firebase-config.js";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Get User ID from URL (e.g., admin_user_details.html?id=USER_UID)
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('id');

let activeLoanId = null;
let currentRemaining = 0;

/**
 * Loads User Profile and Active Loan
 */
async function loadCustomerData() {
    if (!userId) return;

    try {
        // 1. Fetch User Info
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
            const userData = userSnap.data();
            document.getElementById("customerName").innerText = userData.name;
            document.getElementById("customerContact").innerText = `${userData.phone} | ${userData.email}`;
        }

        // 2. Fetch Active Loan
        const loanQuery = query(collection(db, "loans"), where("userId", "==", userId), where("status", "==", "active"));
        const loanSnap = await getDocs(loanQuery);

        if (!loanSnap.empty) {
            const loanDoc = loanSnap.docs[0];
            activeLoanId = loanDoc.id;
            const loanData = loanDoc.data();

            currentRemaining = loanData.remainingAmount;
            document.getElementById("sumPrincipal").innerText = `₹${loanData.principal.toLocaleString('en-IN')}`;
            document.getElementById("sumTotal").innerText = `₹${loanData.totalWithInterest.toLocaleString('en-IN')}`;
            document.getElementById("sumRemaining").innerText = `₹${currentRemaining.toLocaleString('en-IN')}`;
            document.getElementById("sumPaid").innerText = `₹${(loanData.totalWithInterest - currentRemaining).toLocaleString('en-IN')}`;
            
            loadLedger(activeLoanId);
        } else {
            document.getElementById("loanStatus").innerText = "NO ACTIVE LOAN";
            document.getElementById("loanStatus").className = "status-badge";
        }
    } catch (error) {
        console.error("Error loading customer details:", error);
    }
}

/**
 * Loads Payment History
 */
async function loadLedger(loanId) {
    const ledgerTable = document.getElementById("ledgerTableBody");
    ledgerTable.innerHTML = "";

    const q = query(collection(db, "ledger"), where("loanId", "==", loanId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
        const data = doc.data();
        const row = `<tr>
            <td>${new Date(data.date.toDate()).toLocaleDateString('en-IN')}</td>
            <td>${data.note || 'Payment'}</td>
            <td style="color: #15803d; font-weight: 700;">₹${data.amount.toLocaleString('en-IN')}</td>
        </tr>`;
        ledgerTable.innerHTML += row;
    });
}

/**
 * Process New Payment
 */
document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("payAmount").value);
    const note = document.getElementById("payNote").value;

    if (!activeLoanId || amount <= 0) return;

    const payBtn = document.getElementById("payBtn");
    payBtn.disabled = true;
    payBtn.innerText = "Processing...";

    try {
        // 1. Add to Ledger
        await addDoc(collection(db, "ledger"), {
            loanId: activeLoanId,
            userId: userId,
            amount: amount,
            note: note,
            date: serverTimestamp()
        });

        // 2. Update Loan Balance
        const newRemaining = currentRemaining - amount;
        const loanRef = doc(db, "loans", activeLoanId);
        
        await updateDoc(loanRef, {
            remainingAmount: newRemaining,
            status: newRemaining <= 0 ? "closed" : "active"
        });

        alert("Payment Recorded Successfully!");
        location.reload(); // Refresh to show new balance
    } catch (error) {
        alert("Error: " + error.message);
        payBtn.disabled = false;
        payBtn.innerText = "Submit Payment";
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) loadCustomerData();
    else window.location.href = "index.html";
});
