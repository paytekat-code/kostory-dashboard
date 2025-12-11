import { firebaseConfig } from './firebase-config.js';
import { formatDate, hitungLamaTinggal, closeModal } from './utils.js';

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#userName").forEach(el => el.textContent = localStorage.getItem("kostoryUser").toUpperCase());
  loadCheckoutList();
});

function loadCheckoutList() {
  // kode load daftar check-out
}

window.prosesCheckout = function() {
  // kode proses checkout
};
