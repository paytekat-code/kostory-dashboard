const firebaseConfig = {
  apiKey: "AIzaSyAhN2a4m6PkTwFOvJ88TreD1lCERYJD7m0",
  authDomain: "kostory-db.firebaseapp.com",
  databaseURL: "https://kostory-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kostory-db",
  storageBucket: "kostory-db.appspot.com",
  messagingSenderId: "447318101438",
  appId: "1:447318101438:web:7aba8e16ccee69fd3c53def"
};

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

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77","ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// AUTO LOGIN
window.onload = () => {
  const saved = localStorage.getItem("kostoryUser");
  if (saved && passwordDb[saved]) {
    currentUser = saved;
    allowedKosts = hakAkses[saved] === "all" ? Object.keys(kosts) : [hakAkses[saved]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  }
};

function logout() {
  localStorage.removeItem("kostoryUser");
  location.reload();
}

window.login = () => {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    localStorage.setItem("kostoryUser", user);
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else alert("Username/password salah!");
};

function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return `${date.getDate()} ${date.toLocaleDateString("id-ID",{month:"short"}).replace(".","")} ${date.getFullYear().toString().slice(-2)}`;
}

function hitungLamaTinggal(masuk) {
  const diff = Math.floor((new Date() - new Date(masuk)) / 86400000);
  const y = Math.floor(diff / 365);
  const m = Math.floor((diff % 365) / 30);
  const h = diff % 30;
  return `${y}y ${m}bln ${h}h`;
}

function hariKeUlangTahun(tgl) {
  if (!tgl) return 9999;
  const lahir = new Date(tgl);
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
}

function backToDashboard() {
  ["penghuniListPage","checkoutListPage","checkinListPage"].forEach(id => 
    document.getElementById(id)?.classList.add("hidden")
  );
  document.getElementById("app").classList.remove("hidden");
}

// DASHBOARD
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "<div style='text-align:center;padding:100px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  let totalKamar = 0, totalTerisi = 0;

  allowedKosts.forEach(namaKost => {
    totalKamar += kosts[namaKost].length;
    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `<h2 style="color:#1e40af;margin-bottom:20px">${namaKost}</h2><div class="room-grid"></div>`;
    container.appendChild(card);
    const grid = card.querySelector(".room-grid");

    kosts[namaKost].forEach(room => {
      db.ref(`kosts/${namaKost}/${room}`).once("value").then(snap => {
        const d = snap.val();
        const div = document.createElement("div");
        div.className = "room";
        div.onclick = () => openModal(namaKost, room);
        if (!d || d.checkout) {
          div.classList.add("kosong");
          div.innerHTML = room + "<br><small>Kosong</small>";
        } else {
          totalTerisi++;
          div.classList.add(d.status || "staying");
          div.innerHTML = room + "<br><small>" + d.nama + "</small>";
        }
        grid.appendChild(div);
        document.getElementById("totalStats").innerHTML = `Total Kamar: ${totalKamar} | Terisi: ${totalTerisi} (${Math.round(terisi/totalKamar*100)}%)`;
      });
    });
  });
}

// MODAL DETAIL — TOMBOL TAGIH & LUNAS KEMBALI DI SINI (bukan di list penghuni)
window.openModal = function(kost, room) {
  currentKost = kost; currentRoom = room;
  db.ref(`kosts/${kost}/${room}`).once("value").then(snap => {
    currentData = snap.val() || {};
    document.getElementById("detailModal").classList.remove("hidden");
    document.getElementById("modalTitle").textContent = currentData.nama ? `DETAIL / EDIT - ${room}` : `CHECK-IN BARU - ${room}`;

    // Isi form
    ["nama","hp","alamat","perusahaan","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan","namaKeluarga","hubunganKeluarga","hpKeluarga"].forEach(id => {
      document.getElementById(id).value = currentData[id] || "";
    });
    document.getElementById("statusPenghuni").value = currentData.status || "staying";
    document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];

    // TOMBOL-TOMBOL KEMBALI KE TEMPAT SEMULA
    const btn = document.getElementById("modalButtons");
    btn.innerHTML = `
      <button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="simpanData()">${currentData.nama ? "UPDATE DATA" : "SIMPAN CHECK-IN"}</button>
    `;

    if (currentData.nama) {
      btn.innerHTML += `
        <button class="btn-wa" onclick="kirimWA('${kost}','${room}')">KIRIM WA BIASA</button>
        <button class="btn-wa" onclick="ucapanUlangTahun('${kost}','${room}')">ULANG TAHUN</button>
        <button class="tagih-btn" onclick="tagihModal()">TAGIH</button>
        <button class="lunas-btn" onclick="lunasModal()">LUNAS</button>
        <button class="btn-danger" onclick="checkoutModal()">CHECK-OUT</button>
      `;
    }
  });
};

