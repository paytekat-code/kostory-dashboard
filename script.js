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
  if (isNaN(date)) return "-";
  const hari = date.getDate();
  const bulan = date.toLocaleDateString("id-ID", { month: "short" }).replace(".", "");
  const tahun = date.getFullYear().toString().slice(-2);
  return `${hari} ${bulan} ${tahun}`;
}

function hitungLamaTinggal(masuk, keluar = new Date()) {
  if (!masuk) return "-";
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun} tahun ${bulan} bulan ${hari} hari`;
}

function hariKeUlangTahun(tglLahir) {
  if (!tglLahir) return 9999;
  const lahir = new Date(tglLahir);
  if (isNaN(lahir)) return 9999;
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function isHariIniUlangTahun(tglLahir) {
  if (!tglLahir) return false;
  const lahir = new Date(tglLahir);
  if (isNaN(lahir)) return false;
  const today = new Date();
  return lahir.getDate() === today.getDate() && lahir.getMonth() === today.getMonth();
}

function closeModal() { 
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); 
}

function backToDashboard() {
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// === LOGIN ===
window.login = function() {
  const user = document.getElementById("username")?.value.trim().toLowerCase();
  const pass = document.getElementById("password")?.value;
  if (!user || !pass) return alert("Isi username dan password!");
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    localStorage.setItem("kostoryUser", user);
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
    loadDashboard();
  } else {
    alert("Username/password salah!");
  }
};

// === DASHBOARD ===
function loadDashboard() {
  const container = document.getElementById("kostList");
  if (!container) return alert("Error: Elemen kostList tidak ditemukan!");
  container.innerHTML = "<div style='text-align:center;padding:80px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  let totalKamar = 0, totalTerisi = 0;

  container.innerHTML = "";

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    totalKamar += kosts[namaKost].length;

    const card = document.createElement("div"); 
    card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px">
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
          if (box.classList.contains("kosong")) terisi++;
          if (!occ.textContent.includes(terisi + "")) totalTerisi++;
          box.className = `room ${d.statusPenghuni || "staying"}`;
          box.innerHTML = `${room}<br><small>${d.nama}</small>`;
        } else {
          if (!box.classList.contains("kosong")) terisi = Math.max(terisi - 1, 0);
          if (!box.classList.contains("kosong")) totalTerisi = Math.max(totalTerisi - 1, 0);
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `Total Terisi: ${totalTerisi} / ${totalKamar} (${Math.round(totalTerisi/totalKamar*100)}%)`;
      });
    });
  });
}

// === MODAL UTAMA (DIPERBAIKI ANTI-BLANK) ===
window.openModal = async function(kost, room, fromCheckout = false) {
  currentKost = kost; 
  currentRoom = room;
  const modal = document.getElementById("modal");
  const modalTitle = document.getElementById("modalTitle");
  if (!modal || !modalTitle) {
    console.error("Error: Elemen modal/modalTitle tidak ditemukan!");
    return alert("Error: Modal tidak ditemukan. Cek HTML!");
  }

  modalTitle.textContent = fromCheckout ? `Detail Check-Out: ${kost} - ${room}` : `${kost} - ${room}`;
  const path = fromCheckout ? `checkout/${kost}/${room}` : `kosts/${kost}/${room}`;
  
  try {
    const snap = await db.ref(path).once("value");
    currentData = snap.val() || {};
  } catch (err) {
    console.error("Error fetching data:", err);
    return alert("Error mengambil data dari Firebase!");
  }

  const fields = [
    "nama", "hp", "tanggalLahir", "alamat", "perusahaan", "jenis", "durasi", 
    "kendaraan", "harga", "deposit", "tokenAwal", "noRek", "namaBank", 
    "namaRekening", "catatan", "namaKeluarga", "hubunganKeluarga", "hpKeluarga"
  ];

  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = currentData[id] || "";
    } else {
      console.warn(`Peringatan: Elemen dengan ID ${id} tidak ditemukan di modal!`);
    }
  });

  const tanggalEl = document.getElementById("tanggal");
  const statusPenghuniEl = document.getElementById("statusPenghuni");
  if (tanggalEl) tanggalEl.value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
  if (statusPenghuniEl) statusPenghuniEl.value = currentData.statusPenghuni || "staying";

  const checkoutFields = ["tokenAkhirCheckout", "selisihToken"];
  checkoutFields.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.parentElement) {
      el.parentElement.style.display = fromCheckout ? "block" : "none";
    }
  });

  const infoSelisih = document.getElementById("infoSelisih");
  if (infoSelisih) infoSelisih.style.display = fromCheckout ? "block" : "none";

  if (fromCheckout && currentData.tokenAkhir) {
    const tokenAkhirEl = document.getElementById("tokenAkhirCheckout");
    if (tokenAkhirEl) {
      tokenAkhirEl.value = currentData.tokenAkhir;
      hitungSelisihToken();
    }
  }

  const btns = document.getElementById("modalButtons");
  if (!btns) {
    console.error("Error: Elemen modalButtons tidak ditemukan!");
    return alert("Error: Tombol modal tidak ditemukan!");
  }
  btns.innerHTML = "";
  if (!fromCheckout) {
    if (currentData.nama) {
      btns.innerHTML = `
        <button class="btn-success" onclick="updateDataOnly()">UPDATE DATA</button>
        <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
        <button class="btn-danger full" onclick="openCheckoutModal()">CHECK-OUT</button>
        <button class="btn-secondary full" onclick="closeModal()">TUTUP</button>`;
    } else {
      btns.innerHTML = `
        <button class="btn-success full" onclick="simpanData()">SIMPAN</button>
        <button class="btn-danger full" onclick="closeModal()">Batal</button>`;
    }
  } else {
    btns.innerHTML = `
      <button class="btn-success" onclick="updateDataOnly(true)">UPDATE DATA</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
      <button class="btn-secondary full" onclick="closeModal()">TUTUP</button>`;
  }

  modal.classList.remove("hidden");
};

// === HITUNG SELISIH TOKEN ===
window.hitungSelisihToken = function() {
  const awalEl = document.getElementById("tokenAwal");
  const akhirEl = document.getElementById("tokenAkhirCheckout");
  const selisihEl = document.getElementById("selisihToken");
  const infoSelisihEl = document.getElementById("infoSelisih");

  if (!awalEl || !akhirEl || !selisihEl || !infoSelisihEl) {
    console.error("Error: Elemen token tidak ditemukan!");
    return;
  }

  const awal = Number(awalEl.value) || 0;
  const akhir = Number(akhirEl.value) || 0;
  const selisih = akhir - awal;
  selisihEl.value = selisih;
  infoSelisihEl.textContent = selisih < 0 ? "Selisih negatif, cek input!" : "";
};

// === SIMPAN & UPDATE DATA ===
window.simpanData = function() {
  const nama = document.getElementById("nama")?.value.trim();
  const hp = document.getElementById("hp")?.value.trim();
  if (!nama || !hp) return alert("Nama dan HP wajib diisi!");
  const data = updateDataOnly();
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal(); 
    alert("Data tersimpan!");
  }).catch(err => alert("Error: " + err.message));
};

window.updateDataOnly = function(isFromCheckout = false) {
  const data = {
    nama: document.getElementById("nama")?.value.trim() || "",
    hp: document.getElementById("hp")?.value.trim() || "",
    statusPenghuni: document.getElementById("statusPenghuni")?.value || "staying",
    tanggalLahir: document.getElementById("tanggalLahir")?.value || null,
    alamat: document.getElementById("alamat")?.value.trim() || "",
    perusahaan: document.getElementById("perusahaan")?.value.trim() || "",
    jenis: document.getElementById("jenis")?.value || "",
    durasi: document.getElementById("durasi")?.value || "",
    kendaraan: document.getElementById("kendaraan")?.value || "",
    harga: Number(document.getElementById("harga")?.value) || 0,
    deposit: Number(document.getElementById("deposit")?.value) || 0,
    tanggalMasuk: document.getElementById("tanggal")?.value || new Date().toISOString().split("T")[0],
    tokenAwal: Number(document.getElementById("tokenAwal")?.value) || 0,
    noRek: document.getElementById("noRek")?.value.trim() || "",
    namaBank: document.getElementById("namaBank")?.value.trim() || "",
    namaRekening: document.getElementById("namaRekening")?.value.trim() || "",
    catatan: document.getElementById("catatan")?.value.trim() || "",
    namaKeluarga: document.getElementById("namaKeluarga")?.value.trim() || "",
    hubunganKeluarga: document.getElementById("hubunganKeluarga")?.value || "",
    hpKeluarga: document.getElementById("hpKeluarga")?.value.trim() || ""
  };

  if (isFromCheckout) {
    data.tokenAkhir = Number(document.getElementById("tokenAkhirCheckout")?.value) || 0;
    data.selisihToken = data.tokenAkhir - data.tokenAwal;
  }

  const ref = isFromCheckout 
    ? db.ref(`checkout/${currentKost}/${currentRoom}`)
    : db.ref(`kosts/${currentKost}/${currentRoom}`);

  ref.update(data).then(() => {
    closeModal();
    alert("Update berhasil!");
  }).catch(err => alert("Error: " + err.message));

  return data;
};

// === SHARE FULL DATA ===
window.shareFullData = async function() {
  const path = currentData.checkout ? `checkout/${currentKost}/${currentRoom}` : `kosts/${currentKost}/${currentRoom}`;
  const snap = await db.ref(path).once("value");
  const d = snap.val() || {};

  const lamaTinggal = d.tanggalCheckout 
    ? hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout) 
    : hitungLamaTinggal(d.tanggalMasuk);

  const status = d.tanggalCheckout ? "CHECK-OUT" : "MASIH MENETAP";

  let pesan = `*DATA PENGHUNI KOSTORY*\n\n` +
    `Kost: ${currentKost} | Kamar: ${currentRoom}\n` +
    `Nama: ${d.nama || "-"}\n` +
    `HP: ${d.hp || "-"}\n` +
    `Alamat Asal: ${d.alamat || "-"}\n` +
    `Perusahaan/Sekolah: ${d.perusahaan || "-"}\n` +
    `Check-in: ${formatDate(d.tanggalMasuk)}\n` +
    `Check-out: ${d.tanggalCheckout ? formatDate(d.tanggalCheckout) : "-"}\n` +
    `Lama Menghuni: ${lamaTinggal}\n` +
    `Status: ${status}\n` +
    `Harga/Bulan: Rp ${d.harga?.toLocaleString() || "-"}\n` +
    `Deposit: Rp ${d.deposit?.toLocaleString() || "0"}\n` +
    `Token Awal: ${d.tokenAwal || "-"}\n` +
    `Token Akhir: ${d.tokenAkhir || "-"}\n` +
    `Selisih Token: ${d.selisihToken ? d.selisihToken + " kWh" : "-"}\n` +
    `Rekening: ${d.namaBank || "-"} - ${d.noRek || "-"} a.n ${d.namaRekening || "-"}\n` +
    `Catatan: ${d.catatan || "-"}\n`;

  if (d.namaKeluarga) {
    pesan += `Keluarga Darurat: ${d.namaKeluarga} (${d.hubunganKeluarga || "-"})\nHP Keluarga: ${d.hpKeluarga || "-"}\n`;
  }

  pesan += `\nTeam Kostory`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// === LAPOR KOST ===
window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  let terisi = 0, kosongList = [], penghuniList = [], mobilList = [], motorList = [];

  for (const room of rooms) {
    const snap = await db.ref(`kosts/${namaKost}/${room}`).once("value");
    const d = snap.val();
    if (d && d.nama && !d.checkout) {
      terisi++;
      penghuniList.push({
        room,
        nama: d.nama,
        hp: d.hp || "-",
        durasi: d.durasi || "Bulanan",
        tanggalMasuk: d.tanggalMasuk
      });
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else {
      kosongList.push(room);
    }
  }

  penghuniList.sort((a, b) => new Date(a.tanggalMasuk) - new Date(b.tanggalMasuk));

  let daftar = "";
  penghuniList.forEach((p, i) => {
    daftar += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${formatDate(p.tanggalMasuk)} | ${p.durasi} | ${hitungLamaTinggal(p.tanggalMasuk)}\n`;
  });

  const pesan = `*LAPORAN HARIAN*\n${formatDate(today)}\n\n` +
    `*${namaKost}*\n` +
    `Terisi: ${terisi}/${rooms.length} (${Math.round(terisi/rooms.length*100)}%)\n` +
    `Kosong: ${kosongList.join(", ") || "Tidak ada"}\n\n` +
    `*Daftar Penghuni (Urut Paling Lama):*\n${daftar || "Tidak ada"}\n\n` +
    `*Kendaraan:*\n` +
    `Mobil (${mobilList.length}): ${mobilList.join(", ") || "-"}\n` +
    `Motor (${motorList.length}): ${motorList.join(", ") || "-"}\n\n` +
    `Team Kostory`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// === KIRIM ULANG TAHUN ===
