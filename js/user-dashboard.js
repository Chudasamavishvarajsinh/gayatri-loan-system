import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

window.logout = async function () {
  await signOut(auth);
  window.location = "index.html";
};

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location = "index.html";
    return;
  }

  try {

    const q = query(
      collection(db, "loans"),
      where("userId", "==", user.uid)
    );

    const snap = await getDocs(q);

    const loansContainer = document.getElementById("loans");

    if (snap.empty) {
      loansContainer.innerHTML = "<p>No loans found.</p>";
      return;
    }

    let html = `
      <table border="1" width="100%" cellpadding="8">
        <tr>
          <th>Loan ID</th>
          <th>Principal</th>
          <th>Total With Interest</th>
          <th>Remaining</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
    `;

    snap.forEach((docSnap) => {

      const d = docSnap.data();
      const loanId = docSnap.id;

      html += `
        <tr>
          <td>${loanId}</td>
          <td>₹ ${d.principal}</td>
          <td>₹ ${d.totalWithInterest}</td>
          <td>₹ ${d.remainingAmount}</td>
          <td>${d.status}</td>
          <td>
            <button onclick="viewLoan('${loanId}')">
              View
            </button>
          </td>
        </tr>
      `;
    });

    html += `</table>`;

    loansContainer.innerHTML = html;

  } catch (error) {
    console.error(error);
    document.getElementById("loans").innerHTML =
      "<p>Error loading loans.</p>";
  }

});

window.viewLoan = function (loanId) {
  window.location = `loan-details.html?loanId=${loanId}`;
};
