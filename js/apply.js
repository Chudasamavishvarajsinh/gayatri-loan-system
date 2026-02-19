import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg536DdCRGBTacV4wx1_asQ6NyOflX01I",
  authDomain: "gayatri-loan-system.firebaseapp.com",
  projectId: "gayatri-loan-system",
  storageBucket: "gayatri-loan-system.firebasestorage.app",
  messagingSenderId: "52394591148",
  appId: "1:52394591148:web:11e859e4d0f411ec4af009"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

window.applyLoan = async function(){

  const user = auth.currentUser;
  if(!user){
    alert("Login required");
    window.location="index.html";
    return;
  }

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const address = document.getElementById("address").value;
  const amount = document.getElementById("amount").value;

  await addDoc(collection(db,"loans"),{
    userId:user.uid,
    name:name,
    phone:phone,
    address:address,
    amount:amount,
    status:"Pending",
    meeting:"",
    createdAt:serverTimestamp()
  });

  alert("Loan Applied Successfully");
  window.location="user-dashboard.html";
}
