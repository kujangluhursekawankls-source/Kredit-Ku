import React, { useState } from 'react';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  HelpCircle,
  X,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onOpenAppGuide?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenAppGuide }) => {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    resetPassword,
    switchProfileMode,
    isLoading
  } = useAuthAndTenant();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [forgotError, setForgotError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotStatus('sending');
    setForgotError('');

    try {
      await resetPassword(forgotEmail);
      setForgotStatus('sent');
    } catch (err: any) {
      setForgotStatus('error');
      setForgotError(err.message || 'Gagal mengirim email reset kata sandi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200/80 px-4 py-3 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white p-0.5 flex items-center justify-center">
              <img
                src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2"
                alt="KreditKu Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-slate-900 leading-none">
                KreditKu
              </div>
              <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider">
                Buku Kredit Digital
              </span>
            </div>
          </div>

          {onOpenAppGuide && (
            <button
              onClick={onOpenAppGuide}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 transition cursor-pointer"
            >
              Panduan Aplikasi
            </button>
          )}
        </div>
      </header>

      {/* Main Login / Register Card (Android Mobile-Optimized) */}
      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 flex flex-col justify-center space-y-4">
        {/* Banner */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Selamat Datang di KreditKu
          </h1>
          <p className="text-xs text-slate-500">
            Kelola cicilan barang & pinjaman usaha Anda dengan mudah dari HP.
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
          {/* Switch Mode Tab */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setErrorMessage(''); }}
              className={`py-2 rounded-xl transition cursor-pointer ${authMode === 'login' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setErrorMessage(''); }}
              className={`py-2 rounded-xl transition cursor-pointer ${authMode === 'register' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
            >
              Daftar Baru
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Anda / Pemilik Usaha
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStatus('idle');
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    Lupa Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-2xl shadow-md transition cursor-pointer text-sm disabled:opacity-50 mt-2"
            >
              {isSubmitting
                ? 'Memproses...'
                : authMode === 'login'
                ? 'Masuk ke Aplikasi'
                : 'Daftar Akun Baru'}
            </button>
          </form>

          {/* Or Google Login */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-slate-400 font-bold">Atau Masuk Lebih Cepat</span>
            </div>
          </div>

          <button
            onClick={loginWithGoogle}
            disabled={isLoading}
            className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold rounded-2xl border border-slate-300 shadow-2xs flex items-center justify-center gap-2.5 transition cursor-pointer text-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>
        </div>

        {/* Quick Testing Switcher */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-[11px] uppercase text-slate-700 block">
              Mode Uji Coba Saja (Simulasi Tampilan):
            </span>
            <p className="text-[11px] text-slate-400">
              Data di mode ini hanya simulasi untuk mencoba fitur aplikasi dan tidak disimpan sebagai pembukuan toko asli Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => switchProfileMode('test_user_a')}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-left border border-blue-200 transition cursor-pointer"
            >
              <div className="font-bold">Toko Berkah (Demo)</div>
              <div className="text-[10px] text-blue-600">Simulasi Elektronik</div>
            </button>
            <button
              onClick={() => switchProfileMode('test_user_b')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-left border border-amber-200 transition cursor-pointer"
            >
              <div className="font-bold">Cahaya Mandiri (Demo)</div>
              <div className="text-[10px] text-amber-600">Simulasi Kredit HP</div>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © 2026 KreditKu • Khusus Android & Pemilik Usaha
      </footer>

      {/* Lupa Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Reset Kata Sandi</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotStatus === 'sent' ? (
              <div className="py-4 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">Email Terkirim!</h4>
                <p className="text-xs text-slate-500">
                  Instruksi untuk membuat kata sandi baru telah dikirimkan ke <strong>{forgotEmail}</strong>. Periksa kotak masuk atau spam email Anda.
                </p>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="w-full mt-3 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetPassword} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Masukkan email akun KreditKu Anda. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                </p>

                {forgotStatus === 'error' && (
                  <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl">
                    {forgotError}
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus === 'sending'}
                    className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    {forgotStatus === 'sending' ? 'Mengirim...' : 'Kirim Tautan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
