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
  alert("Session habis, silakan login ulang");
  location.href = "index.html";
}

// ================= STATE =================
let dataPenghuni = [];

// ================= MODAL =================
window.openModal = function () {
  document.getElementById("komplainModal").style.display = "flex";
};

window.closeModal = function () {
  document.getElementById("komplainModal").style.display = "none";
};

// ================= LOAD PENGHUNI =================
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
function cariNama() {
  const keyword = document.getElementById("searchNama").value.trim().toLowerCase();
  const hasilEl = document.getElementById("hasilNama");

  document.getElementById("room").value = "";
  document.getElementById("kost").value = "";

  if (!keyword) {
    hasilEl.innerHTML = "";
    return;
  }

  const hasil = dataPenghuni.filter(p =>
    p.nama.toLowerCase().includes(keyword)
  );

  if (hasil.length === 0) {
    hasilEl.innerHTML = "<small>Tidak ditemukan</small>";
    return;
  }

  hasilEl.innerHTML = hasil.map(p => `
    <div onclick="pilihNama('${p.nama}','${p.room}','${p.kost}')">
      ${p.nama} — ${p.kost} (Kamar ${p.room})
    </div>
  `).join("");
}

function pilihNama(nama, room, kost) {
  document.getElementById("searchNama").value = nama;
  document.getElementById("room").value = room;
  document.getElementById("kost").value = kost;
  document.getElementById("hasilNama").innerHTML = "";
}

// ================= SIMPAN KOMPLAIN =================
window.simpanKomplain = function () {
  const room = document.getElementById("room").value.trim();
  const nama = document.getElementById("searchNama").value.trim();
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

  dibuatOleh: user,
  dibuatPada: new Date().toISOString(),

  komentar: {}

  
  }).then(() => {
    closeModal();
    document.getElementById("deskripsi").value = "";
    document.querySelectorAll('input[name="kategori"]').forEach(c => c.checked = false);
    loadKomplain();
  });
}

// ================= LOAD & SORT LIST =================
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

  // 🔥 SORT: OPEN dulu, lalu paling lama di atas
  list.sort((a, b) => {
  if (a.status === "open" && b.status !== "open") return -1;
  if (a.status !== "open" && b.status === "open") return 1;
  return new Date(a.dibuatPada) - new Date(b.dibuatPada);
  });

  el.innerHTML = list.map(k => `
    <div class="item">
      <div>
        <strong>
          ${new Date(k.dibuatPada || k.tanggalBuat).toLocaleString("id-ID")}
          | ${k.room} | ${k.namaPenghuni}
        </strong>

        <small>${k.kategori} | ${k.deskripsi}</small>
<br>
<small style="color:#64748b">
  Ditulis oleh: ${k.dibuatOleh || "-"}
</small>

${k.komentar ? `
  <div style="margin-top:10px;padding-left:12px;border-left:3px solid #f59e0b">
    ${Object.values(k.komentar).map(c => `
      <div style="margin-bottom:8px">
        <small style="color:#6b7280">
          ${new Date(c.waktu).toLocaleString("id-ID")} — ${c.oleh}
        </small><br>
        ${c.teks}
      </div>
    `).join("")}
  </div>
` : ""}


      </div>

      ${k.status === "open"
  ? `
    <button class="btn btn-progress"
  onclick="openKomentar('${k.kost}','${k.room}','${k.id}')">
  Progres
</button>
    <button class="btn btn-done"
      onclick="selesaikan('${k.kost}','${k.room}','${k.id}')">
      Selesai
    </button>
  `
  : `<span class="status-selesai">Selesai</span>`
}
    </div>
  `).join("");
}

// ================= SELESAIKAN =================
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
window.openKomentar = function(kost, room, id) {
  const teks = prompt("Isi komentar progres:");

  if (!teks || teks.trim() === "") {
    alert("Komentar wajib diisi!");
    return;
  }

  const waktu = new Date().toISOString();
  const kid = Date.now().toString();

  db.ref(`komplain/${kost}/${room}/${id}/komentar/${kid}`).set({
    teks: teks.trim(),
    oleh: user,
    waktu
  }).then(() => {
    alert("Komentar tersimpan");
    loadKomplain();
  });
};