window.kirimUlangTahun = function(nama, hp) {
  const pesan = `Halo *Kak ${nama}! 🎉*\n\nKami segenap Kostorian, mengucapkan: \n\n*Selamat Ulang Tahun*\n\nSemoga selalu diberikan Kesehatan, Umur yang Panjang dan semakin sukses dalam berkarya\nKostory bangga menjadi bagian dari cerita hidup kak ${nama}!. 🏡\n\nTeam Kostory`;
  const phone = hp.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
};

// === SHOW PENGHUNI LIST ===
window.showPenghuniList = async function() {
  const penghuniPage = document.getElementById("penghuniListPage");
  const app = document.getElementById("app");
  if (!penghuniPage || !app) return alert("Error: Halaman penghuni tidak ditemukan!");

  app.classList.add("hidden");
  penghuniPage.classList.remove("hidden");

  if (new Date().getDate() === 1) {
    const updates = {};
    for (const kost of allowedKosts) {
      for (const room of kosts[kost]) {
        updates[`kosts/${kost}/${room}/lunas`] = false;
        updates[`kosts/${kost}/${room}/tanggalLunas`] = null;
        updates[`kosts/${kost}/${room}/jumlahLunas`] = 0;
      }
    }
    try {
      await db.ref().update(updates);
    } catch (err) {
      console.error("Error resetting lunas:", err);
    }
  }

  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        list.push({
          kost, room, nama: d.nama, hp: d.hp || "", tanggalLahir: d.tanggalLahir,
          lunas: !!d.lunas, tanggalLunas: d.tanggalLunas, jumlahLunas: d.jumlahLunas || 0
        });
      }
    }
  }

  list.sort((a, b) => hariKeUlangTahun(a.tanggalLahir) - hariKeUlangTahun(b.tanggalLahir));

  const header = document.querySelector("#penghuniListPage #header");
  if (header) {
    header.innerHTML = `
      <h1>Daftar Penghuni</h1>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-wa" onclick="laporPembayaran()">LAPOR PEMBAYARAN</button>
        <button class="btn" onclick="backToDashboard()">Kembali</button>
      </div>`;
  }

  const listPenghuni = document.getElementById("listPenghuni");
  if (!listPenghuni) return alert("Error: Elemen listPenghuni tidak ditemukan!");

  listPenghuni.innerHTML = list.map(p => {
    const hariIni = isHariIniUlangTahun(p.tanggalLahir);
    const statusBayar = p.lunas 
      ? `<span style="color:#166534;font-weight:bold">Lunas ${formatDate(p.tanggalLunas)} Rp ${Number(p.jumlahLunas).toLocaleString("id-ID")}</span>`
      : `<span style="color:#dc2626;font-weight:bold">Belum Bayar</span>`;

    return `<div class="penghuni-item" data-kost="${p.kost}" data-room="${p.room}" style="cursor:pointer">
      <div>
        <strong>${p.nama}</strong><br>
        <small>${p.kost} - ${p.room}</small><br>
        ${statusBayar}
        <br><small style="color:#555;font-style:italic;">
          ${p.tanggalLahir ? (hariIni ? "HARI INI ULANG TAHUN!" : `${hariKeUlangTahun(p.tanggalLahir)} hari lagi ulang tahun`) : "Tanggal lahir belum diisi"}
        </small>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button class="tagih-btn" onclick="event.stopPropagation(); bukaTagih('${p.kost}','${p.room}','${p.nama}','${p.hp}')">TAGIH</button>
        <button class="lunas-btn" onclick="event.stopPropagation(); bukaLunas('${p.kost}','${p.room}')">LUNASI</button>
        <button style="background:${hariIni ? '#dc2626' : '#2563eb'};color:white;padding:8px 12px;border:none;border-radius:8px;font-weight:bold" 
                onclick="event.stopPropagation(); kirimUlangTahun('${p.nama}','${p.hp}')">
          ${hariIni ? 'HARI INI!' : ''} Ulang Tahun
        </button>
      </div>
    </div>`;
  }).join("") || "<p style='text-align:center;color:#666;padding:50px'>Belum ada penghuni aktif</p>";
};

