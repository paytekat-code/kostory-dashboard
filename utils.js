export function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  const hari = date.getDate();
  const bulan = date.toLocaleDateString("id-ID", { month: "short" }).replace(".", "");
  const tahun = date.getFullYear().toString().slice(-2);
  return `${hari} ${bulan} ${tahun}`;
}

export function hitungLamaTinggal(masuk, keluar = new Date()) {
  const diff = Math.floor((new Date(keluar) - new Date(masuk)) / 86400000);
  const tahun = Math.floor(diff / 365);
  const bulan = Math.floor((diff % 365) / 30);
  const hari = diff % 30;
  return `${tahun}y ${bulan}m ${hari}d`;
}

export function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
}
