// firebase-config.js

const firebaseConfig = {
  apiKey: "AIzaSyAhN2a4m6PkTwFOvJ88TreD1lCERYJD7m0",
  authDomain: "kostory-db.firebaseapp.com",
  databaseURL: "https://kostory-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kostory-db",
  storageBucket: "kostory-db.appspot.com",
  messagingSenderId: "447318101438",
  appId: "1:447318101438:web:7aba8e16ccee69fd3c53def"
};

// Daftar kamar per lokasi kost
const kosts = {
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","107","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

// Hak akses user
const hakAkses = { 
  "admin": "all",
  "mekar": "Kostory Mekar",
  "satria": "Kostory Satria",
  "mitra": "Kostory Mitra",
  "ecokost": "Ecokost by Kostory",
  "mitraya": "Mitraya by Kostory",
  "inaya": "Inaya Bukit by Kostory"
};

// Password user (hanya untuk demo, jangan dipakai di produksi)
const passwordDb = { 
  "": "ramenuno20",
  "mekar": "kopipait69",
  "satria": "cilukba123",
  "mitra": "ayamgeprek77",
  "ecokost": "mirebus08",
  "mitraya": "odading88",
  "inaya": "nasiuduk21"
};

// Export semua biar bisa dipakai di file lain
export { 
  firebaseConfig, 
  kosts, 
  hakAkses, 
  passwordDb 
};
