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
  "Ecokost by Kostory": ["101","102","103","105","106","108","107","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77","ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

// ==================== UTILS ===//
function formatDate(d) { if(!d) return "-"; return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
function hitungLamaTinggal(masuk, keluar = new Date()) {
  {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun}t ${bulan}b ${hari}h`;
}
function hariKeUlangTahun(tglLahir) {
  if (!tglLahir) return 9999;
  const lahir = new Date(tglLahir);
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}
function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }

//=== LOGIN ===//
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
  } else alert("Username atau password salah!");
};
window.logout = function() { localStorage.removeItem("kostoryUser"); location.reload(); };
function backToDashboard() {
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

//=== DASHBOARD ===//
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
      const box = document.createElement("div"); box.className = "room kosong";
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

//=== MODAL — FIX STUCK 100% ===//
window.openModal = async function(kost, room, fromCheckout = false) {
  currentKost = kost; currentRoom = room;
  document.getElementById("modalTitle").textContent = fromCheckout ? `Detail Check-Out: ${kost} - ${room}` : `${kost} - ${room}`;

  const path = fromCheckout ? `checkout/${kost}/${room}` : `kosts/${kost}/${room}`;
  const snap = await db.ref(path).once("value");
  currentData = snap.val() || {};

  // Isi semua field
  const fields = ["nama","hp","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","noRek","namaBank","namaRekening","catatan"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = currentData[id] || (id==="tanggal" ? new Date().toISOString().split("T")[0] : "");
  });
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  // Sembunyikan Token Akhir & Selisih kalau bukan check-out
  document.getElementById("tokenAkhirCheckout").closest("div")?.style = fromCheckout ? "" : "display:none";
  document.getElementById("selisihToken").closest("div")?.style = fromCheckout ? "" : "display:none";
  document.getElementById("infoSelisih").style.display = fromCheckout ? "block" : "none";

  if (fromCheckout && currentData.tokenAkhir) {
    document.getElementById("tokenAkhirCheckout").value = currentData.tokenAkhir;
    hitungSelisihToken();
  }

  // Button sesuai kondisi
  const btn = document.getElementById("modalButtons");
  if (fromCheckout) {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Tutup</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE WA</button>
      <button class="btn full" onclick="updateDataOnly(true)">UPDATE CHECK-OUT</button>`;
  } else if (currentData.nama) {
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-wa" onclick="shareFullData()">SHARE</button>
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
  const selisih = awal - akhir;
  document.getElementById("selisihToken").value = selisih >= 0 ? selisih : 0;
  document.getElementById("infoSelisih").textContent = selisih >= 0 
    ? `Pemakaian: ${selisih} kWh → Potong Rp ${(selisih*1452).toLocaleString()}`
    : "Token akhir lebih besar → tidak ada potongan";
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
    catatan: document.getElementById("catatan").value.trim()
  };

  if (isFromCheckout) {
    {
    const tokenAkhir = Number(document.getElementById("tokenAkhirCheckout").value) || 0;
    const selisih = data.tokenAwal - tokenAkhir;
    Object.assign(data, {
      tokenAkhir,
      selisihToken: selisih >= 0 ? selisih : 0,
      potonganListrik: selisih >= 0 ? selisih * 1452 : 0,
      sisaDeposit: data.deposit - (selisih >= 0 ? selisih * 1452 : 0)
    });
  }

  if (!data.nama || !data.hp || !data.tanggalMasuk || !data.harga) return alert("Field wajib diisi!");

  const path = isFromCheckout ? `checkout/${currentKost}/${currentRoom}` : `kosts/${currentKost}/${currentRoom}`;
  db.ref(path).update(data).then(() => {
    closeModal();
    alert("Data berhasil disimpan!");
  }).catch(err => alert("Error: " + err.message));
};

//=== LIST PENGHUNI (DENGAN TAGIH & LUNAS JALAN!) ===//
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

  list.innerHTML = all.map(p => `
    <div class="penghuni-item">
      <div>
        <strong>${p.nama}</strong>${p.lunas ? ` <span class="status-lunas">Lunas ${formatDate(p.tanggalLunas)}</span>` : ""}
        <br><small>${p.jenis} • ${p.statusPenghuni || "staying"} • Check-in: ${formatDate(p.tanggalMasuk)} • ${hitungLamaTinggal(p.tanggalMasuk)}</small>
        <br><small style="color:#e11d48;font-weight:bold">Ulang tahun: ${p.hariUlangTahun === 0 ? "HARI INI!" : p.hariUlangTahun + " hari lagi"}</small>
      </div>
      <div>
        <button class="tagih-btn" onclick="bukaTagih('${p.kost}','${p.room}','${p.nama}','${p.hp}')">TAGIH</button>
        <button class="lunas-btn" onclick="bukaLunas('${p.kost}','${p.room}')">LUNASI</button>
      </div>
    </div>
  `).join("") || "<p style='text-align:center;color:#666;padding:50px'>Belum ada penghuni</p>";
};

//=== CHECK-OUT LIST ===//
window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");
  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost]).forEach(room => {
      const d = all[kost][room];
      if (d.tanggalCheckout) {
        const item = {kost, room, ...d, coDate: new Date(d.tanggalCheckout)};
        if (item.coDate.getMonth() === thisMonth && item.coDate.getFullYear() === thisYear) {
          bulanIni.push(item);
        } else {
          sebelumnya.push(item);
        }
      }
    });
  });

  bulanIni.sort((a,b) => b.coDate - a.coDate);
  sebelumnya.sort((a,b) => b.coDate - a.coDate);

  document.getElementById("listBulanIni").innerHTML = renderCheckoutList(bulanIni);
  document.getElementById("listSebelumnya").innerHTML = renderCheckoutList(sebelumnya);
};

