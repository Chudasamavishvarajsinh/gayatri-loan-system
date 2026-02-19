import { db } from "./firebase-config.js";
import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const btn = document.getElementById("checkBtn");

btn.addEventListener("click", async ()=>{

const phone = document.getElementById("phone").value.trim();
const result = document.getElementById("result");

result.innerHTML="";

const snapshot = await getDocs(collection(db,"applications"));

let found = false;

snapshot.forEach(docSnap=>{
const data = docSnap.data();

if(data.phone === phone){
found = true;

result.innerHTML = `
<p><strong>Status:</strong> ${data.status}</p>
<p><strong>Loan Amount:</strong> ₹${data.requestedAmount}</p>
<p><strong>Meeting:</strong> ${data.meeting || "Not Fixed"}</p>
`;
}
});

if(!found){
result.innerHTML = "<p>No record found.</p>";
}
});
