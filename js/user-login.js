import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");

    loginBtn.addEventListener("click", async () => {

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        if (!email || !password) {
            alert("Please fill all fields");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location = "user-dashboard.html";
        } catch (error) {
            alert(error.message);
            console.error(error);
        }

    });

});
