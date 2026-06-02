// 1. Masukkan URL Web App Google Apps Script Anda di sini
const API_URL = 'URL_WEB_APP_GOOGLE_SCRIPT_ANDA_DISINI';

// 2. Fungsi untuk memuat data dari Google Sheet
async function muatDataTabel() {
    const tableBody = document.getElementById("tableBody");
    
    // Tampilkan tulisan "Memuat..." saat sedang mengambil data
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Memuat data pengaduan...</td></tr>';

    try {
        // Melakukan request GET ke API Google Script
        const response = await fetch(API_URL);
        const result = await response.json();

        // Pastikan status dari Google Script adalah "success"
        if (result.status === "success") {
            const dataPengaduan = result.data;
            
            // Kosongkan tabel sebelum mengisinya dengan data baru
            tableBody.innerHTML = "";

            // Jika sheet masih kosong (hanya ada header)
            if (dataPengaduan.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Belum ada data laporan.</td></tr>';
                return;
            }

            // Looping/Ulangi untuk setiap baris data di Sheet
            dataPengaduan.forEach(item => {
                
                // Cek apakah ada link foto. Jika kosong, beri tanda "-"
                const tautanFoto = (item.Foto && item.Foto !== "") 
                    ? `<a href="${item.Foto}" class="link-foto" target="_blank">Lihat Foto</a>` 
                    : '-';

                // Format baris HTML menggunakan data dari Google Sheet
                // Catatan: Jika nama header kolom Anda menggunakan spasi (Tempat), gunakan kurung siku item['Tempat']
                const barisBaru = `
                    <tr>
                        <td>${item.Tanggal}</td>
                        <td>${item.Nama}</td>
                        <td>${item['Tempat'] || item.Tempat}</td>
                        <td class="td-uraian">${item.Uraian}</td>
                        <td>${tautanFoto}</td>
                        <td class="action-buttons">
                            <button class="btn-edit" onclick="editData('${item.Id}')">Edit</button>
                            <button class="btn-delete" onclick="hapusData('${item.Id}')">Hapus</button>
                        </td>
                    </tr>
                `;
                
                // Tambahkan baris tersebut ke dalam tabel
                tableBody.innerHTML += barisBaru;
            });
            
        } else {
            // Jika ada error dari server Google
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444;">Gagal memuat data: ${result.message}</td></tr>`;
        }

    } catch (error) {
        // Jika internet terputus atau URL salah
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #ef4444;">Terjadi kesalahan koneksi jaringan.</td></tr>';
        console.error("Error mengambil data: ", error);
    }
}

// 3. Panggil fungsi ini secara otomatis saat halaman Admin pertama kali dibuka
document.addEventListener("DOMContentLoaded", muatDataTabel);

function pindahTab(namaTab) {
    // 1. Sembunyikan semua section
    document.getElementById('sectionAduan').style.display = 'none';
    document.getElementById('sectionAkun').style.display = 'none';
    
    // 2. Hilangkan class 'active' dari semua tombol tab
    document.getElementById('tabAduan').classList.remove('active');
    document.getElementById('tabAkun').classList.remove('active');
    
    // 3. Tampilkan section yang dipilih dan beri tanda 'active' pada tombolnya
    if (namaTab === 'aduan') {
        document.getElementById('sectionAduan').style.display = 'block';
        document.getElementById('tabAduan').classList.add('active');
    } else if (namaTab === 'akun') {
        document.getElementById('sectionAkun').style.display = 'block';
        document.getElementById('tabAkun').classList.add('active');
    }
}

// Fungsi Modal Akun (Contoh dasar)
function bukaModalAkun() {
    document.getElementById('modalAkunTitle').innerText = "Tambah Akun Baru";
    document.getElementById('formAkun').reset(); // Kosongkan form
    document.getElementById('modalAkun').style.display = 'flex';
}

function tutupModalAkun() {
    document.getElementById('modalAkun').style.display = 'none';
}