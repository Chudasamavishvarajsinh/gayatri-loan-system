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


/* ========================= */
/* 🔹 GLOBAL STATE */
/* ========================= */

let usersData = {};


/* ========================= */
/* 🔒 ADMIN AUTH */
/* ========================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location = "admin-login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    alert("Access Denied");
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  setupUserHistoryListener();
  await loadDashboardSummary();
});


/* ========================= */
/* 🔹 LOAD USERS */
/* ========================= */

async function loadUsers() {

  const usersSnap = await getDocs(collection(db, "users"));

  const createLoanSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createLoanSelect || !historySelect) return;

  createLoanSelect.innerHTML = `<option value="">Select User</option>`;
  historySelect.innerHTML = `<option value="">Select User</option>`;

  usersData = {};

  usersSnap.forEach((docSnap) => {

    const data = docSnap.data();
    if (!data.name) return;

    usersData[docSnap.id] = data;

    const opt1 = new Option(data.name, docSnap.id);
    const opt2 = new Option(data.name, docSnap.id);

    createLoanSelect.appendChild(opt1);
    historySelect.appendChild(opt2);
  });
}


/* ========================= */
/* 📊 DASHBOARD */
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

    if (loan.status === "closed") closed++;
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = active;
  document.getElementById("totalClosedLoans").innerText = closed;
  document.getElementById("totalOutstanding").innerText = "₹ " + outstanding;
}


/* ========================= */
/* 🔹 LOGOUT */
/* ========================= */

window.logout = async function () {
  await signOut(auth);
  window.location = "admin-login.html";
};


/* ========================= */
/* 🔹 CREATE LOAN */
/* ========================= */

window.createLoan = async function () {

  const userId = document.getElementById("userId")?.value;
  const principal = parseFloat(document.getElementById("principal")?.value);
  const rate = parseFloat(document.getElementById("interest")?.value);
  const months = parseInt(document.getElementById("months")?.value);

  if (!userId || isNaN(principal) || isNaN(rate) || isNaN(months)) {
    alert("Fill all fields correctly");
    return;
  }

  const interest = (principal * rate * months) / 100;
  const total = principal + interest;

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

  alert("Loan Created Successfully");
  await loadDashboardSummary();
};


/* ========================= */
/* 🔹 USER LOAN HISTORY */
/* ========================= */

function setupUserHistoryListener() {

  const select = document.getElementById("historyUserSelect");
  if (!select) return;

  select.addEventListener("change", handleUserHistoryChange);
}


async function handleUserHistoryChange() {

  const userId = this.value;

  const userInfoDiv = document.getElementById("selectedUserInfo");
  const tableBody = document.querySelector("#loanHistoryTable tbody");

  if (!tableBody || !userInfoDiv) return;

  if (!userId) {
    tableBody.innerHTML = `<tr><td colspan="8">Select a user.</td></tr>`;
    userInfoDiv.innerHTML = "";
    return;
  }

  const user = usersData[userId];

  userInfoDiv.innerHTML = `
    <strong>Name:</strong> ${user?.name || "-"} <br>
    <strong>Phone:</strong> ${user?.phone || "-"} <br>
    <strong>Address:</strong> ${user?.address || "-"}
  `;

  const q = query(collection(db, "loans"), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) {
    tableBody.innerHTML = `<tr><td colspan="8">No loans found.</td></tr>`;
    return;
  }

  let html = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();
    const loanId = docSnap.id;

    const startDate = d.startDate?.toDate?.().toLocaleString() || "-";
    const closedDate = d.closedDate?.toDate?.().toLocaleString() || "-";

    html += `
      <tr>
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td>${d.status}</td>
        <td>${startDate}</td>
        <td>${closedDate}</td>
        <td>
          <button onclick="addPayment('${loanId}')">Add Payment</button>
          <button onclick="toggleLedger('${loanId}', ${d.totalWithInterest})">View Ledger</button>
        </td>
      </tr>
      <tr id="ledger-row-${loanId}" style="display:none;">
        <td colspan="8">
          <div id="ledger-${loanId}" style="max-height:200px; overflow-y:auto;"></div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}


/* ========================= */
/* 🔹 TOGGLE LEDGER */
/* ========================= */

window.toggleLedger = async function (loanId, totalAmount) {

  const row = document.getElementById(`ledger-row-${loanId}`);
  const container = document.getElementById(`ledger-${loanId}`);

  if (!row || !container) return;

  if (row.style.display === "none") {
    row.style.display = "table-row";
    await loadLedger(loanId, totalAmount, container);
  } else {
    row.style.display = "none";
  }
};


async function loadLedger(loanId, totalAmount, container) {

  const q = query(
    collection(db, "ledger"),
    where("loanId", "==", loanId),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    container.innerHTML = "No payments yet.";
    return;
  }

  let balance = totalAmount;
  let html = `
    <table style="width:100%; border-collapse:collapse;">
      <tr>
        <th>Date</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
  `;

  snap.forEach(docSnap => {

    const entry = docSnap.data();
    balance -= entry.amount;

    html += `
      <tr>
        <td>${new Date(entry.date).toLocaleString()}</td>
        <td>₹ ${entry.amount}</td>
        <td>₹ ${balance < 0 ? 0 : balance}</td>
      </tr>
    `;
  });

  html += "</table>";
  container.innerHTML = html;
}


/* ========================= */
/* 🔹 ADD PAYMENT */
/* ========================= */

window.addPayment = async function (loanId) {

  const amount = prompt("Enter Payment Amount:");
  if (!amount) return;

  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    alert("Invalid amount");
    return;
  }

  const loanRef = doc(db, "loans", loanId);
  const loanSnap = await getDoc(loanRef);
  if (!loanSnap.exists()) return;

  let remaining = loanSnap.data().remainingAmount - paymentAmount;

  await addDoc(collection(db, "ledger"), {
    loanId,
    userId: loanSnap.data().userId,
    type: "credit",
    amount: paymentAmount,
    date: new Date().toISOString()
  });

  if (remaining <= 0) {
    remaining = 0;
    await updateDoc(loanRef, {
      remainingAmount: 0,
      status: "closed",
      closedDate: serverTimestamp()
    });
  } else {
    await updateDoc(loanRef, { remainingAmount: remaining });
  }

  document.getElementById("historyUserSelect")
    ?.dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};
