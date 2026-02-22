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

let currentLoanId = null;

/* ================= HELPER: FORMAT CURRENCY ================= */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

/* ================= ADMIN AUTH ================= */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location = "admin-login.html";
    return;
  }

  const adminSnap = await getDoc(doc(db, "admins", user.uid));

  if (!adminSnap.exists()) {
    await signOut(auth);
    window.location = "admin-login.html";
    return;
  }

  // Initial Data Load
  await loadUsers();
  await loadDashboardSummary();

  document
    .getElementById("historyUserSelect")
    ?.addEventListener("change", loadUserLoans);
});

/* ================= LOAD USERS ================= */
async function loadUsers() {
  const usersSnapshot = await getDocs(collection(db, "users"));
  const createSelect = document.getElementById("userId");
  const historySelect = document.getElementById("historyUserSelect");

  if (!createSelect || !historySelect) return;

  createSelect.innerHTML = `<option value="">Choose a user...</option>`;
  historySelect.innerHTML = `<option value="">Select User</option>`;

  usersSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const optionText = data.name || "No Name";
    
    [createSelect, historySelect].forEach(select => {
        const opt = document.createElement("option");
        opt.value = docSnap.id;
        opt.textContent = optionText;
        select.appendChild(opt);
    });
  });
}

/* ================= DASHBOARD SUMMARY ================= */
async function loadDashboardSummary() {
  const usersSnap = await getDocs(collection(db, "users"));
  const loansSnap = await getDocs(collection(db, "loans"));

  let active = 0;
  let closed = 0;
  let outstanding = 0;

  loansSnap.forEach(docSnap => {
    const loan = docSnap.data();
    if (loan.status === "active") {
      active++;
      outstanding += loan.remainingAmount || 0;
    } else if (loan.status === "closed") {
      closed++;
    }
  });

  // Adding a small "pop" animation to numbers
  animateNumber("totalUsers", usersSnap.size);
  animateNumber("totalActiveLoans", active);
  animateNumber("totalClosedLoans", closed);
  document.getElementById("totalOutstanding").innerText = formatCurrency(outstanding);
}

function animateNumber(id, value) {
    const el = document.getElementById(id);
    el.classList.add('fade-in');
    el.innerText = value;
}

/* ================= CREATE LOAN ================= */
window.createLoan = async function () {
  const btn = event.target;
  const userId = document.getElementById("userId").value;
  const principal = parseFloat(document.getElementById("principal").value);
  const rate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("months").value);

  if (!userId || isNaN(principal) || isNaN(rate) || isNaN(months)) {
    alert("Please fill all fields correctly.");
    return;
  }

  try {
    btn.disabled = true;
    btn.innerText = "Processing...";

    const interest = (principal * rate * months) / 100;
    const total = principal + interest;

    await addDoc(collection(db, "loans"), {
      userId,
      principal,
      interestRate: rate,
      months,
      totalWithoutInterest: principal,
      totalWithInterest: total,
      remainingAmount: total,
      status: "active",
      startDate: serverTimestamp()
    });

    alert("✅ Loan Agreement Created Successfully");
    
    // Reset Form
    document.getElementById("principal").value = "";
    document.getElementById("interest").value = "";
    document.getElementById("months").value = "";
    
    await loadDashboardSummary();
  } catch (e) {
    console.error(e);
    alert("Error creating loan");
  } finally {
    btn.disabled = false;
    btn.innerText = "Create Loan Agreement";
  }
};

/* ================= LOAD USER LOANS ================= */
async function loadUserLoans() {
  const userId = this.value;
  const tbody = document.querySelector("#loanHistoryTable tbody");

  if (!userId) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Select a user to view history</td></tr>`;
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Loading history...</td></tr>`;

  const q = query(collection(db, "loans"), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">No loan records found for this user.</td></tr>`;
    return;
  }

  let html = "";
  snap.forEach(docSnap => {
    const d = docSnap.data();
    const loanId = docSnap.id;
    const statusClass = d.status === 'active' ? 'status-active' : 'status-closed';

    html += `
      <tr class="fade-in">
        <td style="font-family: monospace; font-size: 12px; color: #64748b;">#${loanId.slice(0,8)}</td>
        <td>${formatCurrency(d.principal)}</td>
        <td>${formatCurrency(d.totalWithInterest)}</td>
        <td style="font-weight:600; color:var(--primary)">${formatCurrency(d.remainingAmount)}</td>
        <td><span class="status-pill ${statusClass}">${d.status.toUpperCase()}</span></td>
        <td>
          ${d.status === 'active' 
            ? `<button class="btn-primary" style="padding: 6px 12px; font-size: 12px; width:auto;" onclick="openPaymentModal('${loanId}')">Collect Payment</button>`
            : `<span style="color:var(--success); font-size:12px; font-weight:600;">Cleared</span>`
          }
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/* ================= PAYMENT ACTIONS ================= */
window.openPaymentModal = function (loanId) {
  currentLoanId = loanId;
  const modal = document.getElementById("paymentModal");
  modal.style.display = "flex";
  modal.classList.add('fade-in');
};

window.closePaymentModal = function () {
  document.getElementById("paymentAmountInput").value = "";
  document.getElementById("paymentModal").style.display = "none";
};

window.submitPayment = async function () {
  const amount = parseFloat(document.getElementById("paymentAmountInput").value);

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid payment amount.");
    return;
  }

  try {
      const loanRef = doc(db, "loans", currentLoanId);
      const loanSnap = await getDoc(loanRef);
      const loanData = loanSnap.data();

      let remaining = loanData.remainingAmount - amount;

      await addDoc(collection(db, "ledger"), {
        loanId: currentLoanId,
        userId: loanData.userId,
        type: "credit",
        amount: amount,
        dateString: new Date().toLocaleString(),
        timestamp: serverTimestamp()
      });

      await updateDoc(loanRef, {
        remainingAmount: remaining <= 0 ? 0 : remaining,
        status: remaining <= 0 ? "closed" : "active"
      });

      closePaymentModal();
      
      // Refresh the table
      document.getElementById("historyUserSelect").dispatchEvent(new Event("change"));
      await loadDashboardSummary();
  } catch (e) {
      alert("Error processing payment");
  }
};

/* ================= LOGOUT ================= */
window.logout = async function () {
  if(confirm("Are you sure you want to logout?")) {
    await signOut(auth);
    window.location = "admin-login.html";
  }
};
