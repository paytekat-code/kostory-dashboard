// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyAhN2a4m6PkTwFOvJ88TreD1lCERYJD7m0",
  authDomain: "kostory-db.firebaseapp.com",
  databaseURL: "https://kostory-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kostory-db"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ================= HAK AKSES =================
const hakAkses = {
  admin: "all",
  mekar: "Kostory Mekar",
  satria: "Kostory Satria",
  mitra: "Kostory Mitra",
  ecokost: "Ecokost by Kostory",
  mitraya: "Mitraya by Kostory",
  inaya: "Inaya Bukit by Kostory"
};

const user = localStorage.getItem("kostoryUser");
const aksesKost = hakAkses[user];

if (!user || !aksesKost) {
  alert("Session habis, login ulang");
  location.href = "index.html";
}

// ================= DATA PENGHUNI =================
let dataPenghuni = [];

// ================= LOAD PENGHUNI SESUAI AKSES =================
async function loadPenghuniUntukKomplain() {
  dataPenghuni = [];

  if (aksesKost === "all") {
    const snap = await db.ref("kosts").once("value");
    const all = snap.val() || {};
    Object.keys(all).forEach(kost => {
      Object.keys(all[kost]).forEach(room => {
        const d = all[kost][room];
        if (d && d.nama) {
          dataPenghuni.push({ kost, room, nama: d.nama });
        }
      });
    });
  } else {
    const snap = await db.ref(`kosts/${aksesKost}`).once("value");
    const data = snap.val() || {};
    Object.keys(data).forEach(room => {
      const d = data[room];
      if (d && d.nama) {
        dataPenghuni.push({ kost: aksesKost, room, nama: d.nama });
      }
    });
  }
}

// ================= SEARCH KAMAR =================
function cariKamar() {
  const keyword = document.getElementById("room").value.trim();
  const hasilEl = document.getElementById("hasilKamar");

  document.getElementById("nama").value = "";
  document.getElementById("kost").value = "";

  if (!keyword) {
    hasilEl.innerHTML = "";
    return;
  }

  const hasil = dataPenghuni.filter(p => p.room.includes(keyword));

  if (hasil.length === 0) {
    hasilEl.innerHTML = "<small style='padding:8px;display:block'>Tidak ditemukan</small>";
    return;
  }

  hasilEl.innerHTML = hasil.map(p => `
    <div onclick="pilihKamar('${p.room}','${p.nama}','${p.kost}')">
      ${p.kost} - Kamar ${p.room} (${p.nama})
    </div>
  `).join("");
}

function pilihKamar(room, nama, kost) {
  document.getElementById("room").value = room;
  document.getElementById("nama").value = nama;
  document.getElementById("kost").value = kost;
  document.getElementById("hasilKamar").innerHTML = "";
}

// ================= SIMPAN =================
function simpanKomplain() {
  const room = document.getElementById("room").value.trim();
  const nama = document.getElementById("nama").value.trim();
  const kost = document.getElementById("kost").value.trim();
  const deskripsi = document.getElementById("deskripsi").value.trim();

  const kategori = Array.from(
    document.querySelectorAll('input[name="kategori"]:checked')
  ).map(el => el.value).join(", ");

  if (!room || !nama || !kost) {
    alert("Pilih kamar terlebih dahulu");
    return;
  }

  if (!kategori) {
    alert("Pilih minimal 1 kategori");
    return;
  }

  if (!deskripsi) {
    alert("Isi deskripsi komplain");
    return;
  }

  const id = Date.now().toString();

  db.ref(`komplain/${kost}/${room}/${id}`).set({
    id,
    kost,
    room,
    namaPenghuni: nama,
    kategori,
    deskripsi,
    status: "open",
    tanggalBuat: new Date().toISOString()
  }).then(() => {
    alert("Komplain tersimpan");
    document.getElementById("deskripsi").value = "";
    document.querySelectorAll('input[name="kategori"]').forEach(c => c.checked = false);
    loadKomplain();
  });
}

// ================= LOAD LIST =================
async function loadKomplain() {
  const el = document.getElementById("listKomplain");
  el.innerHTML = "<em>Memuat data...</em>";

  let data = {};

  if (aksesKost === "all") {
    const snap = await db.ref("komplain").once("value");
    data = snap.val() || {};
  } else {
    const snap = await db.ref(`komplain/${aksesKost}`).once("value");
    data[aksesKost] = snap.val() || {};
  }

  let list = [];

  Object.keys(data).forEach(kost => {
    Object.keys(data[kost] || {}).forEach(room => {
      Object.values(data[kost][room]).forEach(k => list.push(k));
    });
  });

  if (list.length === 0) {
    el.innerHTML = "<em>Belum ada komplain</em>";
    return;
  }

  list.sort((a,b)=> new Date(b.tanggalBuat) - new Date(a.tanggalBuat));

  el.innerHTML = list.map(k => `
    <div class="card">
      <div class="meta">
        <strong>${k.namaPenghuni}</strong>
        <small>${k.kost} • Kamar ${k.room}</small>
        <small>${k.kategori}</small>
        <small>${k.deskripsi}</small>
        <small>Status:
          <span class="status-${k.status}">${k.status}</span>
        </small>
      </div>
      ${k.status !== "selesai"
        ? `<button class="btn btn-done" onclick="selesaikan('${k.kost}','${k.room}','${k.id}')">Selesai</button>`
        : ""}
    </div>
  `).join("");
}

function selesaikan(kost, room, id) {
  db.ref(`komplain/${kost}/${room}/${id}`).update({
    status: "selesai"
  }).then(loadKomplain);
}

// ================= NAV =================
function kembali() {
  location.href = "index.html";
}

// ================= INIT =================
window.onload = async () => {
  await loadPenghuniUntukKomplain();
  loadKomplain();
};
