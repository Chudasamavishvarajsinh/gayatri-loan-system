import { db } from "./firebase-config.js";
import {
collection,
onSnapshot,
updateDoc,
doc,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const appTable=document.getElementById("appTable");

window.loadApplications=function(){

onSnapshot(collection(db,"applications"),snapshot=>{
appTable.innerHTML="";
snapshot.forEach(docSnap=>{
const data=docSnap.data();

appTable.innerHTML+=`
<tr>
<td>${data.name}</td>
<td>${data.phone}</td>
<td>${data.requestedAmount}</td>
<td>${data.status}</td>
<td>${data.meeting||"Not Fixed"}</td>
<td>
<button onclick="fixMeeting('${docSnap.id}')">Meeting</button>
<button onclick="createAccount('${docSnap.id}',${data.requestedAmount})">Approve</button>
</td>
</tr>
`;
});
});
}

window.fixMeeting=async function(id){
const meeting=prompt("Enter Meeting Date & Time");
await updateDoc(doc(db,"applications",id),{
meeting
});
}

window.createAccount=async function(id,amount){

const snapshot=await getDocs(collection(db,"applications"));

snapshot.forEach(async docSnap=>{
if(docSnap.id===id){

const data=docSnap.data();

await addDoc(collection(db,"accounts"),{
phone:data.phone,
name:data.name,
ledger:[
{
type:"credit",
amount:amount,
date:new Date()
}
]
});

await updateDoc(doc(db,"applications",id),{
status:"approved"
});
}
});
}

window.addLedger=async function(){

const phone=document.getElementById("ledgerPhone").value;
const amount=parseFloat(document.getElementById("ledgerAmount").value);
const type=document.getElementById("ledgerType").value;

const snapshot=await getDocs(collection(db,"accounts"));

snapshot.forEach(async docSnap=>{
const data=docSnap.data();
if(data.phone===phone){

let ledger=data.ledger;
ledger.push({
type,
amount,
date:new Date()
});

await updateDoc(doc(db,"accounts",docSnap.id),{
ledger
});
}
});
}
