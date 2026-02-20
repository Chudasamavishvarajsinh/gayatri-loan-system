import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


window.logout = async function(){
  await signOut(auth);
  window.location = "index.html";
};


onAuthStateChanged(auth, async (user)=>{

  if(!user){
    window.location = "index.html";
    return;
  }

  const q = query(collection(db,"loans"), where("userId","==",user.uid));
  const snap = await getDocs(q);

  let html = "";

  snap.forEach(docSnap=>{

    const d = docSnap.data();

    html += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px;">
        <p><strong>Principal:</strong> ${d.principal}</p>
        <p><strong>Interest Rate:</strong> ${d.interestRate}%</p>
        <p><strong>Total Without Interest:</strong> ${d.totalWithoutInterest}</p>
        <p><strong>Total With Interest:</strong> ${d.totalWithInterest}</p>
        <p><strong>Remaining:</strong> ${d.remainingAmount}</p>
        <p><strong>Status:</strong> ${d.status}</p>
      </div>
    `;
  });

  document.getElementById("loans").innerHTML = html;
});
