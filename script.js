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

// === UTIL ===
function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  const hari = date.getDate();
  const bulan = date.toLocaleDateString("id-ID", { month: "short" }).replace(".", "");
  const tahun = date.getFullYear().toString().slice(-2);
  return `${hari} ${bulan} ${tahun}`;
}
function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun} tahun ${bulan} bulan ${hari} hari`;
}
function hariKeUlangTahun(tglLahir) {
  if (!tglLahir) return 9999;
  const lahir = new Date(tglLahir);
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}
function isHariIniUlangTahun(tglLahir) {
  if (!tglLahir) return false;
  const lahir = new Date(tglLahir);
  const today = new Date();
  return lahir.getDate() === today.getDate() && lahir.getMonth() === today.getMonth();
}
function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }
function backToDashboard() {
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// === LOGIN ===
window.login = function() {
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

// === DASHBOARD ===
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "<div style='text-align:center;padding:80px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  let totalKamar = 0, totalTerisi = 0;

  container.innerHTML = "";

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    totalKamar += kosts[namaKost].length;

    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px">
        <h3>${namaKost}</h3>
        <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${kosts[namaKost].length}</div>
      <div class="room-grid"></div>`;
    container.appendChild(card);

    const grid = card.querySelector(".room-grid");
    const occ = card.querySelector(".occ");
    let terisi = 0;

    kosts[namaKost].forEach(room => {
      const box = document.createElement("div");
      box.className = "room kosong";
      box.dataset.kost = namaKost;
      box.dataset.room = room;
      box.style.cursor = "pointer";
      box.innerHTML = room + "<br><small>KOSONG</small>";
      grid.appendChild(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", s => {
        const d = s.val();
        if (d && d.nama && !d.checkout) {
          if (box.classList.contains("kosong")) { terisi++; totalTerisi++; }
          box.className = `room ${d.statusPenghuni || "staying"}`;
          box.innerHTML = `${room}<br><small>${d.nama}</small>`;
        } else {
          if (!box.classList.contains("kosong")) { terisi--; totalTerisi--; }
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `Total Terisi: ${totalTerisi} / ${totalKamar} (${Math.round(totalTerisi/totalKamar*100)}%)`;
      });
    });
  });
}

// === EVENT DELEGATION SUPAYA SELALU BISA DIKLIK ===
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("kostoryUser");
  if (saved && passwordDb[saved.toLowerCase()]) {
    currentUser = saved.toLowerCase();
    allowedKosts = hakAkses[currentUser] === "all" ? Object.keys(kosts) : [hakAkses[currentUser]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  }

  // KOTAK KAMAR
  document.getElementById("kostList").addEventListener("click", e => {
    const box = e.target.closest(".room");
    if (box && box.dataset.kost && box.dataset.room) {
      openModal(box.dataset.kost, box.dataset.room);
    }
  });

  // DAFTAR PENGHUNI
  document.getElementById("listPenghuni").addEventListener("click", e => {
    const item = e.target.closest(".penghuni-item");
    if (item && item.dataset.kost && item.dataset.room) {
      openModal(item.dataset.kost, item.dataset.room);
    }
  });

  // CHECKOUT LIST
  document.getElementById("listBulanIni").addEventListener("click", e => {
    const item = e.target.closest(".checkout-item");
    if (item && item.dataset.kost && item.dataset.room) openModal(item.dataset.kost, item.dataset.room, true);
  });
  document.getElementById("listSebelumnya").addEventListener("click", e => {
    const item = e.target.closest(".checkout-item");
    if (item && item.dataset.kost && item.dataset.room) openModal(item.dataset.kost, item.dataset.room, true);
  });
});

