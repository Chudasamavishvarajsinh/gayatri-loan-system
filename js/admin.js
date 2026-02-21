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

  // Load Users Cleanly
  const usersSnap = await getDocs(collection(db, "users"));
  const userSelect = document.getElementById("userId");

  userSelect.innerHTML = '<option value="">Select User</option>';

  usersSnap.forEach((docSnap) => {
    const data = docSnap.data();

    // Only add users that have name
    if (data.name) {
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name + " (" + data.phone + ")";
      userSelect.appendChild(option);
    }
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

  document.getElementById("principal").value = "";
  document.getElementById("interest").value = "";
  document.getElementById("months").value = "";
};


/* 🔹 Add Payment */
window.addLedger = async function(){

  const loanId = document.getElementById("loanId").value;
  const amount = parseFloat(document.getElementById("amount").value);

  if(!loanId || !amount){
    alert("Fill all fields");
    return;
  }

  const loanRef = doc(db,"loans",loanId);
  const loanSnap = await getDoc(loanRef);

  if(!loanSnap.exists()){
    alert("Invalid Loan ID");
    return;
  }

  let remaining = loanSnap.data().remainingAmount;
  remaining -= amount;

  await addDoc(collection(db,"ledger"),{
      loanId,
      userId: loanSnap.data().userId,
      type: "credit",
      amount,
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

  document.getElementById("loanId").value = "";
  document.getElementById("amount").value = "";
};
