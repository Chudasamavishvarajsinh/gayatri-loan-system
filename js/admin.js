import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let usersData = {};

/* ADMIN AUTH */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location = "admin-login.html";
    return;
  }

  const adminRef = doc(db, "admins", user.uid);
  const adminSnap = await getDoc(adminRef);

  if (!adminSnap.exists()) {
    alert("Access Denied");
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  await loadUsers();
  await loadDashboardSummary();
});

/* LOAD USERS */
async function loadUsers() {

  const usersSnap = await getDocs(collection(db, "users"));

  const createLoanSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  createLoanSelect.innerHTML = '<option value="">Select User</option>';
  historySelect.innerHTML = '<option value="">Select User</option>';

  usersData = {};

  usersSnap.forEach((docSnap) => {

    const data = docSnap.data();
    if (!data.name) return;

    usersData[docSnap.id] = data;

    const option1 = document.createElement("option");
    option1.value = docSnap.id;
    option1.textContent = data.name;
    createLoanSelect.appendChild(option1);

    const option2 = document.createElement("option");
    option2.value = docSnap.id;
    option2.textContent = data.name;
    historySelect.appendChild(option2);
  });
}

/* DASHBOARD SUMMARY */
async function loadDashboardSummary() {

  const usersSnap = await getDocs(collection(db, "users"));
  const loansSnap = await getDocs(collection(db, "loans"));

  let activeCount = 0;
  let closedCount = 0;
  let totalOutstanding = 0;

  loansSnap.forEach(docSnap => {
    const loan = docSnap.data();

    if (loan.status === "active") {
      activeCount++;
      totalOutstanding += loan.remainingAmount || 0;
    }

    if (loan.status === "closed") {
      closedCount++;
    }
  });

  document.getElementById("totalUsers").innerText = usersSnap.size;
  document.getElementById("totalActiveLoans").innerText = activeCount;
  document.getElementById("totalClosedLoans").innerText = closedCount;
  document.getElementById("totalOutstanding").innerText = "₹ " + totalOutstanding;
}

/* LOGOUT */
window.logout = async function(){
  await signOut(auth);
  window.location = "admin-login.html";
};
