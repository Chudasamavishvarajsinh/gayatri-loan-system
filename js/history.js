import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

auth.onAuthStateChanged(user=>{
  if(!user){
    window.location="index.html";
  }else{
    const q = query(collection(db,"loans"), where("userId","==",user.uid));

    onSnapshot(q,(snapshot)=>{
      let html="";
      snapshot.forEach(doc=>{
        const data = doc.data();
        html+=`
        <tr>
        <td>${data.amount}</td>
        <td>${data.status}</td>
        <td>${data.meeting || "Not Scheduled"}</td>
        <td>${data.createdAt?.toDate().toLocaleDateString() || ""}</td>
        </tr>
        `;
      });
      document.getElementById("historyTable").innerHTML=html;
    });
  }
});