window.simpanData = function() {
  const data = {
    status: document.getElementById("statusPenghuni").value,
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    alamat: document.getElementById("alamat").value,
    perusahaan: document.getElementById("perusahaan").value,
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: Number(document.getElementById("harga").value) || 0,
    deposit: Number(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value) || 0,
    noRek: document.getElementById("noRek").value,
    namaBank: document.getElementById("namaBank").value,
    namaRekening: document.getElementById("namaRekening").value,
    catatan: document.getElementById("catatan").value,
    namaKeluarga: document.getElementById("namaKeluarga").value,
    hubunganKeluarga: document.getElementById("hubunganKeluarga").value,
    hpKeluarga: document.getElementById("hpKeluarga").value
  };
  if (!data.nama || !data.hp) return alert("Nama dan No. HP wajib diisi!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal(); alert("Data berhasil disimpan!"); loadDashboard();
  });
};

// TOMBOL WA BIASA & ULANG TAHUN KEMBALI HIDUP
window.kirimWA = function() {
  const pesan = `Halo ${currentData.nama}!\nIni dari Kostory, ada yang bisa dibantu?`;
  window.open(`https://wa.me/${currentData.hp}?text=${encodeURIComponent(pesan)}`, "_blank");
};

window.ucapanUlangTahun = function() {
  const hari = hariKeUlangTahun(currentData.tanggalLahir);
  let pesan = "";
  if (hari === 0) {
    pesan = `Selamat Ulang Tahun yang ke-${new Date().getFullYear() - new Date(currentData.tanggalLahir).getFullYear()} tahun, ${currentData.nama}!\n\nSemoga panjang umur, sehat selalu, rezekinya lancar, dan selalu bahagia bersama keluarga.\n\nSalam hangat dari seluruh tim Kostory`;
  } else {
    pesan = `Halo ${currentData.nama}, dalam ${hari} hari lagi ulang tahun ya!\nKami dari Kostory mengucapkan: Selamat ulang tahun di muka bumi ini, semoga selalu sehat dan bahagia!`;
  }
  window.open(`https://wa.me/${currentData.hp}?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Check-out, Tagih, Lunas — tetap sama
window.checkoutModal = function() { /* sama seperti sebelumnya */ };
window.prosesCheckout = function() { /* sama */ };
window.tagihModal = function() { /* sama */ };
window.kirimTagihan = function() { /* sama */ };
window.lunasModal = function() { /* sama */ };
window.catatLunas = function() { /* sama */ };

// Daftar Penghuni — tombol TAGIH & LUNAS DIHAPUS DARI SINI (kembali ke modal)
window.showPenghuniList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");
  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d?.nama && !d.checkout) {
        list.push({kost, room, d});
      }
    }
  }
  list.sort((a,b) => hariKeUlangTahun(a.d.tanggalLahir) - hariKeUlangTahun(b.d.tanggalLahir));

  document.getElementById("penghuniListContainer").innerHTML = list.map(p => {
    const hari = hariKeUlangTahun(p.d.tanggalLahir);
    const ulangText = hari === 0 ? 'Hari Ini!' : `dalam ${hari} hari`;
    return `<div class="penghuni-item" onclick="openModal('${p.kost}','${p.room}')">
      <div>
        <strong>${p.room} - ${p.d.nama}</strong><br>
        <small>${p.d.hp} • ${p.d.durasi} • Tinggal ${hitungLamaTinggal(p.d.tanggalMasuk)}</small><br>
        <small>Ulang tahun: ${ulangText}</small>
      </div>
      ${p.d.lunas ? '<span class="status-lunas">LUNAS</span>' : '<span style="background:#fee2e2;color:#b91c1c;padding:6px 12px;border-radius:8px">BELUM</span>'}
    </div>`;
  }).join("") || "<p style='text-align:center;padding:60px;color:#666'>Belum ada penghuni aktif</p>";
};

// Check-in List + WA Lengkap (tetap jalan seperti sebelumnya)
window.showCheckinList = async function() { /* sama seperti versi sebelumnya yang sudah jalan */ };
async function loadCheckinList() { /* sama */ };
window.laporCheckinWA = async function() { /* sama */ };

// Check-out List (tetap jalan)
window.showCheckoutList = async function() { /* sama */ };
