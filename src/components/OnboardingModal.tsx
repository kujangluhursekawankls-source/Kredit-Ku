import React, { useState } from 'react';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import { Store, User, Phone, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { needsOnboarding, completeOnboarding, isLoading, currentUser } = useAuthAndTenant();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!needsOnboarding) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErrorMsg('Nama usaha wajib diisi.');
      return;
    }
    if (!ownerName.trim()) {
      setErrorMsg('Nama pemilik wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await completeOnboarding({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        businessAddress: businessAddress.trim(),
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan profil usaha. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-600 px-6 py-6 text-white text-center relative">
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 p-2 shadow-inner">
            <img 
              src="https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2" 
              alt="KreditKu Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Selamat Datang di KreditKu!</h2>
          <p className="text-teal-100 text-sm mt-1">
            Platform Buku Kredit Digital Multi-User. Mari siapkan profil usaha Anda dalam 1 menit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Usaha / Toko <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Store className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Contoh: Toko Berkah Elektronik & Mebel"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Pemilik Usaha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp Usaha
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Digunakan sebagai nomor pengirim struk & pengingat tagihan ke nasabah.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Alamat Usaha
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Contoh: Jl. Diponegoro No. 45, Surabaya"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyiapkan Tenant Usaha...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Mulai Kelola Kredit Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">
            Data usaha dan seluruh nasabah Anda dienkripsi & terisolasi 100% mandiri (Multi-Tenant).
          </p>
        </form>
      </div>
    </div>
  );
};
