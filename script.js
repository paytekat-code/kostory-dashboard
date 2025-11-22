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
  document.getElementById("checkinListPage").classList.add("hidden");
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
    const card = document.createElement("div");
    card.classList.add("kost-card");
    card.innerHTML = `<h2 style="color:#1e40af;font-size:24px;margin-bottom:20px">${namaKost}</h2>
      <div class="room-grid"></div>`;
    container.appendChild(card);
    const grid = card.querySelector(".room-grid");
    kosts[namaKost].forEach(room => {
      db.ref(`kosts/${namaKost}/${room}`).once("value").then(snap => {
        const d = snap.val();
        const div = document.createElement("div");
        div.classList.add("room");
        div.onclick = () => openModal(namaKost, room, d?.checkout);
        if (!d) {
          div.classList.add("kosong");
          div.innerHTML = room + " <br><small>Kosong</small>";
        } else {
          totalTerisi++;
          div.classList.add(d.status || "staying");
          div.innerHTML = room + " <br><small>" + d.nama + "</small>";
        }
        grid.appendChild(div);
        updateTotal(totalKamar, totalTerisi);
      });
    });
  });
  container.removeChild(container.firstChild); // hapus loading
}

function updateTotal(total, terisi) {
  document.getElementById("totalStats").innerHTML = `Total Kamar: ${total} | Terisi: ${terisi} (${Math.round(terisi/total*100)}%)`;
}

window.openModal = function(kost, room, fromCheckout = false) {
  currentKost = kost;
  currentRoom = room;
  const modal = document.getElementById("detailModal");
  modal.classList.remove("hidden");
  const title = document.getElementById("modalTitle");
  const buttons = document.getElementById("modalButtons");
  buttons.innerHTML = "";
  const ref = db.ref((fromCheckout ? 'checkout/' : 'kosts/') + kost + '/' + room);
  ref.once("value").then(snap => {
    currentData = snap.val() || {};
    title.textContent = (currentData.nama ? 'DETAIL / EDIT' : 'CHECK-IN BARU') + ' KAMAR ' + room;
    ['nama', 'hp', 'alamat', 'perusahaan', 'tanggalLahir', 'jenis', 'durasi', 'kendaraan', 'harga', 'deposit', 'tanggal', 'tokenAwal', 'tokenAkhirCheckout', 'noRek', 'namaBank', 'namaRekening', 'catatan', 'namaKeluarga', 'hubunganKeluarga', 'hpKeluarga'].forEach(id => document.getElementById(id).value = currentData[id] || '');
    document.getElementById("statusPenghuni").value = currentData.status || 'staying';
    document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split('T')[0];
    hitungSelisihToken();
    buttons.innerHTML = `
      <button class="btn-danger" onclick="closeModal()">Batal</button>
      <button class="btn-success full" onclick="simpanData()">${currentData.nama ? 'UPDATE' : 'CHECK-IN'}</button>`;
    if (currentData.nama && !currentData.checkout) {
      buttons.innerHTML += `<button class="btn-wa" onclick="kirimWA()">KIRIM WA</button>`;
      buttons.innerHTML += `<button class="btn-danger" onclick="checkoutModal()">CHECK-OUT</button>`;
      buttons.innerHTML += `<button class="tagih-btn" onclick="tagihModal()">TAGIH</button>`;
      buttons.innerHTML += `<button class="lunas-btn" onclick="lunasModal()">LUNAS</button>`;
    }
  });
};

window.simpanData = function() {
  const data = {
    status: document.getElementById("statusPenghuni").value,
    nama: document.getElementById("nama").value,
    hp: document.getElementById("hp").value,
    alamat: document.getElementById("alamat").value,
    perusahaan: document.getElementById("perusahaan").value,
    tanggalLahir: document.getElementById("tanggalLahir").value,
    jenis: document.getElementById("jenis").value,
    durasi: document.getElementById("durasi").value,
    kendaraan: document.getElementById("kendaraan").value,
    harga: Number(document.getElementById("harga").value),
    deposit: Number(document.getElementById("deposit").value),
    tanggalMasuk: document.getElementById("tanggal").value,
    tokenAwal: Number(document.getElementById("tokenAwal").value),
    tokenAkhirCheckout: Number(document.getElementById("tokenAkhirCheckout").value),
    noRek: document.getElementById("noRek").value,
    namaBank: document.getElementById("namaBank").value,
    namaRekening: document.getElementById("namaRekening").value,
    catatan: document.getElementById("catatan").value,
    namaKeluarga: document.getElementById("namaKeluarga").value,
    hubunganKeluarga: document.getElementById("hubunganKeluarga").value,
    hpKeluarga: document.getElementById("hpKeluarga").value
  };
  if (!data.nama || !data.hp) return alert("Nama dan HP wajib diisi!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).set(data).then(() => {
    closeModal();
    alert("Data disimpan!");
    loadDashboard();
  });
};

