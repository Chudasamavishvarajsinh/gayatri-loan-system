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

let usersData = {};
let currentLoanId = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  setupUserHistoryListener();
  await loadDashboardSummary();
});


async function loadUsers() {

  const usersSnap = await getDocs(collection(db, "users"));
  const select = document.getElementById("historyUserSelect");

  select.innerHTML = `<option value="">Select User</option>`;

  usersSnap.forEach(docSnap => {
    usersData[docSnap.id] = docSnap.data();
    select.appendChild(new Option(docSnap.data().name, docSnap.id));
  });
}


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
    if (loan.status === "closed") closed++;
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = active;
  document.getElementById("totalClosedLoans").innerText = closed;
  document.getElementById("totalOutstanding").innerText = "₹ " + outstanding;
}


function setupUserHistoryListener() {
  document.getElementById("historyUserSelect")
    .addEventListener("change", handleUserHistoryChange);
}


async function handleUserHistoryChange() {

  const userId = this.value;
  const tableBody = document.querySelector("#loanHistoryTable tbody");

  if (!userId) {
    tableBody.innerHTML = `<tr><td colspan="6">Select user</td></tr>`;
    return;
  }

  const q = query(collection(db, "loans"), where("userId", "==", userId));
  const snap = await getDocs(q);

  let html = "";

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const loanId = docSnap.id;

    html += `
      <tr>
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td><span class="status-badge ${d.status}">${d.status}</span></td>
        <td>
          <button class="btn-primary" onclick="openPaymentModal('${loanId}')">Add Payment</button>
          <button class="btn-secondary" onclick="toggleLedger('${loanId}', ${d.totalWithInterest})">Ledger</button>
        </td>
      </tr>
      <tr id="ledger-${loanId}" class="ledger-row">
        <td colspan="6"></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}


/* PAYMENT MODAL */

window.openPaymentModal = function(loanId){
  currentLoanId = loanId;
  document.getElementById("paymentModal").style.display = "flex";
};

window.closePaymentModal = function(){
  currentLoanId = null;
  document.getElementById("paymentAmountInput").value = "";
  document.getElementById("paymentModal").style.display = "none";
};

window.submitPayment = async function(){

  const amount = parseFloat(document.getElementById("paymentAmountInput").value);

  if (isNaN(amount) || amount <= 0) {
    alert("Enter valid amount");
    return;
  }

  const loanRef = doc(db, "loans", currentLoanId);
  const loanSnap = await getDoc(loanRef);

  let remaining = loanSnap.data().remainingAmount - amount;

  await addDoc(collection(db, "ledger"), {
    loanId: currentLoanId,
    userId: loanSnap.data().userId,
    type: "credit",
    amount: amount,
    date: new Date().toISOString()
  });

  await updateDoc(loanRef, {
    remainingAmount: remaining <= 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active",
    closedDate: remaining <= 0 ? serverTimestamp() : null
  });

  closePaymentModal();

  document.getElementById("historyUserSelect")
    .dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};


/* LEDGER */

window.toggleLedger = async function (loanId, totalAmount) {

  const row = document.getElementById(`ledger-${loanId}`);
  const isOpen = row.style.display === "table-row";
  row.style.display = isOpen ? "none" : "table-row";

  if (!isOpen) {

    const q = query(
      collection(db, "ledger"),
      where("loanId", "==", loanId),
      orderBy("date", "asc")
    );

    const snap = await getDocs(q);

    let balance = totalAmount;
    let html = `<div class="ledger-card"><div class="ledger-body">`;

    snap.forEach(docSnap => {
      const entry = docSnap.data();
      balance -= entry.amount;

      html += `
        <div class="ledger-item">
          <div>${new Date(entry.date).toLocaleDateString()}</div>
          <div style="color:green;">₹ ${entry.amount}</div>
          <div>₹ ${balance < 0 ? 0 : balance}</div>
        </div>
      `;
    });

    html += `</div></div>`;

    row.innerHTML = `<td colspan="6">${html}</td>`;
  }
};
