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
  "Ecokost by Kostory": ["101","102","103","105","106","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77","ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// ==================== LOGIN ====================
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
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

function backToDashboard() {
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// ==================== UTILS ====================
function formatDate(d) { return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
function hitungLamaTinggal(masuk, keluar) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const y = Math.floor(diff / 365);
  const m = Math.floor((diff % 365) / 30);
  const h = diff % 30;
  return `${y} Tahun ${m} Bulan ${h} Hari`;
}
function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }

// ==================== DASHBOARD ====================
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "<div style='text-align:center;padding:60px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";

  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    const rooms = kosts[namaKost];
    totalKamar += rooms.length;

    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px">
        <h3>${namaKost}</h3>
        <div>
          <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
          <button class="btn btn-secondary" onclick="showCheckoutList()">LIST CHECK-OUT</button>
        </div>
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
      box.innerHTML = room + "<br><small>KOSONG</small>";
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", s => {
        const d = s.val();
        if (d && d.nama && !d.checkout) {
          terisi++; totalTerisi++;
          const cls = d.durasi === "Harian" ? "harian" : d.durasi === "Mingguan" ? "mingguan" : d.durasi === "Tahunan" ? "tahunan" : "bulanan";
          box.className = `room ${cls}`;
          box.innerHTML = room + "<br><strong>" + d.nama + "</strong>";
        } else {
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `<strong>TOTAL: ${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG</strong>`;
      });
    });
  });
}

// ==================== MODAL & DATA ====================
window.openModal = async function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = kost + " - " + room;
  const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
  currentData = snap.val() || {};

  ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });

  // Tambah tombol SHARE & CHECKOUT kalau sudah ada penghuni
  const buttons = document.querySelector("#modal .modal-buttons");
  if (currentData.nama) {
    buttons.innerHTML = `
      <button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-wa" onclick="shareCurrentData()">SHARE</button>
      <button class="btn-success" onclick="openCheckoutModal()">CHECK-OUT</button>
      <button class="btn full" onclick="updateDataOnly()">UPDATE DATA</button>`;
  } else {
    buttons.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="updateDataOnly()">SIMPAN & CHECK-IN</button>`;
  }

  document.getElementById("modal").classList.remove("hidden");
};

window.updateDataOnly = function() {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    tanggalLahir: document.getElementById("tanggalLahir").value || null,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: Number(document.getElementById("harga").value),
    deposit: Number(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value),
    noRek: document.getElementById("noRek").value.trim(),
    namaBank: document.getElementById("namaBank").value.trim(),
    namaRekening: document.getElementById("namaRekening").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  if (!data.nama || !data.hp || !data.tanggalMasuk || !data.harga) return alert("Field wajib harus diisi!");

  db.ref(`kosts/${currentKost}/${currentRoom}`).update(data).then(() => {
    closeModal();
    alert("Data berhasil disimpan!");
  });
};

window.shareCurrentData = function() {
  const d = currentData;
  const pesan = `*DATA PENGHUNI*\n${currentKost} - ${currentRoom}\n\n` +
    `*Nama*: ${d.nama}\n*HP*: ${d.hp}\n*Durasi*: ${d.durasi}\n*Harga*: Rp ${d.harga?.toLocaleString()}\n` +
    `*Masuk*: ${formatDate(d.tanggalMasuk)}\n*Token Awal*: ${d.tokenAwal}\n` +
    `*Rekening*: ${d.namaBank||"-"} ${d.noRek||"-"} a.n ${d.namaRekening||"-"}\n\nTeam Kostory`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`,"_blank");
};

// ==================== CHECK-OUT ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = Number(document.getElementById("tokenAkhir").value);
  if (!tgl || !tokenAkhir) return alert("Isi tanggal & token akhir!");

  const checkoutData = {
    ...currentData,
    checkout: true,
    tanggalCheckout: tgl,
    tokenAkhir: tokenAkhir
  };

  db.ref(`checkout/${currentKost}/${currentRoom}`).set(checkoutData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal();
      alert("Check-out berhasil!");
    });
  });
};

// ==================== LIST CHECK-OUT ====================
window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");

  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();

  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost]).forEach(room => {
      const d = all[kost][room];
      const coDate = new Date(d.tanggalCheckout);
      const item = {kost, room, ...d, coDate};
      if (coDate.getMonth() === thisMonth && coDate.getFullYear() === thisYear) bulanIni.push(item);
      else sebelumnya.push(item);
    });
  });

  bulanIni.sort((a,b) => b.coDate - a.coDate);
  sebelumnya.sort((a,b) => b.coDate - a.coDate);

  document.getElementById("listBulanIni").innerHTML = renderList(bulanIni);
  document.getElementById("listSebelumnya").innerHTML = renderList(sebelumnya);
};

function renderList(arr) {
  if (arr.length === 0) return "<p style='text-align:center;color:#666;padding:20px'>Belum ada data</p>";
  return arr.map((d,i) => `
    <div class="checkout-item" onclick="openCheckoutDetail('${d.kost}','${d.room}')">
      <strong>${i+1}. ${d.nama}</strong><br>
      <small>${d.hp} • ${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small>
    </div>`).join("");
}

window.openCheckoutDetail = async function(kost, room) {
  const snap = await db.ref(`checkout/${kost}/${room}`).once("value");
  currentData = snap.val();
  currentKost = kost; currentRoom = room;
  openModal(kost, room);
};

// ==================== LAPOR HARIAN (sementara matiin dulu biar gak error) ====================
window.laporKost = function() { alert("Fitur lapor sementara dinonaktifkan di versi ini"); };

// ==================== INIT ====================
document.addEventListener("DOMContentLoaded", () => {
  if (currentUser) loadDashboard();
});
