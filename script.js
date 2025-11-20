// script.js - Kostory Dashboard v2.5 FINAL (November 20, 2025)
// Fitur: Tanggal Lahir + Laporan Harian Super Lengkap + Share WA Full Data
// Kompatibel 100% dengan index.html terbaru (type="module")

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

const hakAkses = { 
  "admin": "all", 
  "mekar": "Kostory Mekar", 
  "satria": "Kostory Satria", 
  "mitra": "Kostory Mitra", 
  "ecokost": "Ecokost by Kostory", 
  "mitraya": "Mitraya by Kostory", 
  "inaya": "Inaya Bukit by Kostory" 
};
const passwordDb = { 
  "admin": "kostory123", 
  "mekar": "mekar123", 
  "satria": "satria123", 
  "mitra": "mitra123", 
  "ecokost": "ecokost123", 
  "mitraya": "mitraya123", 
  "inaya": "inaya123" 
};

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// Login & Logout
window.login = function() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else {
    alert("Username atau password salah!");
  }
};

window.logout = function() {
  currentUser = null; allowedKosts = []; currentKost = null; currentRoom = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
};

// Hitung Lama Tinggal
function hitungLamaTinggal(tanggalMasuk) {
  const masuk = new Date(tanggalMasuk);
  const sekarang = new Date();
  let diff = Math.floor((sekarang - masuk) / (1000 * 60 * 60 * 24));
  const tahun = Math.floor(diff / 365);
  diff %= 365;
  const bulan = Math.floor(diff / 30);
  const hari = diff % 30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

// Load Dashboard
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
      onValue(roomRef, (snap) => {
        const d = snap.val();
        if (!d || !d.nama) {
          roomEl.className = "room kosong";
          roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
        } else {
          occupied++; totalOccupied++;
          let durasiClass = "bulanan";
          if (d.durasi === "Harian") durasiClass = "harian";
          else if (d.durasi === "Mingguan") durasiClass = "mingguan";
          else if (d.durasi === "Tahunan") durasiClass = "tahunan";
          roomEl.className = `room ${durasiClass}`;
          roomEl.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        }
        occSpan.textContent = occupied;
        document.getElementById("totalStats").innerHTML = `TOTAL: ${totalOccupied} terisi / ${totalRooms} kamar → <b>${totalRooms - totalOccupied} KOSONG</b>`;
      });
    });
  });
}

// Open Modal
window.openModal = function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `Check-in / Update - ${kost} - Kamar ${room}`;

  const roomRef = ref(db, `kosts/${kost}/${room}`);
  get(roomRef).then((snap) => {
    currentData = snap.val() || {};
    
    document.getElementById("nama").value = currentData.nama || "";
    document.getElementById("hp").value = currentData.hp || "";
    document.getElementById("tanggalLahir").value = currentData.tanggalLahir || "";
    document.getElementById("jenis").value = currentData.jenis || "Pria";
    document.getElementById("durasi").value = currentData.durasi || "Bulanan";
    document.getElementById("kendaraan").value = currentData.kendaraan || "Umum";
    document.getElementById("alamatktp").value = currentData.alamatktp || "";
    document.getElementById("perusahaan").value = currentData.perusahaan || "";
    document.getElementById("harga").value = currentData.harga || "";
    document.getElementById("deposit").value = currentData.deposit || "";
    document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
    document.getElementById("tokenAwal").value = currentData.tokenAwal || "";
    document.getElementById("namaKeluarga").value = currentData.namaKeluarga || "";
    document.getElementById("statusKeluarga").value = currentData.statusKeluarga || "Orangtua";
    document.getElementById("telpKeluarga").value = currentData.telpKeluarga || "";
    document.getElementById("catatan").value = currentData.catatan || "";

    const btn = document.querySelector(".modal-buttons");
    if (currentData.nama) {
      btn.innerHTML = `
        <button onclick="openCheckoutModal()">CHECK OUT</button>
        <button onclick="saveAndAskShare()">UPDATE & SHARE</button>
        <button onclick="openTagih()">TAGIH</button>
        <button onclick="closeModal()">BATAL</button>`;
    } else {
      btn.innerHTML = `
        <button class="full" onclick="saveAndAskShare()">CHECK IN & SHARE</button>
        <button onclick="closeModal()">BATAL</button>`;
    }

    document.getElementById("modal").classList.remove("hidden");
  });
};

