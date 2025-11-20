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

const hakAkses = { "admin": "all", "mekar": "Kostory Mekar", "satria": "Kostory Satria", "mitra": "Kostory Mitra", "ecokost": "Ecokost by Kostory", "mitraya": "Mitraya by Kostory", "inaya": "Inaya Bukit by Kostory" };
const passwordDb = { "admin": "kostory123", "mekar": "mekar123", "satria": "satria123", "mitra": "mitra123", "ecokost": "ecokost123", "mitraya": "mitraya123", "inaya": "inaya123" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

function login() {
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
}

function logout() {
  currentUser = null; allowedKosts = []; currentKost = null; currentRoom = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
}

function loadDashboard() {
  const kostList = document.getElementById("kostList"); kostList.innerHTML = "";
  document.getElementById("totalStats").innerHTML = "Memuat data...";

  let totalRooms = 0, totalOccupied = 0;

  Object.keys(kosts).forEach(kostName => {
    if (!allowedKosts.includes(kostName)) return;
    const rooms = kosts[kostName]; totalRooms += rooms.length;

    const card = document.createElement("div"); card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3>${kostName}</h3>
        <button onclick="laporKost('${kostName}')" style="background:#25d366;color:white;padding:8px 15px;border:none;border-radius:8px;font-weight:bold;cursor:pointer;font-size:14px">LAPOR</button>
      </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${rooms.length}</div>
      <div class="room-grid"></div>`;
    kostList.appendChild(card);

    const grid = card.querySelector(".room-grid");
    const occSpan = card.querySelector(".occ");
    let occupied = 0;

    rooms.forEach(room => {
      const roomEl = document.createElement("div");
      roomEl.className = "room kosong";
      roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
      roomEl.onclick = () => openModal(kostName, room);
      grid.appendChild(roomEl);

      const ref = db.ref(`kosts/${kostName}/${room}`);
      ref.on("value", snap => {
        const d = snap.val();

        if (!d || !d.nama) {
          roomEl.className = "room kosong";
          roomEl.innerHTML = `${room}<br><small>KOSONG</small>`;
        } else {
          occupied++; totalOccupied++;

          const icon = d.jenis === "Pria" ? "Male" :
                      d.jenis === "Wanita" ? "Female" :
                      d.jenis === "Suami-Istri" ? "Couple" : "Family";

          let durasiClass = "bulanan";
          if (d.durasi === "Harian") durasiClass = "harian";
          else if (d.durasi === "Mingguan") durasiClass = "mingguan";
          else if (d.durasi === "Tahunan") durasiClass = "tahunan";

          roomEl.className = `room ${durasiClass}`;
          roomEl.innerHTML = `${room}<br><strong>${icon} ${d.nama}</strong>`;
        }

        occSpan.textContent = occupied;
        document.getElementById("totalStats").innerHTML = `TOTAL: ${totalOccupied} terisi / ${totalRooms} kamar → <b>${totalRooms - totalOccupied} KOSONG</b>`;
      });
    });
  });
}

function openModal(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = `${kost} - Kamar ${room}`;

  db.ref(`kosts/${kost}/${room}`).once("value").then(snap => {
    currentData = snap.val() || {};
    
    document.getElementById("nama").value = currentData.nama || "";
    document.getElementById("hp").value = currentData.hp || "";
    document.getElementById("jenis").value = currentData.jenis || "Pria";
    document.getElementById("durasi").value = currentData.durasi || "Bulanan";
    document.getElementById("kendaraan").value = currentData.kendaraan || "Umum";
    document.getElementById("alamatktp").value = currentData.alamatktp || "";
    document.getElementById("perusahaan").value = currentData.perusahaan || "";
    document.getElementById("harga").value = currentData.harga || "";
    document.getElementById("deposit").value = currentData.deposit || "";
    document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
    document.getElementById("tokenAwal").value = currentData.tokenAwal || "";
    document.getElementById("namaKeluarga").value = currentData.namaKeluarga || "";
    document.getElementById("statusKeluarga").value = currentData.statusKeluarga || "Orangtua";
    document.getElementById("telpKeluarga").value = currentData.telpKeluarga || "";
    document.getElementById("catatan").value = currentData.catatan || "";

    const btn = document.querySelector(".modal-buttons");
    if (currentData.nama) {
      btn.innerHTML = `
        <button style="background:#dc2626" onclick="openCheckoutModal()">CHECK OUT</button>
        <button style="background:#16a34a" onclick="saveAndAskShare()">UPDATE & SHARE?</button>
        <button style="background:#ec4899" onclick="openTagih()">TAGIH</button>
        <button style="background:#64748b" onclick="closeModal()">BATAL</button>`;
    } else {
      btn.innerHTML = `
        <button class="full" style="background:#16a34a" onclick="saveAndAskShare()">CHECK IN & SHARE?</button>
        <button style="background:#64748b" onclick="closeModal()">BATAL</button>`;
    }

    document.getElementById("modal").classList.remove("hidden");
  });
}

function closeModal() { document.getElementById("modal").classList.add("hidden"); }

function saveAndAskShare() {
  const required = ["nama","hp","harga","tokenAwal","namaKeluarga","telpKeluarga"];
  for (let id of required) {
    if (!document.getElementById(id).value.trim()) {
      alert(`Kolom "${document.querySelector(`label[for="${id}"]`)?.textContent || id}" wajib diisi!`);
      return;
    }
  }

  const data = {
    status: "occupied",
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    alamatktp: document.getElementById("alamatktp").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
    harga: parseInt(document.getElementById("harga").value),
    deposit: document.getElementById("deposit").value ? parseInt(document.getElementById("deposit").value) : 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: parseInt(document.getElementById("tokenAwal").value),
    namaKeluarga: document.getElementById("namaKeluarga").value.trim(),
    statusKeluarga: document.getElementById("statusKeluarga").value,
    telpKeluarga: document.getElementById("telpKeluarga").value.trim(),
    catatan: document.getElementById("catatan").value.trim()
  };

  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal();
    if (confirm("Data berhasil disimpan!\n\nIngin share ke WhatsApp sekarang?")) sharePenghuni(data);
    else alert("Tersimpan!");
  });
}

function sharePenghuni(d) {
  const pesan = `*DATA PENGHUNI BARU/UPDATE*%0A%0AKost: *${currentKost}* | Kamar: *${currentRoom}*%0A` +
    `Nama: *${d.nama}* | HP: ${d.hp}%0A` +
    `Jenis: ${d.jenis} | Durasi: ${d.durasi}%0A` +
    `Deposit: Rp ${Number(d.deposit||0).toLocaleString()}%0A` +
    `Token PLN Awal: ${d.tokenAwal}%0A` +
    `Keluarga: ${d.namaKeluarga} (${d.statusKeluarga}) - ${d.telpKeluarga}%0A%0A` +
    `Salam Kostorian!`;
  window.open(`https://wa.me/?text=${pesan}`, "_blank");
}

function openCheckoutModal() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
}

function prosesCheckout(share = false) {
  const tglOut = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = document.getElementById("tokenAkhir").value;
  const noRek = document.getElementById("noRek").value.trim();
  const namaBank = document.getElementById("namaBank").value.trim();
  const namaRek = document.getElementById("namaRekening").value.trim();

  if (!tglOut || !tokenAkhir || !noRek || !namaBank || !namaRek) {
    alert("Semua kolom check-out wajib diisi!");
    return;
  }

  const tglIn = new Date(currentData.tanggalMasuk);
  const tglOutDate = new Date(tglOut);
  const diffTime = Math.abs(tglOutDate - tglIn);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  const selisihToken = tokenAkhir - currentData.tokenAwal;

  db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
    document.getElementById("checkoutModal").classList.add("hidden");
    alert("Check-out berhasil!");

    if (share) {
      const pesan = `*INFORMASI CHECK-OUT*%0A%0A` +
        `Kost: *${currentKost}* | Kamar: *${currentRoom}*%0A` +
        `Nama: *${currentData.nama}*%0A` +
        `Deposit: *Rp ${Number(currentData.deposit||0).toLocaleString()}*%0A%0A` +
        `Check-in: *${currentData.tanggalMasuk}*%0A` +
        `Check-out: *${tglOut}*%0A` +
        `Durasi: *${years} Tahun ${months} Bulan ${days} Hari*%0A%0A` +
        `Token Awal: *${currentData.tokenAwal}* | Token Akhir: *${tokenAkhir}* | Selisih: *${selisihToken}*%0A%0A` +
        `Pengembalian ke:%0A${noRek} - ${namaBank} a.n ${namaRek}%0A%0A` +
        `Terima kasih telah tinggal di Kostory!`;
      window.open(`https://wa.me/?text=${pesan}`, "_blank");
    }
  });
}

