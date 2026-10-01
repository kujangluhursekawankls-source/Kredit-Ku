import React, { useState } from 'react';
import { Customer, Loan, Installment } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  Bell,
  Send,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Filter
} from 'lucide-react';

interface RemindersViewProps {
  installments: Installment[];
  loans: Loan[];
  customers: Customer[];
  onOpenNewPayment: (loan: Loan, installment?: Installment) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  installments,
  loans,
  customers,
  onOpenNewPayment
}) => {
  const { currentTenant, settings } = useAuthAndTenant();
  const [filterType, setFilterType] = useState<'all' | 'due_today' | 'overdue' | 'upcoming'>('due_today');
  const [previewMsg, setPreviewMsg] = useState<{ text: string; phone: string } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const pendingInstallments = installments.filter(i => i.status === 'pending' || i.status === 'partial' || i.status === 'late');

  const filteredInstallments = pendingInstallments.filter(i => {
    if (filterType === 'due_today') {
      return i.dueDate === todayStr;
    }
    if (filterType === 'overdue') {
      return i.dueDate < todayStr;
    }
    if (filterType === 'upcoming') {
      return i.dueDate > todayStr && i.dueDate <= next7DaysStr;
    }
    return true;
  });

  const getCleanPhone = (phoneStr: string) => {
    let clean = phoneStr.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    return clean;
  };

  const buildReminderText = (customer: Customer, loan: Loan, installment: Installment) => {
    let template = settings?.whatsappReminderTemplate ||
      'Halo Bpk/Ibu *{nama}*, mengingatkan tagihan angsuran kredit *{barang}* sebesar *Rp{nominal}* jatuh tempo pada *{jatuh_tempo}*. Sisa tagihan: *Rp{sisa_piutang}*. Terima kasih. - *{nama_usaha}*';

    return template
      .replace(/{nama}/g, customer.name)
      .replace(/{barang}/g, loan.itemName)
      .replace(/{nominal}/g, installment.amount.toLocaleString('id-ID'))
      .replace(/{jatuh_tempo}/g, installment.dueDate)
      .replace(/{sisa_piutang}/g, loan.remainingAmount.toLocaleString('id-ID'))
      .replace(/{nama_usaha}/g, currentTenant?.businessName || 'KreditKu');
  };

  const handleOpenWhatsApp = (customer: Customer, loan: Loan, installment: Installment) => {
    const text = buildReminderText(customer, loan, installment);
    const phone = getCleanPhone(customer.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Jatuh Tempo & Pengingat WhatsApp</h2>
          <p className="text-xs text-slate-500">
            Kirim pesan pengingat tagihan cicilan barang langsung ke WhatsApp nasabah dengan 1-klik template kustom tenant.
          </p>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setFilterType('due_today')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${filterType === 'due_today' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Jatuh Tempo Hari Ini ({pendingInstallments.filter(i => i.dueDate === todayStr).length})</span>
        </button>

        <button
          onClick={() => setFilterType('overdue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${filterType === 'overdue' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Menunggak / Terlewat ({pendingInstallments.filter(i => i.dueDate < todayStr).length})</span>
        </button>

        <button
          onClick={() => setFilterType('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${filterType === 'upcoming' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>7 Hari Kedepan ({pendingInstallments.filter(i => i.dueDate > todayStr && i.dueDate <= next7DaysStr).length})</span>
        </button>

        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${filterType === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <span>Semua Tagihan ({pendingInstallments.length})</span>
        </button>
      </div>

      {/* Installments List */}
      {filteredInstallments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
          <h3 className="text-base font-bold text-slate-700">Tidak Ada Tagihan Pada Kategori Ini</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Nasabah Anda tidak memiliki jadwal angsuran yang jatuh tempo pada kriteria yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstallments.map(inst => {
            const loan = loans.find(l => l.id === inst.loanId);
            const customer = customers.find(c => c.id === inst.customerId);
            const isLate = inst.dueDate < todayStr;
            const isToday = inst.dueDate === todayStr;

            if (!loan || !customer) return null;

            return (
              <div
                key={inst.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{customer.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{customer.phone}</p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isLate ? 'bg-red-100 text-red-700' : isToday ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {isLate ? 'TERLEWAT' : isToday ? 'HARI INI' : 'MENDATANG'}
                    </span>
                  </div>

                  <div className="mt-3 bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Barang:</span>
                      <strong className="text-slate-800 line-clamp-1">{loan.itemName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Angsuran Ke:</span>
                      <span className="font-bold text-slate-800">#{inst.installmentNumber} dari {loan.tenor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jatuh Tempo:</span>
                      <strong className="font-mono text-slate-900">{inst.dueDate}</strong>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-600 font-semibold">Nominal Cicilan:</span>
                      <strong className="font-mono text-emerald-700 text-sm">
                        Rp {inst.amount.toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenWhatsApp(customer, loan, inst)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim WA</span>
                  </button>

                  <button
                    onClick={() => onOpenNewPayment(loan, inst)}
                    className="py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Catat Bayar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
