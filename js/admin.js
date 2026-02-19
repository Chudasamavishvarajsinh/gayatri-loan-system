import { db } from "./firebase-config.js";
import {
collection,
getDocs,
updateDoc,
doc,
deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table = document.getElementById("appTable");

async function loadApplications() {
table.innerHTML = "";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap => {
const data = docSnap.data();

table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.amount}</td>
<td>${data.status}</td>
<td>${data.meeting || "Not Fixed"}</td>
<td>
<button onclick="approve('${docSnap.id}',${data.amount})">Approve</button>
<button onclick="fixMeeting('${docSnap.id}')">Meeting</button>
<button onclick="deleteApp('${docSnap.id}')">Delete</button>
</td>
</tr>`;
});
}

window.approve = async function(id, amount) {

const interest = amount * 0.10; // 10%
const totalPayable = parseFloat(amount) + interest;

await updateDoc(doc(db,"applications",id),{
status:"approved",
interest,
totalPayable
});

alert("Loan Approved");
loadApplications();
}

window.fixMeeting = async function(id){

const meetingTime = prompt("Enter Meeting Date & Time");

if(!meetingTime) return;

await updateDoc(doc(db,"applications",id),{
meeting:meetingTime
});

alert("Meeting Fixed");
loadApplications();
}

window.deleteApp = async function(id){
await deleteDoc(doc(db,"applications",id));
loadApplications();
}

window.searchUser = async function(){

const phone = document.getElementById("searchPhone").value;
table.innerHTML = "";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap => {
const data = docSnap.data();

if(data.phone === phone){
table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.amount}</td>
<td>${data.status}</td>
<td>${data.meeting || "Not Fixed"}</td>
<td>Found</td>
</tr>`;
}
});
}

loadApplications();
