import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.applyLoan = async function(){

const name = document.getElementById("name").value;
const phone = document.getElementById("phone").value;
const address = document.getElementById("address").value;
const amount = document.getElementById("amount").value;

if(!name || !phone || !amount){
alert("Fill all required fields");
return;
}

await addDoc(collection(db,"applications"),{
name,
phone,
address,
amount: parseFloat(amount),
status:"pending",
createdAt: new Date()
});

alert("Application Submitted Successfully");
location.reload();
}
