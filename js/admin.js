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


/* 🔒 Protect Admin */
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

  const usersSnap = await getDocs(collection(db, "users"));

  const createLoanSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  createLoanSelect.innerHTML = '<option value="">Select User</option>';
  historySelect.innerHTML = '<option value="">Select User</option>';

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


/* 🔹 User Loan History */
document.getElementById("historyUserSelect").addEventListener("change", async function(){

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
    <strong>Name:</strong> ${user.name} <br>
    <strong>Phone:</strong> ${user.phone} <br>
    <strong>Address:</strong> ${user.address}
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

    // 🔹 Fetch partial payments for this loan
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
        `;
    });

    if(paymentHtml === ""){
        paymentHtml = "-";
    }

    let actionBtn = "";

    if(d.status === "active"){
      actionBtn = `<button onclick="addPayment('${loanId}')">Add Payment</button>`;
    } else {
      actionBtn = "-";
    }

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


/* 🔹 Add Payment */
window.addPayment = async function(loanId){

  const amount = prompt("Enter Payment Amount:");
  if(!amount) return;

  const paymentAmount = parseFloat(amount);
  if(isNaN(paymentAmount)){
    alert("Invalid amount");
    return;
  }

  const loanRef = doc(db,"loans",loanId);
  const loanSnap = await getDoc(loanRef);

  if(!loanSnap.exists()){
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

  if(remaining <= 0){
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
    .dispatchEvent(new Event("change"));
};


/* 🔍 Search Only Loan ID + Status */
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


