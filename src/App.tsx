import React, { useState, useEffect } from 'react';
import { AuthAndTenantProvider, useAuthAndTenant } from './context/AuthAndTenantContext';
import { dbService } from './services/dbService';
import { Customer, Loan, Payment, Installment, NotificationItem, AuditLogItem } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { LoansView } from './components/LoansView';
import { PaymentsView } from './components/PaymentsView';
import { RemindersView } from './components/RemindersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AuditLogView } from './components/AuditLogView';
import { CrossTenantTestView } from './components/CrossTenantTestView';
import { OnboardingModal } from './components/OnboardingModal';
import { AppGuideModal } from './components/AppGuideModal';
import { LoginView } from './components/LoginView';
import { DEMO_DATASETS } from './data/demoData';
import {
  Home,
  Users,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Bell,
  Settings,
  ShieldCheck,
  Activity,
  Menu,
  X,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    currentUser,
    currentTenant,
    currentTenantId,
    currentUid,
    isAuthenticated,
    isLoading,
    needsOnboarding,
    profileMode,
    switchProfileMode
  } = useAuthAndTenant();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showAppGuide, setShowAppGuide] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // Tenant-Scoped Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Action Modals State
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [preselectedCustomerForLoan, setPreselectedCustomerForLoan] = useState<Customer | null>(null);
  const [showNewPaymentModal, setShowNewPaymentModal] = useState(false);
  const [preselectedLoanForPayment, setPreselectedLoanForPayment] = useState<Loan | null>(null);
  const [preselectedInstallmentForPayment, setPreselectedInstallmentForPayment] = useState<Installment | null>(null);

  const isDemo = profileMode !== 'google';

  // Real-time synchronization strictly bound to currentTenantId and currentUid
  useEffect(() => {
    if (isDemo) {
      // In Demo Mode: load in-memory simulated dataset for testing only (never writes to real Firestore)
      const dataset = DEMO_DATASETS[profileMode as keyof typeof DEMO_DATASETS] || DEMO_DATASETS.test_user_a;
      setCustomers(dataset.customers);
      setLoans(dataset.loans);
      setInstallments(dataset.installments);
      setPayments(dataset.payments);
      setNotifications(dataset.notifications);
      setAuditLogs(dataset.auditLogs);
      return;
    }

    if (!isAuthenticated || !currentTenantId || !currentUid) {
      setCustomers([]);
      setLoans([]);
      setInstallments([]);
      setPayments([]);
      setNotifications([]);
      setAuditLogs([]);
      return;
    }

    const unsubCustomers = dbService.listenCustomers(currentTenantId, currentUid, (data) => {
      setCustomers(data);
    });

    const unsubLoans = dbService.listenLoans(currentTenantId, currentUid, (data) => {
      setLoans(data);
    });

    const unsubInstallments = dbService.listenInstallments(currentTenantId, currentUid, (data) => {
      setInstallments(data);
    });

    const unsubPayments = dbService.listenPayments(currentTenantId, currentUid, (data) => {
      setPayments(data);
    });

    const unsubNotifs = dbService.listenNotifications(currentTenantId, currentUid, (data) => {
      setNotifications(data);
    });

    const unsubLogs = dbService.listenAuditLogs(currentTenantId, currentUid, (data) => {
      setAuditLogs(data);
    });

    return () => {
      unsubCustomers();
      unsubLoans();
      unsubInstallments();
      unsubPayments();
      unsubNotifs();
      unsubLogs();
    };
  }, [isAuthenticated, currentTenantId, currentUid, isDemo, profileMode]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-white p-2 mb-3 animate-bounce">
          <img
            src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2"
            alt="KreditKu Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-slate-900 font-black text-base">Memuat KreditKu...</div>
        <p className="text-xs text-slate-500 mt-0.5">Menyiapkan buku kredit Anda</p>
      </div>
    );
  }

  // Not logged in and doesn't need onboarding
  if (!isAuthenticated && !needsOnboarding) {
    return (
      <>
        <LoginView onOpenAppGuide={() => setShowAppGuide(true)} />
        <AppGuideModal isOpen={showAppGuide} onClose={() => setShowAppGuide(false)} />
      </>
    );
  }

  // Handlers for quick actions
  const handleOpenNewLoan = (customer?: Customer) => {
    setPreselectedCustomerForLoan(customer || null);
    setShowNewLoanModal(true);
    setActiveTab('loans');
  };

  const handleOpenNewPayment = (loan?: Loan, installment?: Installment) => {
    setPreselectedLoanForPayment(loan || null);
    setPreselectedInstallmentForPayment(installment || null);
    setShowNewPaymentModal(true);
    setActiveTab('payments');
  };

  const handleSendWhatsAppFromDashboard = () => {
    setActiveTab('reminders');
  };

  // Bottom Navigation Items (Android Mobile Standard)
  const bottomNavItems = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'customers', label: 'Nasabah', icon: Users, badge: customers.length },
    { id: 'loans', label: 'Kredit', icon: CreditCard, badge: loans.filter(l => l.status === 'active').length },
    { id: 'payments', label: 'Buku Kas', icon: Receipt },
    { id: 'reports', label: 'Laporan', icon: FileSpreadsheet },
    { id: 'more_menu', label: 'Menu', icon: Menu }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        notifications={notifications}
        onOpenAppGuide={() => setShowAppGuide(true)}
        onOpenCrossTenantTest={() => setActiveTab('test_cross_tenant')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container - Optimized for Android viewports */}
      <div className="max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 flex-1">
        {/* Warning if user is in Demo Mode */}
        {isDemo && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Uji Coba:</strong> Anda sedang dalam simulasi demo. Data tidak disimpan sebagai pembukuan toko asli Anda.
              </span>
            </div>
            <button
              onClick={() => switchProfileMode('google')}
              className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px] shrink-0"
            >
              Masuk Akun Asli
            </button>
          </div>
        )}

        <main>
          {activeTab === 'dashboard' && (
            <DashboardView
              customers={customers}
              loans={loans}
              payments={payments}
              installments={installments}
              onOpenNewCustomer={() => setActiveTab('customers')}
              onOpenNewLoan={() => handleOpenNewLoan()}
              onOpenNewPayment={handleOpenNewPayment}
              onSendWhatsApp={handleSendWhatsAppFromDashboard}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              loans={loans}
              onOpenNewLoanForCustomer={(customer) => handleOpenNewLoan(customer)}
            />
          )}

          {activeTab === 'loans' && (
            <LoansView
              loans={loans}
              customers={customers}
              installments={installments}
              onOpenNewPayment={handleOpenNewPayment}
              preselectedCustomer={preselectedCustomerForLoan}
              showCreateModalDirectly={showNewLoanModal}
              onCloseCreateModalDirectly={() => setShowNewLoanModal(false)}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              payments={payments}
              loans={loans}
              customers={customers}
              installments={installments}
              showAddPaymentDirectly={showNewPaymentModal}
              preselectedLoan={preselectedLoanForPayment}
              preselectedInstallment={preselectedInstallmentForPayment}
              onCloseAddDirectly={() => setShowNewPaymentModal(false)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              customers={customers}
              loans={loans}
              payments={payments}
              installments={installments}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              installments={installments}
              loans={loans}
              customers={customers}
              onOpenNewPayment={handleOpenNewPayment}
            />
          )}

          {activeTab === 'settings' && <SettingsView />}

          {activeTab === 'audit_logs' && <AuditLogView logs={auditLogs} />}

          {activeTab === 'test_cross_tenant' && <CrossTenantTestView />}
        </main>
      </div>

      {/* Android Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/98 backdrop-blur-md border-t border-slate-200/90 py-1.5 px-2 z-40 shadow-lg no-print">
        <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-around">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isMenu = item.id === 'more_menu';
            const isActive = isMenu ? showMoreMenu : (activeTab === item.id && !showMoreMenu);

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (isMenu) {
                    setShowMoreMenu(prev => !prev);
                  } else {
                    setActiveTab(item.id);
                    setShowMoreMenu(false);
                  }
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition cursor-pointer relative ${
                  isActive ? 'text-teal-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 text-[9px] font-black bg-teal-600 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* "Lainnya / Menu" Android Drawer / Sheet */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs p-0 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl shadow-2xl max-w-md w-full border border-slate-100 p-5 space-y-4 pb-12">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-900">Menu Tambahan Usaha</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-full bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { setShowAppGuide(true); setShowMoreMenu(false); }}
                className="w-full p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 flex items-center justify-between text-xs font-bold text-teal-900 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-600 text-white">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <span>Buku Panduan Penggunaan Aplikasi</span>
                </div>
                <span className="text-teal-600">Buka →</span>
              </button>

              <button
                onClick={() => { setActiveTab('reminders'); setShowMoreMenu(false); }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span>Pengingat WhatsApp Jatuh Tempo</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setShowMoreMenu(false); }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span>Pengaturan Profil Toko & WhatsApp</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => { setActiveTab('audit_logs'); setShowMoreMenu(false); }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-800">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span>Audit Log / Riwayat Pembukuan</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>

              <button
                onClick={() => { setActiveTab('test_cross_tenant'); setShowMoreMenu(false); }}
                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Uji Isolasi Multi-Tenant (A vs B vs C)</span>
                </div>
                <span className="text-slate-400">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <OnboardingModal />
      <AppGuideModal isOpen={showAppGuide} onClose={() => setShowAppGuide(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AuthAndTenantProvider>
      <MainApp />
    </AuthAndTenantProvider>
  );
}
