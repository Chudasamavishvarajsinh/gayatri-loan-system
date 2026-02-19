import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg536DdCRGBTacV4wx1_asQ6NyOflX01I",
  authDomain: "gayatri-loan-system.firebaseapp.com",
  projectId: "gayatri-loan-system",
  storageBucket: "gayatri-loan-system.firebasestorage.app",
  messagingSenderId: "52394591148",
  appId: "1:52394591148:web:11e859e4d0f411ec4af009"
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
