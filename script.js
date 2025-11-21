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

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;
let allRoomBoxes = [];

// ==================== UTILS ====================
function formatDate(d) { if(!d) return "-"; return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
function formatRupiah(n) { return n ? n.toLocaleString('id-ID') : '0'; }
function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }

window.toggleDark = () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", document.body.classList.contains("dark"));
};

// ==================== LOGIN ====================
window.login = () => {
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

window.logout = () => location.reload();

// ==================== DASHBOARD ====================
function filterRooms() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  allRoomBoxes.forEach(box => {
    box.style.display = box.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

async function loadDashboard() {
  const container = document.getElementById("kostList"); container.innerHTML = "Loading...";
  allRoomBoxes = [];
  let totalKamar = 0, totalTerisi = 0;

  for (const namaKost of allowedKosts) {
    const rooms = kosts[namaKost];
    totalKamar += rooms.length;

    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
        <h3>${namaKost}</h3>
        <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
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
      allRoomBoxes.push(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", s => {
        const d = s.val();
        if (d && d.nama) {
          terisi++; totalTerisi++;
          const status = d.statusPenghuni || "staying";
          const cls = status === "booking" ? "booking" : d.durasi === "Harian" ? "harian" : d.durasi === "Mingguan" ? "mingguan" : d.durasi === "Tahunan" ? "tahunan" : "staying";
          box.className = `room ${cls}`;
          box.innerHTML = room + "<br><strong>" + d.nama + "</strong>";
        } else {
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `<strong>${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG</strong>`;
      });
    }
  }
}

// ==================== MODAL ====================
function showTab(id) {
  document.querySelectorAll("#modal .tab-buttons button").forEach(b => b.classList.remove("active"));
  document.querySelectorAll("#modal > .modal-content > div[id^=tab-]").forEach(t => t.classList.add("hidden"));
  event.target.classList.add("active");
  document.getElementById(id).classList.remove("hidden");
  if (id === "tab-laundry") renderLaundry();
  if (id === "tab-pembayaran") renderPembayaran();
  if (id === "tab-foto") loadFoto();
}

window.openModal = async (kost, room) => {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - ${room}`;

  const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
  currentData = snap.val() || {};
  currentData.laundry = currentData.laundry || [];
  currentData.pembayaran = currentData.pembayaran || [];

  // Isi semua field
  ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan"].forEach(id => {
    document.getElementById(id).value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  const btn = document.getElementById("modalButtons");
  if (currentData.nama) {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-wa" onclick="shareWA()">Share WA</button>
      <button class="btn-success" onclick="openCheckoutModal()">Check-Out</button>
      <button class="btn full" onclick="saveData()">UPDATE DATA</button>`;
  } else {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="saveData()">SIMPAN & CHECK-IN</button>`;
  }

  showTab("tab-data");
  document.getElementById("modal").classList.remove("hidden");
};

// Laundry
window.tambahLaundry = () => {
  const kilo = Number(document.getElementById("kiloLaundry").value);
  const harga = Number(document.getElementById("hargaLaundry").value) || 8000;
  if (!kilo) return alert("Isi kilo!");
  currentData.laundry.push({kilo, harga, total: kilo*harga, tanggal: new Date().toISOString().split("T")[0]});
  renderLaundry();
  document.getElementById("kiloLaundry").value = "";
};
function renderLaundry() {
  const list = document.getElementById("listLaundry");
  const total = currentData.laundry.reduce((a,b)=>a+b.total,0);
  list.innerHTML = currentData.laundry.map((l,i)=>`
    <div class="laundry-item">
      <span>${formatDate(l.tanggal)} — ${l.kilo} kg × Rp ${formatRupiah(l.harga)} = Rp ${formatRupiah(l.total)}</span>
      <button class="btn-danger" style="padding:5px 10px" onclick="currentData.laundry.splice(${i},1);renderLaundry()">X</button>
    </div>`).join("") || "<p>Belum ada tagihan laundry</p>";
  document.getElementById("totalLaundry").textContent = formatRupiah(total);
}

// Pembayaran
window.tambahPembayaran = () => {
  const nominal = prompt("Nominal pembayaran (Rp):");
  const ket = prompt("Keterangan:", "Bayar kost");
  if (nominal) {
    currentData.pembayaran.push({nominal: Number(nominal), keterangan: ket, tanggal: new Date().toISOString().split("T")[0]});
    renderPembayaran();
  }
};
function renderPembayaran() {
  document.getElementById("listPembayaran").innerHTML = currentData.pembayaran.map(p=>`
    <div style="background:#ecfdf5;padding:12px;border-radius:8px;margin:8px 0">
      <strong>Rp ${formatRupiah(p.nominal)}</strong> — ${p.keterangan}<br>
      <small>${formatDate(p.tanggal)}</small>
    </div>`).join("") || "<p>Belum ada pembayaran</p>";
}

// Foto
function loadFoto() {
  if (currentData.fotoKTP) { document.getElementById("previewKTP").src = currentData.fotoKTP; document.getElementById("previewKTP").classList.remove("hidden"); }
  if (currentData.fotoPenghuni) { document.getElementById("previewPenghuni").src = currentData.fotoPenghuni; document.getElementById("previewPenghuni").classList.remove("hidden"); }
}
document.getElementById("fotoKTP").onchange = e => uploadFoto(e.target.files[0], "fotoKTP");
document.getElementById("fotoPenghuni").onchange = e => uploadFoto(e.target.files[0], "fotoPenghuni");
async function uploadFoto(file, field) {
  if (!file) return;
  const ref = storage.ref(`foto/${currentKost}/${currentRoom}/${field}_${Date.now()}.jpg`);
  await ref.put(file);
  const url = await ref.getDownloadURL();
  currentData[field] = url;
  document.getElementById("preview"+field.slice(4)).src = url;
  document.getElementById("preview"+field.slice(4)).classList.remove("hidden");
}

// Save
window.saveData = () => {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    statusPenghuni: document.getElementById("statusPenghuni").value,
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
    laundry: currentData.laundry,
    pembayaran: currentData.pembayaran,
    fotoKTP: currentData.fotoKTP || null,
    fotoPenghuni: currentData.fotoPenghuni || null
  };
  if (!data.nama || !data.hp || !data.tanggalMasuk) return alert("Field wajib diisi!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => { closeModal(); alert("Data tersimpan!"); });
};

// ==================== CHECKOUT ====================
window.openCheckoutModal = () => {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};
window.hitungListrik = () => {
  const akhir = Number(document.getElementById("tokenAkhir").value);
  const awal = currentData.tokenAwal || 0;
  const pakai = awal - akhir;
  document.getElementById("infoListrik").textContent = pakai > 0 ? `Pemakaian ${pakai} kWh → Potong deposit Rp ${(pakai*1452).toLocaleString()}` : "Token akhir lebih besar → tidak ada potongan";
};
window.prosesCheckout = () => {
  const tgl = document.getElementById("tanggalCheckout").value;
  const akhir = Number(document.getElementById("tokenAkhir").value);
  if (!tgl || !akhir) return alert("Isi semua field!");
  const pakai = (currentData.tokenAwal || 0) - akhir;
  const potong = pakai > 0 ? pakai * 1452 : 0;
  const final = {...currentData, checkout: true, tanggalCheckout: tgl, tokenAkhir: akhir, potongListrik: potong};
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(final);
  db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
    closeModal(); alert(`Check-out selesai! Deposit kembali: Rp ${(currentData.deposit - potong).toLocaleString()}`);
  });
};

// ==================== EXPORT & BACKUP ====================
window.exportToExcel = async () => {
  const data = [];
  for (const kost of allowedKosts) {
    const snap = await db.ref(`kosts/${kost}`).once("value");
    const rooms = snap.val() || {};
    Object.keys(rooms).forEach(room => {
      const d = rooms[room];
      if (d.nama) data.push({Kost: kost, Kamar: room, Nama: d.nama, HP: d.hp, Status: d.statusPenghuni || "staying", Durasi: d.durasi, Harga: d.harga});
    });
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Penghuni");
  XLSX.writeFile(wb, `Kostory_${new Date().toISOString().split("T")[0]}.xlsx`);
};

window.backupData = async () => {
  const snap = await db.ref().once("value");
  const data = snap.val();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `backup-full-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
};

// ==================== SHARE WA ====================
window.shareWA = () => {
  const d = currentData;
  const laundryTotal = d.laundry.reduce((a,b)=>a+b.total,0);
  const pesan = `*DATA PENGHUNI*\n${currentKost} - ${currentRoom}\n\n*Nama*: ${d.nama}\n*Status*: ${d.statusPenghuni}\n*HP*: ${d.hp}\n*Durasi*: ${d.durasi}\n*Harga*: Rp ${formatRupiah(d.harga)}\n*Check-in*: ${formatDate(d.tanggalMasuk)}\n*Deposit*: Rp ${formatRupiah(d.deposit)}\n${laundryTotal>0?`*Total Laundry*: Rp ${formatRupiah(laundryTotal)}\n`:""}Team Kostory`;
  open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`);
};

// ==================== LAPOR HARIAN (tetap 100% seperti semula) ====================
window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  const bulanIni = today.getMonth(), tahunIni = today.getFullYear();

  let terisi = 0, kosongList = [], penghuniList = [], mobilList = [], motorList = [], checkInBulanIni = [];

  for (const room of rooms) {
    const snap = await db.ref(`kosts/${namaKost}/${room}`).once("value");
    const d = snap.val();
    if (d && d.nama) {
      terisi++;
      const tglMasuk = new Date(d.tanggalMasuk);
      const lamaHari = Math.floor((today - tglMasuk) / 86400000);
      penghuniList.push({room, nama: d.nama, hp: d.hp || "-", durasi: d.durasi, masuk: tglMasuk.toLocaleDateString("id-ID", {day:"numeric", month:"short", year:"numeric"}), lamaHari});
      if (tglMasuk.getMonth() === bulanIni && tglMasuk.getFullYear() === tahunIni) {
        checkInBulanIni.push(`${room} | ${d.nama} | ${tglMasuk.toLocaleDateString("id-ID",{day:"numeric", month:"long", year:"numeric"})}`);
      }
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else kosongList.push(room);
  }

  penghuniList.sort((a, b) => b.lamaHari - a.lamaHari);
  const tanggalHariIni = today.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
  const okupasi = Math.round((terisi / rooms.length) * 100);

  let pesan = `*Laporan Harian*\n${tanggalHariIni}\n\n*${namaKost}*\nOkupasi = *${okupasi}%* (${terisi}/${rooms.length})\nKamar Kosong: ${kosongList.length} → ${kosongList.join(", ") || "Tidak ada"}\n\n*Daftar Penghuni (Urut Lama Tinggal):*\n`;
  penghuniList.forEach((p, i) => { pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${p.masuk} | ${hitungLamaTinggal(p.tanggalMasuk || d.tanggalMasuk)}\n`; });
  pesan += `\n*Kendaraan:*\nMobil: ${mobilList.length} → ${mobilList.join(", ") || "-"}\nMotor: ${motorList.length} → ${motorList.join(", ") || "-"}\n\n*Check-in Bulan Ini*: ${checkInBulanIni.length} orang\n${checkInBulanIni.length ? checkInBulanIni.join("\n") : "Belum ada"}\n\nTerima kasih! Team Kostory`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

function hitungLamaTinggal(masuk) {
  const diff = Math.floor((new Date() - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun}t ${bulan}b ${hari}h`;
}

// INIT
if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