// === CHECKOUT LIST ===
window.showCheckoutList = async function() {
  const app = document.getElementById("app");
  const checkoutPage = document.getElementById("checkoutListPage");
  if (!app || !checkoutPage) return alert("Error: Halaman checkout tidak ditemukan!");

  app.classList.add("hidden");
  checkoutPage.classList.remove("hidden");

  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost] || {}).forEach(room => {
      const d = all[kost][room];
      if (d && d.tanggalCheckout) {
        const item = { kost, room, ...d, coDate: new Date(d.tanggalCheckout) };
        if (item.coDate.getMonth() === thisMonth && item.coDate.getFullYear() === thisYear) {
          bulanIni.push(item);
        } else {
          sebelumnya.push(item);
        }
      }
    });
  });

  bulanIni.sort((a, b) => b.coDate - a.coDate);
  sebelumnya.sort((a, b) => b.coDate - a.coDate);

  const listBulanIni = document.getElementById("listBulanIni");
  const listSebelumnya = document.getElementById("listSebelumnya");
  if (!listBulanIni || !listSebelumnya) return alert("Error: Elemen list checkout tidak ditemukan!");

  listBulanIni.innerHTML = bulanIni.map((d, i) => `
    <div class="checkout-item" data-kost="${d.kost}" data-room="${d.room}" style="cursor:pointer">
      <strong>${i+1}. ${d.nama}</strong><br>
      <small>${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small>
    </div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";

  listSebelumnya.innerHTML = sebelumnya.map(d => `
    <div class="checkout-item" data-kost="${d.kost}" data-room="${d.room}" style="cursor:pointer">
      <strong>${d.nama}</strong><br>
      <small>${formatDate(d.tanggalCheckout)}</small>
    </div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";
};

