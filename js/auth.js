import { auth } from "./firebase-config.js";
import {
createUserWithEmailAndPassword,
signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

window.register = function() {
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

createUserWithEmailAndPassword(auth, email, password)
.then(() => window.location.href="user.html")
.catch(err => alert(err.message));
}

window.login = function() {
const email = document.getElementById("email").value;
const password = document.getElementById("password").value;

signInWithEmailAndPassword(auth, email, password)
.then(() => window.location.href="user.html")
.catch(err => alert(err.message));
}
