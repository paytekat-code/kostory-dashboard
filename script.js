// script.js – VERSI FINAL 100% JALAN (Tagih + Checkout + Semua Fitur)
// Tanggal: 20 November 2025

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

const kosts = { /* sama seperti sebelumnya */ 
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"kostory123","mekar":"mekar123","satria":"satria123","mitra":"mitra123","ecokost":"ecokost123","mitraya":"mitraya123","inaya":"inaya123" };

let currentUser=null, allowedKosts=[], currentKost=null, currentRoom=null, currentData=null;

// ==================== SEMUA FUNGSI HARUS KE WINDOW ====================
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
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
};

function hitungLamaTinggal(checkin, checkout = new Date()) {
  const masuk = new Date(checkin);
  const keluar = new Date(checkout);
  let diff = Math.floor((keluar - masuk) / (1000*60*60*24));
  const tahun = Math.floor(diff/365); diff %= 365;
  const bulan = Math.floor(diff/30); const hari = diff%30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

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
        <button onclick="laporKost('${kostName}')" style="background:#25d366;color:white;padding:8px 15px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">LAPOR</button>
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
      roomEl.onclick = () => window.openModal(kostName, room);
      grid.appendChild(roomEl);

      onValue(ref(db, `kosts/${kostName}/${room}`), snap => {
        const d = snap.val();
        if (!d || !d.nama) {
          roomEl.className = "room kosong";
          roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
        } else {
          occupied++; totalOccupied++;
          const cls = d.durasi==="Harian"?"harian":d.durasi==="Mingguan"?"mingguan":d.durasi==="Tahunan"?"tahunan":"bulanan";
          roomEl.className = `room ${cls}`;
          roomEl.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        }
        occSpan.textContent = occupied;
        document.getElementById("totalStats").innerHTML = `TOTAL: ${totalOccupied} terisi / ${totalRooms} kamar → <b>${totalRooms-totalOccupied} KOSONG</b>`;
      });
    });
  });
}

// ==================== MODAL CHECK-IN / UPDATE ====================
window.openModal = async function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - Kamar ${room}`;

  const snap = await get(ref(db, `kosts/${kost}/${room}`));
  currentData = snap.val() || {};

  // isi form
  ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","alamatktp","perusahaan","harga","deposit","tanggal","tokenAwal","namaKeluarga","statusKeluarga","telpKeluarga","catatan"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });

  const btn = document.querySelector(".modal-buttons");
  if (currentData.nama) {
    btn.innerHTML = `
      <button onclick="window.openCheckoutModal()">CHECK OUT</button>
      <button onclick="window.saveAndAskShare()">UPDATE & SHARE</button>
      <button onclick="window.openTagih()">TAGIH</button>
      <button onclick="window.closeModal()">BATAL</button>`;
  } else {
    btn.innerHTML = `
      <button class="full" onclick="window.saveAndAskShare()">CHECK IN & SHARE</button>
      <button onclick="window.closeModal()">BATAL</button>`;
  }
  document.getElementById("modal").classList.remove("hidden");
};

window.closeModal = () => document.getElementById("modal").classList.add("hidden");

window.saveAndAskShare = function() {
  const wajib = ["nama","hp","tanggalLahir","harga","tokenAwal","namaKeluarga","telpKeluarga"];
  for (let id of wajib) if (!document.getElementById(id).value.trim()) { alert(`Kolom ${id} wajib diisi!`); return; }

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
    deposit: parseInt(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: parseInt(document.getElementById("tokenAwal").value),
    namaKeluarga: document.getElementById("namaKeluarga").value.trim(),
    statusKeluarga: document.getElementById("statusKeluarga").value,
    telpKeluarga: document.getElementById("telpKeluarga").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  set(ref(db, `kosts/${currentKost}/${currentRoom}`), data).then(() => {
    closeModal();
    if (confirm("Data tersimpan! Share ke WA sekarang?")) window.sharePenghuni(data);
  });
};

window.sharePenghuni = function(d) {
  const lahir = d.tanggalLahir ? new Date(d.tanggalLahir).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-";
  const pesan = `*DATA PENGHUNI ${d.nama?"UPDATE":"BARU"}*\n\nCabang: *${currentKost}*\nKamar: *${currentRoom}*\n\nNama: *${d.nama}*\nHP: ${d.hp}\nTgl Lahir: ${lahir}\nJenis: ${d.jenis}\nDurasi: ${d.durasi}\nKendaraan: ${d.kendaraan}\n\nAlamat KTP: ${d.alamatktp||"-"}\nPerusahaan: ${d.perusahaan||"-"}\nHarga: Rp ${Number(d.harga).toLocaleString()}\nDeposit: Rp ${Number(d.deposit).toLocaleString()}\nCheck-in: ${d.tanggalMasuk}\nToken Awal: ${d.tokenAwal}\n\nKeluarga: ${d.namaKeluarga} (${d.statusKeluarga}) - ${d.telpKeluarga}\nCatatan: ${d.catatan||"Tidak ada"}\n\nSalam Kostory!`;
  window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`,"_blank");
};

