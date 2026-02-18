import { db } from "./firebase-config.js";
import { collection, addDoc }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

window.applyLoan = async function() {
const amount = document.getElementById("amount").value;
const rate = document.getElementById("rate").value;
const months = document.getElementById("months").value;

await addDoc(collection(db,"loans"),{
amount,
rate,
months,
status:"pending",
createdAt:new Date()
});

alert("Loan Applied Successfully");
}
