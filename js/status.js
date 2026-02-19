import { db } from "./firebase-config.js";
import { collection,onSnapshot }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.checkStatus=function(){

const phone=document.getElementById("phone").value;
const result=document.getElementById("result");

onSnapshot(collection(db,"accounts"),snapshot=>{
snapshot.forEach(docSnap=>{
const data=docSnap.data();

if(data.phone===phone){

let balance=0;
let html="<h3>Transaction History</h3><ul>";

data.ledger.forEach(entry=>{
if(entry.type==="credit") balance+=entry.amount;
if(entry.type==="debit") balance-=entry.amount;

const date=new Date(entry.date.seconds*1000);
html+=`<li>${date.toDateString()} - ${entry.type} - ₹${entry.amount}</li>`;
});

html+="</ul>";
html+=`<div class='balance-box'>Current Balance: ₹${balance}</div>`;

result.innerHTML=html;
}
});
});
}
