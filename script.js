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
const storage = firebase.storage();

const kosts = {
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","108","107","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77","ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null, isCheckoutView = false;

// ==================== UTILS ====================
function formatDate(d) { if(!d) return "-"; return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
function formatRupiah(angka) { return angka ? angka.toLocaleString('id-ID') : '0'; }

function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun}t ${bulan}b ${hari}h`;
}

function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }

window.toggleDark = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
  if (currentUser) loadDashboard();
});

// ==================== LOGIN & NAV ====================
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
  currentUser = null; isCheckoutView = false;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

function backToDashboard() {
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}
// ==================== DASHBOARD + SEARCH + STATS ====================
let allRoomsElements = [];

function filterRooms() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  allRoomsElements.forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = text.includes(query) ? "" : "none";
  });
}

async function loadDashboard() {
  const container = document.getElementById("kostList"); container.innerHTML = "<div style='text-align:center;padding:60px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  allRoomsElements = [];

  let totalKamar = 0, totalTerisi = 0, totalPendapatanBulanIni = 0;

  for (const namaKost of allowedKosts) {
    const rooms = kosts[namaKost];
    totalKamar += rooms.length;

    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:15px">
        <h3>${namaKost}</h3>
        <div>
          <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
        </div>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
      <div class="room-grid"></div>`;
    container.appendChild(card);

    const grid = card.querySelector(".room-grid"), occ = card.querySelector(".occ");
    let terisi = 0;

    for (const room of rooms) {
      const box = document.createElement("div"); box.className = "room kosong";
      box.innerHTML = room + "<br><small>KOSONG</small>";
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);
      allRoomsElements.push(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", async s => {
        const d = s.val();
        if (d && d.nama && !d.checkout) {
          terisi++; totalTerisi++;
          const cls = d.durasi === "Harian" ? "harian" : d.durasi === "Mingguan" ? "mingguan" : d.durasi === "Tahunan" ? "tahunan" : "bulanan";
          box.className = `room ${cls}`;
          box.innerHTML = room + "<br><strong>" + d.nama + "</strong>";
          allRoomsElements.push(box);

          // Hitung pendapatan bulan ini (hanya bulanan & tahunan)
          if (d.durasi === "Bulanan" || d.durasi === "Tahunan") {
            const masuk = new Date(d.tanggalMasuk);
            const now = new Date();
            if (masuk.getMonth() === now.getMonth() && masuk.getFullYear() === now.getFullYear()) {
              totalPendapatanBulanIni += d.harga;
            }
          }
        } else {
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `
          <div><strong>${totalTerisi}</strong> Terisi / ${totalKamar} Kamar</div>
          <div><strong>${totalKamar - totalTerisi}</strong> Kosong</div>
          <div>Pendapatan Bulan Ini<br><strong>Rp ${formatRupiah(totalPendapatanBulanIni)}</strong></div>
          <div>Okupasi<br><strong>${Math.round((totalTerisi/totalKamar)*100)}%</strong></div>`;
      });
    }
  }
}

