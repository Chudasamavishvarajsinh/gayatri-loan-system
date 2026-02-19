import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDg536DdCRGBTacV4wx1_asQ6NyOflX01I",
  authDomain: "gayatri-loan-system.firebaseapp.com",
  projectId: "gayatri-loan-system",
  storageBucket: "gayatri-loan-system.firebasestorage.app",
  messagingSenderId: "52394591148",
  appId: "1:52394591148:web:11e859e4d0f411ec4af009"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

auth.onAuthStateChanged(user=>{
  if(!user){
    window.location="index.html";
  }else{
    const q = query(collection(db,"loans"), where("userId","==",user.uid));

    onSnapshot(q,(snapshot)=>{
      let html="";
      snapshot.forEach(doc=>{
        const data = doc.data();
        html+=`
        <tr>
        <td>${data.amount}</td>
        <td>${data.status}</td>
        <td>${data.meeting || "Not Scheduled"}</td>
        <td>${data.createdAt?.toDate().toLocaleDateString() || ""}</td>
        </tr>
        `;
      });
      document.getElementById("historyTable").innerHTML=html;
    });
  }
});
