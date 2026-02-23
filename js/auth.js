import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const errorBox = document.getElementById("errorBox");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Reset UI state
    loginBtn.innerText = "Verifying Credentials...";
    loginBtn.disabled = true;
    errorBox.style.display = "none";

    try {
        // 1. Firebase Auth Sign-In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Role-Based Redirection Logic (Admin vs User)
        // We look for the user's UID in the 'admins' collection
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDocSnap = await getDoc(adminDocRef);

        if (adminDocSnap.exists()) {
            // Logged in as: Chudasama Baldevsinh (Admin)
            window.location.href = "admin_dashboard.html";
        } else {
            // Logged in as: Customer
            window.location.href = "user.html";
        }

    } catch (error) {
        console.error("Auth Error:", error.code);
        errorBox.style.display = "block";
        
        // Friendly error messages
        if (error.code === 'auth/invalid-credential') {
            errorBox.innerText = "Incorrect email or password. Please try again.";
        } else if (error.code === 'auth/user-not-found') {
            errorBox.innerText = "No account found with this email.";
        } else {
            errorBox.innerText = "Login failed: " + error.message;
        }

        loginBtn.innerText = "Secure Sign In";
        loginBtn.disabled = false;
    }
});