window.checkoutModal = function() {
  closeModal();
  document.getElementById("coNama").textContent = currentData.nama;
  document.getElementById("coKamar").textContent = currentRoom;
  document.getElementById("tanggalCheckout").value = new Date().toISOString().split('T')[0];
  document.getElementById("tokenAkhir").value = '';
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

window.tagihModal = function() {
  closeModal();
  document.getElementById("jatuhTempo").value = new Date().toISOString().split('T')[0];
  document.getElementById("nominalTagihan").value = currentData.harga || '';
  document.getElementById("tagihModal").classList.remove("hidden");
};

window.kirimTagihan = function() {
  const tempo = document.getElementById("jatuhTempo").value;
  const nominal = Number(document.getElementById("nominalTagihan").value);
  if (!tempo || !nominal) return alert("Isi lengkap!");
  const pesan = `*TAGIHAN KOST*\n\nKepada: ${currentData.nama}\nKamar: ${currentRoom}\n\nNominal: Rp. ${nominal.toLocaleString("id-ID")}\nJatuh Tempo: ${formatDate(tempo)}\n\nSilakan transfer ke:\nRek: ${currentData.noRek || '-'} a/n ${currentData.namaRekening || '-'} (${currentData.namaBank || '-'})`;
  window.open(`https://wa.me/${currentData.hp}?text=${encodeURIComponent(pesan)}`, "_blank");
  closeModal();
};

window.lunasModal = function() {
  closeModal();
  document.getElementById("tanggalBayar").value = new Date().toISOString().split('T')[0];
  document.getElementById("jumlahBayar").value = currentData.harga || '';
  document.getElementById("lunasModal").classList.remove("hidden");
};

window.catatLunas = function() {
  const tgl = document.getElementById("tanggalBayar").value;
  const jumlah = Number(document.getElementById("jumlahBayar").value);
  if (!tgl || !jumlah) return alert("Isi lengkap!");
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({lunas: true, tanggalLunas: tgl, jumlahLunas: jumlah}).then(() => {
    closeModal();
    alert("Pelunasan dicatat!");
    loadDashboard();
  });
};

window.showPenghuniList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");
  await loadPenghuniList();
};

async function loadPenghuniList() {
  const container = document.getElementById("penghuniListContainer");
  container.innerHTML = "<div style='text-align:center;padding:80px;color:#666'>Loading...</div>";
  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        list.push({kost, room, d});
      }
    }
  }

  list.sort((a,b) => hariKeUlangTahun(a.d.tanggalLahir) - hariKeUlangTahun(b.d.tanggalLahir));

  container.innerHTML = list.map(p => {
    const d = p.d;
    const ulangTahun = hariKeUlangTahun(d.tanggalLahir);
    const ulangText = ulangTahun === 0 ? '🎉 Hari Ini!' : `dalam ${ulangTahun} hari`;
    const lunas = d.lunas ? '<span class="status-lunas">LUNAS</span>' : '<span style="background:#fee2e2;color:#b91c1c;padding:6px 12px;border-radius:8px;font-weight:bold;font-size:13px">Belum Lunas</span>';
    return `<div class="penghuni-item" onclick="openModal('${p.kost}','${p.room}')">
      <div style="flex:1;min-width:200px">
        <strong>${p.room} | ${d.nama}</strong><br>
        <small>${d.hp} • ${d.durasi} • Lama tinggal: ${hitungLamaTinggal(d.tanggalMasuk)}</small><br>
        <small>Ulang tahun: ${ulangText}</small>
      </div>
      ${lunas}
    </div>`;
  }).join("");
}

window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");
  await loadCheckoutList();
};

