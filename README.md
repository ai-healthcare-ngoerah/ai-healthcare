# USADA AI - Frontend Web Application

Aplikasi antarmuka web modern untuk platform kecerdasan buatan operasional rumah sakit (USADA AI). Dibangun menggunakan React 19, Vite, dan Tailwind CSS.

## Repositori Terkait
- Backend API (FastAPI): https://github.com/ai-healthcare-ngoerah/usada-ai-backend

## Prasyarat
- Node.js versi 18 atau lebih baru
- npm, pnpm, atau yarn

## Panduan Instalasi dan Menjalankan

1. Salin konfigurasi environment:
   ```bash
   cp .env.example .env
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`.

4. Build untuk produksi:
   ```bash
   npm run build
   ```

5. Pratinjau hasil build:
   ```bash
   npm run preview
   ```

## Konfigurasi Environment

Variabel environment yang didukung:
- `VITE_API_BASE_URL`: URL dasar endpoint REST API backend USADA AI (contoh: `http://127.0.0.1:8005` atau domain backend produksi).
- `VITE_N8N_WEBHOOK_URL`: URL webhook n8n untuk otomasi alur kerja (opsional).

## Deployment

Aplikasi ini siap di-deploy langsung ke Vercel dengan konfigurasi bawaan pada file `vercel.json`. Pastikan mengatur variabel `VITE_API_BASE_URL` pada pengaturan environment di dashboard Vercel.
