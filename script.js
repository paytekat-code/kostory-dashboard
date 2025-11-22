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

// AUTO LOGIN
window.onload = function() {
  const saved = localStorage.getItem("kostoryUser");
  if (saved && passwordDb[saved]) {
    currentUser = saved;
    allowedKosts = hakAkses[saved] === "all" ? Object.keys(kosts) : [hakAkses[saved]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  }
};

function logout() {
  localStorage.removeItem("kostoryUser");
  location.reload();
}

// LOGIN MANUAL
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
  } else {
    alert("Username atau password salah!");
  }
};

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
  return `${tahun}y ${bulan}bln ${hari}h`;
}

function hariKeUlangTahun(tglLahir) {
  if (!tglLahir) return 9999;
  const lahir = new Date(tglLahir);
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

function closeModal() { 
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); 
}

function backToDashboard() {
  ["penghuniListPage","checkoutListPage","checkinListPage"].forEach(id => 
    document.getElementById(id)?.classList.add("hidden")
  );
  document.getElementById("app").classList.remove("hidden");
}

// DASHBOARD + KOTAK KAMAR
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "<div style='text-align:center;padding:100px;color:#666'>Loading kamar...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat...";
  let totalKamar = 0, totalTerisi = 0;

  allowedKosts.forEach(namaKost => {
    totalKamar += kosts[namaKost].length;
    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `<h2 style="color:#1e40af;margin-bottom:20px">${namaKost}</h2><div class="room-grid"></div>`;
    container.appendChild(card);
    const grid = card.querySelector(".room-grid");

    kosts[namaKost].forEach(room => {
      db.ref(`kosts/${namaKost}/${room}`).once("value").then(snap => {
        const d = snap.val();
        const box = document.createElement("div");
        box.className = "room";
        box.onclick = () => openModal(namaKost, room);
        if (!d || d.checkout) {
          box.classList.add("kosong");
          box.innerHTML = room + "<br><small>Kosong</small>";
        } else {
          totalTerisi++;
          box.classList.add(d.status || "staying");
          box.innerHTML = room + "<br><small>" + (d.nama || "???") + "</small>";
        }
        grid.appendChild(box);
        document.getElementById("totalStats").innerHTML = `Total Kamar: ${totalKamar} | Terisi: ${totalTerisi} (${Math.round(totalTerisi/totalKamar*100)}%)`;
      });
    });
  });
}

// MODAL DETAIL / CHECK-IN / EDIT
window.openModal = function(kost, room, fromCheckout = false) {
  currentKost = kost; currentRoom = room;
  const ref = fromCheckout ? db.ref(`checkout/${kost}/${room}`) : db.ref(`kosts/${kost}/${room}`);
  ref.once("value").then(snap => {
    currentData = snap.val() || {};
    document.getElementById("detailModal").classList.remove("hidden");
    document.getElementById("modalTitle").textContent = currentData.nama ? `EDIT ${room} - ${currentData.nama}` : `CHECK-IN BARU ${room}`;

    const fields = ["nama","hp","alamat","perusahaan","tanggalLahir","jenis","durasi","kendaraan","harga","deposit","tanggal","tokenAwal","tokenAkhirCheckout","noRek","namaBank","namaRekening","catatan","namaKeluarga","hubunganKeluarga","hpKeluarga"];
    fields.forEach(f => document.getElementById(f).value = currentData[f] || "");
    document.getElementById("statusPenghuni").value = currentData.status || "staying";
    document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];

    const btn = document.getElementById("modalButtons");
    btn.innerHTML = `<button class="btn-danger" onclick="closeModal()">Batal</button>
                     <button class="btn-success full" onclick="simpanData()">${currentData.nama ? "UPDATE" : "CHECK-IN"}</button>`;
    if (currentData.nama && !currentData.checkout) {
      btn.innerHTML += `<button class="btn-wa" onclick="kirimWA()">WA</button>
                        <button class="btn-danger" onclick="checkoutModal()">CHECK-OUT</button>
                        <button class="tagih-btn" onclick="tagihModal()">TAGIH</button>
                        <button class="lunas-btn" onclick="lunasModal()">LUNAS</button>`;
    }
  });
};

