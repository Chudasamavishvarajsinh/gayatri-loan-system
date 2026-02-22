<!DOCTYPE html>
<html>
<head>
<title>Admin Dashboard - Gayatri Electronics</title>

<style>
body{
    font-family:Segoe UI,Arial,sans-serif;
    background:#f4f6fb;
    padding:30px;
    margin:0;
}

/* HEADER */

.header{
    background:#1e293b;
    color:white;
    padding:20px;
    border-radius:12px;
    margin-bottom:25px;
}

.header h1{margin:0;}
.header p{margin:5px 0;font-size:14px;opacity:0.9;}

.top-bar{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-bottom:20px;
}

.logout{
    background:#dc2626;
    color:white;
    border:none;
    padding:8px 14px;
    border-radius:6px;
    cursor:pointer;
}

/* CARD */

.card{
    background:white;
    padding:20px;
    border-radius:14px;
    box-shadow:0 8px 20px rgba(0,0,0,0.06);
    margin-bottom:25px;
}

input, select{
    padding:10px;
    margin:6px 0;
    width:100%;
    border-radius:6px;
    border:1px solid #ccc;
}

button{
    padding:8px 14px;
    border:none;
    border-radius:6px;
    font-weight:600;
    cursor:pointer;
}

.btn-primary{background:#2563eb;color:white;}
.btn-secondary{background:#475569;color:white;}
.btn-add{background:#2563eb;color:white;}
.btn-ledger{background:#475569;color:white;margin-left:5px;}

/* TABLE */

table{
    width:100%;
    border-collapse:collapse;
    margin-top:15px;
}

th{
    background:#e2e8f0;
    padding:12px;
    text-align:left;
}

td{
    padding:12px;
    border-bottom:1px solid #e5e7eb;
}

.loan-closed{background:#ecfdf5;}
.loan-active{background:#ffffff;}

.status{
    padding:4px 10px;
    border-radius:20px;
    font-size:12px;
    font-weight:600;
}

.active{background:#fef3c7;color:#92400e;}
.closed{background:#bbf7d0;color:#065f46;}

/* LEDGER */

.ledger-row{display:none;}

.ledger-card{
    background:#f8fafc;
    border-radius:10px;
    padding:15px;
}

.ledger-header{
    font-weight:600;
    margin-bottom:10px;
}

.ledger-body{
    max-height:220px;
    overflow-y:auto;
}

.ledger-item{
    display:flex;
    justify-content:space-between;
    padding:8px 0;
    border-bottom:1px solid #e5e7eb;
}

/* MODAL */

.modal-overlay{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.5);
    display:none;
    justify-content:center;
    align-items:center;
}

.modal{
    background:white;
    padding:25px;
    width:360px;
    border-radius:12px;
}

.modal-buttons{
    margin-top:15px;
    display:flex;
    justify-content:flex-end;
    gap:10px;
}
</style>
</head>

<body>

<div class="header">
    <h1>Gayatri Electronics</h1>
    <p>Owner: Chudasama Baldevsinh Mansang</p>
    <p>Phone: 9924232759</p>
    <p>
        Beside Chamunda Games Store,<br>
        Opp. Pir Ni Dargah,<br>
        Street Number 5,<br>
        Khodiyar Colony,<br>
        Jamnagar, Gujarat – 361006
    </p>
</div>

<div class="top-bar">
    <h2>Admin Dashboard</h2>
    <button class="logout" onclick="logout()">Logout</button>
</div>

<!-- DASHBOARD SUMMARY -->

<div class="card">
<p>Total Users: <strong id="totalUsers">0</strong></p>
<p>Active Loans: <strong id="totalActiveLoans">0</strong></p>
<p>Closed Loans: <strong id="totalClosedLoans">0</strong></p>
<p>Total Outstanding: <strong id="totalOutstanding">₹ 0</strong></p>
</div>

<!-- CREATE LOAN SECTION (RESTORED) -->

<div class="card">
<h3>Create Loan</h3>

<select id="userId">
<option value="">Select User</option>
</select>

<input type="number" id="principal" placeholder="Loan Amount">
<input type="number" id="interest" placeholder="Interest %">
<input type="number" id="months" placeholder="Months">

<button class="btn-primary" onclick="createLoan()">Create Loan</button>
</div>

<!-- USER HISTORY -->

<div class="card">
<h3>User Loan History</h3>

<select id="historyUserSelect">
<option value="">Select User</option>
</select>

<table id="loanHistoryTable">
<thead>
<tr>
<th>Loan ID</th>
<th>Principal</th>
<th>Total</th>
<th>Remaining</th>
<th>Status</th>
<th>Action</th>
</tr>
</thead>
<tbody>
<tr><td colspan="6">Select user</td></tr>
</tbody>
</table>
</div>

<!-- PAYMENT MODAL -->

<div class="modal-overlay" id="paymentModal">
<div class="modal">
<h3>Add Payment</h3>
<input type="number" id="paymentAmountInput" placeholder="Enter amount">
<div class="modal-buttons">
<button onclick="closePaymentModal()">Cancel</button>
<button class="btn-add" onclick="submitPayment()">Save Payment</button>
</div>
</div>
</div>

<script type="module" src="js/admin.js"></script>
</body>
</html>
