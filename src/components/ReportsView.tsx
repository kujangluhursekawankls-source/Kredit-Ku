import React, { useState } from 'react';
import { Customer, Loan, Payment, Installment } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Wallet,
  TrendingUp,
  Receipt,
  CheckCircle,
  Database,
  FileText,
  X,
  Share2,
  AlertTriangle,
  Ban
} from 'lucide-react';

interface ReportsViewProps {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  installments: Installment[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  customers,
  loans,
  payments,
  installments
}) => {
  const { currentTenant, currentTenantId, currentUid } = useAuthAndTenant();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filtered payments by date if selected
  const filteredPayments = payments.filter(p => {
    if (p.status === 'void') return false;
    if (startDate && p.paymentDate < startDate) return false;
    if (endDate && p.paymentDate > endDate) return false;
    return true;
  });

  const totalCashIn = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  // Filtered loans
  const filteredLoans = loans.filter(l => {
    if (startDate && l.startDate < startDate) return false;
    if (endDate && l.startDate > endDate) return false;
    return true;
  });

  const totalCreditTurnover = filteredLoans.reduce((sum, l) => sum + l.totalLoanAmount, 0);
  const totalItemCost = filteredLoans.reduce((sum, l) => sum + l.itemPrice, 0);
  const totalMargin = Math.max(0, totalCreditTurnover - totalItemCost);
  const totalOutstanding = filteredLoans.reduce((sum, l) => sum + (l.status === 'active' ? l.remainingAmount : 0), 0);

  const badDebtCustomers = customers.filter(c => c.status === 'bad_debt' || c.isBadDebt);

  const handleDownloadPdf = () => {
    window.print();
  };

  const exportPaymentsCSV = () => {
    const headers = ['No Kwitansi', 'Tanggal', 'Nama Nasabah', 'Barang', 'Nominal (Rp)', 'Metode', 'Status'];
    const rows = filteredPayments.map(p => {
      const loan = loans.find(l => l.id === p.loanId);
      return [
        `"${p.receiptNumber}"`,
        `"${p.paymentDate}"`,
        `"${p.customerName}"`,
        `"${loan?.itemName || '-'}"`,
        p.amount,
        `"${p.paymentMethod}"`,
        `"${p.status}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_kreditku_${currentTenantId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile-Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900">Laporan Keuangan & PDF</h2>
          <p className="text-xs text-slate-500">
            Data pembukuan terinci, omset kredit, sisa piutang, dan unduh PDF resmi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Main Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Laporan</span>
          </button>

          <button
            onClick={exportPaymentsCSV}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            title="Download Data CSV (Excel)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>Filter Periode Tanggal Laporan:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">Dari Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block mb-0.5">Sampai Tanggal:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
            />
          </div>
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="text-teal-700 font-bold hover:underline cursor-pointer pt-1"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Executive Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Omset Kredit</span>
          <div className="text-base font-black font-mono text-slate-900 mt-0.5">
            Rp {totalCreditTurnover.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400">{filteredLoans.length} kontrak</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Kas Masuk Real</span>
          <div className="text-base font-black font-mono text-emerald-700 mt-0.5">
            Rp {totalCashIn.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400">{filteredPayments.length} transaksi</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Sisa Piutang</span>
          <div className="text-base font-black font-mono text-amber-700 mt-0.5">
            Rp {totalOutstanding.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400">Belum lunas</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 block">Proyeksi Margin</span>
          <div className="text-base font-black font-mono text-teal-800 mt-0.5">
            Rp {totalMargin.toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-slate-400">Selisih laba</span>
        </div>
      </div>

      {/* Bad Debt Summary Box if exists */}
      {badDebtCustomers.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs flex items-center justify-between text-red-900">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-red-600" />
            <span>Perhatian: Terdapat <strong>{badDebtCustomers.length} nasabah</strong> berstatus Gagal Bayar (Macet).</span>
          </div>
        </div>
      )}

      {/* Printable Area - Document Preview & PDF Template */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4 print-area">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-4 text-center space-y-1">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl overflow-hidden p-1 border border-slate-200">
            <img
              src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">
            {currentTenant?.businessName || 'KreditKu'}
          </h3>
          <p className="text-xs text-slate-600 font-medium">
            LAPORAN RINCI PEMBUKUAN KREDIT & PENERIMAAN KAS
          </p>
          <div className="text-[11px] text-slate-400 space-x-2">
            <span>Pemilik Usaha: <strong>{currentTenant?.ownerName}</strong></span>
            <span>•</span>
            <span>No. WhatsApp: {currentTenant?.phone || '-'}</span>
            <span>•</span>
            <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</span>
          </div>
        </div>

        {/* Financial Summary Table */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-slate-500 block text-[10px]">TOTAL PENJUALAN:</span>
            <strong className="font-mono text-slate-900">Rp {totalCreditTurnover.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">TOTAL KAS DITERIMA:</span>
            <strong className="font-mono text-emerald-700">Rp {totalCashIn.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">SISA PIUTANG:</span>
            <strong className="font-mono text-amber-700">Rp {totalOutstanding.toLocaleString('id-ID')}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">MARGIN KEUNTUNGAN:</span>
            <strong className="font-mono text-teal-800">Rp {totalMargin.toLocaleString('id-ID')}</strong>
          </div>
        </div>

        {/* Detailed Loans Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            1. Rincian Kontrak Kredit & Status Nasabah ({filteredLoans.length})
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Nama Nasabah</th>
                  <th className="py-2 px-3">Barang Kredit</th>
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3 text-right">Total Kredit</th>
                  <th className="py-2 px-3 text-right">Sudah Bayar</th>
                  <th className="py-2 px-3 text-right">Sisa Hutang</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLoans.map(l => {
                  const cust = customers.find(c => c.id === l.customerId);
                  const isCustBad = cust?.status === 'bad_debt' || cust?.isBadDebt;

                  return (
                    <tr key={l.id}>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {l.customerName}
                        {isCustBad && (
                          <span className="block text-[9px] text-red-600 font-bold uppercase">
                            [Gagal Bayar]
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700">{l.itemName}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{l.startDate}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">Rp {l.totalLoanAmount.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-700 font-semibold">Rp {l.totalPaid.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">Rp {l.remainingAmount.toLocaleString('id-ID')}</td>
                      <td className="py-2 px-3 text-center">
                        {isCustBad ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            MACET
                          </span>
                        ) : l.status === 'paid_off' ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            LUNAS
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            BERJALAN
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Payments Table */}
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            2. Rincian Pembayaran Kas Masuk ({filteredPayments.length})
          </h4>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">No. Kwitansi</th>
                  <th className="py-2 px-3">Tanggal</th>
                  <th className="py-2 px-3">Nasabah</th>
                  <th className="py-2 px-3">Metode</th>
                  <th className="py-2 px-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{p.receiptNumber}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{p.paymentDate}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{p.customerName}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-bold text-slate-500">{p.paymentMethod}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-6 flex justify-between items-end text-xs text-slate-600">
          <div>
            <p className="text-[10px] text-slate-400">Dicetak melalui KreditKu Platform Multi-Tenant</p>
          </div>
          <div className="text-center space-y-8">
            <p>Pemilik Usaha,</p>
            <p className="font-bold border-t border-slate-400 pt-1 px-4">{currentTenant?.ownerName || '.....................'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
