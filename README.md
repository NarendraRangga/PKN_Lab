# PKN Lab - Layanan Aduan

Implementasi CRUD laporan dengan penyimpanan di Google Sheets dan notifikasi email via Resend. Siap dideploy di Vercel.

## Fitur

1. Form laporan (user) menambah data ke Google Sheets
2. Admin dashboard membaca, mengedit uraian, dan menghapus laporan
3. Notifikasi email dikirim setiap ada laporan baru

## Persiapan Google Sheets API

1. Buat Google Cloud Project baru di https://console.cloud.google.com/
2. Enable **Google Sheets API**
3. Buat **Service Account**
4. Buat **Service Account Key** (JSON) lalu simpan isinya
5. Buat Google Sheet untuk laporan, lalu **share** spreadsheet ke email service account (permission: Editor)
6. Catat **Spreadsheet ID** (bagian di URL setelah `/d/`)
7. Catat nama sheet/tab yang dipakai (contoh: `Sheet1` atau `Laporan`)

## Persiapan Resend

1. Daftar di https://resend.com/
2. Buat API key
3. Siapkan email pengirim (verified domain) untuk `REPORT_NOTIFICATION_EMAIL_FROM`

## Environment Variables

Gunakan `.env.example` sebagai panduan. Set di Vercel Project Settings.

```
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SHEETS_SHEET_NAME=
RESEND_API_KEY=
REPORT_NOTIFICATION_EMAIL_FROM=
REPORT_NOTIFICATION_EMAIL_TO=
```

**Catatan:** `GOOGLE_SHEETS_PRIVATE_KEY` harus disimpan dengan newline yang di-escape (`\n`) di Vercel.

## Menjalankan Lokal

1. Install dependencies
   ```
   npm install
   ```
2. Jalankan static server sesuai kebutuhan (contoh: VS Code Live Server) dan pastikan API Vercel dijalankan via `vercel dev` jika ingin test full stack.

## Deploy ke Vercel

1. Push repo ke GitHub
2. Import project di Vercel
3. Set environment variables sesuai di atas
4. Deploy