window.closeModal = function() { 
  document.getElementById("modal").classList.add("hidden"); 
};

// Save Data (dengan Tanggal Lahir)
window.saveAndAskShare = function() {
  const required = ["nama","hp","tanggalLahir","harga","tokenAwal","namaKeluarga","telpKeluarga"];
  for (let id of required) {
    if (!document.getElementById(id).value.trim()) {
      alert(`Kolom "${id}" wajib diisi!`);
      return;
    }
  }

  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    alamatktp: document.getElementById("alamatktp").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
    harga: parseInt(document.getElementById("harga").value),
    deposit: document.getElementById("deposit").value ? parseInt(document.getElementById("deposit").value) : 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: parseInt(document.getElementById("tokenAwal").value),
    namaKeluarga: document.getElementById("namaKeluarga").value.trim(),
    statusKeluarga: document.getElementById("statusKeluarga").value,
    telpKeluarga: document.getElementById("telpKeluarga").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  set(ref(db, `kosts/${currentKost}/${currentRoom}`), data).then(() => {
    closeModal();
    if (confirm("Data berhasil disimpan!\n\nIngin share ke WhatsApp sekarang?")) sharePenghuni(data);
    else alert("Tersimpan!");
  }).catch(err => alert("Error: " + err.message));
};

// Share Penghuni ke WA (Full Data)
window.sharePenghuni = function(d) {
  const tglLahir = d.tanggalLahir ? new Date(d.tanggalLahir).toLocaleDateString("id-ID", {day: "numeric", month: "long", year: "numeric"}) : "-";
  const pesan = `*DATA PENGHUNI ${d.nama ? "UPDATE" : "BARU"}*\n\n` +
    `Cabang: *${currentKost}*\n` +
    `Kamar: *${currentRoom}*\n\n` +
    `Nama: *${d.nama}*\n` +
    `No. HP/WA: ${d.hp}\n` +
    `Tanggal Lahir: ${tglLahir}\n` +
    `Jenis: ${d.jenis}\n` +
    `Durasi Kost: ${d.durasi}\n` +
    `Kendaraan: ${d.kendaraan}\n\n` +
    `Alamat KTP: ${d.alamatktp || "-"}\n` +
    `Perusahaan/Kampus: ${d.perusahaan || "-"}\n` +
    `Harga per Periode: *Rp ${Number(d.harga).toLocaleString()}*\n` +
    `Deposit: Rp ${Number(d.deposit || 0).toLocaleString()}\n` +
    `Tanggal Check-in: ${d.tanggalMasuk}\n` +
    `Token PLN Awal: ${d.tokenAwal}\n\n` +
    `Keluarga Darurat:\n` +
    `${d.namaKeluarga} (${d.statusKeluarga}) - ${d.telpKeluarga}\n\n` +
    `Catatan: ${d.catatan || "Tidak ada"}\n\n` +
    `Salam hangat dari Kostory!`;

  window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Checkout
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function(share = false) {
  const tglOut = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = document.getElementById("tokenAkhir").value;
  const noRek = document.getElementById("noRek").value.trim();
  const namaBank = document.getElementById("namaBank").value.trim();
  const namaRek = document.getElementById("namaRekening").value.trim();

  if (!tglOut || !tokenAkhir || !noRek || !namaBank || !namaRek) {
    alert("Semua kolom check-out wajib diisi!");
    return;
  }

  const selisihToken = tokenAkhir - currentData.tokenAwal;
  const lamaTinggal = hitungLamaTinggal(currentData.tanggalMasuk);

  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil!");

    if (share) {
      const pesan = `*INFORMASI CHECK-OUT*\n\n` +
        `Kost: *${currentKost}* | Kamar: *${currentRoom}*\n` +
        `Nama: *${currentData.nama}*\n` +
        `Deposit: *Rp ${Number(currentData.deposit || 0).toLocaleString()}*\n\n` +
        `Check-in: *${currentData.tanggalMasuk}*\n` +
        `Check-out: *${tglOut}*\n` +
        `Lama Tinggal: *${lamaTinggal}*\n\n` +
        `Token Awal: *${currentData.tokenAwal}* | Token Akhir: *${tokenAkhir}* | Selisih: *${selisihToken}*\n\n` +
        `Pengembalian ke:\n${noRek} - ${namaBank} a.n ${namaRek}\n\n` +
        `Terima kasih telah tinggal di Kostory!`;

      window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, "_blank");
    }
  }).catch(err => alert("Error: " + err.message));
};

