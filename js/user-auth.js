import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_ID",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.login = function(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth,email,password)
  .then(()=>{
    alert("Login successful");
    window.location="user-dashboard.html";
  })
  .catch(e=>document.getElementById("msg").innerText=e.message);
}

window.register = function(){
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth,email,password)
  .then(()=>{
    alert("Registration successful");
    window.location="index.html";
  })
  .catch(e=>document.getElementById("msg").innerText=e.message);
}

window.logout = function(){
  signOut(auth).then(()=>{
    window.location="index.html";
  });
}