window.simpanData = function() {
  const data = {
    status: document.getElementById("statusPenghuni").value,
    nama: document.getElementById("nama").value.trim(),
    hp: document.getElementById("hp").value.trim(),
    alamat: document.getElementById("alamat").value,
    perusahaan: document.getElementById("perusahaan").value,
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: Number(document.getElementById("harga").value) || 0,
    deposit: Number(document.getElementById("deposit").value) || 0,
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value) || 0,
    noRek: document.getElementById("noRek").value,
    namaBank: document.getElementById("namaBank").value,
    namaRekening: document.getElementById("namaRekening").value,
    catatan: document.getElementById("catatan").value,
    namaKeluarga: document.getElementById("namaKeluarga").value,
    hubunganKeluarga: document.getElementById("hubunganKeluarga").value,
    hpKeluarga: document.getElementById("hpKeluarga").value
  };
  if (!data.nama || !data.hp) return alert("Nama & HP wajib diisi!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal(); alert("Data tersimpan!"); loadDashboard();
  });
};

// CHECK-OUT
window.checkoutModal = function() { closeModal(); document.getElementById("checkoutModal").classList.remove("hidden");
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split("T")[0];
};
window.prosesCheckout = function() {
  const tgl = document.getElementById("tanggalCheckout").value;
  const token = Number(document.getElementById("tokenAkhir").value) || 0;
  if (!tgl) return alert("Isi tanggal!");
  const final = {...currentData, checkout:true, tanggalCheckout:tgl, tokenAkhir:token, selisihToken: token - (currentData.tokenAwal||0)};
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(final).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal(); alert("Check-out berhasil!"); loadDashboard();
    });
  });
};

// TAGIH & LUNAS (tetap sama)
window.tagihModal = function() { closeModal(); document.getElementById("tagihModal").classList.remove("hidden");
  document.getElementById("jatuhTempo").value = new Date().toISOString().split("T")[0];
  document.getElementById("nominalTagihan").value = currentData.harga || "";
};
window.kirimTagihan = function() {
  const t = document.getElementById("jatuhTempo").value;
  const n = document.getElementById("nominalTagihan").value;
  const pesan = `*TAGIHAN KOST*\n\n${currentData.nama}\nKamar ${currentRoom}\n\nRp ${Number(n).toLocaleString("id-ID")}\nJatuh Tempo: ${formatDate(t)}\n\nTransfer ke:\n${currentData.noRek||"-"} a/n ${currentData.namaRekening||"-"} (${currentData.namaBank||"-"})`;
  window.open(`https://wa.me/${currentData.hp}?text=${encodeURIComponent(pesan)}`); closeModal();
};
window.lunasModal = function() { closeModal(); document.getElementById("lunasModal").classList.remove("hidden");
  document.getElementById("tanggalBayar").value = new Date().toISOString().split("T")[0];
  document.getElementById("jumlahBayar").value = currentData.harga || "";
};
window.catatLunas = function() {
  const t = document.getElementById("tanggalBayar").value;
  const j = document.getElementById("jumlahBayar").value;
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({lunas:true, tanggalLunas:t, jumlahLunas:Number(j)}).then(() => {
    closeModal(); alert("Lunas tercatat!"); loadDashboard();
  });
};

// DAFTAR PENGHUNI
window.showPenghuniList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");
  const list = [];
  for (const k of allowedKosts) for (const r of kosts[k]) {
    const snap = await db.ref(`kosts/${k}/${r}`).once("value");
    const d = snap.val();
    if (d && d.nama && !d.checkout) list.push({kost:k, room:r, d});
  }
  list.sort((a,b) => hariKeUlangTahun(a.d.tanggalLahir) - hariKeUlangTahun(b.d.tanggalLahir));
  document.getElementById("penghuniListContainer").innerHTML = list.map(p => `
    <div class="penghuni-item" onclick="openModal('${p.kost}','${p.room}')">
      <div><strong>${p.room} - ${p.d.nama}</strong><br>
      <small>${p.d.hp} • ${p.d.durasi} • Tinggal ${hitungLamaTinggal(p.d.tanggalMasuk)}</small><br>
      <small>Ulang tahun dalam ${hariKeUlangTahun(p.d.tanggalLahir)} hari</small></div>
      ${p.d.lunas ? '<span class="status-lunas">LUNAS</span>' : '<span style="background:#fee2e2;color:#b91c1c;padding:6px 12px;border-radius:8px">BELUM</span>'}
    </div>`).join("") || "<p style='text-align:center;padding:50px;color:#666'>Belum ada penghuni aktif</p>";
};

