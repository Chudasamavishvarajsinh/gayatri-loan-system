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
  await loadDashboardSummary();
});


async function loadUsers() {

  const usersSnap = await getDocs(collection(db, "users"));
  const select = document.getElementById("historyUserSelect");

  select.innerHTML = `<option value="">Select User</option>`;

  usersSnap.forEach(docSnap => {
    const data = docSnap.data();
    usersData[docSnap.id] = data;
    select.appendChild(new Option(data.name, docSnap.id));
  });
}


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
        <td><span class="status-badge ${d.status}">${d.status}</span></td>
        <td>${d.startDate?.toDate?.().toLocaleDateString() || "-"}</td>
        <td>${d.closedDate?.toDate?.().toLocaleDateString() || "-"}</td>
        <td>
          <button class="btn-primary" onclick="addPayment('${loanId}')">Add Payment</button>
          <button class="btn-secondary" onclick="toggleLedger('${loanId}', ${d.totalWithInterest})">View Ledger</button>
        </td>
      </tr>
      <tr id="ledger-${loanId}" class="ledger-row">
        <td colspan="8"></td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}


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

    let ledgerHTML = `
      <div class="ledger-card">
        <div class="ledger-header">Payment History</div>
        <div class="ledger-body">
    `;

    snap.forEach(docSnap => {
      const entry = docSnap.data();
      balance -= entry.amount;

      ledgerHTML += `
        <div class="ledger-item">
          <div>${new Date(entry.date).toLocaleDateString()}</div>
          <div class="ledger-credit">₹ ${entry.amount}</div>
          <div class="ledger-balance">₹ ${balance < 0 ? 0 : balance}</div>
        </div>
      `;
    });

    ledgerHTML += `</div></div>`;

    row.innerHTML = `<td colspan="8">${ledgerHTML}</td>`;
  }
};


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