async function loadCheckoutList() {
  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    if (!allowedKosts.includes(kost)) return;
    Object.keys(all[kost] || {}).forEach(room => {
      const d = all[kost][room];
      if (d && d.tanggalCheckout) {
        const item = {
          kost, room, nama: d.nama || "-", durasi: d.durasi || "Bulanan",
          tanggalCheckout: d.tanggalCheckout,
          lama: hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)
        };
        const coDate = new Date(d.tanggalCheckout);
        if (coDate.getMonth() === thisMonth && coDate.getFullYear() === thisYear) {
          bulanIni.push(item);
        } else {
          sebelumnya.push(item);
        }
      }
    });
  });

  bulanIni.sort((a,b) => new Date(b.tanggalCheckout) - new Date(a.tanggalCheckout));
  sebelumnya.sort((a,b) => new Date(b.tanggalCheckout) - new Date(a.tanggalCheckout));

  const renderItem = (d, i) => `
    <div class="checkout-item" onclick="openModal('${d.kost}','${d.room}', true)">
      <strong>${i+1}. ${d.room} | ${d.nama}</strong><br>
      <small>${d.durasi} | ${formatDate(d.tanggalCheckout)} | ${d.lama}</small>
    </div>`;

  document.getElementById("checkoutBulanIni").innerHTML = bulanIni.map(renderItem).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada check-out</p>";
  document.getElementById("checkoutSebelumnya").innerHTML = sebelumnya.map(renderItem).join("") || "<p style='text-align:center;color:#666;padding:30px'>Tidak ada</p>";
}

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
        list.push({ room, nama: d.nama, status, tgl, jumlah });
      }
    }
  }

  let pesan = "*LAPORAN PEMBAYARAN*\n";
  pesan += formatDate(new Date()) + "\n\n";

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

window.laporCheckout = async function() {
  const bulanIni = [], sebelumnya = [];
  const now = new Date(), thisMonth = now.getMonth(), thisYear = now.getFullYear();
  const snap = await db.ref("checkout").once("value");
  const all = snap.val() || {};

  Object.keys(all).forEach(kost => {
    Object.keys(all[kost] || {}).forEach(room => {
      const d = all[kost][room];
      if (d && d.tanggalCheckout) {
        const item = {
          kost, room, nama: d.nama || "-", durasi: d.durasi || "Bulanan",
          tanggalCheckout: d.tanggalCheckout,
          lama: hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)
        };
        const coDate = new Date(d.tanggalCheckout);
        if (coDate.getMonth() === thisMonth && coDate.getFullYear() === thisYear) {
          bulanIni.push(item);
        } else {
          sebelumnya.push(item);
        }
      }
    });
  });

  bulanIni.sort((a,b) => new Date(b.tanggalCheckout) - new Date(a.tanggalCheckout));
  sebelumnya.sort((a,b) => new Date(b.tanggalCheckout) - new Date(a.tanggalCheckout));

  let pesan = "*LAPORAN CHECK-OUT*\n";
  pesan += formatDate(new Date()) + "\n\n";

  pesan += "*Bulan Ini:*\n";
  if (bulanIni.length === 0) {
    pesan += "Belum ada check-out\n\n";
  } else {
    bulanIni.forEach((d, i) => {
      pesan += `${i+1}. ${d.room} | ${d.nama} | ${d.durasi} | ${formatDate(d.tanggalCheckout)} | ${d.lama}\n`;
    });
    pesan += "\n";
  }

  pesan += "*Sebelumnya:*\n";
  if (sebelumnya.length === 0) {
    pesan += "Tidak ada\n";
  } else {
    sebelumnya.forEach((d, i) => {
      pesan += `${i+1}. ${d.room} | ${d.nama} | ${d.durasi} | ${formatDate(d.tanggalCheckout)} | ${d.lama}\n`;
    });
  }

  pesan += "\nTeam Kostory";

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};
// === FITUR DAFTAR CHECK-IN + LAPORAN WA ===
window.showCheckinList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("checkinListPage").classList.remove("hidden");
  await loadCheckinList();
};

