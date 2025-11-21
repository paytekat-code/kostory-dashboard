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

function formatDate(d) { if(!d) return "-"; return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
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
        <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
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
          box.className = "room staying";
          box.innerHTML = room + "<br><strong>" + d.nama + "</strong>";
        } else {
          box.className = "room kosong";
          box.innerHTML = room + "<br><small>KOSONG</small>";
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `<strong>TOTAL: ${totalTerisi} terisi / ${totalKamar} kamar → ${totalKamar-totalTerisi} KOSONG</strong>`;
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

  const fields = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan","namaKeluarga","hubunganKeluarga","hpKeluarga"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id === "tanggal" ? new Date().toISOString().split("T")[0] : "");
  });
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  ["tokenAkhirCheckout", "selisihToken"].forEach(id => {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label && label.parentElement) label.parentElement.style.display = fromCheckout ? "block" : "none";
  });
  document.getElementById("infoSelisih").style.display = fromCheckout ? "block" : "none";

  if (fromCheckout) {
    document.getElementById("tokenAkhirCheckout").value = currentData.tokenAkhir || "";
    hitungSelisihToken();
  }

  const btn = document.getElementById("modalButtons");
  if (fromCheckout) {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Tutup</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
      <button class="btn full" onclick="updateDataOnly(true)">UPDATE</button>`;
  } else if (currentData.nama) {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
      <button class="btn-success" onclick="openCheckoutModal()">CHECK-OUT</button>
      <button class="btn full" onclick="updateDataOnly()">UPDATE</button>`;
  } else {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="updateDataOnly()">SIMPAN & CHECK-IN</button>`;
  }
  document.getElementById("modal").classList.remove("hidden");
};

window.hitungSelisihToken = function() {
  const awal = Number(document.getElementById("tokenAwal").value) || 0;
  const akhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
  const selisih = akhir - awal;
  document.getElementById("selisihToken").value = selisih;
  document.getElementById("infoSelisih").textContent = `Selisih Token: ${selisih} kWh (Akhir - Awal)`;
};

window.updateDataOnly = function(isFromCheckout = false) {
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
    namaKeluarga: document.getElementById("namaKeluarga")?.value.trim() || "",
    hubunganKeluarga: document.getElementById("hubunganKeluarga")?.value || "",
    hpKeluarga: document.getElementById("hpKeluarga")?.value.trim() || ""
  };

  if (isFromCheckout) {
    data.tokenAkhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
    data.selisihToken = Number(document.getElementById("selisihToken").value);
  }

  if (!data.nama || !data.hp || !data.tanggalMasuk || !data.harga) return alert("Field wajib diisi!");

  const path = isFromCheckout ? `checkout/${currentKost}/${currentRoom}` : `kosts/${currentKost}/${currentRoom}`;
  db.ref(path).update(data).then(() => {
    closeModal();
    alert("Data berhasil disimpan!");
  });
};

window.shareFullData = function() {
  const d = {
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    tanggalMasuk: document.getElementById("tanggal").value,
    tanggalCheckout: currentData.tanggalCheckout || null,
    harga: Number(document.getElementById("harga").value),
    deposit: Number(document.getElementById("deposit").value) || 0,
    tokenAwal: Number(document.getElementById("tokenAwal").value),
    tokenAkhir: currentData.tokenAkhir || "-",
    selisihToken: currentData.selisihToken || "-",
    namaBank: document.getElementById("namaBank").value.trim(),
    noRek: document.getElementById("noRek").value.trim(),
    namaRekening: document.getElementById("namaRekening").value.trim(),
    catatan: document.getElementById("catatan").value.trim(),
    namaKeluarga: document.getElementById("namaKeluarga")?.value.trim() || "",
    hubunganKeluarga: document.getElementById("hubunganKeluarga")?.value || "",
    hpKeluarga: document.getElementById("hpKeluarga")?.value.trim() || ""
  };

  const lamaTinggal = d.tanggalCheckout ? hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout) : hitungLamaTinggal(d.tanggalMasuk);
  const status = d.tanggalCheckout ? "CHECK-OUT" : "MASIH MENETAP";

  let pesan = `*DATA PENGHUNI KOSTORY*\n\n` +
    `Kost: ${currentKost} | Kamar: ${currentRoom}\n` +
    `Nama: ${d.nama}\n` +
    `HP: ${d.hp}\n` +
    `Check-in: ${formatDate(d.tanggalMasuk)}\n` +
    `Check-out: ${d.tanggalCheckout ? formatDate(d.tanggalCheckout) : "-"}\n` +
    `Lama Menghuni: ${lamaTinggal}\n` +
    `Status: ${status}\n` +
    `Harga/Bulan: Rp ${d.harga?.toLocaleString() || "-"}\n` +
    `Deposit: Rp ${d.deposit?.toLocaleString() || "0"}\n` +
    `Token Awal: ${d.tokenAwal || "-"}\n` +
    `Token Akhir: ${d.tokenAkhir}\n` +
    `Selisih Token: ${d.selisihToken} kWh\n` +
    `Rekening: ${d.namaBank || "-"} - ${d.noRek || "-"} a.n ${d.namaRekening || "-"}\n` +
    `Catatan: ${d.catatan || "-"}\n`;

  if (d.namaKeluarga) {
    pesan += `Keluarga Darurat: ${d.namaKeluarga} (${d.hubunganKeluarga || "-"})\nHP Keluarga: ${d.hpKeluarga || "-"}\n`;
  }

  pesan += `\nTeam Kostory`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

window.kirimUlangTahun = function(nama, hp) {
  const pesan = `Halo *${nama}*!!! 🎉🎂\n\n*SELAMAT ULANG TAHUN Kak!!* 🥳🔥\nSemoga panjang umur, sehat selalu, dilancarkan usahanya, dan semakin sukses tiap tahunnya ya! 💪\n\nSemoga selalu dilindugi Tuhan dalam Pekerjaan dan semua urusan\n\nSomnia Audacter - Mane Kostorianus,\nSalam Kostorian - Team Kostory`;
  const phone = hp.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
};

window.laporKost = async function(namaKost) {
  const rooms = kosts[namaKost];
  const today = new Date();
  let terisi = 0, kosongList = [], penghuniList = [], mobilList = [], motorList = [];

  for (const room of rooms) {
    const snap = await db.ref(`kosts/${namaKost}/${room}`).once("value");
    const d = snap.val();
    if (d && d.nama) {
      terisi++;
      const lamaHari = Math.floor((today - new Date(d.tanggalMasuk)) / 86400000);
      penghuniList.push({room, nama: d.nama, hp: d.hp||"-", durasi: d.durasi, lamaHari});
      if (d.kendaraan === "Mobil") mobilList.push(d.nama);
      if (d.kendaraan === "Motor") motorList.push(d.nama);
    } else kosongList.push(room);
  }

  penghuniList.sort((a,b) => b.lamaHari - a.lamaHari);

  let daftar = "";
  penghuniList.forEach((p, i) => {
    daftar += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${hitungLamaTinggal(p.tanggalMasuk || today)}\n`;
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

window.showPenghuniList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");
  const list = document.getElementById("listPenghuni");
  list.innerHTML = "Memuat...";

  const today = new Date();
  const isTanggal1 = today.getDate() === 1;
  const all = [];

  for (const kost of allowedKosts) {
    const snap = await db.ref(`kosts/${kost}`).once("value");
    const rooms = snap.val() || {};
    Object.entries(rooms).forEach(([room, d]) => {
      if (d && d.nama) {
        if (isTanggal1 && d.lunas) {
          db.ref(`kosts/${kost}/${room}`).update({lunas:null, tanggalLunas:null, jumlahLunas:null});
        }
        all.push({kost, room, ...d, hariUlangTahun: hariKeUlangTahun(d.tanggalLahir)});
      }
    });
  }

  all.sort((a,b) => a.hariUlangTahun - b.hariUlangTahun);

  list.innerHTML = all.map(p => {
    const hariIni = isHariIniUlangTahun(p.tanggalLahir);
    return `
    <div class="penghuni-item">
      <div>
        <strong>${p.nama}</strong>${p.lunas ? ` <span class="status-lunas">Lunas ${formatDate(p.tanggalLunas)}</span>` : ""}
        <br><small>${p.jenis} • ${p.statusPenghuni || "staying"} • Check-in: ${formatDate(p.tanggalMasuk)} • ${hitungLamaTinggal(p.tanggalMasuk)}</small>
        <br><small style="color:#e11d48;font-weight:bold">Ulang tahun: ${hariIni ? "HARI INI!" : p.hariUlangTahun + " hari lagi"}</small>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="tagih-btn" onclick="bukaTagih('${p.kost}','${p.room}','${p.nama}','${p.hp}')">TAGIH</button>
        <button class="lunas-btn" onclick="bukaLunas('${p.kost}','${p.room}')">LUNASI</button>
        <button style="background:${hariIni ? '#dc2626' : '#2563eb'};color:white;padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:bold" 
                onclick="kirimUlangTahun('${p.nama}','${p.hp}')">
          ${hariIni ? 'HARI INI! ' : ''}🎂 Ulang Tahun
        </button>
      </div>
    </div>`;
  }).join("") || "<p style='text-align:center;color:#666;padding:50px'>Belum ada penghuni aktif</p>";
};

window.showCheckoutList = async function() {
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
  const pesan = `Hai Kak ${window.currentNamaTagih}\n\nTagihan kost jatuh tempo *${formatDate(tgl)}*\nJumlah: *Rp ${Number(nominal).toLocaleString()}*\n\nTerima kasih`;
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
  if (!tgl) return alert("Isi tanggal!");
  const finalData = {...currentData, checkout:true, tanggalCheckout:tgl};
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal(); alert("Check-out berhasil!");
      loadDashboard(); // Refresh dashboard biar box kamar langsung kosong
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
