import { db } from "./firebase-config.js";
import { auth } from "./firebase-config.js";
import {
collection,
getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const table = document.getElementById("loanTable");

onAuthStateChanged(auth,async(user)=>{

if(!user){
window.location.href="user-login.html";
return;
}

const snapshot = await getDocs(collection(db,"applications"));

snapshot.forEach(doc=>{
const d = doc.data();

if(d.email === user.email){
table.innerHTML += `
<tr>
<td>${d.requestedAmount}</td>
<td>${d.status}</td>
<td>${d.meeting || "-"}</td>
</tr>
`;
}
});

});
