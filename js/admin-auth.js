import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_REAL_KEY",
  authDomain: "YOUR_REAL_DOMAIN",
  projectId: "YOUR_REAL_PROJECT_ID"
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
