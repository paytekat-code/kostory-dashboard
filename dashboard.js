import { firebaseConfig } from './firebase-config.js';
import { formatDate, hitungLamaTinggal, closeModal } from './utils.js';

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const kosts = {
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","107","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { 
  "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra",
  "ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" 
};

let currentUser = localStorage.getItem("kostoryUser");
let allowedKosts = hakAkses[currentUser] === "all" ? Object.keys(kosts) : [hakAkses[currentUser]];
let currentKost = null, currentRoom = null;

// ==================== TAMPILKAN USER ====================
document.getElementById("userName").textContent = currentUser.toUpperCase();

// ==================== LOAD DASHBOARD ====================
function loadDashboard() {
  const list = document.getElementById("kostList");
  list.innerHTML = "";

  let stats = {kosong:0,booking:0,staying:0,bulanan:0,tahunan:0};

  allowedKosts.forEach(kostName => {
    // Buat card kost
    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `<h2>${kostName}</h2><div class="room-grid" id="grid-${kostName.replace(/\s+/g,'-')}"></div>`;
    list.appendChild(card);

    const grid = document.getElementById(`grid-${kostName.replace(/\s+/g,'-')}`);

    // Tambah semua kamar
    kosts[kostName].forEach(room => {
      const roomEl = document.createElement("div");
      roomEl.className = "room kosong";
      roomEl.textContent = room;
      roomEl.onclick = () => bukaModal(kostName, room);
      grid.appendChild(roomEl);
    });

    // Listen data real-time
    db.ref(kostName).on("value", snap => {
      const data = snap.val() || {};
      let count = {kosong:0,booking:0,staying:0,bulanan:0,tahunan:0};

      Object.keys(data).forEach(roomNum => {
        const d = data[roomNum];
        const el = Array.from(grid.children).find(e => e.textContent === roomNum);
        if (!el) return;

        const status = d.status || "kosong";
        el.className = `room ${status}`;
        if (status !== "kosong") el.title = d.nama || "";
        count[status]++;
      });

      // Hitung kosong
      count.kosong = kosts[kostName].length - Object.keys(data).length;
      Object.keys(count).forEach(k => stats[k] += count[k]);

      // Update stats di atas
      document.getElementById("totalStats").innerHTML = `
        <b>Kosong:</b> ${stats.kosong} | 
        <b>Booking:</b> ${stats.booking} | 
        <b>Harian/Mingguan:</b> ${stats.staying} | 
        <b>Bulanan:</b> ${stats.bulanan} | 
        <b>Tahunan:</b> ${stats.tahunan}
      `;
    });
  });
}

// ==================== MODAL TAMBAH/EDIT ====================
window.bukaModal = function(kost, room) {
  currentKost = kost;
  currentRoom = room;

  document.getElementById("modalTitle").textContent = "Tambah Penghuni";
  document.getElementById("kostSelect").value = kost;
  document.getElementById("kamar").value = room;

  // Reset form
  document.querySelectorAll("#penghuniModal input, #penghuniModal select, #penghuniModal textarea")
    .forEach(el => el.value = "");
  document.getElementById("durasi").value = "Bulanan";

  // Kalau edit → isi data
  db.ref(`${kost}/${room}`).once("value").then(snap => {
    if (snap.exists()) {
      const d = snap.val();
      document.getElementById("modalTitle").textContent = "Edit Penghuni";
      Object.keys(d).forEach(k => {
        if (document.getElementById(k)) document.getElementById(k).value = d[k] || "";
      });
    }
    document.getElementById("penghuniModal").classList.remove("hidden");
  });
};

window.simpanPenghuni = function() {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value,
    perusahaan: document.getElementById("perusahaan").value,
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: parseInt(document.getElementById("harga").value) || 0,
    deposit: parseInt(document.getElementById("deposit").value) || 0,
    tglMasuk: document.getElementById("tanggal").value,
    tokenAwal: parseInt(document.getElementById("tokenAwal").value) || 0,
    noRek: document.getElementById("noRek").value,
    namaBank: document.getElementById("namaBank").value,
    namaRekening: document.getElementById("namaRekening").value,
    catatan: document.getElementById("catatan").value,
    namaKeluarga: document.getElementById("namaKeluarga").value,
    hubunganKeluarga: document.getElementById("hubunganKeluarga").value,
    hpKeluarga: document.getElementById("hpKeluarga").value,
    status: document.getElementById("durasi").value === "Tahunan" ? "tahunan" : 
            ["Harian","Mingguan"].includes(document.getElementById("durasi").value) ? "staying" : "bulanan"
  };

  if (!data.nama || !data.hp || !data.tglMasuk) {
    alert("Nama, No.HP, dan Tanggal Check-in wajib diisi!");
    return;
  }

  db.ref(`${currentKost}/${currentRoom}`).set(data).then(() => {
    alert("Penghuni berhasil disimpan!");
    closeModal();
  }).catch(err => alert(err.message));
};

// ==================== LOGOUT ====================
window.logout = function() {
  localStorage.removeItem("kostoryUser");
  location.href = "login.html";
};

// ==================== JALANKAN ====================
loadDashboard();
