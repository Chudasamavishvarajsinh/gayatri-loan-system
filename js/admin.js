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
  serverTimestamp,
  orderBy
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

/* ================= ADMIN AUTH & INITIALIZATION ================= */
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

  document
    .getElementById("historyUserSelect")
    ?.addEventListener("change", loadUserLoans);
});

/* ================= LOAD USERS INTO DROPDOWNS ================= */
async function loadUsers() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const createSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createSelect || !historySelect) return;

  const placeholder = `<option value="">Select User</option>`;
  createSelect.innerHTML = placeholder;
  historySelect.innerHTML = placeholder;

  usersSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const name = data.name || "Unknown User";

    const opt1 = new Option(name, docSnap.id);
    const opt2 = new Option(name, docSnap.id);

    createSelect.add(opt1);
    historySelect.add(opt2);
  });
}

/* ================= DASHBOARD SUMMARY DATA ================= */
async function loadDashboardSummary() {
  const usersSnap = await getDocs(collection(db, "users"));
  const loansSnap = await getDocs(collection(db, "loans"));

  let active = 0;
  let closed = 0;
  let outstanding = 0;

  loansSnap.forEach(docSnap => {
    const loan = docSnap.data();
    if (loan.status === "active") {
      active++;
      outstanding += loan.remainingAmount || 0;
    } else if (loan.status === "closed") {
      closed++;
    }
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = active;
  document.getElementById("totalClosedLoans").innerText = closed;
  document.getElementById("totalOutstanding").innerText = formatCurrency(outstanding);
}

/* ================= CREATE LOAN LOGIC ================= */
window.createLoan = async function () {
  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  if (!userId || isNaN(principal) || isNaN(rate) || isNaN(months)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const interest = (principal * rate * months) / 100;
  const total = principal + interest;

  try {
    await addDoc(collection(db, "loans"), {
      userId,
      principal,
      interestRate: rate,
      months,
      totalWithoutInterest: principal,
      totalWithInterest: total,
      remainingAmount: total,
      status: "active",
      startDate: serverTimestamp()
    });

    alert("Loan Created Successfully!");
    
    // Clear Inputs
    ["principal", "interest", "months"].forEach(id => document.getElementById(id).value = "");
    await loadDashboardSummary();
  } catch (error) {
    console.error("Error creating loan:", error);
  }
};

/* ================= LOAD USER LOANS (TABLE) ================= */
async function loadUserLoans() {
  const userId = this.value;
  const tbody = document.querySelector("#loanHistoryTable tbody");

  if (!userId) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Select a user</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Loading...</td></tr>`;

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
        <td style="font-size:11px; color:#64748b; font-family:monospace;">${loanId.slice(0,8)}</td>
        <td>${formatCurrency(d.principal)}</td>
        <td>${formatCurrency(d.totalWithInterest)}</td>
        <td style="font-weight:600; color:var(--primary)">${formatCurrency(d.remainingAmount)}</td>
        <td><span class="status-pill ${statusClass}">${d.status}</span></td>
        <td>
          <button class="btn-ghost" onclick="openLedgerModal('${loanId}')" style="margin-right:5px;">📜 Ledger</button>
          ${d.status === 'active' 
            ? `<button class="btn-primary" style="width:auto; padding:8px 12px;" onclick="openPaymentModal('${loanId}')">💸 Pay</button>` 
            : `<span style="color:var(--success); font-weight:600;">Cleared</span>`
          }
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

/* ================= LEDGER (OLD RECORDS) LOGIC ================= */
window.openLedgerModal = async function (loanId) {
  const tbody = document.getElementById("ledgerTableBody");
  document.getElementById("ledgerModal").style.display = "flex";
  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">Loading records...</td></tr>`;

  try {
    const q = query(collection(db, "ledger"), where("loanId", "==", loanId));
    const snap = await getDocs(q);

    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center">No payments found</td></tr>`;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const data = docSnap.data();
      html += `
        <tr class="fade-in">
          <td>${data.dateString || 'N/A'}</td>
          <td><span class="status-pill" style="background:#f1f5f9; color:#475569;">${data.type}</span></td>
          <td style="font-weight:600; color:var(--success)">+ ${formatCurrency(data.amount)}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="3">Error loading ledger</td></tr>`;
  }
};

window.closeLedgerModal = function () {
  document.getElementById("ledgerModal").style.display = "none";
};

/* ================= PAYMENT MODAL LOGIC ================= */
window.openPaymentModal = function (loanId) {
  currentLoanId = loanId;
  document.getElementById("paymentModal").style.display = "flex";
};

window.closePaymentModal = function () {
  document.getElementById("paymentAmountInput").value = "";
  document.getElementById("paymentModal").style.display = "none";
};

window.submitPayment = async function () {
  const amount = parseFloat(document.getElementById("paymentAmountInput").value);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const loanRef = doc(db, "loans", currentLoanId);
  const loanSnap = await getDoc(loanRef);
  const loanData = loanSnap.data();

  let remaining = loanData.remainingAmount - amount;

  // 1. Add to Ledger
  await addDoc(collection(db, "ledger"), {
    loanId: currentLoanId,
    userId: loanData.userId,
    type: "credit",
    amount: amount,
    dateString: new Date().toLocaleString()
  });

  // 2. Update Loan Status
  await updateDoc(loanRef, {
    remainingAmount: remaining <= 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active"
  });

  closePaymentModal();
  
  // Refresh UI
  document.getElementById("historyUserSelect").dispatchEvent(new Event("change"));
  await loadDashboardSummary();
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  await signOut(auth);
  window.location = "admin-login.html";
};
