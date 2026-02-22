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

let usersData = {};
let currentLoanId = null;


/* ========================= */
/* 🔐 ADMIN AUTH PROTECTION */
/* ========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location = "admin-login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  setupHistoryListener();
  await loadDashboardSummary();
});


/* ========================= */
/* 🔹 LOAD USERS */
/* ========================= */

async function loadUsers() {

  const snap = await getDocs(collection(db, "users"));

  const createSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createSelect || !historySelect) return;

  createSelect.innerHTML = `<option value="">Select User</option>`;
  historySelect.innerHTML = `<option value="">Select User</option>`;

  usersData = {};

  snap.forEach(docSnap => {

    usersData[docSnap.id] = docSnap.data();

    createSelect.appendChild(
      new Option(docSnap.data().name, docSnap.id)
    );

    historySelect.appendChild(
      new Option(docSnap.data().name, docSnap.id)
    );
  });
}


/* ========================= */
/* 📊 DASHBOARD SUMMARY */
/* ========================= */

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
    }

    if (loan.status === "closed") {
      closed++;
    }
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = active;
  document.getElementById("totalClosedLoans").innerText = closed;
  document.getElementById("totalOutstanding").innerText = "₹ " + outstanding;
}


/* ========================= */
/* 🏦 CREATE LOAN */
/* ========================= */

window.createLoan = async function () {

  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  if (!userId || isNaN(principal) || isNaN(rate) || isNaN(months)) {
    alert("Fill all fields correctly");
    return;
  }

  const interestAmount = (principal * rate * months) / 100;
  const totalWithInterest = principal + interestAmount;

  await addDoc(collection(db, "loans"), {
    userId,
    principal,
    interestRate: rate,
    months,
    totalWithoutInterest: principal,
    totalWithInterest,
    remainingAmount: totalWithInterest,
    status: "active",
    startDate: serverTimestamp()
  });

  alert("Loan Created Successfully");

  document.getElementById("principal").value = "";
  document.getElementById("interest").value = "";
  document.getElementById("months").value = "";

  await loadDashboardSummary();
};


/* ========================= */
/* 📂 USER LOAN HISTORY */
/* ========================= */

function setupHistoryListener() {
  document.getElementById("historyUserSelect")
    ?.addEventListener("change", handleUserHistory);
}


async function handleUserHistory() {

  const userId = this.value;
  const tbody = document.querySelector("#loanHistoryTable tbody");

  if (!userId) {
    tbody.innerHTML = `<tr><td colspan="6">Select user</td></tr>`;
    return;
  }

  const q = query(collection(db, "loans"), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="6">No loans found</td></tr>`;
    return;
  }

  let html = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();
    const loanId = docSnap.id;

    html += `
      <tr class="${d.status === "closed" ? "loan-closed" : "loan-active"}">
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td><span class="status ${d.status}">${d.status}</span></td>
        <td>
          <button class="btn-add" onclick="openPaymentModal('${loanId}')">Add Payment</button>
          <button class="btn-ledger" onclick="toggleLedger('${loanId}', ${d.totalWithInterest})">Ledger</button>
        </td>
      </tr>
      <tr id="ledger-${loanId}" class="ledger-row">
        <td colspan="6"></td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}


/* ========================= */
/* 💳 PAYMENT MODAL */
/* ========================= */

window.openPaymentModal = function (loanId) {
  currentLoanId = loanId;
  document.getElementById("paymentModal").style.display = "flex";
};

window.closePaymentModal = function () {
  document.getElementById("paymentAmountInput").value = "";
  document.getElementById("paymentModal").style.display = "none";
};


window.submitPayment = async function () {

  const amount = parseFloat(
    document.getElementById("paymentAmountInput").value
  );

  if (isNaN(amount) || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const loanRef = doc(db, "loans", currentLoanId);
  const loanSnap = await getDoc(loanRef);

  if (!loanSnap.exists()) return;

  let remaining = loanSnap.data().remainingAmount - amount;

  await addDoc(collection(db, "ledger"), {
    loanId: currentLoanId,
    userId: loanSnap.data().userId,
    type: "credit",
    amount: amount,
    createdAt: serverTimestamp(),
    date: new Date().toISOString(),
    dateString: new Date().toLocaleString()
  });

  await updateDoc(loanRef, {
    remainingAmount: remaining <= 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active",
    closedDate: remaining <= 0 ? serverTimestamp() : null
  });

  closePaymentModal();

  document.getElementById("historyUserSelect")
    ?.dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};


/* ========================= */
/* 📒 LEDGER */
/* ========================= */

window.toggleLedger = async function (loanId, totalAmount) {

  const row = document.getElementById(`ledger-${loanId}`);
  const isOpen = row.style.display === "table-row";
  row.style.display = isOpen ? "none" : "table-row";

  if (!isOpen) {

    const q = query(collection(db, "ledger"), where("loanId", "==", loanId));
    const snap = await getDocs(q);

    if (snap.empty) {
      row.innerHTML = `<td colspan="6">No payments yet</td>`;
      return;
    }

    let entries = [];
    snap.forEach(docSnap => entries.push(docSnap.data()));

    entries.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date();
      const dateB = b.date ? new Date(b.date) : new Date();
      return dateA - dateB;
    });

    let balance = totalAmount;

    let html = `
      <div class="ledger-card">
        <div class="ledger-header">Payment History</div>
        <div class="ledger-body">
    `;

    entries.forEach(entry => {

      balance -= entry.amount;

      const dateTime =
        entry.dateString ||
        (entry.date ? new Date(entry.date).toLocaleString() : "-");

      html += `
        <div class="ledger-item">
          <div>${dateTime}</div>
          <div class="credit">₹ ${entry.amount}</div>
          <div class="balance">₹ ${balance < 0 ? 0 : balance}</div>
        </div>
      `;
    });

    html += `</div></div>`;

    row.innerHTML = `<td colspan="6">${html}</td>`;
  }
};


/* ========================= */
/* 🔓 LOGOUT */
/* ========================= */

window.logout = async function () {
  await signOut(auth);
  window.location = "admin-login.html";
};
