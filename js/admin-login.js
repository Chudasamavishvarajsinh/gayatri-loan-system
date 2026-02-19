import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

window.loginAdmin = async function(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

try{
await signInWithEmailAndPassword(auth,email,password);
window.location.href="admin.html";
}catch(error){
alert(error.message);
}
}
