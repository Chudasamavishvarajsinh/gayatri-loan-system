function calculate() {
const P = parseFloat(document.getElementById("amount").value);
const R = parseFloat(document.getElementById("rate").value) / 12 / 100;
const N = parseFloat(document.getElementById("months").value);

const emi = P * R * Math.pow(1+R,N) / (Math.pow(1+R,N)-1);

document.getElementById("emiResult").innerText =
"Monthly EMI: ₹" + emi.toFixed(2);
}
