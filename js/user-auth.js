import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");
    const messageBox = document.getElementById("messageBox");

    loginBtn.addEventListener("click", async () => {

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        messageBox.className = "message-box";
        messageBox.style.display = "none";

        if (!email || !password) {
            showError("Please fill all fields");
            return;
        }

        try {

            await signInWithEmailAndPassword(auth, email, password);

            showSuccess("Login successful. Redirecting...");

            setTimeout(() => {
                window.location = "user-dashboard.html";
            }, 1000);

        } catch (error) {
            showError(error.message);
            console.error(error);
        }

    });

    function showSuccess(message) {
        messageBox.textContent = message;
        messageBox.classList.add("message-success");
    }

    function showError(message) {
        messageBox.textContent = message;
        messageBox.classList.add("message-error");
    }

});
