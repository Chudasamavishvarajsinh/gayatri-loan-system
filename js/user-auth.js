import { auth } from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


/* 🔹 Register */
window.register = async function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    alert("Fill all fields");
    return;
  }

  try{
    await createUserWithEmailAndPassword(auth,email,password);
    alert("Registration Successful");
    window.location="index.html";
  }catch(error){
    alert(error.message);
  }
};


/* 🔹 Login */
window.login = async function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if(!email || !password){
    alert("Fill all fields");
    return;
  }

  try{
    await signInWithEmailAndPassword(auth,email,password);
    alert("Login Successful");
    window.location="user-dashboard.html";
  }catch(error){
    alert(error.message);
  }
};


/* 🔹 Logout */
window.logout = async function(){
  await signOut(auth);
  window.location="index.html";
};
