const form = document.getElementById("reportForm");
const statusEl = document.getElementById("formStatus");
const dateInput = document.getElementById("DateTime");

const today = new Date().toISOString().split("T")[0];
dateInput.value = today;

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Mengirim laporan...", "");

  const payload = {
    nama: document.getElementById("Name").value.trim(),
    tempat: document.getElementById("LabFki").value.trim(),
    tanggal: document.getElementById("DateTime").value,
    jenisAduan: document.getElementById("ReportType").value.trim(),
    uraian: document.getElementById("Uraian").value.trim(),
  };

  try {
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Gagal mengirim laporan.");
    }

    form.reset();
    dateInput.value = today;
    setStatus("Laporan berhasil dikirim.", "success");
  } catch (error) {
    setStatus(error.message || "Terjadi kesalahan saat mengirim laporan.", "error");
  }
});
