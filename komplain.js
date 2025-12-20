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

// ================= MODAL =================
function openModal() {
  document.getElementById("komplainModal").style.display = "flex";
}
function closeModal() {
  document.getElementById("komplainModal").style.display = "none";
}

// ================= LOAD LIST =================
window.onload = loadKomplain;

async function loadKomplain() {
  const listEl = document.getElementById("listKomplain");
  listEl.innerHTML = "";

  let snap, data = {};

  if (aksesKost === "all") {
    snap = await db.ref("komplain").once("value");
    data = snap.val() || {};
  } else {
    snap = await db.ref(`komplain/${aksesKost}`).once("value");
    data[aksesKost] = snap.val() || {};
  }

  let list = [];

  Object.keys(data).forEach(kost => {
    Object.keys(data[kost] || {}).forEach(room => {
      Object.values(data[kost][room]).forEach(k => list.push(k));
    });
  });

  if (list.length === 0) {
    listEl.innerHTML = "<em>Belum ada komplain</em>";
    return;
  }

  list.sort((a,b)=> new Date(b.tanggalBuat) - new Date(a.tanggalBuat));

  listEl.innerHTML = list.map(k => `
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
        ? `<button class="btn btn-done"
            onclick="updateStatus('${k.kost}','${k.room}','${k.id}')">
            Tandai Selesai
          </button>`
        : ""}
    </div>
  `).join("");
}

// ================= SIMPAN =================
function simpanKomplain() {
  const nama = document.getElementById("nama").value.trim();
  const room = document.getElementById("room").value.trim();
  const kategori = Array.from(
  document.querySelectorAll('input[name="kategori"]:checked')
).map(el => el.value).join(", ");
if (!kategori) {
  alert("Pilih minimal 1 kategori komplain");
  return;
}

  const deskripsi = document.getElementById("deskripsi").value.trim();

  if (!nama || !room || !deskripsi) {
    alert("Lengkapi data");
    return;
  }

  const kost = aksesKost === "all" ? prompt("Nama Kost:") : aksesKost;
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
    tanggalBuat: new Date().toISOString()
  }).then(() => {
    closeModal();
    loadKomplain();
  });
}

// ================= UPDATE =================
function updateStatus(kost, room, id) {
  db.ref(`komplain/${kost}/${room}/${id}`).update({
    status: "selesai"
  }).then(loadKomplain);
}

// ================= NAV =================
function kembali() {
  location.href = "index.html";
}
