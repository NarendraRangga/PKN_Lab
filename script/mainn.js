const API_URL = "/api/reports";

const tableBody = document.getElementById("tableBody");
const editModal = document.getElementById("editModal");
const editIdInput = document.getElementById("editId");
const editUraianInput = document.getElementById("editUraian");

let cachedReports = new Map();

function setTableMessage(message, isError = false) {
  tableBody.innerHTML = "";
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 8;
  cell.style.textAlign = "center";
  if (isError) {
    cell.style.color = "#ef4444";
  }
  cell.textContent = message;
  row.appendChild(cell);
  tableBody.appendChild(row);
}

function createCell(text, className) {
  const cell = document.createElement("td");
  if (className) {
    cell.className = className;
  }
  cell.textContent = text;
  return cell;
}

function renderReports(reports) {
  cachedReports = new Map(reports.map((item) => [item.id, item]));
  tableBody.innerHTML = "";

  if (reports.length === 0) {
    setTableMessage("Belum ada data laporan.");
    return;
  }

  reports.forEach((item) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(item.tanggal || "-"));
    row.appendChild(createCell(item.nama || "-"));
    row.appendChild(createCell(item.statusPelapor || "-"));
    row.appendChild(createCell(item.nomorIdentitas || "-"));
    row.appendChild(createCell(item.tempat || "-"));
    row.appendChild(createCell(item.uraian || "-", "td-uraian"));

    const fotoCell = document.createElement("td");
    const actualFotoUrl = item.fotoUrl || item.foto;
    if (actualFotoUrl) {
      const link = document.createElement("a");
      link.href = actualFotoUrl;
      link.className = "link-foto";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Lihat Foto";
      fotoCell.appendChild(link);
    } else {
      fotoCell.textContent = "-";
    }
    row.appendChild(fotoCell);

    const actionCell = document.createElement("td");
    actionCell.className = "action-buttons";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editData(item.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn-delete";
    deleteBtn.textContent = "Hapus";
    deleteBtn.addEventListener("click", () => hapusData(item.id));

    actionCell.appendChild(editBtn);
    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

async function muatDataTabel() {
  setTableMessage("Memuat data pengaduan...");

  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal memuat data.");
    }
    renderReports(result.data || []);
  } catch (error) {
    setTableMessage(
      error.message || "Terjadi kesalahan koneksi jaringan.",
      true
    );
  }
}

function editData(id) {
  const report = cachedReports.get(id);
  if (!report) {
    return;
  }
  editIdInput.value = report.id;
  editUraianInput.value = report.uraian || "";
  editModal.style.display = "flex";
}

function tutupModal() {
  editModal.style.display = "none";
}

async function simpanEdit() {
  const id = editIdInput.value;
  const uraian = editUraianInput.value.trim();

  if (!id || !uraian) {
    window.alert("Uraian tidak boleh kosong.");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, uraian }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal menyimpan perubahan.");
    }
    tutupModal();
    await muatDataTabel();
  } catch (error) {
    window.alert(error.message || "Terjadi kesalahan saat menyimpan.");
  }
}

async function hapusData(id) {
  if (!window.confirm("Yakin ingin menghapus laporan ini?")) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Gagal menghapus data.");
    }
    await muatDataTabel();
  } catch (error) {
    window.alert(error.message || "Terjadi kesalahan saat menghapus.");
  }
}

function pindahTab(namaTab) {
  document.getElementById("sectionAduan").style.display = "none";
  document.getElementById("sectionAkun").style.display = "none";
  document.getElementById("tabAduan").classList.remove("active");
  document.getElementById("tabAkun").classList.remove("active");

  if (namaTab === "aduan") {
    document.getElementById("sectionAduan").style.display = "block";
    document.getElementById("tabAduan").classList.add("active");
  } else if (namaTab === "akun") {
    document.getElementById("sectionAkun").style.display = "block";
    document.getElementById("tabAkun").classList.add("active");
    muatDataAkun();
  }
}

async function muatDataAkun() {
  const tableAkunBody = document.getElementById("tableAkunBody");
  if (!tableAkunBody) return;
  
  if (!window.supabaseClient) {
      tableAkunBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Sistem belum siap.</td></tr>`;
      return;
  }
  
  try {
      const { data, error } = await window.supabaseClient.from('profiles').select('*');
      
      if (error) throw error;
      
      tableAkunBody.innerHTML = "";
      if (data.length === 0) {
          tableAkunBody.innerHTML = `<tr><td colspan="4" style="text-align: center;">Belum ada akun</td></tr>`;
          return;
      }
      
      data.forEach(akun => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
              <td>${akun.id.slice(0, 8)}...</td>
              <td>${akun.email}</td>
              <td>Aktif</td>
              <td class="text-center">
                  <button class="btn-danger" onclick="hapusAkun('${akun.id}')">Hapus</button>
              </td>
          `;
          tableAkunBody.appendChild(tr);
      });
  } catch (error) {
      tableAkunBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">Gagal memuat akun: ${error.message}</td></tr>`;
  }
}

function hapusAkun(id) {
  window.alert("Penghapusan akun sementara hanya dapat dilakukan melalui Supabase Dashboard.");
}

function bukaModalAkun() {
  document.getElementById("modalAkunTitle").innerText = "Tambah Akun Baru";
  document.getElementById("formAkun").reset();
  document.getElementById("modalAkun").style.display = "flex";
}

function tutupModalAkun() {
  document.getElementById("modalAkun").style.display = "none";
}

async function logout() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }
  window.location.href = "../index.html";
}

const modalAkun = document.getElementById("modalAkun");
const formAkun = document.getElementById("formAkun");

function bukaModalAkun() {
  if (modalAkun) modalAkun.style.display = "flex";
}

function tutupModalAkun() {
  if (modalAkun) modalAkun.style.display = "none";
  if (formAkun) formAkun.reset();
}

async function simpanAkun() {
  const emailInput = document.getElementById("akunEmail");
  const passwordInput = document.getElementById("akunPassword");
  
  if (!emailInput || !passwordInput) return;
  
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
      window.alert("Email dan password wajib diisi.");
      return;
  }

  if (!window.supabaseClient) {
      window.alert("Sistem belum siap. Coba lagi nanti.");
      return;
  }

  try {
      const { data, error } = await window.supabaseClient.auth.signUp({
          email: email,
          password: password,
      });

      if (error) {
          throw error;
      }

      window.alert("Akun berhasil dibuat!");
      tutupModalAkun();
  } catch (error) {
      window.alert("Gagal membuat akun: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", muatDataTabel);

window.editData = editData;
window.hapusData = hapusData;
window.simpanEdit = simpanEdit;
window.tutupModal = tutupModal;
window.pindahTab = pindahTab;
window.bukaModalAkun = bukaModalAkun;
window.tutupModalAkun = tutupModalAkun;
window.simpanAkun = simpanAkun;
window.logout = logout;
