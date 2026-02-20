import { auth, db } from "./firebase-config.js";

import {
  signOut,
  onAuthStateChanged
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

onAuthStateChanged(auth, async (user) => {

  if(!user){
    window.location = "index.html";
    return;
  }

  const q = query(collection(db,"loans"), where("userId","==",user.uid));
  const snap = await getDocs(q);

  let html = "";

  snap.forEach(doc=>{
    const data = doc.data();
    html += `
      <p><strong>Principal:</strong> ${data.principal}</p>
      <p><strong>Total:</strong> ${data.totalAmount}</p>
      <p><strong>EMI:</strong> ${data.emiAmount}</p>
      <p><strong>Remaining:</strong> ${data.remainingAmount}</p>
      <hr>
    `;
  });

  document.getElementById("loanDetails").innerHTML = html;
});
