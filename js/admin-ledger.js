import { auth, db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


window.createLoan = async function(){

  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  const interestAmount = (principal * rate * months) / (100 * 12);
  const totalAmount = principal + interestAmount;
  const emi = totalAmount / months;

  const loanRef = await addDoc(collection(db,"loans"),{
      userId:userId,
      principal:principal,
      interestRate:rate,
      totalAmount:totalAmount,
      emiAmount:emi,
      emiMonths:months,
      remainingAmount:totalAmount,
      createdAt:serverTimestamp()
  });

  alert("Loan Created Successfully");
};



window.addLedger = async function(){

  const loanId = document.getElementById("loanId").value;
  const type = document.getElementById("type").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  await addDoc(collection(db,"ledger"),{
      loanId:loanId,
      type:type,
      amount:amount,
      note:note,
      date:serverTimestamp()
  });

  // Update remaining balance if credit
  if(type === "credit"){

    const loanRef = doc(db,"loans",loanId);
    const loanSnap = await getDoc(loanRef);

    if(loanSnap.exists()){
        const remaining = loanSnap.data().remainingAmount - amount;

        await updateDoc(loanRef,{
            remainingAmount: remaining
        });
    }
  }

  alert("Ledger Entry Added");
};