function openTagih() {
  document.getElementById("tagihNama").textContent = currentData.nama;
  document.getElementById("tagihJumlah").value = currentData.harga || "";
  const next = new Date(); next.setMonth(next.getMonth() + 1);
  document.getElementById("tagihTanggal").value = next.toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
}

function kirimTagihan() {
  const nama = currentData.nama;
  const hp = currentData.hp.replace(/^0/, "62");
  const tanggal = document.getElementById("tagihTanggal").value;
  const jumlah = document.getElementById("tagihJumlah").value;
  if (!tanggal || !jumlah) return alert("Isi tanggal dan jumlah!");

  const pesan = `Halo kak ${nama}!\n\nKost akan berakhir tanggal *${new Date(tanggal).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}*. Mohon lunasi Rp ${Number(jumlah).toLocaleString()} maksimal H-1. Abaikan jika sudah bayar.\n\nSalam Kostorian!`;
  window.open(`https://wa.me/${hp}?text=${encodeURIComponent(pesan)}`, "_blank");
  document.getElementById("tagihModal").classList.add("hidden");
}

async function laporKost(kostName) {
  const snapshot = await db.ref(`kosts/${kostName}`).once("value");
  const data = snapshot.val() || {};
  const kosong = []; const penghuni = []; let mobil = 0, motor = 0;

  kosts[kostName].forEach(room => {
    const d = data[room];
    if (!d || !d.nama) kosong.push(room);
    else {
      penghuni.push({room, ...d});
      if (d.kendaraan === "Mobil") mobil++;
      if (d.kendaraan === "Motor") motor++;
    }
  });

  const terisi = penghuni.length;
  const okupasi = Math.round((terisi/kosts[kostName].length)*100);

  let pesan = `*LAPORAN ${kostName}*%0A%0AOkupasi: *${okupasi}%* (${terisi}/${kosts[kostName].length})%0A` +
    `Kosong: *${kosong.length}* → ${kosong.join(", ") || "Tidak ada"}%0A%0A` +
    `*Kendaraan*%0AMobil: *${mobil}* | Motor: *${motor}*`;

  window.open(`https://wa.me/?text=${pesan}`, "_blank");
}