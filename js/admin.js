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


/* 🔒 Protect Admin Dashboard */
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

  // Load all users
  const usersSnap = await getDocs(collection(db, "users"));

  const createLoanSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");
  const ledgerUserSelect = document.getElementById("ledgerUserSelect");

  createLoanSelect.innerHTML = '<option value="">Select User</option>';
  historySelect.innerHTML = '<option value="">Select User</option>';
  ledgerUserSelect.innerHTML = '<option value="">Select User</option>';

  usersSnap.forEach((docSnap) => {

    const data = docSnap.data();
    if (!data.name) return;

    usersData[docSnap.id] = data;

    const displayText = `${data.name} (${data.phone})`;

    [createLoanSelect, historySelect, ledgerUserSelect].forEach(select => {
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = displayText;
      select.appendChild(option);
    });

  });

});


/* 🔹 Logout */
window.logout = async function(){
  await signOut(auth);
  window.location = "admin-login.html";
};


/* 🔹 Create Loan */
window.createLoan = async function(){

  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

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
};


/* 🔹 Load Loans for Ledger Dropdown */
document.getElementById("ledgerUserSelect").addEventListener("change", async function(){

  const userId = this.value;
  const loanSelect = document.getElementById("ledgerLoanSelect");

  loanSelect.innerHTML = '<option value="">Select Loan</option>';

  if(!userId) return;

  const q = query(collection(db,"loans"), where("userId","==",userId));
  const snap = await getDocs(q);

  snap.forEach(docSnap => {
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = docSnap.id;
    loanSelect.appendChild(option);
  });

});


/* 🔹 Add Ledger Entry */
window.addLedger = async function(){

  const loanId = document.getElementById("ledgerLoanSelect").value;
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if(!loanId || !amount){
    alert("Fill all fields");
    return;
  }

  const loanRef = doc(db,"loans",loanId);
  const loanSnap = await getDoc(loanRef);

  if(!loanSnap.exists()){
    alert("Loan not found");
    return;
  }

  let remaining = loanSnap.data().remainingAmount;

  if(type === "credit"){
    remaining -= amount;
  } else {
    remaining += amount;
  }

  await addDoc(collection(db,"ledger"),{
      loanId,
      userId: loanSnap.data().userId,
      type,
      amount,
      date: new Date().toISOString()
  });

  if(remaining <= 0){
    await updateDoc(loanRef,{
      remainingAmount: 0,
      status: "closed",
      closedDate: serverTimestamp()
    });
  } else {
    await updateDoc(loanRef,{
      remainingAmount: remaining
    });
  }

  alert("Ledger Updated");
};


/* 🔹 User Loan History */
document.getElementById("historyUserSelect").addEventListener("change", async function(){

  const userId = this.value;
  const userInfoDiv = document.getElementById("selectedUserInfo");
  const tableBody = document.querySelector("#loanHistoryTable tbody");

  if(!userId){
    tableBody.innerHTML = `<tr><td colspan="7">Select a user.</td></tr>`;
    userInfoDiv.innerHTML = "";
    return;
  }

  const user = usersData[userId];

  // Show user info (including phone)
  userInfoDiv.innerHTML = `
    <strong>Name:</strong> ${user.name} <br>
    <strong>Phone:</strong> ${user.phone} <br>
    <strong>Address:</strong> ${user.address}
  `;

  const q = query(collection(db,"loans"), where("userId","==",userId));
  const snap = await getDocs(q);

  if(snap.empty){
    tableBody.innerHTML = `<tr><td colspan="7">No loans found.</td></tr>`;
    return;
  }

  let html = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();
    const startDate = d.startDate?.toDate ? d.startDate.toDate().toLocaleDateString() : "-";
    const closedDate = d.closedDate?.toDate ? d.closedDate.toDate().toLocaleDateString() : "-";

    html += `
      <tr>
        <td>${docSnap.id}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.totalWithInterest}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td class="status-${d.status}">${d.status}</td>
        <td>${startDate}</td>
        <td>${closedDate}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
});


/* 🔍 Search ONLY by Loan ID and Status */
document.getElementById("loanSearchInput").addEventListener("keyup", function(){

  const filter = this.value.trim().toLowerCase();
  const rows = document.querySelectorAll("#loanHistoryTable tbody tr");

  rows.forEach(row => {

    const loanId = row.cells[0] ? row.cells[0].innerText.toLowerCase() : "";
    const status = row.cells[4] ? row.cells[4].innerText.toLowerCase() : "";

    if (loanId.includes(filter) || status.includes(filter)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }

  });

});
