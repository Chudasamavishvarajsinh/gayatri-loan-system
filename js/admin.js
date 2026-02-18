import { db } from "./firebase-config.js";
import { collection, getDocs }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const table = document.getElementById("loanTable");

async function loadLoans() {
const snapshot = await getDocs(collection(db,"loans"));

snapshot.forEach(doc => {
const data = doc.data();
table.innerHTML += `
<tr>
<td>${data.amount}</td>
<td>${data.rate}%</td>
<td>${data.months}</td>
<td>${data.status}</td>
</tr>`;
});
}

loadLoans();
