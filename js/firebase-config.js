import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDg536DdCRGBTacV4wx1_asQ6NyOflX01I",
  authDomain: "gayatri-loan-system.firebaseapp.com",
  projectId: "gayatri-loan-system",
  storageBucket: "gayatri-loan-system.appspot.com",
  messagingSenderId: "52394591148",
  appId: "1:52394591148:web:11e859e4d0f411ec4af009"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
