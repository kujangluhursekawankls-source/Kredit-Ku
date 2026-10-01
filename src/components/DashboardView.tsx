import React from 'react';
import { Customer, Loan, Payment, Installment } from '../types';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  CreditCard,
  ShoppingBag,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  installments: Installment[];
  onOpenNewCustomer: () => void;
  onOpenNewLoan: () => void;
  onOpenNewPayment: (loan?: Loan) => void;
  onSendWhatsApp: (customer: Customer, loan: Loan, installment?: Installment) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  loans,
  payments,
  installments,
  onOpenNewCustomer,
  onOpenNewLoan,
  onOpenNewPayment,
  onSendWhatsApp,
  setActiveTab
}) => {
  const { currentTenant } = useAuthAndTenant();

  const activeLoans = loans.filter(l => l.status === 'active');
  const paidLoans = loans.filter(l => l.status === 'paid_off');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.remainingAmount || 0), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const paymentsThisMonth = payments.filter(p => p.status === 'valid' && p.paymentDate.startsWith(currentMonth));
  const totalReceivedThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const totalProfitEstimate = loans.reduce((sum, l) => {
    const profit = Math.max(0, (l.totalLoanAmount || 0) - (l.itemPrice || 0));
    return sum + profit;
  }, 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingInstallments = installments.filter(i => i.status === 'pending' || i.status === 'partial' || i.status === 'late');
  const dueTodayOrOverdue = pendingInstallments.filter(i => i.dueDate <= todayStr).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile Hero Card: Sisa Piutang & Kas Masuk */}
      <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-700 rounded-3xl p-5 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-teal-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Buku Kredit Usaha</span>
          </span>
          <span className="text-xs font-bold bg-white/15 px-2.5 py-0.5 rounded-full">
            {activeLoans.length} Cicilan Berjalan
          </span>
        </div>

        <div>
          <span className="text-xs text-teal-100 uppercase tracking-wider block">
            Total Sisa Piutang Berjalan:
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-0.5">
            Rp {totalOutstanding.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
          <div>
            <span className="text-teal-200 block text-[11px]">Diterima Bulan Ini:</span>
            <strong className="text-white font-mono font-bold">
              Rp {totalReceivedThisMonth.toLocaleString('id-ID')}
            </strong>
          </div>
          <div>
            <span className="text-teal-200 block text-[11px]">Estimasi Laba:</span>
            <strong className="text-emerald-300 font-mono font-bold">
              +Rp {totalProfitEstimate.toLocaleString('id-ID')}
            </strong>
          </div>
        </div>

        {/* Quick Action Buttons for Thumb Reach */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenNewLoan}
            className="py-2.5 px-3 bg-white text-teal-900 active:scale-95 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-teal-700" />
            <span>+ Kredit Baru</span>
          </button>

          <button
            onClick={() => onOpenNewPayment()}
            className="py-2.5 px-3 bg-teal-900/60 hover:bg-teal-900 active:scale-95 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-white/20 transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-teal-200" />
            <span>Catat Bayar</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => setActiveTab('customers')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs text-left active:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Nasabah</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {customers.length}
          </div>
          <span className="text-[11px] text-teal-700 font-semibold">Buka buku nasabah →</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs text-left active:bg-slate-50 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold text-slate-500">Jatuh Tempo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-700 font-mono">
            {dueTodayOrOverdue.length}
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">Kirim WhatsApp tagihan →</span>
        </button>
      </div>

      {/* Urgent Bills List (Due Today & Overdue) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-slate-900">Tagihan Perlu Ditagih</h3>
          </div>
          <button
            onClick={() => setActiveTab('reminders')}
            className="text-xs font-bold text-teal-700"
          >
            Lihat Semua ({dueTodayOrOverdue.length})
          </button>
        </div>

        {dueTodayOrOverdue.length === 0 ? (
          <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1 opacity-90" />
            <p className="text-xs font-medium text-slate-600">Semua tagihan lunas!</p>
            <p className="text-[11px] text-slate-400">Tidak ada angsuran menunggak hari ini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {dueTodayOrOverdue.slice(0, 5).map(inst => {
              const loan = loans.find(l => l.id === inst.loanId);
              const customer = customers.find(c => c.id === inst.customerId);
              const isLate = inst.dueDate < todayStr;

              return (
                <div
                  key={inst.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {customer?.name || loan?.customerName}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${isLate ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                        {isLate ? 'NUNGGAK' : 'HARI INI'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {loan?.itemName} • Cicilan ke-{inst.installmentNumber}
                    </div>
                    <div className="text-xs font-mono font-black text-slate-900 mt-1">
                      Rp {inst.amount.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {customer && loan && (
                      <button
                        onClick={() => onSendWhatsApp(customer, loan, inst)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 transition cursor-pointer"
                        title="Kirim WA Tagihan"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {loan && (
                      <button
                        onClick={() => onOpenNewPayment(loan)}
                        className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Bayar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Riwayat Penerimaan Pembayaran Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Pembayaran Terakhir</h3>
          <button
            onClick={() => setActiveTab('payments')}
            className="text-xs font-bold text-teal-700"
          >
            Buka Buku Kas →
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada pembayaran yang tercatat.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, 4).map(p => (
              <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900">{p.customerName}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{p.paymentDate} • {p.receiptNumber}</div>
                </div>
                <div className={`font-mono font-bold ${p.status === 'void' ? 'line-through text-slate-400' : 'text-emerald-700'}`}>
                  Rp {p.amount.toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
