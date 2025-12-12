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

const hakAkses = { 
  "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra",
  "ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" 
};

const passwordDb = { 
  "admin":"ramenuno20","mekar":"kopipait69","satria":"cilukba123","mitra":"ayamgeprek77",
  "ecokost":"mirebus08","mitraya":"odading88","inaya":"nasiuduk21" 
};

let currentUser = null;
let allowedKosts = [];
let currentKost = null, currentRoom = null, currentData = null;

// ====================== HELPER FUNCTIONS ======================
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

function closeModal() { 
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); 
}

function backToDashboard() {
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// ====================== LOGIN ======================
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
    alert("Username/password salah!");
  }
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

// ====================== DASHBOARD ======================
function loadDashboard() {
  const container = document.getElementById("kostList");
  container.innerHTML = "<div style='text-align:center;padding:80px;color:#666'>Loading...</div>";
  document.getElementById("totalStats").innerHTML = "Memuat data...";
  let totalKamar = 0, totalTerisi = 0;
  container.innerHTML = "";   // <--- TAMBAHKAN BARIS INI
  Object.keys(kosts).forEach(namaKost => {
    if (!allowedKosts.includes(namaKost)) return;
    totalKamar += kosts[namaKost].length;

    const card = document.createElement("div");
    card.className = "kost-card";
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;flex-wrap:wrap;gap:10px">
        <h3>${namaKost}</h3>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-wa" onclick="laporKost('${namaKost}')">LAPOR</button>
          <button class="btn" style="background:#7c3aed;color:white" onclick="laporCiCo('${namaKost}')">Ci-Co</button>
        </div>
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
      box.innerHTML = `${room}<br><small>KOSONG</small>`;
      box.onclick = () => openModal(namaKost, room);
      grid.appendChild(box);

      db.ref(`kosts/${namaKost}/${room}`).on("value", s => {
        const d = s.val();
        if (d && d.nama && !d.checkout) {
          terisi++; totalTerisi++;
          box.className = `room ${d.statusPenghuni || "staying"}`;
          box.innerHTML = `${room}<br><small>${d.nama}</small>`;
        } else {
        
          box.className = "room kosong";
          box.innerHTML = `${room}<br><small>KOSONG</small>`;
        }
        occ.textContent = terisi;
        document.getElementById("totalStats").innerHTML = `Total Terisi: ${totalTerisi} / ${totalKamar} (${Math.round(totalTerisi/totalKamar*100)}%)`;
      });
    });
  });
}

// ====================== WELCOME MESSAGE (BARU!) ======================
window.kirimWelcome = function(nama, hp, kost) {
  if (!hp || hp.trim() === "") {
    alert("Nomor HP kosong untuk " + nama);
    return;
  }
  const pesan = `Selamat bergabung kak *${nama}* di *${kost}*!\n\nSenang sekali kakak sudah bergabung jadi keluarga besar Kostory\n\nIni peraturan singkat kami ya kak supaya sama-sama nyaman:\n\n1. Perpanjangan kost maks 1 hari dilunasi sebelum Sewa habis, telat didenda Rp.25.000/hari.\n2. Hanya orangtua/anak/kakak/adik kandung yang boleh ke kamar/nginap, lainya hanya sampai teras.🤪\n3. Jam 23.00 WIB semua pintu akan dikunci.\n4. Dilarang masak dan nyuci di kamar.\n5. Listrik token pribadi, isi sendiri ya kak\n6. Tiap 2 minggu kamar akan dibersihin, ingetin pengurus Kost jika lupa.\n7. Parkir ngikutin aturan Pengurus Kost, jangan ngatur sendiri.\n8. Ga boleh taro barang pribadi ditempat umum seperti di dapur, selasar dll.\n9. Ketauan merokok/Vape didalam kost -> denda 500rb perkejadian.\n10. Berteriak-teriak, bertengkar, mabok, ngobat -> minimal dikeluarin 💪 \n11. ini *Penting!* ; Pengurus Kost adalah teman tinggal dan bercerita, bukan ART!, mohon saling menghormati dan menjaga sikap untuk kenyamanan bersama.\n\nKalau ada komplen bisa langsung ke Pengurus Kost ato chat WA mimin : 081383210009  😊 \n\nSekali lagi, selamat menempati kamar baru! Semoga betah & kerasan\n\nSalam hangat,\nTim Kostory`;
  
  const phone = hp.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
};

