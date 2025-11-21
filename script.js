const firebaseConfig = { /* config kamu tetap sama */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const kosts = { /* tetap sama seperti sebelumnya */ };
const hakAkses = { "admin":"all", /* dst */ };
const passwordDb = { "admin":"ramenuno20", /* dst */ };

let currentUser = null, allowedKosts = [], currentKost = null, currentRoom = null, currentData = null;

function formatDate(d) { return new Date(d).toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"}); }
function hitungLamaTinggal(masuk) {
  const diff = Math.floor((new Date() - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun}t ${bulan}b ${hari}h`;
}
function hariKeUlangTahun(tglLahir) {
  if (!tglLahir) return 999;
  const lahir = new Date(tglLahir);
  const today = new Date();
  let next = new Date(today.getFullYear(), lahir.getMonth(), lahir.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next - today) / 86400000);
}

window.login = () => { /* login sama seperti sebelumnya */ };
window.logout = () => location.reload();
function backToDashboard() {
  document.getElementById("penghuniListPage").classList.add("hidden");
  document.getElementById("checkoutListPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

// DASHBOARD & LIST CHECK-OUT (tetap sama seperti v2.2 asli kamu)
async function loadDashboard() { /* kode dashboard asli kamu tetap utuh */ }
window.showCheckoutList = async () => { /* kode list check-out asli kamu tetap utuh */ };

// LIST PENGHUNI + FITUR TAGIH & LUNAS
window.showPenghuniList = async () => {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("penghuniListPage").classList.remove("hidden");
  const list = document.getElementById("listPenghuni");
  list.innerHTML = "Memuat penghuni...";

  const all = [];
  for (const kost of allowedKosts) {
    const snap = await db.ref(`kosts/${kost}`).once("value");
    const rooms = snap.val() || {};
    Object.keys(rooms).forEach(room => {
      const d = rooms[room];
      if (d.nama) {
        all.push({kost, room, ...d, hariUlangTahun: hariKeUlangTahun(d.tanggalLahir)});
      }
    });
  }

  all.sort((a,b) => a.hariUlangTahun - b.hariUlangTahun);

  list.innerHTML = all.map(p => `
    <div class="penghuni-item">
      <div>
        <strong>${p.nama}</strong> 
        ${p.lunas ? `<span class="status-lunas">Lunas ${formatDate(p.tanggalLunas)}</span>` : ''}
        <br><small>${p.jenis} • ${p.statusPenghuni || "staying"} • Check-in: ${formatDate(p.tanggalMasuk)} • ${hitungLamaTinggal(p.tanggalMasuk)}</small>
        <br><small style="color:#e11d48">Ulang tahun: ${p.hariUlangTahun === 0 ? "Hari ini!" : p.hariUlangTahun + " hari lagi"}</small>
      </div>
      <div>
        <button class="tagih-btn" onclick="bukaTagih('${p.kost}','${p.room}','${p.nama}','${p.hp}')">TAGIH</button>
        <button class="lunas-btn" onclick="bukaLunas('${p.kost}','${p.room}')">LUNASI</button>
      </div>
    </div>
  `).join("") || "<p>Tidak ada penghuni aktif</p>";
};

// TAGIH
window.bukaTagih = (kost, room, nama, hp) => {
  currentKost = kost; currentRoom = room;
  document.getElementById("jatuhTempo").value = new Date(Date.now() + 7*86400000).toISOString().split("T")[0];
  document.getElementById("nominalTagihan").value = "";
  document.getElementById("tagihModal").classList.remove("hidden");
  window.currentNama = nama; window.currentHP = hp;
};
window.kirimTagihan = () => {
  const tgl = document.getElementById("jatuhTempo").value;
  const nominal = Number(document.getElementById("nominalTagihan").value);
  if (!tgl || !nominal) return alert("Isi semua field!");

  const pesan = `Hai Kak ${window.currentNama} 👋\n\nKos kakak akan berakhir pada *${formatDate(tgl)}*.\nSilahkan memperpanjang kost dengan melunasi pembayaran *Rp ${nominal.toLocaleString()}* maksimal 1 hari sebelum jatuh tempo.\n\nInformasikan jika *tidak memperpanjang*.\nAbaikan pesan ini jika sudah melunasi.\n\nTerimakasih\nSalam Kostorian ❤️`;

  window.open(`https://api.whatsapp.com/send?phone=62${window.currentHP.replace(/^0/,'').replace(/[^0-9]/g,'')}&text=${encodeURIComponent(pesan)}`);
  closeModal();
};

// LUNASI
window.bukaLunas = (kost, room) => {
  currentKost = kost; currentRoom = room;
  document.getElementById("tanggalBayar").value = new Date().toISOString().split("T")[0];
  document.getElementById("lunasModal").classList.remove("hidden");
};
window.catatLunas = () => {
  const tgl = document.getElementById("tanggalBayar").value;
  const jumlah = document.getElementById("jumlahBayar").value;
  db.ref(`kosts/${currentKost}/${currentRoom}`).update({
    lunas: true,
    tanggalLunas: tgl,
    jumlahLunas: Number(jumlah)
  }).then(() => {
    closeModal();
    alert("Status lunas berhasil disimpan!");
    showPenghuniList();
  });
};

function closeModal() { document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden")); }

// Init
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("darkMode") === "true") document.body.classList.add("dark");
});
