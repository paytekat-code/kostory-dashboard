// ================= FIREBASE CONFIG =================
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

// ================= VALIDASI USER =================
const currentUser = localStorage.getItem("kostoryUser");
const aksesKost = hakAkses[currentUser];

if (!currentUser || !aksesKost) {
  alert("Session tidak valid, silakan login ulang");
  window.location.href = "index.html";
}

// ================= LOAD KOMPLAIN =================
window.onload = loadKomplain;

async function loadKomplain() {
  const container = document.getElementById("listKomplain");
  container.innerHTML = "";

  let snap;
  let data;

  if (aksesKost === "all") {
    snap = await db.ref("komplain").once("value");
    data = snap.val() || {};
  } else {
    snap = await db.ref(`komplain/${aksesKost}`).once("value");
    data = {};
    data[aksesKost] = snap.val() || {};
  }

  let list = [];

  Object.keys(data).forEach(kost => {
    const dataKost = data[kost] || {};
    Object.keys(dataKost).forEach(room => {
      Object.values(dataKost[room]).forEach(k => {
        list.push(k);
      });
    });
  });

  if (list.length === 0) {
    container.innerHTML = "<p>Tidak ada komplain.</p>";
    return;
  }

  list.sort((a,b)=> new Date(b.tanggalBuat) - new Date(a.tanggalBuat));

  container.innerHTML = list.map(k => `
    <div class="card">
      <div>
        <strong>${k.namaPenghuni}</strong><br>
        <small>${k.kost} - Kamar ${k.room}</small><br>
        <small>${k.kategori}</small><br>
        <small>${k.deskripsi}</small><br>
        <small>Status: 
          <span class="status-${k.status}">${k.status.toUpperCase()}</span>
        </small>
      </div>
      <div>
        ${k.status !== 'selesai'
          ? `<button class="btn btn-done"
              onclick="updateStatus('${k.kost}','${k.room}','${k.id}','selesai')">
              Selesai
            </button>`
          : ''}
      </div>
    </div>
  `).join("");
}

// ================= TAMBAH KOMPLAIN =================
function tambahKomplain() {
  const nama = prompt("Nama Penghuni:");
  const room = prompt("No Kamar:");
  const kategori = prompt("Kategori (Air / Listrik / AC / dll):");
  const deskripsi = prompt("Deskripsi komplain:");

  if (!nama || !room || !deskripsi) {
    alert("Data belum lengkap");
    return;
  }

  const kost = aksesKost === "all"
    ? prompt("Nama Kost:")
    : aksesKost;

  if (!kost) return;

  const id = Date.now().toString();

  db.ref(`komplain/${kost}/${room}/${id}`).set({
    id,
    namaPenghuni: nama,
    kost,
    room,
    kategori,
    deskripsi,
    status: "open",
    tanggalBuat: new Date().toISOString(),
    tanggalUpdate: new Date().toISOString()
  }).then(() => {
    alert("Komplain berhasil ditambahkan");
    loadKomplain();
  });
}

// ================= UPDATE STATUS =================
function updateStatus(kost, room, id, status) {
  db.ref(`komplain/${kost}/${room}/${id}`).update({
    status,
    tanggalUpdate: new Date().toISOString()
  }).then(loadKomplain);
}

// ================= NAVIGASI =================
function kembali() {
  window.location.href = "index.html";
}