// === TAGIH ===
window.bukaTagih = function(kost, room, nama, hp) {
  currentKost = kost; 
  currentRoom = room;
  window.currentNamaTagih = nama;
  window.currentHpTagih = hp;
  const jatuhTempo = document.getElementById("jatuhTempo");
  if (jatuhTempo) {
    jatuhTempo.value = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
  }
  const tagihModal = document.getElementById("tagihModal");
  if (tagihModal) {
    tagihModal.classList.remove("hidden");
  } else {
    alert("Error: Modal tagih tidak ditemukan!");
  }
};

window.kirimTagihan = function() {
  const tgl = document.getElementById("jatuhTempo")?.value;
  const nominal = document.getElementById("nominalTagihan")?.value;
  if (!tgl || !nominal) return alert("Isi semua field!");
  const pesan = `Hai Kak ${window.currentNamaTagih}\n\nKami informasikan masa kost akan berakhir pada *${formatDate(tgl)}*\nBiaya Perpanjangan sebesar: *Rp ${Number(nominal).toLocaleString()}*, mohon dilunasi 1 hari sebelum masa sewa kost berakhir.\n\nSegera informasikan kepada kami jika sudah transfer atau tidak memperpanjang.\n\nTerima kasih`;
  const phone = window.currentHpTagih.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
  closeModal();
};

