import { auth, db } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Protect dashboard
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = "admin-login.html";
  }
});

window.logout = async function() {
  await signOut(auth);
  window.location = "admin-login.html";
};


// Create Loan with EMI + Interest
window.createLoan = async function(){

  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  const interestAmount = (principal * rate * months) / (100 * 12);
  const totalAmount = principal + interestAmount;
  const emi = totalAmount / months;

  await addDoc(collection(db,"loans"),{
      userId,
      principal,
      interestRate:rate,
      totalAmount,
      emiAmount:emi,
      emiMonths:months,
      remainingAmount:totalAmount,
      createdAt:serverTimestamp()
  });

  alert("Loan Created");
};


// Ledger Entry
window.addLedger = async function(){

  const loanId = document.getElementById("loanId").value;
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);

  await addDoc(collection(db,"ledger"),{
      loanId,
      type,
      amount,
      date:serverTimestamp()
  });

  const loanRef = doc(db,"loans",loanId);
  const snap = await getDoc(loanRef);

  if(snap.exists()){
    let remaining = snap.data().remainingAmount;

    if(type === "credit"){
        remaining -= amount;
    } else {
        remaining += amount;
    }

    await updateDoc(loanRef,{ remainingAmount: remaining });
  }

  alert("Ledger Updated");
};


// Create Admin
window.createAdmin = async function(){

  const email = document.getElementById("newAdminEmail").value;
  const password = document.getElementById("newAdminPassword").value;

  const currentAdmin = auth.currentUser;

  const userCred = await createUserWithEmailAndPassword(auth,email,password);

  await setDoc(doc(db,"admins",userCred.user.uid),{
    email,
    role:"admin"
  });

  await auth.updateCurrentUser(currentAdmin);

  alert("New Admin Created");
};
