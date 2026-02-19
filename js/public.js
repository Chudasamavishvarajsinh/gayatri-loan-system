import { db } from "./firebase-config.js";
import { collection, addDoc }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.applyLoan = async function() {

const name = document.getElementById("name").value;
const phone = document.getElementById("phone").value;
const address = document.getElementById("address").value;
const amount = document.getElementById("amount").value;

if(!name || !phone || !address || !amount){
alert("Fill all fields");
return;
}

await addDoc(collection(db,"applications"),{
name,
phone,
address,
amount,
status:"pending",
meeting:null,
interest:0,
totalPayable:0,
createdAt:new Date()
});

alert("Application Submitted Successfully");
}
