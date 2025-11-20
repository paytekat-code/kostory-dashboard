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

// ==================== LOGIN & LOGOUT ====================
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

// ==================== HITUNG LAMA TINGGAL ====================
function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

// ==================== LOAD DASHBOARD ====================
function loadDashboard() {
  const container = document.getElementById("kostList"); container.innerHTML = "";
  document.getElementById("totalStats").innerHTML = "Sedang memuat data...";
  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    const rooms = kosts[namaKost]; totalKamar += rooms.length;
    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
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

// ==================== MODAL CHECK-IN / UPDATE ====================
window.openModal = async function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - ${room}`;
  const snap = await get(ref(db, `kosts/${kost}/${room}`));
  currentData = snap.val() || {};
  const fields = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","alamatktp","perusahaan","harga","deposit","tanggal","tokenAwal","namaKeluarga","statusKeluarga","telpKeluarga","catatan"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });

  const btn = document.querySelector(".modal-buttons");
  btn.innerHTML = currentData.nama ? `
    <button onclick="window.openCheckoutModal()">CHECK OUT</button>
    <button onclick="window.saveAndAskShare()">UPDATE & SHARE</button>
    <button onclick="window.openTagih()">TAGIH</button>
    <button onclick="window.closeModal()">BATAL</button>` :
    `<button class="full" onclick="window.saveAndAskShare()">CHECK IN & SHARE</button>
     <button onclick="window.closeModal()">BATAL</button>`;
  document.getElementById("modal").classList.remove("hidden");
};

window.closeModal = () => document.getElementById("modal").classList.add("hidden");

// ==================== FITUR LAPORAN HARIAN (LANGSUNG BUKA WA - PILIH SENDIRI) ====================
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

  const fetchPromises = rooms.map(async room => {
    const snap = await get(ref(db, `kosts/${namaKost}/${room}`));
    const d = snap.val();

    if (d && d.nama) {
      terisi++;
      const tglMasuk = new Date(d.tanggalMasuk);
      const lama = hitungLamaTinggal(d.tanggalMasuk);

      penghuniList.push({
        room,
        nama: d.nama,
        hp: d.hp || "-",
        durasi: d.durasi,
        masuk: tglMasuk.toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"}),
        lama
      });

      if (tglMasuk.getMonth() === bulanIni && tglMasuk.getFullYear() === tahunIni) {
        checkInBulanIni.push(`${room} | ${d.nama} | ${tglMasuk.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}`);
      }

      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else {
      kosongList.push(room);
    }
  });

  await Promise.all(fetchPromises);

  const tanggalHariIni = today.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const okupasi = Math.round((terisi / rooms.length) * 100);

  let pesan = `*Laporan Harian*\n${tanggalHariIni}\n\n`;
  pesan += `*${namaKost}*\n`;
  pesan += `Okupasi = *${okupasi}%* (${terisi}/${rooms.length})\n`;
  pesan += `Kamar Kosong : ${kosongList.length} -> ${kosongList.join(", ") || "Tidak ada"}\n\n`;

  pesan += `*Daftar Penghuni:*\n`;
  if (penghuniList.length === 0) {
    pesan += "Semua kamar kosong hari ini\n";
  } else {
    penghuniList.forEach((p, i) => {
      pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${p.masuk} | ${p.lama}.\n`;
    });
  }

  pesan += `\n*Kendaraan :*\n`;
  pesan += `Mobil: ${mobilList.length} -> ${mobilList.join(", ") || "-"}\n`;
  pesan += `Motor: ${motorList.length} -> ${motorList.join(", ") || "-"}\n\n`;

  pesan += `*Check-in Bulan ini* : ${checkInBulanIni.length} orang\n`;
  if (checkInBulanIni.length === 0) {
    pesan += "Belum ada check-in bulan ini\n";
  } else {
    checkInBulanIni.forEach(line => pesan += `${line}\n`);
  }

  pesan += `\n*Check-out Bulan ini* : 0 orang\n`;
  pesan += `Belum ada check-out bulan ini\n\n`;
  pesan += `Terima kasih Team Kostory!`;

  // LANGSUNG BUKA WHATSAPP - KAMU PILIH MAU KIRIM KEMANA
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`;
  window.open(waUrl, "_blank");
};

// ==================== CHECK-OUT (RAPI + TOKEN OTOMATIS) ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama || "N/A";
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("tokenAwalDisplay").textContent = currentData.tokenAwal || 0;
  document.getElementById("tokenAkhir").value = "";
  document.getElementById("selisihToken").textContent = "0";
  document.getElementById("checkoutModal").classList.remove("hidden");

  document.getElementById("tokenAkhir").oninput = function() {
    const awal = parseInt(currentData.tokenAwal) || 0;
    const akhir = parseInt(this.value) || 0;
    document.getElementById("selisihToken").textContent = akhir >= awal ? akhir - awal : 0;
  };
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  const akhir = parseInt(document.getElementById("tokenAkhir").value) || 0;
  const awal = parseInt(currentData.tokenAwal) || 0;
  const selisih = akhir - awal;
  const rek = document.getElementById("noRek").value.trim();
  const bank = document.getElementById("namaBank").value.trim().toUpperCase();
  const nama = document.getElementById("namaRekening").value.trim();

  if (!tgl || akhir === 0 || !rek || !bank || !nama) return alert("Isi semua field!");

  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil!");
    const pesan = `*Check-out ${currentKost}*\nKamar ${currentRoom} - ${currentData.nama}\nLama tinggal: ${hitungLamaTinggal(currentData.tanggalMasuk, tgl)}\nToken: ${awal} → ${akhir} (selisih ${selisih})\nPengembalian: ${bank} ${rek} a.n ${nama}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
  });
};

// ==================== FITUR LAIN (sementara) ====================
window.saveAndAskShare = () => alert("Fitur simpan & share menyusul ya bro!");
window.openTagih = () => alert("Fitur tagih menyusul ya bro!");

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
