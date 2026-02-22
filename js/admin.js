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


/* ========================= */
/* 🔒 ADMIN AUTH PROTECTION */
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

  createLoanSelect.innerHTML = '<option value="">Select User</option>';
  historySelect.innerHTML = '<option value="">Select User</option>';

  usersData = {};

  usersSnap.forEach((docSnap) => {

    const data = docSnap.data();
    if (!data.name) return;

    usersData[docSnap.id] = data;

    const option1 = document.createElement("option");
    option1.value = docSnap.id;
    option1.textContent = data.name;
    createLoanSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = docSnap.id;
    option2.textContent = data.name;
    historySelect.appendChild(option2);
  });
}


/* ========================= */
/* 📊 DASHBOARD SUMMARY */
/* ========================= */

async function loadDashboardSummary() {

  const usersSnap = await getDocs(collection(db, "users"));
  const loansSnap = await getDocs(collection(db, "loans"));

  let activeCount = 0;
  let closedCount = 0;
  let totalOutstanding = 0;

  loansSnap.forEach(docSnap => {
    const loan = docSnap.data();

    if (loan.status === "active") {
      activeCount++;
      totalOutstanding += loan.remainingAmount || 0;
    }

    if (loan.status === "closed") {
      closedCount++;
    }
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = activeCount;
  document.getElementById("totalClosedLoans").innerText = closedCount;
  document.getElementById("totalOutstanding").innerText = "₹ " + totalOutstanding;
}


/* ========================= */
/* 🔹 LOGOUT */
/* ========================= */

window.logout = async function(){
  await signOut(auth);
  window.location = "admin-login.html";
};


/* ========================= */
/* 🔹 CREATE LOAN */
/* ========================= */

window.createLoan = async function(){

  const userId = document.getElementById("userId")?.value;
  const principal = parseFloat(document.getElementById("principal")?.value);
  const rate = parseFloat(document.getElementById("interest")?.value);
  const months = parseInt(document.getElementById("months")?.value);

  if(!userId || !principal || !rate || !months){
    alert("Fill all fields");
    return;
  }

  const interestAmount = (principal * rate * months) / 100;
  const totalWithInterest = principal + interestAmount;

  await addDoc(collection(db,"loans"),{
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
  await loadDashboardSummary();
};


/* ========================= */
/* 🔹 USER LOAN HISTORY */
/* ========================= */

document.addEventListener("DOMContentLoaded", () => {

  const historySelect = document.getElementById("historyUserSelect");

  if (!historySelect) return;

  historySelect.addEventListener("change", async function(){

    const userId = this.value;
    const userInfoDiv = document.getElementById("selectedUserInfo");
    const tableBody = document.querySelector("#loanHistoryTable tbody");

    if(!userId){
      tableBody.innerHTML = `<tr><td colspan="9">Select a user.</td></tr>`;
      userInfoDiv.innerHTML = "";
      return;
    }

    const user = usersData[userId];

    userInfoDiv.innerHTML = `
      <strong>Name:</strong> ${user?.name || "-"} <br>
      <strong>Phone:</strong> ${user?.phone || "-"} <br>
      <strong>Address:</strong> ${user?.address || "-"}
    `;

    const q = query(collection(db,"loans"), where("userId","==",userId));
    const snap = await getDocs(q);

    if(snap.empty){
      tableBody.innerHTML = `<tr><td colspan="9">No loans found.</td></tr>`;
      return;
    }

    let html = "";

    for (const docSnap of snap.docs) {

      const d = docSnap.data();
      const loanId = docSnap.id;

      const startDate = d.startDate?.toDate ? d.startDate.toDate().toLocaleString() : "-";
      const closedDate = d.closedDate?.toDate ? d.closedDate.toDate().toLocaleString() : "-";

      let actionBtn = d.status === "active"
        ? `<button onclick="addPayment('${loanId}')">Add Payment</button>`
        : "-";

      html += `
        <tr>
          <td>${loanId}</td>
          <td>₹ ${d.principal}</td>
          <td>₹ ${d.totalWithInterest}</td>
          <td>₹ ${d.remainingAmount}</td>
          <td class="status-${d.status}">${d.status}</td>
          <td>${startDate}</td>
          <td>${closedDate}</td>
          <td>-</td>
          <td>${actionBtn}</td>
        </tr>
      `;
    }

    tableBody.innerHTML = html;

  });

});


/* ========================= */
/* 🔹 ADD PAYMENT (FIXED) */
/* ========================= */

window.addPayment = async function(loanId){

  const amount = prompt("Enter Payment Amount:");
  if (!amount) return;

  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount)) {
    alert("Invalid amount");
    return;
  }

  const loanRef = doc(db,"loans",loanId);
  const loanSnap = await getDoc(loanRef);

  if (!loanSnap.exists()) {
    alert("Loan not found");
    return;
  }

  let remaining = loanSnap.data().remainingAmount;
  remaining -= paymentAmount;

  await addDoc(collection(db,"ledger"),{
      loanId,
      userId: loanSnap.data().userId,
      type: "credit",
      amount: paymentAmount,
      date: new Date().toISOString()
  });

  if (remaining <= 0) {
      remaining = 0;
      await updateDoc(loanRef,{
        remainingAmount: 0,
        status: "closed",
        closedDate: serverTimestamp()
      });
      alert("Loan Fully Paid");
  } else {
      await updateDoc(loanRef,{
        remainingAmount: remaining
      });
      alert("Payment Recorded");
  }

  document.getElementById("historyUserSelect")
    ?.dispatchEvent(new Event("change"));

  await loadDashboardSummary();
};

