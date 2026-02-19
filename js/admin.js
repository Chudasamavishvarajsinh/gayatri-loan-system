import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";
import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const table = document.getElementById("adminTable");

onAuthStateChanged(auth,(user)=>{
if(!user){
window.location.href="admin-login.html";
}else{
loadAll();
}
});

async function loadAll(){
table.innerHTML="";
const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(doc=>{
const d = doc.data();

table.innerHTML += `
<tr>
<td>${d.name}</td>
<td>${d.phone}</td>
<td>${d.requestedAmount}</td>
<td>${d.status}</td>
<td>${d.meeting || "-"}</td>
</tr>
`;
});
}

window.searchUser = async function(){
const phone = document.getElementById("searchPhone").value.trim();
table.innerHTML="";
const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(doc=>{
const d = doc.data();
if(d.phone === phone){
table.innerHTML += `
<tr>
<td>${d.name}</td>
<td>${d.phone}</td>
<td>${d.requestedAmount}</td>
<td>${d.status}</td>
<td>${d.meeting || "-"}</td>
</tr>
`;
}
});
};

window.logout = async function(){
await signOut(auth);
window.location.href="admin-login.html";
};