// ==================== TOMBOL TAGIH – SEKARANG JALAN! ====================
window.openTagih = function() {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date();
  next.setMonth(next.getMonth() + 1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const nama = currentData.nama;
  const tglAkhir = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tglAkhir || !jumlah) return alert("Tanggal & jumlah wajib diisi!");

  const tgl = new Date(tglAkhir);
  const hariLagi = Math.ceil((tgl - new Date()) / (1000*60*60*24));

  const pesan = `Halo kak ${nama}!\n\nKost kakak akan berakhir tanggal *${tgl.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}* (${hariLagi} hari lagi), mohon melunasi sebesar *Rp ${Number(jumlah).toLocaleString()}* maksimal 1 hari sebelum masa kontrak berakhir.\n\nAbaikan jika sudah membayar, segera informasikan jika tidak memperpanjang.\n\nTerimakasih\nSalam Kostorian`;

  const hp = currentData.hp.startsWith("0") ? "62" + currentData.hp.slice(1) : currentData.hp;
  window.open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`, "_blank");
  document.getElementById("tagihModal").classList.add("hidden");
};

// ==================== TOMBOL CHECK-OUT – SEKARANG JALAN 100%! ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tglOut = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = document.getElementById("tokenAkhir").value;
  const noRek = document.getElementById("noRek").value.trim();
  const namaBank = document.getElementById("namaBank").value.trim();
  const namaRekening = document.getElementById("namaRekening").value.trim();

  if (!tglOut || !tokenAkhir || !noRek || !namaBank || !namaRekening) {
    alert("Semua kolom check-out wajib diisi!");
    return;
  }

  const selisihToken = tokenAkhir - currentData.tokenAwal;
  const lama = hitungLamaTinggal(currentData.tanggalMasuk, tglOut);

  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil! Kamar sudah dikosongkan.");

    const pesan = `*Informasi Check-out*\n\n` +
      `${currentKost}\n` +
      `Kamar ${currentRoom} | ${currentData.nama} | ${currentData.durasi}\n` +
      `Deposit : *Rp ${Number(currentData.deposit || 0).toLocaleString()}*\n\n` +
      `*Lama Tinggal :*\n` +
      `Check-in : ${new Date(currentData.tanggalMasuk).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\n` +
      `Check-out : ${new Date(tglOut).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\n` +
      `${lama}\n\n` +
      `*Token PLN :*\n` +
      `Awal : ${currentData.tokenAwal} | Akhir : ${tokenAkhir} | Selisih : ${selisihToken}\n\n` +
      `*Pengembalian Deposit ke :*\n` +
      `${namaBank} | ${noRek} | ${namaRekening}\n\n` +
      `Terima kasih telah tinggal di Kostory!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`, "_blank");
  });
};

// ==================== LAPOR KOST HARIAN (sudah lengkap seperti request sebelumnya) ====================
window.laporKost = async function(kostName) {
  const snapshot = await get(ref(db, `kosts/${kostName}`));
  const data = snapshot.val() || {};
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const penghuni = [], kosong = [], mobil = [], motor = [], checkinBulanIni = [];

  kosts[kostName].forEach(room => {
    const d = data[room];
    if (!d || !d.nama) kosong.push(room);
    else {
      const masuk = new Date(d.tanggalMasuk);
      penghuni.push({room, ...d, lama: hitungLamaTinggal(d.tanggalMasuk)});
      if (d.kendaraan==="Mobil") mobil.push(d.nama);
      if (d.kendaraan==="Motor") motor.push(d.nama);
      if (masuk.getMonth()===thisMonth && masuk.getFullYear()===thisYear) checkinBulanIni.push({room, nama:d.nama, tanggal:d.tanggalMasuk});
    }
  });

  penghuni.sort((a,b) => new Date(a.tanggalMasuk) - new Date(b.tanggalMasuk));

  const terisi = penghuni.length;
  const total = kosts[kostName].length;
  const okupasi = Math.round((terisi/total)*100);

  let pesan = `*Laporan Kost perhari ini*\n${today}\n\n*${kostName}*\nOkupasi = ${okupasi}% (${terisi}/${total})\nKamar Kosong: ${kosong.length} → ${kosong.join(", ")||"Tidak ada"}\n\n*Daftar Penghuni:*\n`;
  penghuni.forEach((p,i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${new Date(p.tanggalMasuk).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})} | ${p.lama}\n`;
  });
  pesan += `\n*Kendaraan:* Mobil ${mobil.length} → ${mobil.join(", ")||"Tidak ada"} | Motor ${motor.length} → ${motor.join(", ")||"Tidak ada"}\n\n`;
  pesan += `*Check-in bulan ini:* ${checkinBulanIni.length} orang\n`;
  checkinBulanIni.forEach((c,i) => pesan += `${i+1}. ${c.room} | ${c.nama} | ${new Date(c.tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\n`);
  pesan += `\nTerima kasih Kostorian!`;

  window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`,"_blank");
};

// Load otomatis saat halaman ready
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
