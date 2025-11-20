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

// SEMUA FUNGSI PAKAI window.
window.login = function() {
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else alert("Salah username/password!");
};

window.logout = function() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff/365); const bulan = Math.floor((diff%365)/30); const hari = diff%30;
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`;
}

function loadDashboard() {
  const list = document.getElementById("kostList"); list.innerHTML = "";
  document.getElementById("totalStats").textContent = "Memuat data...";
  let totalTerisi = 0, totalKamar = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    const rooms = kosts[namaKost]; totalKamar += rooms.length;
    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3>${namaKost}</h3><button onclick="window.laporKost('${namaKost}')" style="background:#25d366;color:white;padding:8px 15px;border:none;border-radius:8px;cursor:pointer">LAPOR</button></div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div><div class="room-grid"></div>`;
    list.appendChild(card);
    const grid = card.querySelector(".room-grid");
    const occ = card.querySelector(".occ");
    let terisi = 0;

    rooms.forEach(room => {
      const el = document.createElement("div"); el.className = "room kosong";
      el.innerHTML = `${room}<br><small>KOSONG</small>`;
      el.onclick = () => window.openModal(namaKost, room);
      grid.appendChild(el);

      onValue(ref(db, `kosts/${namaKost}/${room}`), s => {
        const d = s.val();
        if (!d || !d.nama) {
          el.className = "room kosong";
          el.innerHTML = `${room}<br><small>KOSONG</small>`;
        } else {
          terisi++; totalTerisi++;
          const cls = d.durasi==="Harian"?"harian":d.durasi==="Mingguan"?"mingguan":d.durasi==="Tahunan"?"tahunan":"bulanan";
          el.className = `room ${cls}`;
          el.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").textContent = `TOTAL: ${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG`;
      });
    });
  });
}

window.openModal = async function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - ${room}`;
  const snap = await get(ref(db, `kosts/${kost}/${room}`));
  currentData = snap.val() || {};
  const ids = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","alamatktp","perusahaan","harga","deposit","tanggal","tokenAwal","namaKeluarga","statusKeluarga","telpKeluarga","catatan"];
  ids.forEach(id => document.getElementById(id).value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : ""));
  
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

window.saveAndAskShare = function() {
  const wajib = ["nama","hp","tanggalLahir","harga","tokenAwal","namaKeluarga","telpKeluarga"];
  for (let id of wajib) if (!document.getElementById(id).value.trim()) return alert(id + " wajib diisi!");
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
    if (confirm("Tersimpan! Share ke WA?")) window.sharePenghuni(data);
  });
};

window.sharePenghuni = d => {
  const lahir = d.tanggalLahir ? new Date(d.tanggalLahir).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}) : "-";
  const msg = `*DATA PENGHUNI*\n\n${currentKost} - ${currentRoom}\nNama: *${d.nama}*\nHP: ${d.hp}\nLahir: ${lahir}\nHarga: Rp ${d.harga.toLocaleString()}\nCheck-in: ${d.tanggalMasuk}\n\nSalam Kostory!`;
  open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank");
};

window.openTagih = () => {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date(); next.setMonth(next.getMonth()+1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = () => {
  const tgl = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tgl || !jumlah) return alert("Isi dulu!");
  const hari = Math.ceil((new Date(tgl) - new Date()) / 86400000);
  const pesan = `Halo kak ${currentData.nama}!\n\nKost akan berakhir *${new Date(tgl).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}* (${hari} hari lagi), mohon lunasi *Rp ${Number(jumlah).toLocaleString()}* maksimal H-1.\n\nAbaikan jika sudah bayar.\nTerima kasih\nSalam Kostorian`;
  const hp = currentData.hp.replace(/^0/,"62");
  open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`,"_blank");
  document.getElementById("tagihModal").classList.add("hidden");
};

window.openCheckoutModal = () => {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = () => {
  const out = document.getElementById("tanggalCheckout").value;
  const token = document.getElementById("tokenAkhir").value;
  const rek = document.getElementById("noRek").value.trim();
  const bank = document.getElementById("namaBank").value.trim();
  const nama = document.getElementById("namaRekening").value.trim();
  if (!out || !token || !rek || !bank || !nama) return alert("Isi semua!");
  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil!");
    const pesan = `*Check-out ${currentKost}*\nKamar ${currentRoom} | ${currentData.nama}\nDeposit: Rp ${(currentData.deposit||0).toLocaleString()}\nCheck-in: ${new Date(currentData.tanggalMasuk).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\nCheck-out: ${new Date(out).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}\nLama: ${hitungLamaTinggal(currentData.tanggalMasuk,out)}\nToken: ${currentData.tokenAwal} → ${token} (selisih ${token-currentData.tokenAwal})\n\nPengembalian ke:\n${bank} | ${rek} | ${nama}`;
    open(`https://wa.me/?text=${encodeURIComponent(pesan)}`,"_blank");
  });
};

window.laporKost = nama => alert("Laporan " + nama + " (fitur lengkap menyusul, yang penting dulu jalan semua ya bro!)");

// Jalankan saat halaman siap
document.addEventListener("DOMContentLoaded", () => {
  // jika sudah pernah login sebelumnya, langsung masuk
  if (currentUser) loadDashboard();
});
