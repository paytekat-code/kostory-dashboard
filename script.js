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
  return `${tahun} tahun ${bulan} bulan ${hari} hari`;
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
  container.innerHTML = "<div style='text-align:center;padding:80px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  let totalKamar = 0, totalTerisi = 0;

  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    totalKamar += kosts[namaKost].length;
    const card = document.createElement("div"); card.className = "kost-card";
 card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px">
    <h3>${namaKost}</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
      <button class="btn" style="background:#7c3aed;color:white" onclick="laporCiCo('${namaKost}')">Ci-Co</button>
    </div>
  </div>
      <div class="stats">Terisi: <span class="occ">0</span> / ${kosts[namaKost].length}</div>
      <div class="room-grid"></div>`;
    container.appendChild(card);
    const grid = card.querySelector(".room-grid"), occ = card.querySelector(".occ");
    let terisi = 0;

    kosts[namaKost].forEach(room => {
      const box = document.createElement("div");
      box.className = "room kosong";
      box.innerHTML = room + "<br><small>KOSONG</small>";
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", s => {
        const d = s.val();
        if (d && d.nama && !d.checkout) {
          terisi++; totalTerisi++;
          box.className = `room ${d.statusPenghuni || "staying"}`;
          box.innerHTML = `${room}<br><small>${d.nama}</small>`;
        } else {
          terisi = Math.max(terisi - 1, 0); totalTerisi = Math.max(totalTerisi - 1, 0);
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `Total Terisi: ${totalTerisi} / ${totalKamar} (${Math.round(totalTerisi/totalKamar*100)}%)`;
      });
    });
  });
}

window.openModal = async function(kost, room, fromCheckout = false) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = fromCheckout ? `Detail Check-Out: ${kost} - ${room}` : `${kost} - ${room}`;

  const path = fromCheckout ? `checkout/${kost}/${room}` : `kosts/${kost}/${room}`;
  const snap = await db.ref(path).once("value");
  currentData = snap.val() || {};

  const fields = ["nama","hp","tanggalLahir","alamat","perusahaan","jenis","durasi","kendaraan","harga","deposit","tokenAwal","noRek","namaBank","namaRekening","catatan","namaKeluarga","hubunganKeluarga","hpKeluarga"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || "";
  });
  // Khusus tanggal check-in: pakai tanggalMasuk dari data, atau hari ini jika kosong
  document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  ["tokenAkhirCheckout", "selisihToken"].forEach(id => {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label && label.parentElement) label.parentElement.style.display = fromCheckout ? "block" : "none";
  });
  document.getElementById("infoSelisih").style.display = fromCheckout ? "block" : "none";

  if (fromCheckout) {
    document.getElementById("tokenAkhirCheckout").value = currentData.tokenAkhir || "";
    hitungSelisihToken(); // Hitung selisih jika ada data
  }

  const btns = document.getElementById("modalButtons");
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
  document.getElementById("modal").classList.remove("hidden");
};

window.hitungSelisihToken = function() {
  const awal = Number(document.getElementById("tokenAwal").value) || 0;
  const akhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
  const selisih = akhir - awal;
  document.getElementById("selisihToken").value = selisih;
  document.getElementById("infoSelisih").textContent = selisih < 0 ? "Selisih negatif, cek input!" : "";
};

window.simpanData = function() {
  const nama = document.getElementById("nama").value.trim();
  const hp = document.getElementById("hp").value.trim();
  if (!nama || !hp) return alert("Nama dan HP wajib diisi!");
  const data = updateDataOnly(); // Reuse the function to get data
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal(); alert("Data tersimpan!");
  });
};

window.updateDataOnly = function(isFromCheckout = false) {
  const data = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    statusPenghuni: document.getElementById("statusPenghuni").value,
    tanggalLahir: document.getElementById("tanggalLahir").value || null,
    alamat: document.getElementById("alamat").value.trim(),
    perusahaan: document.getElementById("perusahaan").value.trim(),
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
    namaKeluarga: document.getElementById("namaKeluarga")?.value.trim() || "",
    hubunganKeluarga: document.getElementById("hubunganKeluarga")?.value || "",
    hpKeluarga: document.getElementById("hpKeluarga")?.value.trim() || ""
  };
  if (isFromCheckout) {
    data.tokenAkhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
    data.selisihToken = data.tokenAkhir - (data.tokenAwal || 0);
    db.ref(`checkout/${currentKost}/${currentRoom}`).update(data).then(() => {
      closeModal(); alert("Update berhasil!");
    });
  } else {
    db.ref(`kosts/${currentKost}/${currentRoom}`).update(data).then(() => {
      closeModal(); alert("Update berhasil!");
    });
  }
  return data;
};

window.shareFullData = async function() {
  // Ambil data terbaru dari database
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

window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  let terisi = 0, kosongList = [], penghuniList = [], mobilList = [], motorList = [];

  for (const room of rooms) {
    const snap = await db.ref(`kosts/${namaKost}/${room}`).once("value");
    const d = snap.val();
    if (d && d.nama && !d.checkout) {
      terisi++;
      const lamaHari = Math.floor((today - new Date(d.tanggalMasuk)) / 86400000);
      penghuniList.push({
        room,
        nama: d.nama,
        hp: d.hp || "-",
        durasi: d.durasi || "Bulanan",
        tanggalMasuk: d.tanggalMasuk  // penting: simpan tanggalMasuk di object
      });
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else {
      kosongList.push(room);
    }
  }

  // Urutkan dari terlama (check-in awal) ke terbaru
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

window.kirimUlangTahun = function(nama, hp) {
  const pesan = `Halo *Kak ${nama}! 🎉*\n\nKami segenap Kostorian, mengucapkan: \n\n*Selamat Ulang Tahun*\n\nSemoga selalu diberikan Kesehatan, Umur yang Panjang dan semakin sukses dalam berkarya\nKostory bangga menjadi bagian dari cerita hidup kak ${nama}!. 🏡\n\nTeam Kostory`;
  const phone = hp.replace(/^0/,"62").replace(/[^0-9]/g,"");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`,"_blank");
};

