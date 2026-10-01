import React, { useState } from 'react';
import { Customer, Loan, Installment, LoanType, TenorUnit } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import { dbService } from '../services/dbService';
import {
  CreditCard,
  Plus,
  Search,
  Package,
  Coins,
  Calendar,
  Clock,
  Eye,
  Trash2,
  X,
  UserPlus,
  Phone,
  MapPin,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt
} from 'lucide-react';

interface LoansViewProps {
  loans: Loan[];
  customers: Customer[];
  installments: Installment[];
  onOpenNewPayment: (loan: Loan, installment?: Installment) => void;
  preselectedCustomer?: Customer | null;
  showCreateModalDirectly?: boolean;
  onCloseCreateModalDirectly?: () => void;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  customers,
  installments,
  onOpenNewPayment,
  preselectedCustomer,
  showCreateModalDirectly,
  onCloseCreateModalDirectly
}) => {
  const { currentTenantId, currentUid, currentUser, settings } = useAuthAndTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paid_off'>('all');
  const [showAddModal, setShowAddModal] = useState(showCreateModalDirectly || false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Form State for New Loan
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [customerId, setCustomerId] = useState(preselectedCustomer?.id || '');

  // Inline New Customer Fields (Request: "tambah nasabah bisa langsung saat buat kredit !!!")
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Loan Details
  const [loanType, setLoanType] = useState<LoanType>('barang');
  const [calcMethod, setCalcMethod] = useState<'method_a' | 'method_b'>('method_a');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState<number | ''>(2000000);
  const [downPayment, setDownPayment] = useState<number | ''>(0);
  const [totalCreditPrice, setTotalCreditPrice] = useState<number | ''>(3000000);
  const [installmentAmountInput, setInstallmentAmountInput] = useState<number | ''>(300000);
  const [tenor, setTenor] = useState<number>(settings?.defaultTenor || 10);
  const [tenorUnit, setTenorUnit] = useState<TenorUnit>(settings?.defaultTenorUnit || 'bulan');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values according to Method A & Method B
  const numItemPrice = Number(itemPrice) || 0;
  const numDP = Number(downPayment) || 0;
  const numTenor = Math.max(1, Number(tenor) || 1);

  let computedTotalLoan = 0;
  let computedInstallment = 0;
  let computedMargin = 0;

  if (calcMethod === 'method_a') {
    computedTotalLoan = Number(totalCreditPrice) || 0;
    const remainingToInstall = Math.max(0, computedTotalLoan - numDP);
    computedInstallment = Math.round(remainingToInstall / numTenor);
    computedMargin = Math.max(0, computedTotalLoan - numItemPrice);
  } else {
    const installmentPerPeriod = Number(installmentAmountInput) || 0;
    computedTotalLoan = numDP + (installmentPerPeriod * numTenor);
    computedInstallment = installmentPerPeriod;
    computedMargin = Math.max(0, computedTotalLoan - numItemPrice);
  }

  const filteredLoans = loans.filter(l => {
    const matchesSearch =
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAddModal = (customer?: Customer) => {
    if (customer) {
      setCustomerId(customer.id);
      setIsNewCustomerMode(false);
    } else if (customers.length > 0) {
      setCustomerId(customers[0].id);
      setIsNewCustomerMode(false);
    } else {
      setIsNewCustomerMode(true);
    }
    setShowAddModal(true);
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      let finalCustomerId = customerId;
      let finalCustomerName = '';
      let finalCustomerPhone = '';

      if (isNewCustomerMode) {
        if (!newCustName.trim() || !newCustPhone.trim()) {
          alert('Nama nasabah dan nomor WhatsApp wajib diisi.');
          setIsSubmitting(false);
          return;
        }

        // Create Customer right inside this form!
        const createdCustomer = await dbService.createCustomer(
          currentTenantId,
          currentUid,
          currentUser?.displayName || 'User',
          {
            name: newCustName.trim(),
            phone: newCustPhone.trim(),
            address: newCustAddress.trim(),
            status: 'active'
          }
        );
        finalCustomerId = createdCustomer.id;
        finalCustomerName = createdCustomer.name;
        finalCustomerPhone = createdCustomer.phone;
      } else {
        const existingCust = customers.find(c => c.id === customerId);
        if (!existingCust) {
          alert('Silakan pilih nasabah atau buat nasabah baru.');
          setIsSubmitting(false);
          return;
        }
        finalCustomerId = existingCust.id;
        finalCustomerName = existingCust.name;
        finalCustomerPhone = existingCust.phone;
      }

      await dbService.createLoan(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        {
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          customerPhone: finalCustomerPhone,
          type: loanType,
          itemName: itemName.trim() || (loanType === 'barang' ? 'Kredit Barang' : 'Pinjaman Tunai'),
          itemPrice: numItemPrice,
          downPayment: numDP,
          totalLoanAmount: computedTotalLoan,
          installmentAmount: computedInstallment,
          tenor: numTenor,
          tenorUnit,
          startDate,
          dueDate: new Date(new Date(startDate).getTime() + (numTenor * 30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          notes: notes.trim()
        }
      );

      setShowAddModal(false);
      // Reset form
      setNewCustName('');
      setNewCustPhone('');
      setNewCustAddress('');
      setItemName('');
      if (onCloseCreateModalDirectly) onCloseCreateModalDirectly();
    } catch (err) {
      console.error('Failed to create loan:', err);
      alert('Gagal membuat kredit. Silakan periksa koneksi internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLoan = async (loan: Loan) => {
    if (confirm(`Batalkan kredit "${loan.itemName}" untuk ${loan.customerName}?`)) {
      await dbService.softDeleteLoan(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        loan.id,
        loan.itemName
      );
      if (selectedLoan?.id === loan.id) setSelectedLoan(null);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile-First Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">Kredit & Pinjaman</h2>
          <p className="text-xs text-slate-500">Total {loans.length} kontrak kredit</p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Kredit</span>
        </button>
      </div>

      {/* Search & Status Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama nasabah atau nama barang..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === 'all' ? 'bg-teal-700 text-white font-bold' : 'text-slate-600'}`}
          >
            Semua ({loans.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === 'active' ? 'bg-amber-500 text-white font-bold' : 'text-slate-600'}`}
          >
            Aktif ({loans.filter(l => l.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('paid_off')}
            className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterStatus === 'paid_off' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
          >
            Lunas ({loans.filter(l => l.status === 'paid_off').length})
          </button>
        </div>
      </div>

      {/* Loans List Cards - Android Friendly */}
      {filteredLoans.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Data Kredit</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Catat penjualan kredit barang elektronik, HP, furniture, atau pinjaman uang.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            + Buat Kredit Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLoans.map(loan => {
            const isPaidOff = loan.status === 'paid_off' || loan.remainingAmount <= 0;
            const progress = loan.totalLoanAmount > 0 ? Math.min(100, Math.round((loan.totalPaid / loan.totalLoanAmount) * 100)) : 100;

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {loan.type === 'barang' ? 'Kredit Barang' : 'Pinjaman Tunai'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{loan.itemName}</h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Nasabah: <strong className="text-slate-800">{loan.customerName}</strong>
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPaidOff ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {isPaidOff ? 'LUNAS' : 'BERJALAN'}
                  </span>
                </div>

                {/* Financial Summary & Progress */}
                <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Kredit:</span>
                    <strong className="font-mono text-slate-900 font-bold">
                      Rp {loan.totalLoanAmount.toLocaleString('id-ID')}
                    </strong>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Angsuran per {loan.tenorUnit}:</span>
                    <strong className="font-mono text-teal-700">
                      Rp {loan.installmentAmount.toLocaleString('id-ID')} ({loan.tenor}x)
                    </strong>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Sudah Bayar: Rp {loan.totalPaid.toLocaleString('id-ID')}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isPaidOff ? 'bg-emerald-500' : 'bg-teal-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-1 border-t border-slate-200 text-xs">
                    <span className="text-slate-600 font-bold">Sisa Tagihan:</span>
                    <strong className={`font-mono font-bold text-sm ${isPaidOff ? 'text-emerald-600' : 'text-amber-700'}`}>
                      Rp {loan.remainingAmount.toLocaleString('id-ID')}
                    </strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedLoan(loan)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Jadwal Cicilan</span>
                  </button>

                  {!isPaidOff && (
                    <button
                      onClick={() => onOpenNewPayment(loan)}
                      className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs"
                    >
                      <span>Catat Bayar</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteLoan(loan)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    title="Batalkan Kredit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Jadwal Angsuran */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-teal-700">Kartu Angsuran</span>
                <h3 className="text-base font-bold text-slate-900">{selectedLoan.itemName}</h3>
                <p className="text-xs text-slate-500">{selectedLoan.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {installments.filter(i => i.loanId === selectedLoan.id).map(inst => {
                const isPaid = inst.status === 'paid';
                return (
                  <div
                    key={inst.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${isPaid ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'}`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">
                        Cicilan Ke-{inst.installmentNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Jatuh tempo: {inst.dueDate}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-900">
                          Rp {inst.amount.toLocaleString('id-ID')}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {isPaid ? 'LUNAS' : 'BELUM'}
                        </span>
                      </div>

                      {!isPaid && (
                        <button
                          onClick={() => {
                            const l = selectedLoan;
                            setSelectedLoan(null);
                            onOpenNewPayment(l, inst);
                          }}
                          className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] font-bold"
                        >
                          Bayar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add New Loan with INLINE ADD CUSTOMER & DUAL CALCULATION */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">Buat Kredit / Pinjaman Baru</h3>
                <p className="text-[11px] text-slate-400">Pilih nasabah atau input nasabah baru langsung di sini</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="p-5 space-y-4">
              {/* Nasabah Option: Existing vs New Inline */}
              <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900">Data Nasabah:</span>
                  <div className="flex items-center rounded-lg bg-teal-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerMode(false)}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${!isNewCustomerMode ? 'bg-white text-teal-900 font-bold shadow-2xs' : 'text-teal-700'}`}
                    >
                      Pilih Nasabah
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewCustomerMode(true)}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${isNewCustomerMode ? 'bg-white text-teal-900 font-bold shadow-2xs' : 'text-teal-700'}`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>+ Nasabah Baru</span>
                    </button>
                  </div>
                </div>

                {!isNewCustomerMode ? (
                  <div className="space-y-2">
                    <select
                      required
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      <option value="">-- Pilih Dari Buku Nasabah --</option>
                      {customers.map(c => {
                        const isBad = c.isBadDebt || c.status === 'bad_debt';
                        return (
                          <option key={c.id} value={c.id} className={isBad ? 'text-red-600 font-bold' : ''}>
                            {c.name} {isBad ? '[⚠️ GAGAL BAYAR]' : ''} ({c.phone})
                          </option>
                        );
                      })}
                    </select>

                    {customers.find(c => c.id === customerId)?.isBadDebt && (
                      <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-xs text-red-800 font-bold">
                        ⚠️ PERINGATAN: Nasabah ini tercatat memiliki riwayat GAGAL BAYAR (Macet).
                      </div>
                    )}
                  </div>
                ) : (
                  /* Inline New Customer Fields */
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <input
                        type="text"
                        required
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        placeholder="Nama Lengkap Nasabah *"
                        className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        required
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        placeholder="Nomor WhatsApp (Contoh: 081234567890) *"
                        className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newCustAddress}
                        onChange={(e) => setNewCustAddress(e.target.value)}
                        placeholder="Alamat Tempat Tinggal (Opsional)"
                        className="w-full px-3 py-2 bg-white border border-teal-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <p className="text-[11px] text-teal-800">
                      ✓ Nasabah akan otomatis tersimpan ke buku nasabah bersama kredit ini.
                    </p>
                  </div>
                )}
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang / Keterangan Kredit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Contoh: Kulkas Sharp 2 Pintu / HP Samsung A15"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Calculation Method (Metode A vs B) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  Metode Perhitungan Angsuran:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalcMethod('method_a')}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${calcMethod === 'method_a' ? 'bg-white border-teal-500 text-teal-900 font-bold shadow-2xs' : 'border-slate-200 text-slate-600 bg-white'}`}
                  >
                    <div>Metode A</div>
                    <div className="text-[10px] text-slate-400 font-normal">Input Total Kredit</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalcMethod('method_b')}
                    className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${calcMethod === 'method_b' ? 'bg-white border-teal-500 text-teal-900 font-bold shadow-2xs' : 'border-slate-200 text-slate-600 bg-white'}`}
                  >
                    <div>Metode B</div>
                    <div className="text-[10px] text-slate-400 font-normal">Input Cicilan x Tenor</div>
                  </button>
                </div>
              </div>

              {/* Financial inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Modal / Tunai (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="2000000"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uang Muka / DP (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {calcMethod === 'method_a' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Harga Kredit yang Disepakati (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalCreditPrice}
                    onChange={(e) => setTotalCreditPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3000000"
                    className="w-full px-3.5 py-2.5 border border-teal-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Angsuran per Termin (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={installmentAmountInput}
                    onChange={(e) => setInstallmentAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="300000"
                    className="w-full px-3.5 py-2.5 border border-teal-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Tenor & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Tenor (Termin)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    required
                    value={tenor}
                    onChange={(e) => setTenor(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Periode Cicilan
                  </label>
                  <select
                    value={tenorUnit}
                    onChange={(e) => setTenorUnit(e.target.value as TenorUnit)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="bulan">Bulan (Bulanan)</option>
                    <option value="minggu">Minggu (Mingguan)</option>
                    <option value="hari">Hari (Harian)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Summary Calculation Preview */}
              <div className="bg-teal-50/80 border border-teal-200 p-3.5 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-teal-900">
                  <span>Hasil Perhitungan:</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Total Tagihan:</span>
                  <strong className="font-mono text-slate-900">Rp {computedTotalLoan.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Cicilan per {tenorUnit}:</span>
                  <strong className="font-mono text-teal-700 font-bold">
                    Rp {computedInstallment.toLocaleString('id-ID')} x {numTenor}
                  </strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Margin Keuntungan:</span>
                  <strong className="font-mono text-emerald-700 font-bold">+Rp {computedMargin.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Simpan & Buat Kredit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
