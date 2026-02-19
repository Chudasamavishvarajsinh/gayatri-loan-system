import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword }
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

window.loginUser = async function(){

const email = document.getElementById("email").value;
const password = document.getElementById("password").value;
const msg = document.getElementById("msg");

try{
await signInWithEmailAndPassword(auth,email,password);
window.location.href="user-dashboard.html";
}catch(e){
msg.innerText = e.message;
}
};
