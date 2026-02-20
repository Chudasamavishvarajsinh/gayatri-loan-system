import { auth, db } from "./firebase-config.js";

import { createUserWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { doc, setDoc } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

auth.onAuthStateChanged(user=>{
  if(!user){
    window.location="admin-login.html";
  }
});

window.logout=function(){
  signOut(auth).then(()=>{
    window.location="index.html";
  });
}

const table=document.getElementById("loanTable");

onSnapshot(collection(db,"loans"),(snapshot)=>{
  let html="";
  snapshot.forEach(docSnap=>{
    const data=docSnap.data();
    html+=`
    <tr>
    <td>${data.name}</td>
    <td>${data.phone}</td>
    <td>${data.amount}</td>
    <td>${data.meeting || "Not Set"}</td>
    <td>
    <button onclick="setMeeting('${docSnap.id}')">Set Meeting</button>
    </td>
    </tr>
    `;
  });
  table.innerHTML=html;
});

window.setMeeting=async function(id){
  const meeting=prompt("Enter Meeting Date & Time");
  if(meeting){
    await updateDoc(doc(db,"loans",id),{
      meeting:meeting,
      status:"Meeting Scheduled"
    });
  }
}

window.searchUser=function(){
  const value=document.getElementById("search").value.toLowerCase();
  const rows=document.querySelectorAll("#loanTable tr");
  rows.forEach(row=>{
    row.style.display=row.innerText.toLowerCase().includes(value) ? "" : "none";
  });
}
