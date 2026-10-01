import React, { useState } from 'react';
import { Customer, Loan } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import { dbService } from '../services/dbService';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Trash2,
  Edit2,
  ExternalLink,
  CreditCard,
  X,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Ban
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  loans: Loan[];
  onOpenNewLoanForCustomer: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  loans,
  onOpenNewLoanForCustomer
}) => {
  const { currentTenantId, currentUid, currentUser } = useAuthAndTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'good' | 'bad_debt'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Bad Debt Modal
  const [badDebtTarget, setBadDebtTarget] = useState<Customer | null>(null);
  const [badDebtReason, setBadDebtReason] = useState('');

  // Form State - only Nama, No WA, Alamat, Catatan
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCustomers = customers.filter(c => {
    const isBad = c.status === 'bad_debt' || c.isBadDebt;
    if (filterTab === 'good' && isBad) return false;
    if (filterTab === 'bad_debt' && !isBad) return false;

    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const badDebtCount = customers.filter(c => c.status === 'bad_debt' || c.isBadDebt).length;

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address);
    setNotes(c.notes || '');
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await dbService.updateCustomer(
          currentTenantId,
          currentUid,
          currentUser?.displayName || 'User',
          editingCustomer.id,
          {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim()
          }
        );
      } else {
        await dbService.createCustomer(
          currentTenantId,
          currentUid,
          currentUser?.displayName || 'User',
          {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim(),
            status: 'active'
          }
        );
      }
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Failed to save customer:', err);
      alert('Gagal menyimpan nasabah: ' + (err.message || 'Periksa koneksi'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBadDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badDebtTarget) return;

    const isCurrentlyBad = badDebtTarget.status === 'bad_debt' || badDebtTarget.isBadDebt;
    const newBadState = !isCurrentlyBad;

    try {
      await dbService.toggleCustomerBadDebt(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        badDebtTarget.id,
        badDebtTarget.name,
        newBadState,
        badDebtReason.trim()
      );

      if (selectedCustomer?.id === badDebtTarget.id) {
        setSelectedCustomer(prev => prev ? { ...prev, status: newBadState ? 'bad_debt' : 'active', isBadDebt: newBadState } : null);
      }
      setBadDebtTarget(null);
      setBadDebtReason('');
    } catch (err) {
      console.error('Error toggling bad debt:', err);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (confirm(`Hapus nasabah "${c.name}"? Riwayat transaksi tetap aman.`)) {
      await dbService.softDeleteCustomer(
        currentTenantId,
        currentUid,
        currentUser?.displayName || 'User',
        c.id,
        c.name
      );
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer(null);
      }
    }
  };

  const cleanPhoneForWhatsApp = (num: string) => {
    let clean = num.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile-Friendly Search & Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-black text-slate-900">Buku Nasabah</h2>
          <p className="text-xs text-slate-500">
            Total {customers.length} nasabah ({badDebtCount > 0 ? `${badDebtCount} Gagal Bayar` : 'Semua Lancar'})
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* Filter Tabs: Semua, Lancar, Gagal Bayar */}
      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold gap-1">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterTab === 'all' ? 'bg-teal-700 text-white font-bold' : 'text-slate-600'}`}
        >
          Semua ({customers.length})
        </button>
        <button
          onClick={() => setFilterTab('good')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer ${filterTab === 'good' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600'}`}
        >
          Lancar ({customers.length - badDebtCount})
        </button>
        <button
          onClick={() => setFilterTab('bad_debt')}
          className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1 ${filterTab === 'bad_debt' ? 'bg-red-600 text-white font-bold' : 'text-red-700'}`}
        >
          <Ban className="w-3.5 h-3.5" />
          <span>Gagal Bayar ({badDebtCount})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari nama, nomor HP, atau alamat..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Customers Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">
            {filterTab === 'bad_debt' ? 'Tidak Ada Nasabah Gagal Bayar' : 'Belum Ada Nasabah'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {filterTab === 'bad_debt'
              ? 'Bagus! Semua nasabah Anda tertib dan belum ada yang berstatus macet.'
              : 'Tambahkan nasabah untuk mulai mencatat kredit dan pinjaman.'}
          </p>
          {filterTab !== 'bad_debt' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              + Tambah Nasabah Baru
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCustomers.map(customer => {
            const customerLoans = loans.filter(l => l.customerId === customer.id);
            const activeCustomerLoans = customerLoans.filter(l => l.status === 'active');
            const totalRemaining = activeCustomerLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
            const isBadDebt = customer.status === 'bad_debt' || customer.isBadDebt;

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl border p-4 shadow-2xs transition ${
                  isBadDebt ? 'border-red-300 bg-red-50/20 ring-1 ring-red-200' : 'border-slate-200/90'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900">{customer.name}</h4>
                      {isBadDebt ? (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white flex items-center gap-1 shadow-2xs">
                          <Ban className="w-3 h-3" />
                          <span>GAGAL BAYAR (MACET)</span>
                        </span>
                      ) : activeCustomerLoans.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          {activeCustomerLoans.length} Cicilan Berjalan
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Lunas
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{customer.phone}</span>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{customer.address || 'Alamat tidak diisi'}</span>
                    </div>

                    {isBadDebt && customer.badDebtReason && (
                      <div className="mt-1.5 text-[11px] text-red-700 bg-red-100/70 px-2 py-1 rounded-lg">
                        <strong>Catatan Macet:</strong> {customer.badDebtReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(customer)}
                      className="p-2 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sisa Piutang & Action Buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Sisa Hutang / Piutang:</span>
                    <span className={`font-mono font-bold text-sm ${totalRemaining > 0 ? (isBadDebt ? 'text-red-700' : 'text-amber-700') : 'text-slate-500'}`}>
                      Rp {totalRemaining.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Gagal Bayar Button */}
                    <button
                      onClick={() => {
                        setBadDebtTarget(customer);
                        setBadDebtReason(customer.badDebtReason || '');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        isBadDebt
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      }`}
                      title={isBadDebt ? 'Pulihkan Status Lancar' : 'Tandai Gagal Bayar'}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{isBadDebt ? 'Pulihkan' : 'Gagal Bayar'}</span>
                    </button>

                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(customer.phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WA</span>
                    </a>

                    <button
                      onClick={() => onOpenNewLoanForCustomer(customer)}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>+ Kredit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Modal (Android Drawer Style) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm ${selectedCustomer.isBadDebt ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'}`}>
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bad Debt Warning in Detail */}
            {(selectedCustomer.status === 'bad_debt' || selectedCustomer.isBadDebt) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Ban className="w-4 h-4 text-red-600" />
                  <span>NASABAH TERCATAT GAGAL BAYAR (MACET)</span>
                </div>
                <p>Alasan: {selectedCustomer.badDebtReason || 'Tunggakan angsuran tidak tertagih'}</p>
              </div>
            )}

            <div className="bg-slate-50 p-3.5 rounded-xl space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block">Alamat Lengkap</span>
                <span className="text-slate-800 font-medium">{selectedCustomer.address || '-'}</span>
              </div>
              {selectedCustomer.notes && (
                <div>
                  <span className="text-slate-400 block">Catatan / Pekerjaan</span>
                  <span className="text-slate-800">{selectedCustomer.notes}</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Riwayat Kredit Barang & Pinjaman
                </h4>
                <button
                  onClick={() => {
                    const c = selectedCustomer;
                    setSelectedCustomer(null);
                    onOpenNewLoanForCustomer(c);
                  }}
                  className="text-xs font-bold text-teal-700 cursor-pointer"
                >
                  + Tambah Kredit
                </button>
              </div>

              {loans.filter(l => l.customerId === selectedCustomer.id).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Belum ada kredit untuk nasabah ini.</p>
              ) : (
                <div className="space-y-2">
                  {loans.filter(l => l.customerId === selectedCustomer.id).map(loan => (
                    <div key={loan.id} className="p-3 rounded-xl border border-slate-200 bg-white text-xs">
                      <div className="flex items-center justify-between font-bold">
                        <span>{loan.itemName}</span>
                        <span className={loan.status === 'paid_off' ? 'text-emerald-600' : 'text-amber-700'}>
                          {loan.status === 'paid_off' ? 'LUNAS' : `Sisa Rp ${loan.remainingAmount.toLocaleString('id-ID')}`}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1">
                        Total Rp {loan.totalLoanAmount.toLocaleString('id-ID')} • Cicilan Rp {loan.installmentAmount.toLocaleString('id-ID')} x {loan.tenor}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tandai Gagal Bayar (Macet) */}
      {badDebtTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-xl ${badDebtTarget.isBadDebt ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {badDebtTarget.isBadDebt ? 'Pulihkan Status Nasabah' : 'Tandai Nasabah Gagal Bayar'}
                </h3>
                <p className="text-xs text-slate-500">{badDebtTarget.name}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmBadDebt} className="space-y-3 pt-1">
              {!badDebtTarget.isBadDebt ? (
                <>
                  <p className="text-xs text-slate-600">
                    Nasabah ini akan diberi tanda <strong>GAGAL BAYAR (MACET)</strong> berwarna merah di seluruh daftar dan kartu tagihan.
                  </p>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan Gagal Bayar / Macet:
                    </label>
                    <input
                      type="text"
                      required
                      value={badDebtReason}
                      onChange={(e) => setBadDebtReason(e.target.value)}
                      placeholder="Contoh: Nomor WA tidak aktif / Menolak bayar"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600">
                  Yakin ingin memulihkan status nasabah <strong>{badDebtTarget.name}</strong> kembali menjadi <strong>LANCAR</strong>?
                </p>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBadDebtTarget(null)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white font-bold rounded-xl text-xs ${
                    badDebtTarget.isBadDebt ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {badDebtTarget.isBadDebt ? 'Ya, Pulihkan Lancar' : 'Ya, Tandai Gagal Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {editingCustomer ? 'Edit Data Nasabah' : 'Tambah Nasabah Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Nasabah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pak Joko Santoso"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp / HP <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Tempat Tinggal
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: RT 03 RW 02 Desa Sukamaju"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kios pasar / Tetangga Pak RT"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Nasabah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
