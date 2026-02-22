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

  document
    .getElementById("historyUserSelect")
    ?.addEventListener("change", loadUserLoans);
});


/* ================= LOAD USERS ================= */

async function loadUsers() {

  const usersSnapshot = await getDocs(collection(db, "users"));

  const createSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createSelect || !historySelect) return;

  createSelect.innerHTML = `<option value="">Select User</option>`;
  historySelect.innerHTML = `<option value="">Select User</option>`;

  usersSnapshot.forEach(docSnap => {

    const data = docSnap.data();

    const option1 = document.createElement("option");
    option1.value = docSnap.id;
    option1.textContent = data.name || "No Name";
    createSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = docSnap.id;
    option2.textContent = data.name || "No Name";
    historySelect.appendChild(option2);
  });
}


/* ================= DASHBOARD ================= */

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


/* ================= CREATE LOAN ================= */

window.createLoan = async function () {

  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

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

  document.getElementById("principal").value = "";
  document.getElementById("interest").value = "";
  document.getElementById("months").value = "";

  await loadDashboardSummary();
};


/* ================= LOAD USER LOANS ================= */

async function loadUserLoans() {

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
      <tr>
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td>${d.status}</td>
        <td>
          <button onclick="openPaymentModal('${loanId}')">Add Payment</button>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}


/* ================= PAYMENT ================= */

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

  let remaining = loanSnap.data().remainingAmount - amount;

  await addDoc(collection(db, "ledger"), {
    loanId: currentLoanId,
    userId: loanSnap.data().userId,
    type: "credit",
    amount: amount,
    dateString: new Date().toLocaleString()
  });

  await updateDoc(loanRef, {
    remainingAmount: remaining <= 0 ? 0 : remaining,
    status: remaining <= 0 ? "closed" : "active"
  });

  closePaymentModal();

  document
    .getElementById("historyUserSelect")
    ?.dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};


/* ================= LOGOUT ================= */

window.logout = async function () {
  await signOut(auth);
  window.location = "admin-login.html";
};