// === MODAL & FUNGSI LAINNYA (TIDAK DIUBAH) ===
window.openModal = async function(kost, room, fromCheckout = false) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = fromCheckout ? `Detail Check-Out: ${kost} - ${room}` : `${kost} - ${room}`;

  const path = fromCheckout ? `checkout/${kost}/${room}` : `kosts/${kost}/${room}`;
  const snap = await db.ref(path).once("value");
  currentData = snap.val() || {};

  const fields = ["nama","hp","tanggalLahir","alamat","perusahaan","jenis","durasi","kendaraan","harga","deposit","tokenAwal","noRek","namaBank","namaRekening","catatan","namaKeluarga","hubunganKeluarga","hpKeluarga"];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = currentData[id] || ""; });
  document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  document.querySelectorAll("#tokenAkhirCheckout, #selisihToken").forEach(el => { el.parentElement.style.display = fromCheckout ? "block" : "none"; });
  document.getElementById("infoSelisih").style.display = fromCheckout ? "block" : "none";

  if (fromCheckout && currentData.tokenAkhir) {
    document.getElementById("tokenAkhirCheckout").value = currentData.tokenAkhir;
    hitungSelisihToken();
  }

  const btns = document.getElementById("modalButtons"); btns.innerHTML = "";
  if (!fromCheckout) {
    if (currentData.nama) {
      btns.innerHTML = `<button class="btn-success" onclick="updateDataOnly()">UPDATE DATA</button>
        <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
        <button class="btn-danger full" onclick="openCheckoutModal()">CHECK-OUT</button>
        <button class="btn-secondary full" onclick="closeModal()">TUTUP</button>`;
    } else {
      btns.innerHTML = `<button class="btn-success full" onclick="simpanData()">SIMPAN</button>
        <button class="btn-danger full" onclick="closeModal()">Batal</button>`;
    }
  } else {
    btns.innerHTML = `<button class="btn-success" onclick="updateDataOnly(true)">UPDATE DATA</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
      <button class="btn-secondary full" onclick="closeModal()">TUTUP</button>`;
  }
  document.getElementById("modal").classList.remove("hidden");
};

window.hitungSelisihToken = function() {
  const awal = Number(document.getElementById("tokenAwal").value) || 0;
  const akhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
  const selisih = akhir - awal;
  document.getElementById("selisihToken").value = selisih;
  document.getElementById("infoSelisih").textContent = selisih < 0 ? "Selisih negatif, cek input!" : "";
};

window.simpanData = function() {
  const nama = document.getElementById("nama").value.trim();
  const hp = document.getElementById("hp").value.trim();
  if (!nama || !hp) return alert("Nama dan HP wajib diisi!");
  const data = updateDataOnly();
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => { closeModal(); alert("Data tersimpan!"); });
};

window.updateDataOnly = function(isFromCheckout = false) {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    statusPenghuni: document.getElementById("statusPenghuni").value,
    tanggalLahir: document.getElementById("tanggalLahir").value || null,
    alamat: document.getElementById("alamat").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: Number(document.getElementById("harga").value) || 0,
    deposit: Number(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value) || 0,
    noRek: document.getElementById("noRek").value.trim(),
    namaBank: document.getElementById("namaBank").value.trim(),
    namaRekening: document.getElementById("namaRekening").value.trim(),
    catatan: document.getElementById("catatan").value.trim(),
    namaKeluarga: document.getElementById("namaKeluarga")?.value.trim() || "",
    hubunganKeluarga: document.getElementById("hubunganKeluarga")?.value || "",
    hpKeluarga: document.getElementById("hpKeluarga")?.value.trim() || ""
  };

  const ref = isFromCheckout ? db.ref(`checkout/${currentKost}/${currentRoom}`) : db.ref(`kosts/${currentKost}/${currentRoom}`);
  if (isFromCheckout) {
    data.tokenAkhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
    data.selisihToken = data.tokenAkhir - data.tokenAwal;
  }
  ref.update(data).then(() => { closeModal(); alert("Update berhasil!"); });
  return data;
};

window.shareFullData = async function() { /* ... kode shareFullData persis sama seperti sebelumnya ... */ };
window.laporKost = async function(namaKost) { /* ... kode laporKost persis sama ... */ };
window.kirimUlangTahun = function(nama, hp) { /* ... kode kirim ulang tahun ... */ };
window.showPenghuniList = async function() { /* ... kode showPenghuniList dengan data-kost & data-room ... */ };
window.showCheckoutList = async function() { /* ... kode checkout list dengan data-kost & data-room ... */ };
window.bukaTagih = function(kost, room, nama, hp) { /* ... kode tagih ... */ };
window.kirimTagihan = function() { /* ... kode kirim tagihan ... */ };
window.bukaLunas = function(kost, room) { /* ... kode lunasi ... */ };
window.catatLunas = function() { /* ... kode catat lunas ... */ };
window.openCheckoutModal = function() { /* ... kode checkout modal ... */ };
window.prosesCheckout = function() { /* ... kode proses checkout ... */ };
window.laporPembayaran = async function() { /* ... kode lapor pembayaran ... */ };
window.logout = function() { localStorage.removeItem("kostoryUser"); location.reload(); };
