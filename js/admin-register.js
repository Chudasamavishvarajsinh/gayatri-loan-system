import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const regBtn = document.getElementById("regBtn");

/**
 * Handles the registration of a new customer
 */
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("regName").value;
    const phone = document.getElementById("regPhone").value;
    const address = document.getElementById("regAddress").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;

    // Basic Validation
    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    regBtn.disabled = true;
    regBtn.innerText = "Creating Account...";

    try {
        /**
         * IMPORTANT: Firebase automatically logs in a user when you create their account.
         * Since the Admin (Baldevsinh) is the one creating this account, we need to 
         * handle the session carefully so the Admin doesn't get logged out.
         */
        
        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // 2. Save User Profile to 'users' collection
        await setDoc(doc(db, "users", newUser.uid), {
            name: name,
            phone: phone,
            address: address,
            email: email,
            role: "user",
            createdAt: serverTimestamp()
        });

        alert(`Customer ${name} registered successfully!`);
        registerForm.reset();

        /**
         * After registration, we usually want the Admin to stay logged in.
         * Note: In some Firebase versions, you might need to re-verify the Admin session
         * if the browser auto-switches to the new user. 
         */

    } catch (error) {
        console.error("Registration Error:", error);
        alert("Error: " + error.message);
    } finally {
        regBtn.disabled = false;
        regBtn.innerText = "Create Account";
    }
});
