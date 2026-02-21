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

  // Load Users
  const usersSnap = await getDocs(collection(db, "users"));
  const userSelect = document.getElementById("userId");

  userSelect.innerHTML = '<option value="">Select User</option>';

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data();
    if (!data.name || !data.phone) return;

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.name + " (" + data.phone + ")";
    userSelect.appendChild(option);
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
  loadUserLoans(userId);
};


/* 🔹 When User Changes, Load Their Loans */
document.getElementById("userId").addEventListener("change", function(){
  const userId = this.value;
  if(userId){
    loadUserLoans(userId);
  } else {
    document.getElementById("userLoans").innerHTML = "Select a user to view loans.";
  }
});


/* 🔹 Load Loans for Selected User */
async function loadUserLoans(userId){

  const loansDiv = document.getElementById("userLoans");
  loansDiv.innerHTML = "Loading...";

  const q = query(collection(db,"loans"), where("userId","==",userId));
  const snap = await getDocs(q);

  if(snap.empty){
    loansDiv.innerHTML = "No loans found for this user.";
    return;
  }

  let html = `
    <table border="1" width="100%" cellpadding="8">
      <tr>
        <th>Loan ID</th>
        <th>Principal</th>
        <th>Remaining</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
  `;

  snap.forEach(docSnap => {

    const d = docSnap.data();
    const loanId = docSnap.id;

    html += `
      <tr>
        <td>${loanId}</td>
        <td>₹ ${d.principal}</td>
        <td>₹ ${d.remainingAmount}</td>
        <td>${d.status}</td>
        <td>
          <button onclick="addPaymentPrompt('${loanId}')">
            Add Payment
          </button>
        </td>
      </tr>
    `;
  });

  html += `</table>`;

  loansDiv.innerHTML = html;
}


/* 🔹 Add Payment Without Manual Loan ID */
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

  loadUserLoans(loanSnap.data().userId);
};
