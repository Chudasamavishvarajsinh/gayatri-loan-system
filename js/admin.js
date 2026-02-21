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


let allUsersMap = {}; // Store userId -> userName mapping


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

  // Load users for both dropdowns
  const usersSnap = await getDocs(collection(db, "users"));

  const createLoanSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  createLoanSelect.innerHTML = '<option value="">Select User</option>';
  historySelect.innerHTML = '<option value="">Select User</option>';

  usersSnap.forEach((docSnap) => {

    const data = docSnap.data();
    if (!data.name || !data.phone) return;

    const userName = data.name + " (" + data.phone + ")";
    allUsersMap[docSnap.id] = data.name;

    const option1 = document.createElement("option");
    option1.value = docSnap.id;
    option1.textContent = userName;
    createLoanSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = docSnap.id;
    option2.textContent = userName;
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


/* 🔹 Load Selected User Loan History */
document.getElementById("historyUserSelect").addEventListener("change", function(){
  const userId = this.value;
  if(userId){
    loadUserLoanHistory(userId);
  }
});


async function loadUserLoanHistory(userId){

  const tableBody = document.querySelector("#loanHistoryTable tbody");
  tableBody.innerHTML = "Loading...";

  const q = query(collection(db,"loans"), where("userId","==",userId));
  const snap = await getDocs(q);

  if(snap.empty){
    tableBody.innerHTML = `<tr><td colspan="8">No loans found.</td></tr>`;
    return;
  }

  let html = "";

  snap.forEach(docSnap => {

    const d = docSnap.data();
    const loanId = docSnap.id;
    const userName = allUsersMap[d.userId] || "Unknown";

    const startDate = d.startDate?.toDate 
        ? d.startDate.toDate().toLocaleDateString()
        : "-";

    const closedDate = d.closedDate?.toDate
        ? d.closedDate.toDate().toLocaleDateString()
        : "-";

    html += `
      <tr>
        <td>${loanId}</td>
        <td>${userName}</td>
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
}


/* 🔍 Search Filter */
document.getElementById("loanSearchInput").addEventListener("keyup", function(){

  const filter = this.value.toLowerCase();
  const rows = document.querySelectorAll("#loanHistoryTable tbody tr");

  rows.forEach(row => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  });

});


/* 🔹 Add Payment (Unchanged Logic) */
window.addPaymentPrompt = async function(loanId){

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

  loadUserLoanHistory(loanSnap.data().userId);
};
