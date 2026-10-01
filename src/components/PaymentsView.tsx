import React, { useState } from 'react';
import { Customer, Loan, Payment, Installment, PaymentMethod } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import { dbService } from '../services/dbService';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  Printer,
  Share2,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  X,
  ExternalLink,
  Calendar,
  Building2,
  FileCheck
} from 'lucide-react';

interface PaymentsViewProps {
  payments: Payment[];
  loans: Loan[];
  customers: Customer[];
  installments: Installment[];
  showAddPaymentDirectly?: boolean;
  preselectedLoan?: Loan | null;
  preselectedInstallment?: Installment | null;
  onCloseAddDirectly?: () => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  loans,
  customers,
  installments,
  showAddPaymentDirectly,
  preselectedLoan,
  preselectedInstallment,
  onCloseAddDirectly
}) => {
  const { currentTenantId, currentUid, currentUser, currentTenant, settings } = useAuthAndTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState<'all' | PaymentMethod>('all');
  const [showAddModal, setShowAddModal] = useState(showAddPaymentDirectly || false);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [voidPaymentTarget, setVoidPaymentTarget] = useState<Payment | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Form State
  const [selectedLoanId, setSelectedLoanId] = useState(preselectedLoan?.id || '');
  const [amount, setAmount] = useState<number | ''>(preselectedInstallment?.amount || preselectedLoan?.installmentAmount || 250000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState(preselectedInstallment?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeLoans = loans.filter(l => l.status === 'active');
  const currentLoan = loans.find(l => l.id === selectedLoanId);

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const matchesSearch =
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethod = filterMethod === 'all' || p.paymentMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

  const handleOpenAdd = (loan?: Loan) => {
    if (loan) {
      setSelectedLoanId(loan.id);
      setAmount(loan.installmentAmount);
    } else if (activeLoans.length > 0) {
      setSelectedLoanId(activeLoans[0].id);
      setAmount(activeLoans[0].installmentAmount);
    }
    setShowAddModal(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan || !amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      const recorded = await dbService.recordPayment(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        currentLoan,
        Number(amount),
        paymentMethod,
        paymentDate,
        notes,
        selectedInstallmentId || undefined
      );

      setShowAddModal(false);
      setSelectedReceipt(recorded);
      if (onCloseAddDirectly) onCloseAddDirectly();
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmVoid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidPaymentTarget) return;
    const loan = loans.find(l => l.id === voidPaymentTarget.loanId);
    if (!loan) {
      alert('Kontrak kredit terkait tidak ditemukan.');
      return;
    }

    setIsVoiding(true);
    try {
      await dbService.voidPayment(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        voidPaymentTarget,
        loan,
        voidReason.trim() || 'Pembatalan transaksi'
      );
      setVoidPaymentTarget(null);
      setVoidReason('');
    } catch (err) {
      console.error('Failed to void payment:', err);
    } finally {
      setIsVoiding(false);
    }
  };

  const generateWhatsAppReceiptText = (payment: Payment) => {
    const loan = loans.find(l => l.id === payment.loanId);
    let template = settings?.whatsappReceiptTemplate ||
      'Terima kasih Bpk/Ibu *{nama}*! Pembayaran angsuran kredit *{barang}* sebesar *Rp{nominal}* telah kami terima pada *{tanggal}* (Kwitansi: {no_kwitansi}). Sisa tagihan Anda: *Rp{sisa_piutang}*. - *{nama_usaha}*';

    template = template
      .replace(/{nama}/g, payment.customerName)
      .replace(/{barang}/g, loan?.itemName || 'Kredit Barang')
      .replace(/{nominal}/g, payment.amount.toLocaleString('id-ID'))
      .replace(/{tanggal}/g, payment.paymentDate)
      .replace(/{no_kwitansi}/g, payment.receiptNumber)
      .replace(/{sisa_piutang}/g, (loan?.remainingAmount || 0).toLocaleString('id-ID'))
      .replace(/{nama_usaha}/g, currentTenant?.businessName || 'KreditKu');

    return encodeURIComponent(template);
  };

  const getCustomerPhone = (customerId: string) => {
    const c = customers.find(item => item.id === customerId);
    let clean = (c?.phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Buku Pembayaran & Kas</h2>
          <p className="text-xs text-slate-500">
            Riwayat penerimaan angsuran, penerbitan kwitansi digital, dan pembatalan (VOID) transaksi aman.
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Catat Pembayaran Baru</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari no kwitansi, nama nasabah..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Method filter */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilterMethod('all')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterMethod === 'all' ? 'bg-white shadow-2xs text-teal-900 font-bold' : 'text-slate-600'}`}
          >
            Semua Metode
          </button>
          <button
            onClick={() => setFilterMethod('cash')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterMethod === 'cash' ? 'bg-white shadow-2xs text-teal-900 font-bold' : 'text-slate-600'}`}
          >
            Tunai
          </button>
          <button
            onClick={() => setFilterMethod('transfer')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterMethod === 'transfer' ? 'bg-white shadow-2xs text-teal-900 font-bold' : 'text-slate-600'}`}
          >
            Transfer
          </button>
          <button
            onClick={() => setFilterMethod('qris')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${filterMethod === 'qris' ? 'bg-white shadow-2xs text-teal-900 font-bold' : 'text-slate-600'}`}
          >
            QRIS
          </button>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Belum Ada Transaksi Pembayaran</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Catat cicilan masuk dari nasabah Anda untuk memperbarui sisa piutang secara otomatis.
          </p>
          <button
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            + Catat Pembayaran Sekarang
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">No. Kwitansi</th>
                  <th className="py-3 px-4 font-bold">Nasabah</th>
                  <th className="py-3 px-4 font-bold">Tanggal</th>
                  <th className="py-3 px-4 font-bold">Metode</th>
                  <th className="py-3 px-4 font-bold">Nominal</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(p => {
                  const isVoid = p.status === 'void';
                  const loan = loans.find(l => l.id === p.loanId);

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/80 transition ${isVoid ? 'bg-red-50/30 opacity-70' : ''}`}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.customerName}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{loan?.itemName || 'Kredit Barang'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {p.paymentDate}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-sm">
                        <span className={isVoid ? 'line-through text-slate-400' : 'text-emerald-700'}>
                          Rp {p.amount.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isVoid ? (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              VOID (DIBATALKAN)
                            </span>
                            {p.voidReason && (
                              <div className="text-[10px] text-red-500 italic mt-0.5">{p.voidReason}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            VALID
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Lihat / Cetak Kwitansi"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          {!isVoid && (
                            <a
                              href={`https://wa.me/${getCustomerPhone(p.customerId)}?text=${generateWhatsAppReceiptText(p)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              title="Kirim Struk ke WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </a>
                          )}

                          {!isVoid && (
                            <button
                              onClick={() => {
                                setVoidPaymentTarget(p);
                                setVoidReason('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="VOID (Batalkan Pembayaran)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Payment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Catat Pembayaran Angsuran</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kontrak Kredit Aktif <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedLoanId}
                  onChange={(e) => {
                    const lId = e.target.value;
                    setSelectedLoanId(lId);
                    const l = loans.find(item => item.id === lId);
                    if (l) setAmount(l.installmentAmount);
                  }}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="">-- Pilih Kontrak Kredit --</option>
                  {activeLoans.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.customerName} - {l.itemName} (Sisa: Rp {l.remainingAmount.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              {currentLoan && (
                <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Nasabah:</span>
                    <strong className="text-slate-900">{currentLoan.customerName}</strong>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Barang Kredit:</span>
                    <strong className="text-slate-900">{currentLoan.itemName}</strong>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Sisa Pokok Hutang:</span>
                    <strong className="text-amber-700 font-mono font-bold">
                      Rp {currentLoan.remainingAmount.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Pembayaran Diterima (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="250000"
                  className="w-full px-3.5 py-2 border border-teal-300 rounded-xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="cash">Tunai (Cash)</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="qris">QRIS / E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titip lewat anak / Lunas sebagian"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pembayaran & Buat Kwitansi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Kwitansi / Struk Modal Siap Cetak & WhatsApp */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Kwitansi Pembayaran Resmi
              </span>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Print Area */}
            <div className="p-6 space-y-4 print-area bg-white">
              {/* Receipt Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl overflow-hidden p-1 border border-slate-200">
                  <img
                    src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2"
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">{currentTenant?.businessName}</h3>
                <p className="text-[11px] text-slate-500">{currentTenant?.businessAddress || 'Platform Buku Kredit Digital'}</p>
                <p className="text-[11px] text-slate-500">WhatsApp: {currentTenant?.phone || '-'}</p>
              </div>

              {/* Receipt Meta */}
              <div className="flex justify-between text-xs font-mono text-slate-600 py-1">
                <span>No: <strong>{selectedReceipt.receiptNumber}</strong></span>
                <span>{selectedReceipt.paymentDate}</span>
              </div>

              {/* Receipt Details */}
              <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Diterima Dari:</span>
                  <strong className="text-slate-900">{selectedReceipt.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Untuk Pembayaran:</span>
                  <span className="text-slate-800 text-right">
                    {loans.find(l => l.id === selectedReceipt.loanId)?.itemName || 'Angsuran Kredit'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode:</span>
                  <span className="uppercase font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
                </div>
                {selectedReceipt.notes && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Catatan:</span>
                    <span className="text-slate-700">{selectedReceipt.notes}</span>
                  </div>
                )}
              </div>

              {/* Total Amount Box */}
              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-600">JUMLAH DITERIMA:</span>
                <span className="text-lg font-black font-mono text-emerald-700">
                  Rp {selectedReceipt.amount.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Footer */}
              <div className="text-center text-[10px] text-slate-400 pt-2 space-y-1">
                <p>Simpan tanda terima ini sebagai bukti pembayaran yang sah.</p>
                <p className="font-semibold text-slate-600">Dicetak melalui KreditKu Platform Multi-Tenant</p>
              </div>
            </div>

            {/* Action buttons (No print) */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>

              <a
                href={`https://wa.me/${getCustomerPhone(selectedReceipt.customerId)}?text=${generateWhatsAppReceiptText(selectedReceipt)}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* VOID Confirmation Modal (Requirement #18) */}
      {voidPaymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Pembatalan (VOID)</h3>
              <p className="text-xs text-slate-500">
                Sesuai standar audit finansial, pembayaran <strong>{voidPaymentTarget.receiptNumber}</strong> sebesar <strong>Rp {voidPaymentTarget.amount.toLocaleString('id-ID')}</strong> tidak akan dihapus permanen, melainkan berstatus VOID dan saldo sisa piutang nasabah akan dikembalikan.
              </p>

              <form onSubmit={handleConfirmVoid} className="space-y-4 text-left pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alasan Pembatalan Transaksi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Contoh: Salah ketik nominal / Cek ganda"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setVoidPaymentTarget(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isVoiding}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    {isVoiding ? 'Memproses VOID...' : 'Ya, Batalkan Transaksi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
