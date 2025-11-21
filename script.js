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
const passwordDb = { "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77","ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" };

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
  const container = document.getElementById("kostList");
  container.innerHTML = '<div style="text-align:center;padding:60px;color:#666">Loading kamar...</div>';
  document.getElementById("totalStats").innerHTML = "Memuat data...";

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
        <button onclick="laporKost('${namaKost}')" style="background:#25d366;color:white;padding:10px 20px;border:none;border-radius:10px;font-weight:bold;font-size:15px;cursor:pointer">LAPOR</button>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
      <div class="room-grid"></div>`;
    container.appendChild(card);

    const grid = card.querySelector(".room-grid");
    const occSpan = card.querySelector(".occ");
    let terisi = 0;

    rooms.forEach(room => {
      const box = document.createElement("div");
      box.className = "room kosong";
      box.innerHTML = `${room}<br><small>KOSONG</small>`;
      box.style.cursor = "pointer";
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);

      onValue(ref(db, `kosts/${namaKost}/${room}`), snap => {
        const d = snap.val();
        if (d && d.nama) {
          terisi++; totalTerisi++;
          const cls = d.durasi === "Harian" ? "harian" : d.durasi === "Mingguan" ? "mingguan" : d.durasi === "Tahunan" ? "tahunan" : "bulanan";
          box.className = `room ${cls}`;
          box.innerHTML = `${room}<br><strong>${d.nama}</strong>`;
        } else {
          box.className = "room kosong";
          box.innerHTML = `${room}<br><small>KOSONG</small>`;
        }
        occSpan.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `<strong>TOTAL: ${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG</strong>`;
      });
    });
  });
}

// ==================== MODAL ====================
window.openModal = async function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - ${room}`;
  const snap = await get(ref(db, `kosts/${kost}/${room}`));
  currentData = snap.val() || {};

  const fields = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","alamatktp","perusahaan","harga","deposit","tanggal","tokenAwal","namaKeluarga","statusKeluarga","telpKeluarga","catatan"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id === "tanggal" ? new Date().toISOString().split("T")[0] : "");
  });

  const btn = document.querySelector(".modal-buttons");
  if (currentData.nama) {
    btn.innerHTML = `
      <button onclick="openCheckoutModal()">CHECK OUT</button>
      <button onclick="updateDanShare()">UPDATE & SHARE</button>
      <button onclick="openTagihModal()">TAGIH</button>
      <button onclick="closeModal()">BATAL</button>`;
  } else {
    btn.innerHTML = `
      <button class="full" onclick="updateDanShare()">CHECK IN & SHARE</button>
      <button onclick="closeModal()">BATAL</button>`;
  }
  document.getElementById("modal").classList.remove("hidden");
};

window.closeModal = () => document.getElementById("modal").classList.add("hidden");

// ==================== CHECK-IN & UPDATE → KIRIM DATA LENGKAP KE WA ====================
window.updateDanShare = window.checkInDanShare = function() {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    alamatktp: document.getElementById("alamatktp").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
    harga: Number(document.getElementById("harga").value),
    deposit: Number(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value),
    namaKeluarga: document.getElementById("namaKeluarga").value.trim(),
    statusKeluarga: document.getElementById("statusKeluarga").value,
    telpKeluarga: document.getElementById("telpKeluarga").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  if (!data.nama || !data.hp || !data.tanggalMasuk || !data.harga || data.tokenAwal === undefined) {
    return alert("Nama, HP, Tanggal Masuk, Harga, dan Token Awal WAJIB diisi!");
  }

  set(ref(db, `kosts/${currentKost}/${currentRoom}`), data).then(() => {
    closeModal();
    alert(currentData.nama ? "Data berhasil diupdate!" : "Check-in berhasil!");

    const tglMasuk = new Date(data.tanggalMasuk).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
    const tglLahir = data.tanggalLahir ? new Date(data.tanggalLahir).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}) : "-";

    const pesan = (currentData.nama ? `*UPDATE DATA PENGHUNI*` : `*CHECK-IN PENGHUNI BARU*`) +
      `\n\n*${currentKost} - Kamar ${currentRoom}*\n\n` +
      `*Nama*: ${data.nama}\n` +
      `*HP/WA*: ${data.hp}\n` +
      `*Tanggal Lahir*: ${tglLahir}\n` +
      `*Jenis*: ${data.jenis}\n` +
      `*Durasi*: ${data.durasi}\n` +
      `*Kendaraan*: ${data.kendaraan}\n` +
      `*Harga per Periode*: Rp ${data.harga.toLocaleString()}\n` +
      `*Deposit*: Rp ${data.deposit.toLocaleString()}\n` +
      `*Tanggal Masuk*: ${tglMasuk}\n` +
      `*Token PLN Awal*: ${data.tokenAwal}\n` +
      `*Alamat KTP*: ${data.alamatktp || "-"}\n` +
      `*Perusahaan/Kampus*: ${data.perusahaan || "-"}\n` +
      `*Nama Keluarga*: ${data.namaKeluarga || "-"}\n` +
      `*Status Keluarga*: ${data.statusKeluarga}\n` +
      `*Telp Keluarga*: ${data.telpKeluarga || "-"}\n` +
      `*Catatan*: ${data.catatan || "Tidak ada"}\n\n` +
      `Terima kasih! Team Kostory`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
  }).catch(err => alert("Gagal simpan: " + err.message));
};

