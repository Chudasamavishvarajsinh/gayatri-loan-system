import { db } from "./firebase-config.js";
import {
collection,
getDocs,
updateDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table = document.getElementById("appTable");

window.loadApplications = async function(){

table.innerHTML="";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap=>{
const data = docSnap.data();

table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.amount}</td>
<td>${data.status}</td>
<td>${data.meeting || "Not Fixed"}</td>
<td>${data.interest || 0}</td>
<td>${data.totalPayable || 0}</td>
<td>
<button onclick="approve('${docSnap.id}',${data.amount})">Approve</button>
<button onclick="meeting('${docSnap.id}')">Meeting</button>
</td>
</tr>
`;
});
}

window.approve = async function(id,amount){

const interest = amount * 0.10;
const totalPayable = parseFloat(amount) + interest;

await updateDoc(doc(db,"applications",id),{
status:"approved",
interest,
totalPayable
});

alert("Loan Approved");
loadApplications();
}

window.meeting = async function(id){

const time = prompt("Enter Meeting Date & Time");

await updateDoc(doc(db,"applications",id),{
meeting:time
});

alert("Meeting Updated");
loadApplications();
}

window.searchUser = async function(){

const phone = document.getElementById("searchPhone").value;
table.innerHTML="";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap=>{
const data = docSnap.data();

if(data.phone===phone){
table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.amount}</td>
<td>${data.status}</td>
<td>${data.meeting}</td>
<td>${data.interest}</td>
<td>${data.totalPayable}</td>
<td>Found</td>
</tr>
`;
}
});
}

loadApplications();
