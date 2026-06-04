# PKN Lab - Layanan Aduan

Aplikasi layanan aduan fasilitas dan kegiatan praktikum laboratorium yang didesain secara profesional untuk ranah akademik, lengkap dengan sistem manajemen admin. Aplikasi ini menggunakan integrasi serverless modern untuk penyimpanan data, notifikasi, pengelolaan file, dan desain antarmuka premium (Glassmorphism & Mesh Gradients). Siap dideploy di Vercel.

## Fitur Utama

1. **Form Laporan Tanpa Autentikasi**: Seluruh sivitas akademika (Mahasiswa, Asisten, Dosen) maupun pihak terkait (Petugas, Umum) dapat mengirim aduan tanpa perlu login.
2. **Detail Laporan Lengkap**: Mendukung pencatatan Status Pelapor, NIM/NIK (Nomor Identitas), Tempat, Tanggal, dan Jenis Aduan secara terstruktur.
3. **Upload Bukti Foto**: Memungkinkan pelapor menyertakan bukti fisik (dikelola secara aman menggunakan **Supabase Storage** pada bucket `bukti`).
4. **Auto-Generated ID**: Setiap laporan otomatis mendapatkan ID unik (misal: `REP-1700000000000`).
5. **Penyimpanan Google Sheets (via Sheety API)**: Seluruh laporan tersinkronisasi langsung ke Google Sheets.
6. **Notifikasi Email (via Resend)**: Admin otomatis menerima email notifikasi setiap ada laporan baru.
7. **Dashboard Admin Tersentralisasi**:
   - Autentikasi aman menggunakan **Supabase Auth** (Akses eksklusif hanya untuk admin/kepala lab).
   - Akses langsung menuju Spreadsheet Google Sheets.
   - Admin dapat melihat daftar aduan, membuka **Detail Laporan Penuh**, mengedit seluruh field data, dan menghapus laporan.
   - Manajemen akun (tambah admin baru).
8. **Dukungan Bantuan Cepat**: Tombol *Floating WhatsApp* tersedia di seluruh halaman non-admin untuk respon langsung.

## Arsitektur & Layanan

- **Frontend**: HTML/CSS/JS (Vanilla) dengan UI/UX modern
- **Backend/API**: Vercel Serverless Functions (`api/reports.js`)
- **Database (Laporan)**: Google Sheets terintegrasi dengan [Sheety](https://sheety.co)
- **Database (Akun Admin) & Storage (Foto)**: [Supabase](https://supabase.com/)
- **Layanan Email**: [Resend](https://resend.com)
- **Deployment**: [Vercel](https://vercel.com)

## Persiapan & Konfigurasi

### 1. Google Sheets & Sheety API
1. Buat Google Sheet baru dengan **urutan kolom persis** sebagai berikut: `ID`, `Nama`, `Status Pelapor`, `Nomor Identitas`, `Tempat`, `Tanggal`, `Jenis Aduan`, `Uraian`, `Foto`.
2. Daftar di [Sheety](https://sheety.co).
3. Hubungkan Google Sheet Anda ke project Sheety.
4. Aktifkan fitur **GET**, **POST**, **PUT**, dan **DELETE** di pengaturan project Sheety Anda.
5. Jika Anda menggunakan otentikasi Bearer Token di Sheety, catat token tersebut.

### 2. Supabase (Auth & Storage)
1. Buat project di [Supabase](https://supabase.com).
2. Catat `URL` dan `Anon Key` dari menu API Settings. Update nilai tersebut di `script/login.js`, `script/user.js`, dan `admin/index.html`.
3. Di Supabase SQL Editor, jalankan script berikut untuk membuat sistem sinkronisasi profile dan storage bucket `bukti`:

```sql
-- Setup Profiles Table for Dashboard Rendering
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon read" ON public.profiles FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Setup Storage Bucket for Foto Upload
INSERT INTO storage.buckets (id, name, public) VALUES ('bukti', 'bukti', true);
CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'bukti');
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bukti');
```

### 3. Resend (Email Notification)
1. Daftar di [Resend](https://resend.com) dan buat API Key.
2. Lakukan verifikasi domain (verified domain) jika diperlukan untuk alamat email pengirim.

## Environment Variables (.env)

Gunakan file `.env` di lingkungan lokal atau atur Vercel Environment Variables untuk deployment.
```env
SHEETY_API_URL=https://api.sheety.co/.../namaSheet
SHEETY_BEARER_TOKEN=token_anda_disini
RESEND_API_KEY=re_...
REPORT_NOTIFICATION_EMAIL_FROM=onboarding@resend.dev
REPORT_NOTIFICATION_EMAIL_TO=email_admin@domain.com
```

## Menjalankan Secara Lokal

1. Install module `vercel` CLI jika belum punya.
   ```bash
   npm install -g vercel
   ```
2. Pastikan dependencies diinstall:
   ```bash
   npm install
   ```
3. Gunakan command berikut untuk menjalankan server lokal simulasi Vercel API:
   ```bash
   vercel dev
   ```

## Deploy ke Vercel

1. Push kode Anda ke repository GitHub.
2. Buat project baru di Vercel dan impor repository.
3. Tambahkan semua konfigurasi `.env` pada tab *Environment Variables* di Vercel.
4. Klik **Deploy**!