// ==================== TAGIH ====================
window.openTagihModal = function() {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const tgl = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tgl || !jumlah) return alert("Isi tanggal & jumlah!");

  const hariLagi = Math.ceil((new Date(tgl) - new Date()) / 86400000);
  const pesan = `Halo kak ${currentData.nama}!\n\nTagihan kost jatuh tempo tanggal *${new Date(tgl).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}* (${hariLagi} hari lagi)\n\nMohon transfer sebesar *Rp ${Number(jumlah).toLocaleString()}*\n\nTerima kasih kak!`;

  const hp = currentData.hp.replace(/^0/, "62");
  window.open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`, "_blank");
  document.getElementById("tagihModal").classList.add("hidden");
};

// ==================== CHECK-OUT ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
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
  const namaRek = document.getElementById("namaRekening").value.trim();

  if (!tgl || !akhir || !rek || !bank || !namaRek) return alert("Isi semua field!");

  remove(ref(db, `kosts/${currentKost}/${currentRoom}`)).then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil!");
    const pesan = `*CHECK-OUT*\n${currentKost} - ${currentRoom}\n${currentData.nama}\nLama tinggal: ${hitungLamaTinggal(currentData.tanggalMasuk, tgl)}\nToken PLN: ${awal} → ${akhir} (selisih ${selisih})\nPengembalian ke: ${bank} ${rek} a.n ${namaRek}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
  });
};

// ==================== LAPORAN HARIAN ====================
window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  const bulanIni = today.getMonth();
  const tahunIni = today.getFullYear();

  let terisi = 0, kosongList = [], penghuniList = [], mobilList = [], motorList = [], checkInBulanIni = [];

  for (const room of rooms) {
    const snap = await get(ref(db, `kosts/${namaKost}/${room}`));
    const d = snap.val();
    if (d && d.nama) {
      terisi++;
      const tglMasuk = new Date(d.tanggalMasuk);
      const lama = hitungLamaTinggal(d.tanggalMasuk);
      penghuniList.push({room, nama: d.nama, hp: d.hp || "-", durasi: d.durasi, masuk: tglMasuk.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"}), lama});
      if (tglMasuk.getMonth() === bulanIni && tglMasuk.getFullYear() === tahunIni) {
        checkInBulanIni.push(`${room} | ${d.nama} | ${tglMasuk.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}`);
      }
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else {
      kosongList.push(room);
    }
  }

  const tanggalHariIni = today.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
  const okupasi = Math.round((terisi / rooms.length) * 100);

  let pesan = `*Laporan Harian*\n${tanggalHariIni}\n\n*${namaKost}*\nOkupasi = *${okupasi}%* (${terisi}/${rooms.length})\nKamar Kosong : ${kosongList.length} -> ${kosongList.join(", ") || "Tidak ada"}\n\n*Daftar Penghuni:*\n`;
  penghuniList.forEach((p,i) => pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${p.masuk} | ${p.lama}.\n`);
  if (!penghuniList.length) pesan += "Semua kamar kosong hari ini\n";

  pesan += `\n*Kendaraan :*\nMobil: ${mobilList.length} -> ${mobilList.join(", ") || "-"}\nMotor: ${motorList.length} -> ${motorList.join(", ") || "-"}\n\n`;
  pesan += `*Check-in Bulan ini* : ${checkInBulanIni.length} orang\n${checkInBulanIni.length ? checkInBulanIni.join("\n") : "Belum ada"}\n\n`;
  pesan += `*Check-out Bulan ini* : 0 orang\nBelum ada\n\nTerima kasih Team Kostory!`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