// === LUNAS ===
window.bukaLunas = function(kost, room) {
  currentKost = kost; 
  currentRoom = room;
  const tanggalBayar = document.getElementById("tanggalBayar");
  if (tanggalBayar) {
    tanggalBayar.value = new Date().toISOString().split("T")[0];
  }
  const lunasModal = document.getElementById("lunasModal");
  if (lunasModal) {
    lunasModal.classList.remove("hidden");
  } else {
    alert("Error: Modal lunas tidak ditemukan!");
  }
};

window.catatLunas = function() {
  const tgl = document.getElementById("tanggalBayar")?.value;
  const jumlah = Number(document.getElementById("jumlahBayar")?.value);
  if (!tgl || !jumlah) return alert("Isi semua field!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({
    lunas: true,
    tanggalLunas: tgl,
    jumlahLunas: jumlah
  }).then(() => {
    closeModal();
    alert("Lunas tercatat!");
    showPenghuniList();
  }).catch(err => alert("Error: " + err.message));
};

// === CHECKOUT ===
window.openCheckoutModal = function() {
  const coNama = document.getElementById("coNama");
  const coKamar = document.getElementById("coKamar");
  const tanggalCheckout = document.getElementById("tanggalCheckout");
  const checkoutModal = document.getElementById("checkoutModal");

  if (!coNama || !coKamar || !tanggalCheckout || !checkoutModal) {
    return alert("Error: Modal checkout tidak ditemukan!");
  }

  coNama.textContent = currentData.nama || "-";
  coKamar.textContent = currentRoom;
  tanggalCheckout.value = new Date().toISOString().split("T")[0];
  checkoutModal.classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout")?.value;
  const tokenAkhir = Number(document.getElementById("tokenAkhir")?.value) || 0;
  if (!tgl) return alert("Isi tanggal checkout!");

  const finalData = {
    ...currentData,
    checkout: true,
    tanggalCheckout: tgl,
    tokenAkhir,
    selisihToken: tokenAkhir - (currentData.tokenAwal || 0)
  };

  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData)
    .then(() => db.ref(`kosts/${currentKost}/${currentRoom}`).remove())
    .then(() => {
      closeModal();
      alert("Check-out berhasil!");
      loadDashboard();
    })
    .catch(err => alert("Error: " + err.message));
};