// ====================== MODAL INPUT ======================
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

  document.getElementById("tanggal").value = currentData.tanggalMasuk || new Date().toISOString().split("T")[0];
  document.getElementById("statusPenghuni").value = currentData.statusPenghuni || "staying";

  // sembunyikan field checkout kalau bukan dari halaman checkout
  ["tokenAkhirCheckout", "selisihToken"].forEach(id => {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label && label.parentElement) label.parentElement.style.display = fromCheckout ? "block" : "none";
  });
  document.getElementById("infoSelisih").style.display = fromCheckout ? "block" : "none";

  if (fromCheckout) {
    document.getElementById("tokenAkhirCheckout").value = currentData.tokenAkhir || "";
    hitungSelisihToken();
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
  const data = updateDataOnly();
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

// ====================== SHARE & LAPOR ======================
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

  pesan += `\nPowered by KostoryApps`;
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
      penghuniList.push({
        room, nama: d.nama, hp: d.hp || "-", durasi: d.durasi || "Bulanan",
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
    `*Kendaraan:*\nMobil (${mobilList.length}): ${mobilList.join(", ") || "-"}\nMotor (${motorList.length}): ${motorList.join(", ") || "-"}\n\n` +
    `Powered by KostoryApps`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// ====================== UCAPAN ULANG TAHUN & PERPISAHAN ======================
window.kirimPerpisahan = function(nama, hp) {
  if (!hp || hp.trim() === "") {
    alert("Nomor HP tidak tersedia untuk " + nama);
    return;
  }

  // Ambil tanggal dari variabel global (currentData dan tanggalCheckout dari prosesCheckout)
  if (!currentData || !currentData.tanggal || !tanggalCheckout) {
    alert("Data tanggal tidak lengkap untuk " + nama);
    return;
  }

  const tanggalFmt = formatDate(tanggalCheckout);
  const lama = hitungLamaTinggal(currentData.tanggal, tanggalCheckout);

  const pesan = `Halo Kak *${nama}*
 
Menurut catatan kami kakak telah check-out dari Kostory pada tanggal *${tanggalFmt}*, dan telah tinggal selama ${lama}.

kami mengucapkan terimakasih banyak sudah tinggal selama itu, semoga kak ${nama.toLowerCase()} selalu sehat dan makin sukses ditempat yang baru.

Kami memohon maaf apabila selama kakak tinggal, masih banyak kekurangan dalam pelayanan kami, Jika kakak butuh tempat tinggal lagi, Pintu kostory akan selalu terbuka 😊

Salam Kostorian,
Tim Kostory

Info & Pemesanan : 081383210009 (WA only).`;
  
  const phone = hp.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
};

// ====================== DAFTAR CHECK-OUT (DENGAN FILTER AKSES) ======================
window.showCheckoutList = async function() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.remove("hidden");

  const bulanIni = [], sebelumnya = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const minMonth = ((thisMonth - 2) + 12) % 12;
  const minYear = thisMonth - 2 < 0 ? thisYear - 1 : thisYear;

  // Hanya ambil data checkout dari kost yang boleh diakses user
  for (const kost of allowedKosts) {
    const snap = await db.ref(`checkout/${kost}`).once("value");
    const dataKost = snap.val() || {};

    for (const room in dataKost) {
      const d = dataKost[room];
      if (d && d.tanggalCheckout) {
        const coDate = new Date(d.tanggalCheckout);
        const item = {kost, room, ...d, coDate};

        if (coDate.getMonth() === thisMonth && coDate.getFullYear() === thisYear) {
          bulanIni.push(item);
        } else if (coDate.getFullYear() > minYear || (coDate.getFullYear() === minYear && coDate.getMonth() >= minMonth)) {
          sebelumnya.push(item);
        }
      }
    }
  }

  bulanIni.sort((a,b) => b.coDate - a.coDate);
  sebelumnya.sort((a,b) => b.coDate - a.coDate);

  document.querySelector("#checkoutListPage #header").innerHTML = `
    <h1>Daftar Check-out</h1>
    <button class="btn" onclick="backToDashboard()">Kembali</button>`;

  document.getElementById("listBulanIni").innerHTML = bulanIni.map((d,i) => `
    <div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <div>
          <strong>${i+1}. ${d.nama}</strong><br>
          <small>${formatDate(d.tanggalCheckout)} • ${hitungLamaTinggal(d.tanggalMasuk, d.tanggalCheckout)}</small>
        </div>
        <button onclick="event.stopPropagation(); kirimPerpisahan('${d.nama}','${d.hp || ''}')" 
                style="background:#25d366;color:white;padding:8px 12px;border:none;border-radius:8px;font-weight:bold;font-size:12px;">
          Kirim Perpisahan
        </button>
      </div>
    </div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Belum ada check-out bulan ini</p>";

  document.getElementById("listSebelumnya").innerHTML = sebelumnya.map(d => `
    <div class="checkout-item" onclick="openModal('${d.kost}','${d.room}',true)">
      <strong>${d.nama}</strong><br>
      <small>${formatDate(d.tanggalCheckout)} • ${d.kost} - ${d.room}</small>
    </div>`).join("") || "<p style='text-align:center;color:#666;padding:30px'>Tidak ada data 3 bulan terakhir</p>";
};

// ====================== TAGIH & LUNAS ======================
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
  const pesan = `Hai Kak ${window.currentNamaTagih}👋\n\nMau ngingetin aja ya, masa sewa kamar Kakak di Kostory bakal berakhir tanggal *${formatDate(tgl)}*\nKalau Kakak mau lanjut, biaya perpanjangannya *Rp ${Number(nominal).toLocaleString()}*, Boleh banget dibayarkan maksimal 1 hari sebelum masa sewa habis ya, Kak..\n\nMakasih banyak 🙏.\nSalam Kostorian!\nTim Kostory`;
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
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({
    lunas: true,
    tanggalLunas: tgl,
    jumlahLunas: jumlah
  }).then(() => {
    closeModal(); alert("Lunas tercatat!"); showPenghuniList();
  });
};

// ====================== CHECKOUT ======================
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
  const finalData = {...currentData, checkout: true, tanggalCheckout: tgl, tokenAkhir, selisihToken: tokenAkhir - (currentData.tokenAwal || 0)};
  db.ref(`checkout/${currentKost}/${currentRoom}`).set(finalData).then(() => {
    db.ref(`kosts/${currentKost}/${currentRoom}`).remove().then(() => {
      closeModal(); alert("Check-out berhasil!");
      loadDashboard();
    });
  });
};

// ====================== LAPOR PEMBAYARAN & CI-CO ======================
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

  pesan += "\nPowered by KostoryApp 2025";
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
  if (ciLast.length > 0) {
    ciLast.forEach((p, i) => {
      pesan += `${i+1}. ${p.room} | ${p.nama} | ${p.durasi} | ${formatDate(p.tglMasuk)} | - | ${p.tokenAwal} | - | Masih Tinggal\n`;
    });
  } else {
    pesan += "Tidak ada\n";
  }

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

  pesan += `\nPowered by KostoryApps ❤️`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};

// ====================== FULL JS: IZIN PERAWATAN (TANPA UBAH INDEX.HTML) ======================

// Buat modal perawatan sekali saja saat halaman pertama kali dibuka
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("perawatanModal")) return; // sudah ada, skip

  const modalHTML = `
    <div id="perawatanModal" class="modal hidden" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;">
      <div style="background:white;padding:25px;border-radius:12px;width:90%;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,0.3);">
        <h3 style="margin:0 0 15px 0;color:#1f2937;">Izin Perawatan Kamar</h3>
        <p style="margin:0 0 15px 0;color:#4b5563;">Pilih tanggal rencana perawatan:</p>
        <input type="date" id="tanggalPerawatan" style="width:100%;padding:12px;margin-bottom:20px;border:1px solid #d1d5db;border-radius:8px;font-size:16px;">
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="btn-secondary" onclick="document.getElementById('perawatanModal').classList.add('hidden')">
            Batal
          </button>
          <button class="btn-wa" onclick="kirimIzinPerawatan()">Kirim WA</button>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML("beforeend", modalHTML);
});

// Fungsi buka modal + simpan data sementara
window.bukaIzinPerawatan = function(kost, room, nama, hp) {
  window.currentNamaPerawatan = nama;
  window.currentHpPerawatan = hp || "";

  // default 3 hari ke depan
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 3);
  document.getElementById("tanggalPerawatan").value = defaultDate.toISOString().split("T")[0];

  document.getElementById("perawatanModal").classList.remove("hidden");
};

// Fungsi kirim WA
window.kirimIzinPerawatan = function() {
  const tgl = document.getElementById("tanggalPerawatan").value;
  if (!tgl) return alert("Pilih tanggal dulu ya kak!");

  const tanggalFormat = new Date(tgl).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const pesan = `Hai Kak *${window.currentNamaPerawatan}*,\n\n` +
    `Mau info dikit ya, kak.\n` +
    `Tanggal *${tanggalFormat}* kami rencana ada perawatan kamar kk.\n\n` +
    `Kalau ada barang Kakak yang perlu dipindahin, lagi dipakai, atau mau minta ganti jadwal, tinggal kabarin aja ya.\n\n` +
    `Bisa lewat Pengurus Kost, atau langsung chat minkost di WA\n` +
    `081383210009\n\n` +
    `Makasih banyak atas pengertiannya ya kak!\n\n` +
    `Salam Kostorian\nTim Kostory`;

  if (!window.currentHpPerawatan || window.currentHpPerawatan.trim() === "") {
    alert("Nomor HP kosong, tidak bisa kirim WA ke " + window.currentNamaPerawatan);
    return;
  }

  const phone = window.currentHpPerawatan.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");

  document.getElementById("perawatanModal").classList.add("hidden");
};
// CATAT TANGGAL DIBERSIHKAN
window.catatBersih = function(kost, room) {
  if (!confirm("Tandai kamar ini sudah dibersihkan hari ini?")) return;
  
  const today = new Date().toISOString().split('T')[0];
  db.ref(`kosts/${kost}/${room}`).update({
    tanggalBersih: today
  }).then(() => {
    alert(`Kamar ${room} tercatat sudah dibersihkan pada ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}`);
    showPenghuniList(); // refresh list
  });
};
// ====================== LAPORAN PEMBERSIHAN KAMAR KE WA ======================
// ====================== LAPORAN PEMBERSIHAN KAMAR (FORMAT BARU) ======================
window.laporPembersihan = async function() {
  const today = new Date();
  const list = [];

  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();

      if (d && d.nama && d.tanggalMasuk) {
        const checkIn = new Date(d.tanggalMasuk);
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0);

        // Hitung siklus 14 hari dari check-in
        const hariSejakMasuk = Math.floor((hariIni - checkIn) / 86400000);
        const siklus = Math.floor(hariSejakMasuk / 14);
        const jadwalBerikutnya = new Date(checkIn);
        jadwalBerikutnya.setDate(checkIn.getDate() + (siklus + 1) * 14);

        // Format tanggal singkat: 24 Nov 25
        const fmt = (date) => date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "2-digit" }).replace(".", "");

        const jadwalStr = fmt(jadwalBerikutnya);
        const terakhirStr = d.tanggalBersih ? fmt(new Date(d.tanggalBersih)) : "-";

        // Hitung status
        let status = "-";
        if (d.tanggalBersih) {
          const terakhirDate = new Date(d.tanggalBersih);
          const selisihHari = Math.floor((jadwalBerikutnya - terakhirDate) / 86400000);
          status = selisihHari > 7 ? "Belum dibersihkan" : "Sudah dibersihkan";
        }

        list.push({
          room,
          nama: d.nama.trim(),
          jadwal: jadwalStr,
          terakhir: terakhirStr,
          status
        });
      }
    }
  }

  // Urutkan per kost dulu, lalu nomor kamar
  list.sort((a, b) => {
    const kostA = Object.keys(kosts).find(k => kosts[k].includes(a.room));
    const kostB = Object.keys(kosts).find(k => kosts[k].includes(b.room));
    if (kostA !== kostB) return kostA.localeCompare(kostB);
    return a.room.localeCompare(b.room);
  });

  // Bangun pesan WhatsApp
  let pesan = `*Laporan Pembersihan Kamar*\n`;
  pesan += `${today.getDate()} ${today.toLocaleDateString("id-ID", { month: "long" })} ${today.getFullYear()}\n\n`;

  list.forEach((p, i) => {
    const no = (i + 1).toString().padStart(2, "0");   // 01, 02, 03, …
    pesan += `${no}. ${p.room} | ${p.nama} | ${p.jadwal} | ${p.terakhir} | *${p.status}*\n`;
});

  if (list.length === 0) {
    pesan += "Belum ada penghuni aktif.\n";
  }

  pesan += `\nPowered by KostoryApps ❤️`;

  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
};// ====================== DAFTAR PENGHUNI (VERSI TERBARU + FITUR BERSIH KAMAR) ======================
window.showPenghuniList = async function(sortBy = "default") {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");

  // Header dengan dropdown sort
  document.querySelector("#penghuniListPage #header").innerHTML = `
    <h2>Daftar Penghuni</h2>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
      <select id="sortSelect" onchange="showPenghuniList(this.value)" style="padding:10px;border-radius:8px;border:2px solid #e2e8f0;font-size:15px;">
        <option value="default" ${sortBy==='default' ? 'selected' : ''}>Urutkan: Default (Ultah Terdekat)</option>
        <option value="lama" ${sortBy==='lama' ? 'selected' : ''}>Paling Lama Ngekos</option>
        <option value="ultah" ${sortBy==='ultah' ? 'selected' : ''}>Ultah Terdekat</option>
        <option value="bayar" ${sortBy==='bayar' ? 'selected' : ''}>Pembayaran Terbaru</option>
        <option value="bersih" ${sortBy==='bersih' ? 'selected' : ''}>Dibersihkan Terbaru</option>
      </select>
      <button class="btn btn-wa" onclick="laporPembayaran()">LAPOR PEMBAYARAN</button>
      <button class="btn" style="background:#f59e0b;color:white" onclick="laporPembersihan()">LAPOR BERSIH KAMAR</button>
      <button class="btn" onclick="backToDashboard()">Kembali</button>
    </div>
  `;

  const list = [];
  for (const kost of allowedKosts) {
    for (const room of kosts[kost]) {
      const snap = await db.ref(`kosts/${kost}/${room}`).once("value");
      const d = snap.val();
      if (d && d.nama && !d.checkout) {
        list.push({ kost, room, ...d });
      }
    }
  }

  // Sorting logic
  if (sortBy === "lama") {
    list.sort((a, b) => new Date(a.tanggalMasuk) - new Date(b.tanggalMasuk)); // paling lama dulu
  } else if (sortBy === "ultah") {
    list.sort((a, b) => hariKeUlangTahun(a.tanggalLahir) - hariKeUlangTahun(b.tanggalLahir));
  } else if (sortBy === "bayar") {
    list.sort((a, b) => {
      const ta = a.tanggalLunas ? new Date(a.tanggalLunas) : new Date(0);
      const tb = b.tanggalLunas ? new Date(b.tanggalLunas) : new Date(0);
      return tb - ta; // terbaru dulu
    });
  } else if (sortBy === "bersih") {
    list.sort((a, b) => {
      const ta = a.tanggalBersih ? new Date(a.tanggalBersih) : new Date(0);
      const tb = b.tanggalBersih ? new Date(b.tanggalBersih) : new Date(0);
      return tb - ta; // terbaru dulu
    });
  } else {
    // default: ultah terdekat
    list.sort((a, b) => hariKeUlangTahun(a.tanggalLahir) - hariKeUlangTahun(b.tanggalLahir));
  }

  document.getElementById("listPenghuni").innerHTML = list.map(p => {
    const hariIni = isHariIniUlangTahun(p.tanggalLahir);
    let statusBayar = p.lunas 
      ? `<span style="color:#166534;font-weight:bold">Lunas ${formatDate(p.tanggalLunas)} Rp ${Number(p.jumlahLunas).toLocaleString("id-ID")}</span>`
      : `<span style="color:#dc2626;font-weight:bold">Belum Bayar</span>`;

    // Level loyalitas
    let loyalitasHTML = "";
    if (p.tanggalMasuk) {
      const hariSejakMasuk = Math.floor((new Date() - new Date(p.tanggalMasuk)) / 86400000);
      const tahun = Math.floor(hariSejakMasuk / 365);
      let level = "", warna = "";
      if (tahun >= 5) { level = "🪽 Limit Sage"; warna = "#fbbf24"; }
      else if (tahun >= 4) { level = "🧙‍♂️ Sage"; warna = "#dc2626"; }
      else if (tahun >= 3) { level = "🏰 Emperor"; warna = "#92400e"; }
      else if (tahun >= 2) { level = "👑 King"; warna = "#ec4899"; }
      else if (tahun >= 1) { level = "🕯️ Elder"; warna = "#16a34a"; }
      if (level) loyalitasHTML = ` - <i style="color:${warna};font-weight:normal;">${level}</i>`;
    }

    // Jadwal bersih kamar
    let bersihHTML = "";
    if (p.tanggalMasuk) {
      const checkIn = new Date(p.tanggalMasuk);
      const hariIniDate = new Date(); hariIniDate.setHours(0,0,0,0);
      const hariSejakMasuk = Math.floor((hariIniDate - checkIn) / 86400000);
      const siklus = Math.floor(hariSejakMasuk / 14);
      const jadwalBerikutnya = new Date(checkIn);
      jadwalBerikutnya.setDate(checkIn.getDate() + (siklus + 1) * 14);
      const telat = jadwalBerikutnya < hariIniDate;
      const formatJadwal = jadwalBerikutnya.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const terakhir = p.tanggalBersih ? new Date(p.tanggalBersih).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

      bersihHTML = `<small style="color:${telat?'#dc2626':'#f59e0b'};font-weight:bold;display:block;margin:6px 0;">
        Jadwal pembersihan kamar: ${formatJadwal} ${telat?'(TELAT!)':''}
        <button onclick="event.stopPropagation();catatBersih('${p.kost}','${p.room}')" 
                style="margin-left:8px;background:${telat?'#dc2626':'#10b981'};color:white;border:none;padding:3px 8px;border-radius:5px;font-size:10px;">
          Dibersihkan
        </button>
       <div style="font-size:10px;color:#666;margin-top:4px;">
  Dibersihkan terakhir: ${terakhir}
  ${p.tanggalBersih && currentUser === "admin" ? `
    <button onclick="event.stopPropagation();konfirmasiBersih('${p.kost}','${p.room}','${p.nama}','${p.hp||''}','${p.tanggalBersih}')" 
            style="margin-left:6px;background:#8b5cf6;color:white;border:none;padding:2px 7px;border-radius:8px;font-size:9px;cursor:pointer;">
      Kirim WA Konfirmasi
    </button>
  ` : ''}
</div>
      </small>`;
    }

    return `<div class="penghuni-item" style="cursor:pointer;" onclick="openModal('${p.kost}','${p.room}')">
      <div>
        <strong>${p.nama}${loyalitasHTML}</strong><br>
        <small>${p.kost} - ${p.room} - ${formatDate(p.tanggalMasuk)} - Rp ${Number(p.harga||0).toLocaleString("id-ID")} - ${p.durasi||'Bulanan'} - ${hitungLamaTinggal(p.tanggalMasuk)}</small><br>
        ${statusBayar}
        ${bersihHTML}
        <small style="color:#555;font-style:italic;">
          ${p.tanggalLahir ? (hariIni ? "HARI INI ULANG TAHUN!" : `${hariKeUlangTahun(p.tanggalLahir)} hari lagi ulang tahun`) : "Tanggal lahir belum diisi"}
        </small>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:8px;justify-content:flex-end;">
        <button class="btn-mini" onclick="event.stopPropagation();kirimWelcome('${p.nama}','${p.hp||''}','${p.kost}')">Welcome</button>
        <button class="btn-mini" onclick="event.stopPropagation();bukaTagih('${p.kost}','${p.room}','${p.nama}','${p.hp}')">TAGIH</button>
        <button class="btn-mini" onclick="event.stopPropagation();bukaLunas('${p.kost}','${p.room}')">LUNASI</button>
        <button class="btn-mini" style="background:${hariIni?'#dc2626':'#2563eb'};" onclick="event.stopPropagation();kirimUlangTahun('${p.nama}','${p.hp}')">
          ${hariIni?'HARI INI!':'Ulang Tahun'}
        </button>
        <button class="btn-mini" onclick="event.stopPropagation();bukaIzinPerawatan('${p.kost}','${p.room}','${p.nama}','${p.hp||''}')">
          Perawatan
        </button>
      </div>
    </div>`;
  }).join("") || "<p style='text-align:center;color:#666;padding:50px'>Belum ada penghuni aktif</p>";
};
// === KIRIM KONFIRMASI BERSIH KE PENGHUNI (KHUSUS ADMIN) ===
window.konfirmasiBersih = function(kost, room, nama, hp, tanggalBersih) {
  if (currentUser !== "admin") {
    alert("Fitur ini hanya untuk Admin!");
    return;
  }

  if (!hp || hp.trim() === "") {
    alert("Nomor HP penghuni kosong!");
    return;
  }

  if (!tanggalBersih) {
    alert("Belum ada catatan tanggal bersih!");
    return;
  }

  const tgl = new Date(tanggalBersih).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });

  const pesan = `Halo Kak *${nama}*,

Menurut catatan kami, kamar Kakak sudah selesai dibersihkan oleh Pengurus Kost pada tanggal *${tgl}*.

Kalau dirasa masih ada bagian yang kurang rapi atau kurang bersih, kabari kami ya, Kak. Dengan senang hati kami bantu bereskan lagi.

Terima kasih banyak, Kak.

Salam Kostorian!  
Tim Kostory`;

  const phone = hp.replace(/^0/, "62").replace(/[^0-9]/g, "");
  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(pesan)}`, "_blank");
};
