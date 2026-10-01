import React from 'react';
import {
  BookOpen,
  X,
  Users,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Bell,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Send,
  Download,
  Plus,
  HelpCircle
} from 'lucide-react';

interface AppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppGuideModal: React.FC<AppGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 p-5 text-white relative sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5 mb-1 text-teal-200 text-[11px] font-bold tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>PANDUAN LENGKAP PENGOPERASIAN</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            Buku Petunjuk Penggunaan KreditKu
          </h2>
          <p className="text-teal-100 text-xs mt-0.5">
            Panduan praktis menjalankan seluruh menu dan fitur aplikasi di HP Anda.
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100">
          {/* 1. Beranda */}
          <div className="space-y-1.5 pt-2 first:pt-0">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">1</span>
              <span>Menu Beranda (Ringkasan Kas & Piutang)</span>
            </div>
            <p className="text-xs text-slate-600">
              Menampilkan total sisa piutang berjalan yang masih ada di nasabah, total pembayaran yang Anda terima bulan ini, dan estimasi keuntungan usaha. Anda juga dapat melihat daftar tagihan yang harus ditagih hari ini atau yang sudah lewat tempo.
            </p>
          </div>

          {/* 2. Buku Nasabah */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">2</span>
              <span>Menu Nasabah & Riwayat Piutang</span>
            </div>
            <p className="text-xs text-slate-600">
              Menyimpan daftar seluruh pelanggan Anda (Nama Lengkap, Nomor WhatsApp, dan Alamat).
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
              <li><strong>Tambah Nasabah:</strong> Klik tombol <em>"+ Tambah"</em> di kanan atas.</li>
              <li><strong>Detail & Riwayat:</strong> Klik pada kartu nama nasabah untuk melihat kartu piutang dan barang yang pernah dikredit.</li>
              <li><strong>Chat WA:</strong> Klik tombol hijau <em>"WA"</em> untuk langsung membuka percakapan WhatsApp dengan nasabah.</li>
            </ul>
          </div>

          {/* 3. Penanda Gagal Bayar */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-red-100 text-red-800 font-mono text-xs">3</span>
              <span>Penanda Nasabah "Gagal Bayar" (Macet)</span>
            </div>
            <p className="text-xs text-slate-600">
              Jika nasabah menolak bayar, kabur, atau nomor tidak aktif:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
              <li>Klik tombol merah <strong>"Gagal Bayar"</strong> pada kartu nasabah, lalu isi alasannya.</li>
              <li>Nasabah tersebut akan ditandai dengan label merah tebal <strong>GAGAL BAYAR (MACET)</strong> di seluruh sistem.</li>
              <li>Gunakan tab filter <strong>"Gagal Bayar"</strong> di atas daftar nasabah untuk melihat seluruh daftar hitam (blacklist) Anda.</li>
              <li>Jika nasabah sudah melunasi, klik tombol hijau <strong>"Pulihkan"</strong> untuk mengembalikan statusnya menjadi Lancar.</li>
            </ul>
          </div>

          {/* 4. Buat Kredit & Tambah Nasabah Langsung */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">4</span>
              <span>Menu Kredit & Pinjaman (Kredit Barang / Uang)</span>
            </div>
            <p className="text-xs text-slate-600">
              Untuk mencatat penjualan kredit baru, klik tombol <strong>"+ Buat Kredit"</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
              <li>
                <strong>Tambah Nasabah Langsung:</strong> Jika nasabah baru, Anda tidak perlu keluar form! Cukup klik tab <em>"+ Nasabah Baru"</em> di dalam form kredit, ketik Nama dan No. WA, data otomatis tersimpan ke buku nasabah bersama kreditnya.
              </li>
              <li>
                <strong>Metode A (Input Total Kredit):</strong> Masukkan harga modal, uang muka (DP), total harga kredit yang disepakati, dan tenor. Sistem otomatis menghitung cicilan per bulan/minggu dan margin laba.
              </li>
              <li>
                <strong>Metode B (Input Cicilan x Tenor):</strong> Masukkan harga modal, nominal angsuran per termin, dan tenor. Sistem otomatis menghitung total kewajiban dan keuntungan Anda.
              </li>
              <li>
                <strong>Jadwal Cicilan:</strong> Klik <em>"Jadwal Cicilan"</em> pada kartu kredit untuk melihat tabel angsuran ke-1, ke-2, dst.
              </li>
            </ul>
          </div>

          {/* 5. Buku Kas & Kwitansi */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">5</span>
              <span>Menu Buku Kas & Kwitansi Pembayaran</span>
            </div>
            <p className="text-xs text-slate-600">
              Mencatat setoran cicilan yang Anda terima dari nasabah:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
              <li>Pilih nama kredit nasabah, masukkan jumlah uang yang dibayarkan, tanggal, dan metode (Tunai/Transfer/QRIS).</li>
              <li>Sisa hutang nasabah di sistem akan otomatis berkurang secara real-time.</li>
              <li><strong>Download / Cetak Kwitansi:</strong> Klik ikon struk untuk mengunduh kwitansi resmi atau klik <em>"Kirim WhatsApp"</em> untuk mengirimkan bukti bayar langsung ke nomor WA nasabah.</li>
              <li><strong>Pembatalan (VOID):</strong> Jika Anda salah ketik nominal, klik tombol putar balik (VOID) dan isi alasannya. Saldo hutang nasabah akan kembali dipulihkan dengan aman tanpa merusak riwayat audit.</li>
            </ul>
          </div>

          {/* 6. Laporan Keuangan & Download PDF */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">6</span>
              <span>Menu Laporan & Download PDF</span>
            </div>
            <p className="text-xs text-slate-600">
              Melihat rekapan pembukuan usaha:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 pl-1">
              <li>Pilih rentang tanggal jika ingin melihat laporan bulan tertentu.</li>
              <li>Klik tombol <strong>"Download PDF Laporan"</strong> untuk mengunduh berkas laporan pembukuan resmi lengkap dengan kop toko Anda, tabel kontrak kredit, dan riwayat penerimaan kas.</li>
              <li>Tersedia juga tombol <strong>"Excel/CSV"</strong> jika Anda ingin mengolah data di spreadsheet.</li>
            </ul>
          </div>

          {/* 7. Pengingat WhatsApp */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">7</span>
              <span>Menu Pengingat WhatsApp Tagihan</span>
            </div>
            <p className="text-xs text-slate-600">
              Di menu <em>Lainnya &gt; Pengingat WhatsApp</em>, Anda dapat memantau cicilan yang jatuh tempo hari ini atau menunggak, lalu klik <strong>"Kirim WA"</strong> untuk mengirim pesan pengingat sopan yang sudah terisi otomatis dengan nama nasabah dan nominal cicilannya.
            </p>
          </div>

          {/* 8. Pengaturan Toko */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-teal-100 text-teal-800 font-mono text-xs">8</span>
              <span>Menu Pengaturan Usaha</span>
            </div>
            <p className="text-xs text-slate-600">
              Ubah nama toko Anda, nama pemilik, nomor WhatsApp toko, dan sesuaikan kalimat pesan template WhatsApp sesuai gaya bahasa toko Anda sendiri.
            </p>
          </div>

          {/* 9. Mode Uji Coba (Demo Mode) */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-800 font-mono text-xs">9</span>
              <span>Mode Uji Coba (Demo Mode)</span>
            </div>
            <p className="text-xs text-slate-600">
              Bagian Demo Mode (seperti Toko Berkah / Cahaya Mandiri) disediakan khusus bagi Anda untuk mencoba-coba tombol, menguji input cicilan, dan melihat contoh kwitansi tanpa takut salah.
            </p>
            <p className="text-[11px] text-amber-800 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-200">
              Perhatian: Mode Demo hanya sebagai uji coba dan tidak mencatat pembukuan toko asli Anda. Untuk mencatat transaksi pelanggan nyata toko Anda secara permanen dan aman, masuklah menggunakan Akun Anda (Google atau Email).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end sticky bottom-0 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup Buku Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