// DAFTAR CHECK-OUT
window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");
  const bulanIni = [], sebelumnya = [];
  const snap = await db.ref("checkout").once("value");
  const data = snap.val() || {};
  Object.keys(data).forEach(k => {
    if (!allowedKosts.includes(k)) return;
    Object.keys(data[k]).forEach(r => {
      const d = data[k][r];
      if (d.tanggalCheckout) {
        const item = {room:r, nama:d.nama, durasi:d.durasi||"Bulanan", tgl:d.tanggalCheckout, lama:hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)};
        new Date(d.tanggalCheckout).getMonth() === new Date().getMonth() ? bulanIni.push(item) : sebelumnya.push(item);
      }
    });
  });
  const render = (arr) => arr.map((x,i) => `
    <div class="checkout-item"><strong>${i+1}. ${x.room} - ${x.nama}</strong><br>
    <small>${x.durasi} • ${formatDate(x.tgl)} • ${x.lama}</small></div>`).join("") || "<p style='text-align:center;padding:30px;color:#666'>Kosong</p>";
  document.getElementById("checkoutBulanIni").innerHTML = render(bulanIni);
  document.getElementById("checkoutSebelumnya").innerHTML = render(sebelumnya);
};

// DAFTAR CHECK-IN + LAPORAN WA LENGKAP
window.showCheckinList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkinListPage").classList.remove("hidden");
  await loadCheckinList();
};

async function loadCheckinList() {
  const bulanIni = [], bulanLalu = [];
  const now = new Date(), cm = now.getMonth(), cy = now.getFullYear();
  const lm = cm === 0 ? 11 : cm-1, ly = cm === 0 ? cy-1 : cy;

  for (const k of allowedKosts) for (const r of kosts[k]) {
    const snap = await db.ref(`kosts/${k}/${r}`).once("value");
    const d = snap.val();
    if (d?.nama && d.tanggalMasuk) {
      const t = new Date(d.tanggalMasuk);
      const item = {room:r, nama:d.nama, tgl:formatDate(d.tanggalMasuk), durasi:d.durasi||"Bulanan", token:d.tokenAwal||0, status:"Masih Tinggal"};
      (t.getMonth()===cm && t.getFullYear()===cy ? bulanIni : t.getMonth()===lm && t.getFullYear()===ly ? bulanLalu : null)?.push(item);
    }
  }
  const coSnap = await db.ref("checkout").once("value");
  const co = coSnap.val()||{};
  Object.keys(co).forEach(k => allowedKosts.includes(k) && Object.keys(co[k]).forEach(r => {
    const d = co[k][r];
    if (d?.nama && d.tanggalMasuk) {
      const t = new Date(d.tanggalMasuk);
      const item = {room:r, nama:d.nama, tgl:formatDate(d.tanggalMasuk), durasi:d.durasi||"Bulanan", token:d.tokenAwal||0, status:"CHECK-OUT"};
      (t.getMonth()===cm && t.getFullYear()===cy ? bulanIni : t.getMonth()===lm && t.getFullYear()===ly ? bulanLalu : null)?.push(item);
    }
  }));

  bulanIni.sort((a,b) => b.tgl.localeCompare(a.tgl));
  bulanLalu.sort((a,b) => b.tgl.localeCompare(a.tgl));

  const row = (x,i) => `<div class="checkout-item"><strong>${i+1}. ${x.room} - ${x.nama}</strong><br><small>${x.tgl} • ${x.durasi} • Token ${x.token} • ${x.status}</small></div>`;
  document.getElementById("listCheckinBulanIni").innerHTML = bulanIni.length ? bulanIni.map(row).join("") : "<p style='text-align:center;padding:50px;color:#666'>Belum ada</p>";
  document.getElementById("listCheckinBulanLalu").innerHTML = bulanLalu.length ? bulanLalu.map(row).join("") : "<p style='text-align:center;padding:50px;color:#666'>Belum ada</p>";
}

window.laporCheckinWA = async function() {
  await loadCheckinList();
  const bulanIni = Array.from(document.querySelectorAll("#listCheckinBulanIni .checkout-item")).map(el => el.querySelector("small").textContent);
  const bulanLalu = Array.from(document.querySelectorAll("#listCheckinBulanLalu .checkout-item")).map(el => el.querySelector("small").textContent);

  let msg = "*LAPORAN CHECK-IN KOST*\n\n";
  msg += `*Bulan Ini*: ${bulanIni.length} orang\n${bulanIni.map((l,i)=>`${i+1}. ${l}`).join("\n") || "Kosong"}\n\n`;
  msg += `*Bulan Lalu*: ${bulanLalu.length} orang\n${bulanLalu.map((l,i)=>`${i+1}. ${l}`).join("\n") || "Kosong"}`;
  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(msg));
};
