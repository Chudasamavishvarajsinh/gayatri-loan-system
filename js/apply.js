import { auth, db } from "./firebase-config.js";

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