function renderCheckoutList(arr) {
  if (!arr.length) return "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";
  return arr.map((d,i) => `
    <div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)">
      <strong>${i+1}. ${d.nama}</strong><br>
      <small>${d.hp || "-"} • ${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small>
    </div>`).join("");
}

//=== TAGIH & LUNAS (JALAN LAGI!) ===//
window.bukaTagih = function(kost, room, nama, hp) {
  currentKost = kost; currentRoom = room;
  window.currentNamaTagih = nama;
  window.currentHpTagih = hp;
  document.getElementById("jatuhTempo").value = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
  document.getElementById("nominalTagihan").value = "";
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const tgl = document.getElementById("jatuhTempo").value;
  const nominal = Number(document.getElementById("nominalTagihan").value);
  if (!tgl || !nominal) return alert("Isi tanggal & nominal!");

  const pesan = `Hai Kak ${window.currentNamaTagih}\n\nKos akan berakhir pada *${formatDate(tgl)}*.\nSilahkan lunasi *Rp ${nominal.toLocaleString()}* maksimal 1 hari sebelum jatuh tempo.\n\nAbaikan jika sudah lunas.\nTerima kasih\nTeam Kostory ❤️`;
  const phone = window.currentHpTagih.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
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
  if (!tgl || !jumlah) return alert("Isi semua field!");

  db.ref(`kosts/${currentKost}/${currentRoom}`).update({
    lunas: true,
    tanggalLunas: tgl,
    jumlahLunas: jumlah
  }).then(() => {
    closeModal();
    alert("LUNAS tercatat!");
    showPenghuniList();
  });
};

//=== LAPOR HARIAN LENGKAP KEMBALI! ===//
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
    } else {
      kosongList.push(room);
    }
  }

  penghuniList.sort((a, b) => b.lamaHari - a.lamaHari);
  const tanggalHariIni = today.toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"});
  const okupasi = Math.round((terisi / rooms.length) * 100);

  let pesan = `*Laporan Harian*\n${tanggalHariIni}\n\n*${namaKost}*\nOkupasi = *${okupasi}%* (${terisi}/${rooms.length})\nKamar Kosong: ${kosongList.length} → ${kosongList.join(", ") || "Tidak ada"}\n\n*Daftar Penghuni (Urut Lama Tinggal):*\n`;
  
  penghuniList.forEach((p, i) => {
    pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.hp} | ${p.durasi} | ${p.masuk} | ${hitungLamaTinggal(p.tanggalMasuk)}\n`;
  });

  pesan += `\n*Kendaraan:\nMobil: ${mobilList.length} → ${mobilList.join(", ") || "-"}\nMotor: ${motorList.length} → ${motorList.join(", ") || "-"}\n\n*Check-in Bulan Ini*: ${checkInBulanIni.length} orang\n${checkInBulanIni.length ? checkInBulanIni.join("\n") : "Belum ada"}\n\nTerima kasih! Team Kostory`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

//=== FUNGSI CHECK-OUT & SHARE ===//
window.openCheckoutModal = function() {
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
  document.getElementById("checkoutModal").classList.remove("hidden");
};

window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  if (!tgl) return alert("Isi tanggal check-out!");
  const finalData = { ...currentData, checkout: true, tanggalCheckout: tgl };
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal(); alert("Check-out berhasil!");
    });
  });
};

window.shareFullData = function() {
  const d = currentData;
  const pesan = `*DATA PENGHUNI*\n${currentKost} - ${currentRoom}\n\n*Nama*: ${d.nama}\n*HP*: ${d.hp}\n*Check-in*: ${formatDate(d.tanggalMasuk)}\n*Durasi*: ${d.durasi}\n*Harga*: Rp ${d.harga?.toLocaleString()}\n\nTeam Kostory`;
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

//=== AUTO LOGIN ===//
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
