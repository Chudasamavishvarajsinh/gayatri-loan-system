import { db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc, deleteDoc }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table=document.getElementById("appTable");
const totalCount=document.getElementById("totalCount");

async function loadApplications(){

const snapshot=await getDocs(collection(db,"applications"));

let count=0;
table.innerHTML="";

snapshot.forEach(docSnap=>{
count++;

const data=docSnap.data();

table.innerHTML+=`
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.amount}</td>
<td>${data.status}</td>
<td>
<button onclick="approve('${docSnap.id}',${data.amount})">Approve</button>
<button onclick="deleteApp('${docSnap.id}')">Delete</button>
</td>
</tr>`;
});

totalCount.innerText="Total Applications: "+count;
}

window.approve = async function(id,amount){

const interest = amount * 0.1; // 10% interest example
const totalPayable = parseFloat(amount) + interest;

await updateDoc(doc(db,"applications",id),{
status:"approved",
interest,
totalPayable,
meeting:"Tomorrow 11 AM"
});

alert("Loan Approved");
loadApplications();
}

window.deleteApp = async function(id){
await deleteDoc(doc(db,"applications",id));
loadApplications();
}

loadApplications();
