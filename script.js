import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getDatabase, ref, onValue, set, remove, get } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js';

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

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"kostory123","mekar":"mekar123","satria":"satria123","mitra":"mitra123","ecokost":"ecokost123","mitraya":"mitraya123","inaya":"inaya123" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// LOGIN & LOGOUT
window.login = function() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else alert("Username/password salah!");
};

window.logout = function() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

// ==================== FITUR LAPORAN HARIAN SESUAI FORMAT KAMU ====================
window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  const bulanIni = today.getMonth();
  const tahunIni = today.getFullYear();

  let terisi = 0;
  let kosongList = [];
  let penghuniList = [];
  let mobilList = [], motorList = [];
  let checkInBulanIni = [];
  let checkOutBulanIni = []; // kalau ada riwayat checkout nanti bisa ditambah

  const fetchPromises = rooms.map(async room => {
    const snap = await get(ref(db, `kosts/${namaKost}/${room}`));
    const d = snap.val();

    if (d && d.nama) {
      terisi++;
      const tglMasuk = new Date(d.tanggalMasuk);
      const lama = hitungLamaTinggal(d.tanggalMasuk);

      penghuniList.push({
        room, nama: d.nama, hp: d.hp, durasi: d.durasi,
        masuk: tglMasuk.toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"}),
        lama
      });

      // Hitung check-in bulan ini
      if (tglMasuk.getMonth() === bulanIni && tglMasuk.getFullYear() === tahunIni) {
        checkInBulanIni.push(`${room} | ${d.nama} | ${tglMasuk.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}`);
      }

      // Kendaraan
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else {
      kosongList.push(room);
    }
  });

  Promise.all(fetchPromises).then(() => {
    const tanggalHariIni = today.toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    });

    const okupasiPersen = Math.round((terisi / rooms.length) * 100);

    let text = `*Laporan Harian*\n${tanggalHariIni}\n\n`;
    text += `*${namaKost}*\n`;
    text += `Okupasi = *${okupasiPersen}%* (${terisi}/${rooms.length})\n`;
    text += `Kamar Kosong : ${kosongList.length} -> ${kosongList.join(", ") || "Tidak ada"}\n\n`;

    text += `*Daftar Penghuni:*\n`;
    penghuniList.forEach((p, i) => {
      text += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${p.masuk} | ${p.lama}.\n`;
    });
    if (penghuniList.length === 0) text += "Semua kamar kosong\n";

    text += `\n*Kendaraan :*\n`;
    text += `Mobil: ${mobilList.length} -> ${mobilList.join(", ") || "-"}\n`;
    text += `Motor: ${motorList.length} -> ${motorList.join(", ") || "-"}\n\n`;

    text += `*Check-in Bulan ini* : ${checkInBulanIni.length} orang\n`;
    checkInBulanIni.forEach(line => text += `${line}\n`);

    text += `\n*Check-out Bulan ini* : ${checkOutBulanIni.length} orang\n`;
    if (checkOutBulanIni.length === 0) text += "Belum ada check-out bulan ini\n";

    text += `\nTerima kasih Team Kostory!`;

    // GANTI NOMOR INI JADI NOMOR GRUP WA KAMU
    const nomorGrupWA = "6281234567890"; // UBAH INI BRO!

    const url = `https://wa.me/${nomorGrupWA}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  });
};

// Load Dashboard (tetap sama)
function loadDashboard() {
  const container = document.getElementById("kostList"); container.innerHTML = "";
  document.getElementById("totalStats").innerHTML = "Sedang memuat...";
  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    const rooms = kosts[namaKost]; totalKamar += rooms.length;
    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
      <h3>${namaKost}</h3>
      <button onclick="window.laporKost('${namaKost}')" style="background:#25d366;color:white;padding:10px 20px;border:none;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer">LAPOR</button>
    </div>
    <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
    <div class="room-grid"></div>`;
    container.appendChild(card);
    const grid = card.querySelector(".room-grid");
    const occ = card.querySelector(".occ");
    let terisi = 0;

    rooms.forEach(room => {
      const box = document.createElement("div"); box.className = "room kosong";
      box.innerHTML = `${room}<br><small>KOSONG</small>`;
      box.onclick = () => window.openModal(namaKost, room);
      grid.appendChild(box);

      onValue(ref(db, `kosts/${namaKost}/${room}`), snap => {
        const d = snap.val();
        if (d && d.nama) {
          terisi++; totalTerisi++;
          const cls = d.durasi==="Harian"?"harian":d.durasi==="Mingguan"?"mingguan":d.durasi==="Tahunan"?"tahunan":"bulanan";
          box.className = `room ${cls}`;
          box.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        } else {
          box.className = "room kosong";
          box.innerHTML = `${room}<br><small>KOSONG</small>`;
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `<strong>TOTAL: ${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG</strong>`;
      });
    });
  });
}

// Fungsi modal, checkout, dll tetap pakai yang sebelumnya sudah jalan
window.openModal = async function(kost, room) { /* pakai versi lengkap sebelumnya */ };
window.openCheckoutModal = function() { /* pakai yang sudah jalan */ };
window.prosesCheckout = function() { /* pakai yang sudah jalan */ };

document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
