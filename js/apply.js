import { db } from "./firebase-config.js";
import {
collection,
getDocs,
updateDoc,
doc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table = document.getElementById("appTable");
const searchBtn = document.getElementById("searchBtn");

async function loadApplications(){

table.innerHTML="";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap=>{
const data = docSnap.data();

table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.requestedAmount}</td>
<td>${data.status}</td>
<td>${data.meeting || "Not Fixed"}</td>
<td>
<button onclick="fixMeeting('${docSnap.id}')">Meeting</button>
<button onclick="approve('${docSnap.id}')">Approve</button>
</td>
</tr>
`;
});
}

window.fixMeeting = async function(id){

const meeting = prompt("Enter Meeting Date & Time");

if(!meeting) return;

await updateDoc(doc(db,"applications",id),{
meeting
});

alert("Meeting Updated");
loadApplications();
}

window.approve = async function(id){

await updateDoc(doc(db,"applications",id),{
status:"approved"
});

alert("Loan Approved");
loadApplications();
}

searchBtn.addEventListener("click", async ()=>{

const phone = document.getElementById("searchPhone").value.trim();

table.innerHTML="";

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(docSnap=>{
const data = docSnap.data();

if(data.phone === phone){

table.innerHTML += `
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.requestedAmount}</td>
<td>${data.status}</td>
<td>${data.meeting || "Not Fixed"}</td>
<td>Found</td>
</tr>
`;
}
});
});

loadApplications();