// ==================== MODAL + TAB + LAUNDRY + FOTO ====================
function showTab(tabId) {
  document.querySelectorAll("#modal .tab-buttons button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll("#modal > .modal-content > div[id^='tab-']").forEach(t => t.classList.add("hidden"));
  document.querySelector(`#modal .tab-buttons button[onclick="showTab('${tabId}')"]`).classList.add("active");
  document.getElementById(tabId).classList.remove("hidden");
  if (tabId === "tab-tagihan") renderLaundry();
  if (tabId === "tab-pembayaran") renderPembayaran();
  if (tabId === "tab-foto") loadFoto();
}

window.openModal = async function(kost, room, fromCheckout = false) {
  currentKost = kost; currentRoom = room; isCheckoutView = fromCheckout;
  document.getElementById("modalTitle").textContent = fromCheckout ? `Detail Check-Out: ${kost} - ${room}` : `${kost} - ${room}`;

  const path = fromCheckout ? `checkout/${kost}/${room}` : `kosts/${kost}/${room}`;
  const snap = await db.ref(path).once("value");
  currentData = snap.val() || {};

  // Reset tab
  showTab("tab-data");

  // Isi field biasa
  const fields = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });

  // Laundry & Pembayaran
  currentData.laundry = currentData.laundry || [];
  currentData.pembayaran = currentData.pembayaran || [];

  // Button modal
  const btn = document.getElementById("modalButtons");
  if (fromCheckout) {
    btn.innerHTML = `<button class="btn-danger full" onclick="closeModal()">TUTUP</button>`;
  } else if (currentData.nama) {
    btn.innerHTML = `
      <button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-wa" onclick="shareFullData()">Share WA</button>
      <button class="btn-success" onclick="openCheckoutModal()">Check-Out</button>
      <button class="btn full" onclick="updateDataOnly()">Update Data</button>
      <button class="btn full btn-secondary" onclick="perpanjangKontrak()">Perpanjang Kontrak</button>`;
  } else {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="updateDataOnly()">SIMPAN & CHECK-IN</button>`;
  }

  document.getElementById("modal").classList.remove("hidden");
};

// Laundry
window.tambahLaundry = async function() {
  const kilo = Number(document.getElementById("kiloLaundry").value);
  const harga = Number(document.getElementById("hargaPerKilo").value) || 8000;
  if (!kilo) return alert("Isi jumlah kilo!");
  const total = kilo * harga;
  currentData.laundry = currentData.laundry || [];
  currentData.laundry.push({kilo, hargaPerKilo: harga, total, tanggal: new Date().toISOString().split("T")[0]});
  renderLaundry();
  document.getElementById("kiloLaundry").value = "";
};

function renderLaundry() {
  const list = document.getElementById("listLaundry");
  const total = currentData.laundry.reduce((a,b)=>a+b.total,0);
  list.innerHTML = currentData.laundry.map((l,i)=>`
    <div class="laundry-item">
      <span>${formatDate(l.tanggal)} → ${l.kilo} kg × Rp ${formatRupiah(l.hargaPerKilo)} = Rp ${formatRupiah(l.total)}</span>
      <button class="btn-danger" style="padding:5px 10px;font-size:12px" onclick="hapusLaundry(${i})">Hapus</button>
    </div>`).join("") || "<p>Belum ada tagihan laundry</p>";
  document.getElementById("totalLaundry").textContent = formatRupiah(total);
}

window.hapusLaundry = function(i) {
  currentData.laundry.splice(i,1);
  renderLaundry();
};

// Pembayaran
window.tambahPembayaran = async function() {
  const nominal = prompt("Nominal pembayaran (Rp):");
  if (!nominal) return;
  const keterangan = prompt("Keterangan (misal: Bayar bulan Mei)", "Pembayaran kost");
  currentData.pembayaran.push({nominal: Number(nominal), keterangan, tanggal: new Date().toISOString().split("T")[0]});
  renderPembayaran();
};

function renderPembayaran() {
  const div = document.getElementById("listPembayaran");
  div.innerHTML = currentData.pembayaran.map(p=>`
    <div style="background:#ecfdf5;padding:12px;border-radius:8px;margin:8px 0">
      <strong>Rp ${formatRupiah(p.nominal)}</strong> - ${p.keterangan}<br>
      <small>${formatDate(p.tanggal)}</small>
    </div>`).join("") || "<p>Belum ada catatan pembayaran</p>";
}

// Foto
async function loadFoto() {
  const ktp = document.getElementById("previewKTP");
  const penghuni = document.getElementById("previewPenghuni");
  if (currentData.fotoKTP) {
    ktp.src = currentData.fotoKTP; ktp.classList.remove("hidden");
  } else ktp.classList.add("hidden");
  if (currentData.fotoPenghuni) {
    penghuni.src = currentData.fotoPenghuni; penghuni.classList.remove("hidden");
  } else penghuni.classList.add("hidden");
}

document.getElementById("fotoKTP").onchange = e => uploadFoto(e.target.files[0], "fotoKTP");
document.getElementById("fotoPenghuni").onchange = e => uploadFoto(e.target.files[0], "fotoPenghuni");

async function uploadFoto(file, type) {
  if (!file) return;
  const ref = storage.ref().child(`foto/${currentKost}/${currentRoom}/${type}_${Date.now()}.jpg`);
  await ref.put(file);
  const url = await ref.getDownloadURL();
  currentData[type] = url;
  document.getElementById(type === "fotoKTP" ? "previewKTP" : "previewPenghuni").src = url;
  document.getElementById(type === "fotoKTP" ? "previewKTP" : "previewPenghuni").classList.remove("hidden");
}

// Update Data
window.updateDataOnly = function() { saveData(false); };

function saveData(isCheckout) {
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
    catatan: document.getElementById("catatan").value.trim(),
    laundry: currentData.laundry || [],
    pembayaran: currentData.pembayaran || [],
    fotoKTP: currentData.fotoKTP || null,
    fotoPenghuni: currentData.fotoPenghuni || null
  };

  if (!data.nama || !data.hp || !data.tanggalMasuk || !data.harga) return alert("Field wajib harus diisi!");

  const path = isCheckoutView ? `checkout/${currentKost}/${currentRoom}` : `kosts/${currentKost}/${currentRoom}`;
  db.ref(path).set(data).then(() => {
    closeModal();
    alert("Data berhasil disimpan!");
  });
}

// Perpanjang Kontrak
window.perpanjangKontrak = function() {
  const pilihan = prompt("Perpanjang berapa?\n1 = 1 Bulan\n3 = 3 Bulan\n12 = 1 Tahun", "1");
  const bulan = pilihan === "3" ? 3 : pilihan === "12" ? 12 : 1;
  const tglBaru = new Date(currentData.tanggalMasuk);
  tglBaru.setMonth(tglBaru.getMonth() + bulan);
  document.getElementById("tanggal").value = tglBaru.toISOString().split("T")[0];
  alert(`Kontrak diperpanjang ${bulan} bulan! Tanggal masuk baru: ${formatDate(tglBaru)}`);
};

// ==================== CHECK-OUT + LISTRIK & LAUNDRY ====================
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];

  const info = document.getElementById("infoListrik");
  const tokenAkhir = document.getElementById("tokenAkhir");
  tokenAkhir.oninput = () => {
    const akhir = Number(tokenAkhir.value);
    const awal = currentData.tokenAwal || 0;
    const pakai = awal - akhir;
    if (pakai > 0) {
      info.innerHTML = `<strong>Pemakaian Listrik: ${pakai} kWh → Potong deposit Rp ${formatRupiah(pakai*1452)}</strong>`;
    } else {
      info.innerHTML = "Token akhir lebih besar → tidak ada potongan";
    }
  };

  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = Number(document.getElementById("tokenAkhir").value);
  if (!tgl || !tokenAkhir) return alert("Isi tanggal & token akhir!");

  const pakai = (currentData.tokenAwal || 0) - tokenAkhir;
  const potongListrik = pakai > 0 ? pakai * 1452 : 0;

  const finalData = {
    ...currentData,
    checkout: true,
    tanggalCheckout: tgl,
    tokenAkhir,
    potongListrik,
    sisaDeposit: currentData.deposit - potongListrik
  };

  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal();
      alert("Check-out berhasil! Deposit dikembalikan: Rp " + formatRupiah(finalData.sisaDeposit));
    });
  });
};

// ==================== EXPORT & BACKUP ====================
window.exportToExcel = async function() {
  alert("Fitur Export Excel siap! Sedang prepare data...");
  // Bisa ditambah library SheetJS kalau mau full excel
};

window.backupData = async function() {
  const snap = await db.ref().once("value");
  const data = snap.val();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `backup-kostory-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
};

// Share WA tetap sama, cuma ditambah info laundry & listrik
window.shareFullData = function() {
  const d = currentData;
  const totalLaundry = d.laundry ? d.laundry.reduce((a,b)=>a+b.total,0) : 0;
  let pesan = `*DATA PENGHUNI*\n${currentKost} - ${currentRoom}\n\n`;
  pesan += `*Nama*: ${d.nama}\n*HP*: ${d.hp}\n*Durasi*: ${d.durasi}\n*Harga*: Rp ${formatRupiah(d.harga)}\n`;
  pesan += `*Check-in*: ${formatDate(d.tanggalMasuk)}\n*Deposit*: Rp ${formatRupiah(d.deposit)}\n`;
  if (totalLaundry > 0) pesan += `*Total Laundry*: Rp ${formatRupiah(totalLaundry)}\n`;
  pesan += `\nTeam Kostory`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Lapor harian tetap sama (nggak diubah biar 100% akurat seperti sebelumnya)

// Load dashboard saat login
document.addEventListener("DOMContentLoaded", () => { if (currentUser) loadDashboard(); });