async function loadCheckinList() {
  const bulanIni = [], bulanLalu = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // Ambil dari penghuni aktif (kosts/)
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && d.tanggalMasuk) {
        const tglMasuk = new Date(d.tanggalMasuk);
        const m = tglMasuk.getMonth();
        const y = tglMasuk.getFullYear();
        const item = {
          kost,
          room,
          nama: d.nama,
          tanggalCheckin: formatDate(d.tanggalMasuk),
          durasi: d.durasi || "Bulanan",
          tokenAwal: d.tokenAwal || 0,
          status: "Masih Tinggal"
        };
        if (m === thisMonth && y === thisYear) {
          bulanIni.push(item);
        } else if (m === lastMonth && y === lastYear) {
          bulanLalu.push(item);
        }
      }
    }
  }

  // Ambil dari yang sudah check-out (checkout/)
  const checkoutSnap = await db.ref("checkout").once("value");
  const allCheckout = checkoutSnap.val() || {};
  Object.keys(allCheckout).forEach(kost => {
    if (!allowedKosts.includes(kost)) return;
    Object.keys(allCheckout[kost] || {}).forEach(room => {
      const d = allCheckout[kost][room];
      if (d && d.nama && d.tanggalMasuk) {
        const tglMasuk = new Date(d.tanggalMasuk);
        const m = tglMasuk.getMonth();
        const y = tglMasuk.getFullYear();
        const item = {
          kost,
          room,
          nama: d.nama,
          tanggalCheckin: formatDate(d.tanggalMasuk),
          durasi: d.durasi || "Bulanan",
          tokenAwal: d.tokenAwal || 0,
          status: "CHECK-OUT"
        };
        if (m === thisMonth && y === thisYear) {
          bulanIni.push(item);
        } else if (m === lastMonth && y === lastYear) {
          bulanLalu.push(item);
        }
      }
    });
  });

  // Urutkan terbaru
  bulanIni.sort((a, b) => new Date(b.tanggalCheckin) - new Date(a.tanggalCheckin));
  bulanLalu.sort((a, b) => new Date(b.tanggalCheckin) - new Date(a.tanggalCheckin));

  const renderItem = (item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.nama}</td>
      <td>${item.room}</td>
      <td>${item.tanggalCheckin}</td>
      <td>${item.durasi}</td>
    </tr>`;

  document.getElementById("listCheckinBulanIni").innerHTML = `
    <table class="table table-bordered table-hover">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>No Kamar</th>
          <th>Tanggal Check-in</th>
          <th>Durasi</th>
        </tr>
      </thead>
      <tbody>
        ${bulanIni.map(renderItem).join('')}
      </tbody>
    </table>` || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";

  document.getElementById("listCheckinBulanLalu").innerHTML = `
    <table class="table table-bordered table-hover">
      <thead>
        <tr>
          <th>No</th>
          <th>Nama</th>
          <th>No Kamar</th>
          <th>Tanggal Check-in</th>
          <th>Durasi</th>
        </tr>
      </thead>
      <tbody>
        ${bulanLalu.map(renderItem).join('')}
      </tbody>
    </table>` || "<p style='text-align:center;color:#666;padding:30px'>Belum ada</p>";
}

window.laporCheckinWA = async function() {
  const bulanIni = [], bulanLalu = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  // Sama seperti loadCheckinList, tapi untuk teks WA
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && d.tanggalMasuk) {
        const tglMasuk = new Date(d.tanggalMasuk);
        const m = tglMasuk.getMonth();
        const y = tglMasuk.getFullYear();
        const line = `${room} | ${d.nama} | ${formatDate(d.tanggalMasuk)} | ${d.durasi || "Bulanan"} | ${d.tokenAwal || 0} | Masih Tinggal`;
        if (m === thisMonth && y === thisYear) {
          bulanIni.push(line);
        } else if (m === lastMonth && y === lastYear) {
          bulanLalu.push(line);
        }
      }
    }
  }

  const checkoutSnap = await db.ref("checkout").once("value");
  const allCheckout = checkoutSnap.val() || {};
  Object.keys(allCheckout).forEach(kost => {
    if (!allowedKosts.includes(kost)) return;
    Object.keys(allCheckout[kost] || {}).forEach(room => {
      const d = allCheckout[kost][room];
      if (d && d.nama && d.tanggalMasuk) {
        const tglMasuk = new Date(d.tanggalMasuk);
        const m = tglMasuk.getMonth();
        const y = tglMasuk.getFullYear();
        const line = `${room} | ${d.nama} | ${formatDate(d.tanggalMasuk)} | ${d.durasi || "Bulanan"} | ${d.tokenAwal || 0} | CHECK-OUT`;
        if (m === thisMonth && y === thisYear) {
          bulanIni.push(line);
        } else if (m === lastMonth && y === lastYear) {
          bulanLalu.push(line);
        }
      }
    });
  });

  let pesan = "*Laporan Check in*\n\n";
  pesan += `Bulan ini : ${bulanIni.length} Orang\n\n`;
  if (bulanIni.length > 0) {
    bulanIni.forEach((l, i) => pesan += `${i+1}. ${l}\n`);
  } else {
    pesan += "Belum ada\n\n";
  }
  pesan += `Bulan lalu : ${bulanLalu.length} Orang\n\n`;
  if (bulanLalu.length > 0) {
    bulanLalu.forEach((l, i) => pesan += `${i+1}. ${l}\n`;
  } else {
    pesan += "Belum ada\n";
  }

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};