window.showPenghuniList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");

    // === RESET LUNAS OTOMATIS – HANYA SEKALI TIAP TANGGAL 1 TIAP BULAN ===
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-1`; // contoh: 2025-12-1
  const lastReset = localStorage.getItem("kostory_lastLunasReset");

  if (today.getDate() === 1 && lastReset !== todayKey) {
    const updates = {};
    for (const kost of allowedKosts) {
      for (const room of kosts[kost]) {
        updates[`kosts/${kost}/${room}/lunas`] = false;
        updates[`kosts/${kost}/${room}/tanggalLunas`] = null;
        updates[`kosts/${kost}/${room}/jumlahLunas`] = 0;
      }
    }
    db.ref().update(updates)
      .then(() => {
        localStorage.setItem("kostory_lastLunasReset", todayKey);
        console.log("Semua status lunas berhasil di-reset untuk bulan ini");
      })
      .catch(err => console.error("Gagal reset lunas:", err));
  }

  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        list.push({
          kost,
          room,
          nama: d.nama,
          hp: d.hp || "",
          tanggalLahir: d.tanggalLahir,
          lunas: d.lunas || false,
          tanggalLunas: d.tanggalLunas || "",
          jumlahLunas: d.jumlahLunas || 0
        });
      }
    }
  }

  list.sort((a,b) => hariKeUlangTahun(a.tanggalLahir) - hariKeUlangTahun(b.tanggalLahir));

  // Update header dengan tombol LAPOR PEMBAYARAN
  document.querySelector("#penghuniListPage #header").innerHTML = `
    <h1>Daftar Penghuni</h1>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <button class="btn btn-wa" onclick="laporPembayaran()">LAPOR PEMBAYARAN</button>
      <button class="btn" onclick="backToDashboard()">Kembali</button>
    </div>
  `;

  document.getElementById("listPenghuni").innerHTML = list.map(p => {
    const hariIni = isHariIniUlangTahun(p.tanggalLahir);

    let statusBayar = "";
    if (p.lunas) {
      const tgl = formatDate(p.tanggalLunas);
      const jumlah = Number(p.jumlahLunas).toLocaleString("id-ID");
      statusBayar = `<span style="color:#166534;font-weight:bold">Lunas ${tgl} sebesar Rp ${jumlah}</span>`;
    } else {
      statusBayar = `<span style="color:#dc2626;font-weight:bold">Belum Bayar</span>`;
    }

    return `<div class="penghuni-item" onclick="openModal('${p.kost}','${p.room}')">
      <div>
        <strong>${p.nama}</strong><br>
        <small>${p.kost} - ${p.room}</small><br>
        ${statusBayar}
        <br><small style="color:#555;font-style:italic;">
          ${p.tanggalLahir ? 
            (hariIni ? "HARI INI ULANG TAHUN!" : 
              `${hariKeUlangTahun(p.tanggalLahir)} hari lagi ulang tahun`) 
            : "Tanggal lahir belum diisi"}
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
};window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");
  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost] || {}).forEach(room => {
      const d = all[kost][room];
      if (d && d.tanggalCheckout) {
        const item = {kost, room, ...d, coDate: new Date(d.tanggalCheckout)};
        (item.coDate.getMonth() === thisMonth && item.coDate.getFullYear() === thisYear ? bulanIni : sebelumnya).push(item);
      }
    });
  });

  bulanIni.sort((a,b) => b.coDate - a.coDate);
  sebelumnya.sort((a,b) => b.coDate - a.coDate);

  document.getElementById("listBulanIni").innerHTML = bulanIni.map((d,i) => `<div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)"><strong>${i+1}. ${d.nama}</strong><br><small>${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small></div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";
  document.getElementById("listSebelumnya").innerHTML = sebelumnya.map(d => `<div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)"><strong>${d.nama}</strong><br><small>${formatDate(d.tanggalCheckout)}</small></div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";
};

