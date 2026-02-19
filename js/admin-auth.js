import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

window.createAdmin = async function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const userCred = await createUserWithEmailAndPassword(auth,email,password);

  await setDoc(doc(db,"admins",userCred.user.uid),{
    email:email,
    role:"admin"
  });

  alert("Admin Created Successfully");
  window.location="admin-login.html";
}

window.adminLogin = async function(){

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const userCred = await signInWithEmailAndPassword(auth,email,password);

  const adminDoc = await getDoc(doc(db,"admins",userCred.user.uid));

  if(adminDoc.exists()){
    alert("Admin Login Successful");
    window.location="admin-dashboard.html";
  }else{
    alert("Not an admin");
    await signOut(auth);
  }
}

