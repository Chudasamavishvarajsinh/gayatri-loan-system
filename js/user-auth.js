import { auth, db } from "./firebase-config.js";

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