window.bukaTagih = function(kost, room, nama, hp) {
  currentKost = kost; currentRoom = room;
  window.currentNamaTagih = nama;
  window.currentHpTagih = hp;
  document.getElementById("jatuhTempo").value = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const tgl = document.getElementById("jatuhTempo").value;
  const nominal = document.getElementById("nominalTagihan").value;
  if (!tgl || !nominal) return alert("Isi semua!");
  const pesan = `Hai Kak ${window.currentNamaTagih}\n\nKami informasikan masa kost akan berakhir pada *${formatDate(tgl)}*\nBiaya Perpanjangan sebesar: *Rp ${Number(nominal).toLocaleString()}*,mohon dilunasi 1 hari sebelum masa sewa kost berakhir.\n\nSegera informasikan kepada kami, jika sudah melakukan transfer atau jika kakak tidak akan memperpanjang Kost. \n\nInfo Pemesanan dan Customer Care, Silahkan Menghubungi : 081383210009 (WA only).\n\nTerima kasih.\nTim Kostory`;
  const phone = window.currentHpTagih.replace(/^0/,"62").replace(/[^0-9]/g,"");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`,"_blank");
  closeModal();
};

window.bukaLunas = function(kost, room) {
  currentKost = kost; currentRoom = room;
  document.getElementById("tanggalBayar").value = new Date().toISOString().split("T")[0];
  document.getElementById("lunasModal").classList.remove("hidden");
};

window.catatLunas = function() {
  const tgl = document.getElementById("tanggalBayar").value;
  const jumlah = Number(document.getElementById("jumlahBayar").value);
  if (!tgl || !jumlah) return alert("Isi semua!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({lunas:true, tanggalLunas:tgl, jumlahLunas:jumlah}).then(() => {
    closeModal(); alert("Lunas tercatat!"); showPenghuniList();
  });
};

window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  const tokenAkhir = Number(document.getElementById("tokenAkhir").value) || 0;
  if (!tgl) return alert("Isi tanggal!");
  const finalData = {...currentData, checkout:true, tanggalCheckout:tgl, tokenAkhir, selisihToken: tokenAkhir - (currentData.tokenAwal || 0)};
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal(); alert("Check-out berhasil!");
      loadDashboard();
    });
  });
};

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
window.laporPembayaran = async function() {
  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        const status = d.lunas ? "Lunas" : "Belum bayar";
        const tgl = d.lunas ? formatDate(d.tanggalLunas) : "-";
        const jumlah = d.lunas ? "Rp. " + Number(d.jumlahLunas).toLocaleString("id-ID") : "-";
        const tglMasuk = formatDate(d.tanggalMasuk) || "-";
        list.push({ room, nama: d.nama, status, tgl, jumlah, tglMasuk });
      }
    }
  }

  let pesan = "*LAPORAN PEMBAYARAN*\n";
  pesan += formatDate(new Date()) + "\n\n";

  if (list.length === 0) {
    pesan += "Belum ada penghuni aktif.";
  } else {
   list.forEach((p, i) => {
  pesan += `${i+1}. ${p.room} | ${p.nama} (${p.tglMasuk}) | ${p.status} | ${p.tgl} | ${p.jumlah}\n`;
});
  }

  pesan += "\nTeam Kostory";
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};
window.laporCiCo = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  let ciThis = [], ciLast = [], coThis = [], coLast = [];

  // Ambil data aktif (check-in
  for (const room of rooms) {
    const snapAktif = await db.ref(`kosts/${namaKost}/${room}`).once("value");
    const d = snapAktif.val();
    if (d && d.nama && d.tanggalMasuk) {
      const tglMasuk = new Date(d.tanggalMasuk);
      if (tglMasuk.getMonth() === thisMonth && tglMasuk.getFullYear() === thisYear) {
        ciThis.push({room, nama: d.nama, durasi: d.durasi || "Bulanan", tglMasuk: d.tanggalMasuk, tokenAwal: d.tokenAwal || "-"});
      } else if (tglMasuk.getMonth() === lastMonth && tglMasuk.getFullYear() === lastMonthYear) {
        ciLast.push({room, nama: d.nama, durasi: d.durasi || "Bulanan", tglMasuk: d.tanggalMasuk, tokenAwal: d.tokenAwal || "-"});
      }
    }
  }

  // Ambil data check-out
  const snapCo = await db.ref(`checkout/${namaKost}`).once("value");
  const dataCo = snapCo.val() || {};
  for (const room in dataCo) {
    const d = dataCo[room];
    if (d && d.tanggalCheckout) {
      const tglCo = new Date(d.tanggalCheckout);
      const item = {
        room,
        nama: d.nama || "-",
        durasi: d.durasi || "Bulanan",
        tglMasuk: d.tanggalMasuk ? formatDate(d.tanggalMasuk) : "-",
        tglKeluar: formatDate(d.tanggalCheckout),
        tokenAwal: d.tokenAwal || "-",
        tokenAkhir: d.tokenAkhir || "-"
      };
      if (tglCo.getMonth() === thisMonth && tglCo.getFullYear() === thisYear) {
        coThis.push(item);
      } else if (tglCo.getMonth() === lastMonth && tglCo.getFullYear() === lastMonthYear) {
        coLast.push(item);
      }
    }
  }

  // Urutkan dari terbaru
  ciThis.sort((a,b) => new Date(b.tglMasuk) - new Date(a.tglMasuk));
  coThis.sort((a,b) => new Date(b.tglKeluar) - new Date(a.tglKeluar));

  let pesan = `*LAPORAN CI-CO ${namaKost}*\n${formatDate(today)}\n\n`;

  pesan += `*Check in Bulan ini :* ${ciThis.length} orang\n`;
  ciThis.forEach((p,i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${formatDate(p.tglMasuk)} | - | ${p.tokenAwal} | - | Masih Tinggal\n`;
  });
  if (ciThis.length === 0) pesan += "Tidak ada\n";
  pesan += "\n";

  pesan += `*Check in Bulan lalu :* ${ciLast.length} orang\n`;
  if (ciLast.length === 0) pesan += "Tidak ada\n";

  pesan += `\n*Check Out Bulan ini :* ${coThis.length} orang\n`;
  coThis.forEach((p,i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${p.tglMasuk} | ${p.tglKeluar} | ${p.tokenAwal} | ${p.tokenAkhir} | Check-out\n`;
  });
  if (coThis.length === 0) pesan += "Tidak ada\n";
  pesan += "\n";

  pesan += `*Check Out Bulan Lalu :* ${coLast.length} orang\n`;
  coLast.forEach((p,i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${p.tglMasuk} | ${p.tglKeluar} | ${p.tokenAwal} | ${p.tokenAkhir} | Check-out\n`;
  });
  if (coLast.length === 0) pesan += "Tidak ada\n";

  pesan += `\nTeam Kostory ❤️`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};
