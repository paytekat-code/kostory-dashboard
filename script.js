import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import { getDatabase, ref, onValue, set, remove, get } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-database.js';

const firebaseConfig = { /* config kamu sama */ 
  apiKey: "AIzaSyAhN2a4m6PkTwFOvJ88TreD1lCERYJD7m0",
  authDomain: "kostory-db.firebaseapp.com",
  databaseURL: "https://kostory-db-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kostory-db",
  storageBucket: "kostory-db.appspot.com",
  messagingSenderId: "447318101438",
  appId: "1:447318101438:web:7aba8e16ccee69fd3c53def"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const kosts = { /* daftar kost kamu sama */ 
  "Kostory Mekar": ["101","102","103","105","106","107","108","201","202","203","205","206","207","208"],
  "Kostory Satria": ["101","102","103","105","106","107","108","109","201","202","203","205","206","207","208","209","210"],
  "Kostory Mitra": ["101","102","103","105","106","107","108","109","110","112","201","202","203","205","206","207"],
  "Ecokost by Kostory": ["101","102","103","105","106","108","109","110","111","112","115","116","117","118","119","120","121","122","126"],
  "Mitraya by Kostory": ["100","101","102","103","105","106","107","108","201","202","203","205","206","207","208","209","210","211","212"],
  "Inaya Bukit by Kostory": ["101","102","103","105","201","202","203","205"]
};

const hakAkses = { "admin":"all","mekar":"Kostory Mekar","satria":"Kostory Satria","mitra":"Kostory Mitra","ecokost":"Ecokost by Kostory","mitraya":"Mitraya by Kostory","inaya":"Inaya Bukit by Kostory" };
const passwordDb = { "admin":"kostory123","mekar":"mekar123","satria":"satria123","mitra":"mitra123","ecokost":"ecokost123","mitraya":"mitraya123","inaya":"inaya123" };

let currentUser=null, allowedKosts=[], currentKost=null, currentRoom=null, currentData=null;

// SEMUA FUNGSI WAJIB PAKAI window.
window.login = function() { /* kode login sama seperti sebelumnya */ 
  const user = document.getElementById("username").value.trim().toLowerCase();
  const pass = document.getElementById("password").value;
  if (passwordDb[user] && passwordDb[user] === pass) {
    currentUser = user;
    allowedKosts = hakAkses[user] === "all" ? Object.keys(kosts) : [hakAkses[user]];
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    loadDashboard();
  } else alert("Username atau password salah!");
};

window.logout = function() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
};

/* semua fungsi lain (loadDashboard, openModal, saveAndAskShare, openTagih, kirimTagihan, openCheckoutModal, prosesCheckout, laporKost) 
   PAKAI window. di depannya — sama persis seperti script sebelumnya yang sudah jalan */

loadDashboard(); // biar langsung muncul kalau sudah login sebelumnya
