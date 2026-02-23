// Import Firebase SDKs from CDN for web compatibility
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your actual Firebase configuration
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

// Export instances to be used in other JS files
export const auth = getAuth(app);
export const db = getFirestore(app);