// Tagihan
window.openTagih = function() {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const nama = currentData.nama;
  const hp = currentData.hp.replace(/^0/, "62");
  const tanggal = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tanggal || !jumlah) return alert("Isi tanggal dan jumlah!");

  const pesan = `Halo kak ${nama}!\n\nKost akan berakhir tanggal *${new Date(tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}*. Mohon lunasi Rp ${Number(jumlah).toLocaleString()} maksimal H-1. Abaikan jika sudah bayar.\n\nSalam Kostorian!`;
  window.open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`, "_blank");
  document.getElementById("tagihModal").classList.add("hidden");
};

// Laporan Kost Harian Super Lengkap
window.laporKost = async function(kostName) {
  const snapshot = await get(ref(db, `kosts/${kostName}`));
  const data = snapshot.val() || {};
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const penghuni = [];
  const kosong = [];
  const mobil = [], motor = [];
  const checkinBulanIni = [];

  kosts[kostName].forEach(room => {
    const d = data[room];
    if (!d || !d.nama) {
      kosong.push(room);
    } else {
      const masuk = new Date(d.tanggalMasuk);
      penghuni.push({ room, ...d, lama: hitungLamaTinggal(d.tanggalMasuk) });
      if (d.kendaraan === "Mobil") mobil.push(d.nama);
      if (d.kendaraan === "Motor") motor.push(d.nama);
      if (masuk.getMonth() === thisMonth && masuk.getFullYear() === thisYear) {
        checkinBulanIni.push({ room, nama: d.nama, tanggal: d.tanggalMasuk });
      }
    }
  });

  // Urutkan penghuni dari check-in terlama
  penghuni.sort((a, b) => new Date(a.tanggalMasuk) - new Date(b.tanggalMasuk));

  const terisi = penghuni.length;
  const totalKamar = kosts[kostName].length;
  const okupasi = Math.round((terisi / totalKamar) * 100);

  let pesan = `*Laporan Kost perhari ini*\n${today}\n\n`;
  pesan += `*${kostName}*\n`;
  pesan += `Okupasi = ${okupasi}% (${terisi}/${totalKamar})\n`;
  pesan += `Kamar Kosong: ${kosong.length} → ${kosong.join(", ") || "Tidak ada"}\n\n`;
  pesan += `*Daftar Penghuni:* (urut check-in terlama)\n`;
  penghuni.forEach((p, i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${new Date(p.tanggalMasuk).toLocaleDateString("id-ID", {day:"numeric",month:"short",year:"numeric"})} | ${p.lama}\n`;
  });
  pesan += `\n*Kendaraan:*\n`;
  pesan += `Mobil: ${mobil.length} → ${mobil.join(", ") || "Tidak ada"}\n`;
  pesan += `Motor: ${motor.length} → ${motor.join(", ") || "Tidak ada"}\n\n`;
  pesan += `*Check in Bulan ini:* ${checkinBulanIni.length} orang\n`;
  checkinBulanIni.forEach((c, i) => {
    pesan += `${i+1}. ${c.room} | ${c.nama} | ${new Date(c.tanggal).toLocaleDateString("id-ID", {day:"numeric",month:"long",year:"numeric"})}\n`;
  });
  pesan += `\n*Check-out Bulan ini:* 0 orang (fitur history menyusul)\n`;
  pesan += `Terima kasih Kostorian!`;

  window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Tutup modal tagih & checkout
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#tagihModal .cancel')?.addEventListener('click', () => document.getElementById('tagihModal').classList.add('hidden'));
  document.querySelector('#checkoutModal button:last-child')?.addEventListener('click', () => document.getElementById('checkoutModal').classList.add('hidden'));
});
