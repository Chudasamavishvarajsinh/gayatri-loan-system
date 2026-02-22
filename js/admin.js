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
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  setupUserHistoryListener();
  await loadDashboardSummary();   // ✅ Now function exists
});


/* ========================= */
/* 🔹 LOAD USERS */
/* ========================= */

async function loadUsers() {

  const usersSnap = await getDocs(collection(db, "users"));
  const select = document.getElementById("historyUserSelect");

  if (!select) return;

  select.innerHTML = `<option value="">Select User</option>`;

  usersData = {};

  usersSnap.forEach(docSnap => {
    const data = docSnap.data();
    usersData[docSnap.id] = data;
    select.appendChild(new Option(data.name, docSnap.id));
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
/* 🔹 USER HISTORY */
/* ========================= */

function setupUserHistoryListener() {
  document.getElementById("historyUserSelect")
    ?.addEventListener("change", handleUserHistoryChange);
}


async function handleUserHistoryChange() {

  const userId = this.value;
  const tableBody = document.querySelector("#loanHistoryTable tbody");
  const infoDiv = document.getElementById("selectedUserInfo");

  if (!userId) {
    tableBody.innerHTML = `<tr><td colspan="8">Select a user.</td></tr>`;
    infoDiv.innerHTML = "";
    return;
  }

  const user = usersData[userId];

  infoDiv.innerHTML = `
    <strong>${user.name}</strong><br>
    ${user.phone}<br>
    ${user.address}
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

    html += `
      <tr>
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td>${d.status}</td>
        <td>${d.startDate?.toDate?.().toLocaleDateString() || "-"}</td>
        <td>${d.closedDate?.toDate?.().toLocaleDateString() || "-"}</td>
        <td>
          <button onclick="addPayment('${loanId}')">Add Payment</button>
          <button onclick="toggleLedger('${loanId}', ${d.totalWithInterest})">View Ledger</button>
        </td>
      </tr>
      <tr id="ledger-${loanId}" style="display:none;">
        <td colspan="8"></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}


/* ========================= */
/* 🔹 LEDGER */
/* ========================= */

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
    let ledgerHTML = "";

    snap.forEach(docSnap => {
      const entry = docSnap.data();
      balance -= entry.amount;

      ledgerHTML += `
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;">
          <div>${new Date(entry.date).toLocaleDateString()}</div>
          <div style="color:green;">₹ ${entry.amount}</div>
          <div>₹ ${balance < 0 ? 0 : balance}</div>
        </div>
      `;
    });

    row.innerHTML = `<td colspan="8">${ledgerHTML || "No payments yet."}</td>`;
  }
};


/* ========================= */
/* 🔹 ADD PAYMENT */
/* ========================= */

window.addPayment = async function (loanId) {

  const amount = prompt("Enter Payment Amount");
  if (!amount) return;

  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) return;

  const loanRef = doc(db, "loans", loanId);
  const loanSnap = await getDoc(loanRef);

  let remaining = loanSnap.data().remainingAmount - paymentAmount;

  await addDoc(collection(db, "ledger"), {
    loanId,
    userId: loanSnap.data().userId,
    type: "credit",
    amount: paymentAmount,
    date: new Date().toISOString()
  });

  await updateDoc(loanRef, {
    remainingAmount: remaining <= 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active",
    closedDate: remaining <= 0 ? serverTimestamp() : null
  });

  document.getElementById("historyUserSelect")
    ?.dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};
