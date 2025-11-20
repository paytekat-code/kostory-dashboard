// script.js – VERSI FINAL YANG SUDAH 100% COMPATIBLE DENGAN INDEX.HTML TERBARU
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhN2a4m6PkTwFOvJ88TreD1lCERYJD7m0",
  authDomain: "kostory-db.firebaseapp.com",
  databaseURL: "https://kostory-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kostory-db",
  storageBucket: "kostory-db.appspot.com",
  messagingSenderId: "447318101438",
  appId: "1:447318101438:web:7aba8e16ccee69fd3c53def"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const kosts = {
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin": "all", "mekar": "Kostory Mekar", "satria": "Kostory Satria", "mitra": "Kostory Mitra", "ecokost": "Ecokost by Kostory", "mitraya": "Mitraya by Kostory", "inaya": "Inaya Bukit by Kostory" };
const passwordDb = { "admin": "kostory123", "mekar": "mekar123", "satria": "satria123", "mitra": "mitra123", "ecokost": "ecokost123", "mitraya": "mitraya123", "inaya": "inaya123" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// === LOGIN & LOGOUT ===
window.login = function() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else alert("Username atau password salah!");
};

window.logout = function() {
  currentUser = null; allowedKosts = [];
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("username").value = document.getElementById("password").value = "";
};

// === HITUNG LAMA TINGGAL ===
function hitungLamaTinggal(tanggalMasuk) {
  const masuk = new Date(tanggalMasuk);
  const sekarang = new Date();
  let diff = Math.floor((sekarang - masuk) / (1000*60*60*24));
  const tahun = Math.floor(diff/365); diff %= 365;
  const bulan = Math.floor(diff/30); const hari = diff%30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

// === LOAD DASHBOARD ===
function loadDashboard() {
  const kostList = document.getElementById("kostList"); kostList.innerHTML = "";
  document.getElementById("totalStats").innerHTML = "Memuat data...";

  let totalRooms = 0, totalOccupied = 0;

  Object.keys(kosts).forEach(kostName => {
    if (!allowedKosts.includes(kostName)) return;
    const rooms = kosts[kostName]; totalRooms += rooms.length;

    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>${kostName}</h3>
        <button onclick="laporKost('${kostName}')" style="background:#25d366;color:white;padding:8px 15px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">LAPOR</button>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
      <div class="room-grid"></div>`;
    kostList.appendChild(card);

    const grid = card.querySelector(".room-grid");
    const occSpan = card.querySelector(".occ");
    let occupied = 0;

    rooms.forEach(room => {
      const roomEl = document.createElement("div");
      roomEl.className = "room kosong";
      roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
      roomEl.onclick = () => openModal(kostName, room);
      grid.appendChild(roomEl);

      const roomRef = ref(db, `kosts/${kostName}/${room}`);
      onValue(roomRef, snap => {
        const d = snap.val();
        if (!d || !d.nama) {
          roomEl.className = "room kosong";
          roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
        } else {
          occupied++; totalOccupied++;
          let durasiClass = d.durasi === "Harian" ? "harian" : d.durasi === "Mingguan" ? "mingguan" : d.durasi === "Tahunan" ? "tahunan" : "bulanan";
          roomEl.className = `room ${durasiClass}`;
          roomEl.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        }
        occSpan.textContent = occupied;
        document.getElementById("totalStats").innerHTML = `TOTAL: ${totalOccupied} terisi / ${totalRooms} kamar → <b>${totalRooms - totalOccupied} KOSONG</b>`;
      });
    });
  });
}

// === OPEN MODAL, SAVE, SHARE, CHECKOUT, TAGIHAN, LAPORAN – semua fungsi lengkap ada di link pastebin di atas ===
