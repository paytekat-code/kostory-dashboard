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
  } else alert("Username atau password salah!");
};

window.logout = function() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

// ==================== HITUNG LAMA TINGGAL ====================
function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff/365);
  const bulan = Math.floor((diff % 365)/30);
  const hari = diff % 30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

// ==================== LOAD DASHBOARD ====================
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "";
  document.getElementById("totalStats").innerHTML = "Sedang memuat data dari server...";

  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    const rooms = kosts[namaKost];
    totalKamar += rooms.length;

    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <h3>${namaKost}</h3>
        <button onclick="window.laporKost('${namaKost}')" style="background:#25d366;color:white;padding:8px 16px;border:none;border-radius:8px;font-weight:bold;cursor:pointer">LAPOR</button>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
      <div class="room-grid"></div>`;
    container.appendChild(card);

    const grid = card.querySelector(".room-grid");
    const occ = card.querySelector(".occ");
    let terisi = 0;

    rooms.forEach(room => {
      const box = document.createElement("div");
      box.className = "room kosong";
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

// ==================== SAVE DATA ====================
window.saveAndAskShare = function() {
  const wajib = ["nama","hp","tanggalLahir","harga","tokenAwal","namaKeluarga","telpKeluarga"];
  for (let id of wajib) if (!document.getElementById(id).value.trim()) return alert(`${id} wajib diisi!`);

  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    alamatktp: document.getElementById("alamatktp").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
    harga: +document.getElementById("harga").value,
    deposit: +document.getElementById("deposit").value || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: +document.getElementById("tokenAwal").value,
    namaKeluarga: document.getElementById("namaKeluarga").value.trim(),
    statusKeluarga: document.getElementById("statusKeluarga").value,
    telpKeluarga: document.getElementById("telpKeluarga").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  set(ref(db, `kosts/${currentKost}/${currentRoom}`), data).then(() => {
    window.closeModal();
    if (confirm("Data tersimpan! Share ke WA sekarang?")) {
      const pesan = `*DATA PENGHUNI BARU/UPDATE*\n\n${currentKost} - ${currentRoom}\nNama: *${data.nama}*\nHP: ${data.hp}\nHarga: Rp ${data.harga.toLocaleString()}\nCheck-in: ${data.tanggalMasuk}\nDurasi: ${data.durasi}\nToken Awal: ${data.tokenAwal}\n\nTerima kasih!`;
      window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`,"_blank");
    }
  });
};

// ==================== TAGIH ====================
window.openTagih = function() {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date(); next.setMonth(next.getMonth()+1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const tgl = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tgl || !jumlah) return alert("Isi tanggal & jumlah dulu!");
  const hariLagi = Math.ceil((new Date(tgl) - new Date()) / 86400000);
  const pesan = `Halo kak ${currentData.nama}!\n\nKost kakak akan berakhir tanggal *${new Date(tgl).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}* (${hariLagi} hari lagi), mohon melunasi sebesar *Rp ${Number(jumlah).toLocaleString()}* maksimal 1 hari sebelum masa kontrak berakhir.\n\nAbaikan jika sudah membayar, segera informasikan jika tidak memperpanjang.\n\nTerimakasih\nSalam Kostorian`;
  const hp = currentData.hp.replace(/^0/, "62");
  window.open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`,"_blank");
  document.getElementById("tagihModal").classList.add("hidden");
};

// ==================== CHECK-OUT (RAPI + TOKEN OTOMATIS) ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("tokenAwalDisplay").textContent = currentData.tokenAwal || 0;
  document.getElementById("tokenAkhir").value = "";
  document.getElementById("selisihToken").textContent = "0";
  document.getElementById("checkoutModal").classList.remove("hidden");
};

// Auto hitung selisih token
document.getElementById("tokenAkhir")?.addEventListener("input", function() {
  const awal = parseInt(currentData.tokenAwal) || 0;
  const akhir = parseInt(this.value) || 0;
  const selisih = akhir - awal;
  document.getElementById("selisihToken").textContent = selisih >= 0 ? selisih : 0;
});

window.prosesCheckout = function() {
  const tglOut = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = parseInt(document.getElementById("tokenAkhir").value) || 0;
  const tokenAwal = parseInt(currentData.tokenAwal) || 0;
  const selisih = tokenAkhir - tokenAwal;
  const noRek = document.getElementById("noRek").value.trim();
  const namaBank = document.getElementById("namaBank").value.trim().toUpperCase();
  const namaRekening = document.getElementById("namaRekening").value.trim();

  if (!tglOut || tokenAkhir === 0 || !noRek || !namaBank || !namaRekening) {
    return alert("Semua kolom wajib diisi!");
  }

  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil! Kamar sudah kosong.");

    const lama = hitungLamaTinggal(currentData.tanggalMasuk, tglOut);

    const pesan = `*Informasi Check-out*\n\n` +
      `${currentKost}\n` +
      `Kamar ${currentRoom} | ${currentData.nama} | ${currentData.durasi}\n` +
      `Deposit : *Rp ${(currentData.deposit || 0).toLocaleString()}*\n\n` +
      `*Lama Tinggal :*\n` +
      `Check-in : ${new Date(currentData.tanggalMasuk).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\n` +
      `Check-out : ${new Date(tglOut).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\n` +
      `${lama}\n\n` +
      `*Token PLN :*\n` +
      `Awal : ${tokenAwal} | Akhir : ${tokenAkhir} | Selisih : *${selisih}*\n\n` +
      `*Pengembalian Deposit ke :*\n` +
      `${namaBank} | ${noRek} | ${namaRekening}\n\n` +
      `Terima kasih telah tinggal di Kostory!`;

    window.open(`https://wa.me/?text=${encodeURIComponent(pesan)}`,"_blank");
  });
};

// ==================== LAPOR KOST ====================
window.laporKost = function(kostName) {
  alert(`Fitur laporan lengkap untuk ${kostName} menyusul ya bro! Yang penting dulu semua jalan dulu`);
};

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
