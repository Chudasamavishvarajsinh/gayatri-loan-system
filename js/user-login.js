import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = document.getElementById("loginBtn");

    loginBtn.addEventListener("click", async () => {

        console.log("Login button clicked");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();

        console.log("Email:", email);
        console.log("Password:", password);

    });

});
