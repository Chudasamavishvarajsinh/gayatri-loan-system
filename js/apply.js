import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.applyLoan = async function(){

const name = document.getElementById("name").value.trim();
const phone = document.getElementById("phone").value.trim();
const address = document.getElementById("address").value.trim();
const amount = parseFloat(document.getElementById("amount").value);
const msg = document.getElementById("msg");

if(!name || !phone || !amount){
msg.innerText = "Please fill all required fields.";
return;
}

try{

await addDoc(collection(db,"applications"),{
name,
phone,
address,
requestedAmount: amount,
status:"pending",
meeting:"",
createdAt: serverTimestamp()
});

msg.innerText = 
"You have successfully applied for a loan. Admin will contact you.";

document.getElementById("name").value="";
document.getElementById("phone").value="";
document.getElementById("address").value="";
document.getElementById("amount").value="";

}catch(error){
msg.innerText = error.message;
}

};
