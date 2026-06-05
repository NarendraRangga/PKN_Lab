// ---------------------------------------------------------
// PENGATURAN MODAL LOGIN (Pop-up Login)
// ---------------------------------------------------------
// Mengambil elemen-elemen HTML berdasarkan ID dan Class-nya
const modal = document.getElementById("login-modal"); // Container untuk pop-up modal
const loginBtn = document.getElementById("login-btn"); // Tombol "Login" di navbar
const closeBtn = document.querySelector(".close-btn"); // Tombol silang "X" untuk menutup modal

// 1. Menampilkan Modal saat tombol Login diklik
loginBtn.addEventListener("click", function(event) {
    event.preventDefault(); // Mencegah browser melompat ke atas halaman (sifat bawaan tag <a>)
    modal.style.display = "flex"; // Mengubah display dari 'none' menjadi 'flex' agar pop-up muncul di tengah
});

// 2. Menutup Modal saat tombol "X" diklik
closeBtn.addEventListener("click", function() {
    modal.style.display = "none"; // Menyembunyikan modal kembali
});

// 3. Menutup Modal jika user mengklik area gelap di luar box login putih
window.addEventListener("click", function(event) {
    if (event.target === modal) {
        modal.style.display = "none"; // Sembunyikan modal jika target klik adalah background gelap
    }
});

// ---------------------------------------------------------
// PENGATURAN TAHUN COPYRIGHT DINAMIS
// ---------------------------------------------------------
// Mengambil tahun saat ini secara otomatis dari sistem komputer
const currentYear = new Date().getFullYear();
const copyrightYearElement = document.getElementById('copyright-year');
// Memasukkan angka tahun (misal: 2026) ke dalam elemen HTML
copyrightYearElement.textContent = currentYear;

// ---------------------------------------------------------
// PENGATURAN TOMBOL INSTRUKSI (Scroll ke bagian tata cara)
// ---------------------------------------------------------
const instructbtn = document.getElementById("instructBtn");
const instructCard = document.getElementById("instructGlass");

instructbtn.addEventListener("click", function(event) {
    event.preventDefault(); // Mencegah reload/lompat ke atas
    instructCard.style.display = "block"; // Memunculkan kartu instruksi yang awalnya disembunyikan
    
    // Memberikan efek scroll yang halus menuju kartu instruksi
    instructCard.scrollIntoView({
        behavior : "smooth"
    });
});