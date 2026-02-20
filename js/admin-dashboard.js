import { auth, db } from "./firebase-config.js";

import { 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* 🔒 Protect Dashboard */
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location = "admin-login.html";
        return;
    }

    const adminDoc = await getDoc(doc(db, "admins", user.uid));

    if (!adminDoc.exists()) {
        alert("Access Denied");
        await signOut(auth);
        window.location = "admin-login.html";
    }
});


/* Toggle Create Admin Section */
window.toggleCreateAdmin = function() {
    const section = document.getElementById("createAdminSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
};


/* Create New Admin */
window.createAdmin = async function() {

    const currentAdmin = auth.currentUser;

    const email = document.getElementById("newAdminEmail").value;
    const password = document.getElementById("newAdminPassword").value;

    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }

    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "admins", userCred.user.uid), {
            email: email,
            role: "admin",
            createdAt: new Date()
        });

        alert("New Admin Created Successfully");

        // Keep original admin logged in
        await auth.updateCurrentUser(currentAdmin);

        document.getElementById("newAdminEmail").value = "";
        document.getElementById("newAdminPassword").value = "";

    } catch (error) {
        alert(error.message);
    }
};


/* Logout */
window.logout = async function() {
    await signOut(auth);
    window.location = "admin-login.html";
};
