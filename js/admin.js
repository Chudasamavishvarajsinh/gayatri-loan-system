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

  try {

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

  } catch (error) {
    console.error("Admin Auth Error:", error);
  }

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

const historySelect = document.getElementById("historyUserSelect");

if (historySelect) {

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

    const ledgerQuery = query(
        collection(db,"ledger"),
        where("loanId","==",loanId),
        where("type","==","credit")
    );

    const ledgerSnap = await getDocs(ledgerQuery);

    let paymentHtml = "";

    ledgerSnap.forEach(paymentDoc => {
        const paymentData = paymentDoc.data();
        const paymentDate = new Date(paymentData.date).toLocaleString();

        paymentHtml += `
          <div>
            ₹ ${paymentData.amount} <br>
            <small>${paymentDate}</small>
            <hr>
          </div>
        `;
    });

    if(paymentHtml === ""){
        paymentHtml = "-";
    }

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
        <td><div class="payment-box">${paymentHtml}</div></td>
        <td>${actionBtn}</td>
      </tr>
    `;
  }

  tableBody.innerHTML = html;

});
}


/* ========================= */
/* 🔍 SAFE SEARCH */
/* ========================= */

const searchInput = document.getElementById("loanSearchInput");

if (searchInput) {

searchInput.addEventListener("keyup", function(){

  const filter = this.value.trim().toLowerCase();
  const rows = document.querySelectorAll("#loanHistoryTable tbody tr");

  rows.forEach(row => {

    if (row.cells.length < 5) return;

    const loanId = row.cells[0].innerText.toLowerCase();
    const status = row.cells[4].innerText.toLowerCase();

    if (filter === "") {
      row.style.display = "";
    } else if (loanId.includes(filter) || status.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }

  });

});
}
