import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentLoanId = null;

/* ================= HELPER: FORMAT CURRENCY ================= */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

/* ================= ADMIN AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = "admin-login.html";
    return;
  }
  const adminSnap = await getDoc(doc(db, "admins", user.uid));
  if (!adminSnap.exists()) {
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  await loadDashboardSummary();

  document.getElementById("historyUserSelect")?.addEventListener("change", loadUserLoans);
});

/* ================= LOAD USERS ================= */
async function loadUsers() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const createSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createSelect || !historySelect) return;

  createSelect.innerHTML = `<option value="">Choose User</option>`;
  historySelect.innerHTML = `<option value="">Select User</option>`;

  usersSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const opt = new Option(data.name || "No Name", docSnap.id);
    createSelect.add(opt.cloneNode(true));
    historySelect.add(opt);
  });
}

/* ================= DASHBOARD SUMMARY ================= */
async function loadDashboardSummary() {
  const loansSnap = await getDocs(collection(db, "loans"));
  const usersSnap = await getDocs(collection(db, "users"));

  let active = 0, closed = 0, outstanding = 0;

  loansSnap.forEach(docSnap => {
    const loan = docSnap.data();
    if (loan.status === "active") {
      active++;
      outstanding += loan.remainingAmount || 0;
    } else {
      closed++;
    }
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = active;
  document.getElementById("totalClosedLoans").innerText = closed;
  document.getElementById("totalOutstanding").innerText = formatCurrency(outstanding);
}

/* ================= LOAD USER LOANS ================= */
async function loadUserLoans() {
  const userId = this.value;
  const tbody = document.querySelector("#loanHistoryTable tbody");

  if (!userId) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Select a user</td></tr>`;
    return;
  }

  const q = query(collection(db, "loans"), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No loans found</td></tr>`;
    return;
  }

  let html = "";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const loanId = docSnap.id;
    const statusClass = d.status === 'active' ? 'status-active' : 'status-closed';

    html += `
      <tr class="fade-in">
        <td style="font-family:monospace; font-size:12px;">#${loanId.slice(0,6)}</td>
        <td>${formatCurrency(d.principal)}</td>
        <td>${formatCurrency(d.totalWithInterest)}</td>
        <td style="font-weight:600; color:var(--primary)">${formatCurrency(d.remainingAmount)}</td>
        <td><span class="status-pill ${statusClass}">${d.status}</span></td>
        <td>
          <button class="btn-ghost" onclick="openLedgerModal('${loanId}')">📜 Ledger</button>
          ${d.status === 'active' ? `<button class="btn-primary" style="width:auto; padding:5px 10px;" onclick="openPaymentModal('${loanId}')">💸 Pay</button>` : ''}
        </td>
      </tr>`;
  });
  tbody.innerHTML = html;
}

/* ================= LEDGER (FIXED) ================= */
window.openLedgerModal = async function (loanId) {
  const tbody = document.getElementById("ledgerTableBody");
  document.getElementById("ledgerModal").style.display = "flex";
  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">Loading Ledger...</td></tr>`;

  try {
    // Matches your screenshot fields: loanId, date, amount, type
    const q = query(collection(db, "ledger"), where("loanId", "==", loanId));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">No records found for this loan.</td></tr>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      // Format the date string from your screenshot "2026-02-22T..."
      const dateDisplay = data.date ? new Date(data.date).toLocaleDateString() : 'N/A';
      
      html += `
        <tr class="fade-in">
          <td>${dateDisplay}</td>
          <td style="text-transform:uppercase; font-size:11px;">${data.type || 'credit'}</td>
          <td style="font-weight:600; color:var(--success)">+ ${formatCurrency(data.amount)}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
  } catch (err) {
    console.error("Ledger Error:", err);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Query error. Check index.</td></tr>`;
  }
};

window.closeLedgerModal = () => document.getElementById("ledgerModal").style.display = "none";

/* ================= CREATE LOAN ================= */
window.createLoan = async function () {
  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  if (!userId || isNaN(principal)) return alert("Check inputs");

  const total = principal + (principal * rate * months / 100);

  await addDoc(collection(db, "loans"), {
    userId, principal, interestRate: rate, months,
    totalWithInterest: total, remainingAmount: total,
    status: "active", startDate: serverTimestamp()
  });

  alert("Loan Created");
  loadDashboardSummary();
};

/* ================= PAYMENT ================= */
window.openPaymentModal = (id) => { currentLoanId = id; document.getElementById("paymentModal").style.display = "flex"; };
window.closePaymentModal = () => document.getElementById("paymentModal").style.display = "none";

window.submitPayment = async function () {
  const amount = parseFloat(document.getElementById("paymentAmountInput").value);
  if (isNaN(amount) || amount <= 0) return;

  const loanRef = doc(db, "loans", currentLoanId);
  const loanSnap = await getDoc(loanRef);
  const loanData = loanSnap.data();
  const remaining = loanData.remainingAmount - amount;

  // Add to ledger (Matching your screenshot format)
  await addDoc(collection(db, "ledger"), {
    loanId: currentLoanId,
    userId: loanData.userId,
    amount: amount,
    type: "credit",
    date: new Date().toISOString() // Matches your screenshot date format
  });

  await updateDoc(loanRef, {
    remainingAmount: remaining < 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active"
  });

  closePaymentModal();
  loadDashboardSummary();
  // Trigger table refresh
  document.getElementById("historyUserSelect").dispatchEvent(new Event("change"));
};

window.logout = async () => { await signOut(auth); window.location = "admin-login.html"; };
