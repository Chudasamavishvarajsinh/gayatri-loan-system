import { auth, db } from "./firebase-config.js";
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