// === LAPOR PEMBAYARAN ===
window.laporPembayaran = async function() {
  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        list.push({
          room,
          nama: d.nama,
          status: d.lunas ? "Lunas" : "Belum bayar",
          tgl: d.lunas ? formatDate(d.tanggalLunas) : "-",
          jumlah: d.lunas ? "Rp " + Number(d.jumlahLunas).toLocaleString("id-ID") : "-"
        });
      }
    }
  }

  let pesan = "*LAPORAN PEMBAYARAN*\n" + formatDate(new Date()) + "\n\n";
  if (list.length === 0) {
    pesan += "Belum ada penghuni aktif.";
  } else {
    list.forEach((p, i) => {
      pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.status} | ${p.tgl} | ${p.jumlah}\n`;
    });
  }
  pesan += "\nTeam Kostory";
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// === EVENT DELEGATION ===
document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("kostoryUser");
  if (saved && passwordDb[saved.toLowerCase()]) {
    currentUser = saved.toLowerCase();
    allowedKosts = hakAkses[currentUser] === "all" ? Object.keys(kosts) : [hakAkses[currentUser]];
    document.getElementById("loginScreen")?.classList.add("hidden");
    document.getElementById("app")?.classList.remove("hidden");
    loadDashboard();
  }

  const kostList = document.getElementById("kostList");
  if (kostList) {
    kostList.addEventListener("click", e => {
      const roomBox = e.target.closest(".room");
      if (roomBox && roomBox.dataset.kost && roomBox.dataset.room) {
        openModal(roomBox.dataset.kost, roomBox.dataset.room);
      }
    });
  }

  const listPenghuni = document.getElementById("listPenghuni");
  if (listPenghuni) {
    listPenghuni.addEventListener("click", e => {
      const item = e.target.closest(".penghuni-item");
      if (item && item.dataset.kost && item.dataset.room) {
        openModal(item.dataset.kost, item.dataset.room);
      }
    });
  }

  const listBulanIni = document.getElementById("listBulanIni");
  if (listBulanIni) {
    listBulanIni.addEventListener("click", e => {
      const item = e.target.closest(".checkout-item");
      if (item && item.dataset.kost && item.dataset.room) {
        openModal(item.dataset.kost, item.dataset.room, true);
      }
    });
  }

  const listSebelumnya = document.getElementById("listSebelumnya");
  if (listSebelumnya) {
    listSebelumnya.addEventListener("click", e => {
      const item = e.target.closest(".checkout-item");
      if (item && item.dataset.kost && item.dataset.room) {
        openModal(item.dataset.kost, item.dataset.room, true);
      }
    });
  }
});

// === LOGOUT ===
window.logout = function() {
  localStorage.removeItem("kostoryUser");
  location.reload();
};
