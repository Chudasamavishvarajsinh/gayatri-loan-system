// Import the Firebase SDKs from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your specific Firebase project configuration
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

// Export services and Branding Details for use in other files
export const auth = getAuth(app);
export const db = getFirestore(app);

export const storeInfo = {
    name: "Gayatri Electronics",
    owner: "Chudasama Baldevsinh Mansang",
    phone: "9924232759",
    address: "Beside Chamunda Games Store, Opp. Pir Ni Dargah, Street No. 5, Khodiyar Colony, Jamnagar, Gujarat 361006"
};
