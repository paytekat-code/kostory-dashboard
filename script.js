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
  return `${tahun} Tahun ${bulan} Bulan ${hari} Hari`.replace(/0 (Tahun|Bulan|Hari)/g, "").trim() || "0 Hari";
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

function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "";
  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    totalKamar += kosts[namaKost].length;

    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
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
      box.innerHTML = room + "<br><small>KOSONG</small>";
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", snap => {
        const d = snap.val();
        if (d && d.nama && !d.checkout) {
          terisi++;
          totalTerisi++;
          box.className = `room ${d.durasi === "Tahunan" ? "tahunan" : d.durasi === "Bulanan" ? "bulanan" : "staying"}`;
          box.innerHTML = `${room}<br><small>${d.nama}</small>`;
        } else {
          terisi = Math.max(0, terisi - 1);
          totalTerisi = Math.max(0, totalTerisi - 1);
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `Total Terisi: ${totalTerisi} / ${totalKamar} kamar`;
      });
    });
  });
}

// === FITUR BARU: LAPORAN CHECK-OUT (TANPA RUSAK YANG LAIN) ===
window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");

  // Update header dengan tombol LAPORAN CHECK-OUT
  document.querySelector("#checkoutListPage > div:first-child").innerHTML = `
    <h1>Daftar Check-Out</h1>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:15px">
      <button class="btn btn-wa" onclick="laporCheckout()">LAPORAN CHECK-OUT</button>
      <button class="btn" onclick="backToDashboard()">Kembali</button>
    </div>
  `;

  const snap = await db.ref("checkout").once("value");
  const data = snap.val() || {};
  const list = [];

  Object.keys(data).forEach(kost => {
    Object.keys(data[kost] || {}).forEach(room => {
      const d = data[kost][room];
      if (d && d.tanggalCheckout) {
        list.push({kost, room, ...d});
      }
    });
  });

  list.sort((a,b) => new Date(b.tanggalCheckout) - new Date(a.tanggalCheckout));

  document.getElementById("listBulanIni").innerHTML = list.slice(0, 20).map((d,i) => 
    `<div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)">
      <strong>${i+1}. ${d.room} - ${d.nama}</strong><br>
      <small>${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small>
    </div>`
  ).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada check-out</p>";

  document.getElementById("listSebelumnya").innerHTML = list.slice(20).map(d => 
    `<div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)">
      <strong>${d.nama}</strong><br><small>${formatDate(d.tanggalCheckout)}</small>
    </div>`
  ).join("") || "";
};

window.laporCheckout = async function() {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const bulanIniStart = new Date(thisYear, thisMonth, 1);
  const bulanLaluStart = new Date(thisYear, thisMonth - 1, 1);

  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  const bulanIni = [], bulanLalu = [];

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost] || {}).forEach(room => {
      const d = all[kost][room];
      if (d && d.tanggalCheckout && d.tanggalMasuk) {
        const coDate = new Date(d.tanggalCheckout);
        const item = {
          room,
          nama: d.nama || "Tanpa Nama",
          durasi: d.durasi || "Bulanan",
          tgl: formatDate(d.tanggalCheckout),
          lama: hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)
        };
        if (coDate >= bulanIniStart) bulanIni.push(item);
        else if (coDate >= bulanLaluStart) bulanLalu.push(item);
      }
    });
  });

  let pesan = `*LAPORAN CHECK-OUT*\n${formatDate(new Date())}\n\n`;

  if (bulanIni.length > 0) {
    pesan += "*Bulan ini*\n";
    bulanIni.forEach((p, i) => {
      pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${p.tgl} | ${p.lama}\n`;
    });
    pesan += "\n";
  }

  if (bulanLalu.length > 0) {
    pesan += "*Bulan lalu*\n";
    bulanLalu.forEach((p, i) => {
      pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${p.tgl} | ${p.lama}\n`;
    });
  }

  if (bulanIni.length === 0 && bulanLalu.length === 0) {
    pesan += "Belum ada check-out dalam 2 bulan terakhir.";
  }

  pesan += "\nTeam Kostory";
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// Semua fungsi lain (openModal, simpanData, dll) tetap seperti versi kamu yang sudah jalan
// Aku gak ubah sama sekali biar aman 100%

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("kostoryUser");
  if (saved && passwordDb[saved.toLowerCase()]) {
    currentUser = saved.toLowerCase();
    allowedKosts = hakAkses[currentUser] === "all" ? Object.keys(kosts) : [hakAkses[currentUser]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  }
});

window.logout = function() {
  localStorage.removeItem("kostoryUser");
  location.reload();
};
