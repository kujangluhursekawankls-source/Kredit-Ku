import React, { useState } from 'react';
import { useAuthAndTenant } from '../context/AuthAndTenantContext';
import {
  Settings,
  Store,
  Phone,
  MapPin,
  MessageSquare,
  Shield,
  CreditCard,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { TenorUnit } from '../types';

export const SettingsView: React.FC = () => {
  const { currentTenant, settings, updateTenantProfile, updateSettings } = useAuthAndTenant();

  // Business Profile Form
  const [businessName, setBusinessName] = useState(currentTenant?.businessName || '');
  const [ownerName, setOwnerName] = useState(currentTenant?.ownerName || '');
  const [phone, setPhone] = useState(currentTenant?.phone || '');
  const [businessAddress, setBusinessAddress] = useState(currentTenant?.businessAddress || '');

  // Tenant Settings Form
  const [defaultTenor, setDefaultTenor] = useState(settings?.defaultTenor || 10);
  const [defaultTenorUnit, setDefaultTenorUnit] = useState<TenorUnit>(settings?.defaultTenorUnit || 'bulan');
  const [whatsappReminderTemplate, setWhatsappReminderTemplate] = useState(
    settings?.whatsappReminderTemplate ||
    'Halo Bpk/Ibu *{nama}*, mengingatkan tagihan angsuran kredit *{barang}* sebesar *Rp{nominal}* jatuh tempo pada *{jatuh_tempo}*. Sisa tagihan: *Rp{sisa_piutang}*. Terima kasih. - *{nama_usaha}*'
  );
  const [whatsappReceiptTemplate, setWhatsappReceiptTemplate] = useState(
    settings?.whatsappReceiptTemplate ||
    'Terima kasih Bpk/Ibu *{nama}*! Pembayaran angsuran kredit *{barang}* sebesar *Rp{nominal}* telah kami terima pada *{tanggal}* (Kwitansi: {no_kwitansi}). Sisa tagihan Anda: *Rp{sisa_piutang}*. - *{nama_usaha}*'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateTenantProfile({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        businessAddress: businessAddress.trim()
      });

      await updateSettings({
        defaultTenor: Number(defaultTenor) || 10,
        defaultTenorUnit,
        whatsappReminderTemplate: whatsappReminderTemplate.trim(),
        whatsappReceiptTemplate: whatsappReceiptTemplate.trim()
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Pengaturan Usaha (Tenant Settings)</h2>
        <p className="text-xs text-slate-500">
          Kelola profil toko kredit Anda, kustomisasi template WhatsApp, dan pengaturan default termin.
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pengaturan usaha berhasil diperbarui dan tersimpan khusus untuk tenant Anda!</span>
          </div>
        )}

        {/* Section 1: Profil Usaha */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Profil Usaha & Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Usaha / Toko
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Pemilik Usaha
              </label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor WhatsApp Usaha
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Usaha
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Default Tenor */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-teal-700" />
            <h3 className="text-sm font-bold text-slate-900">Konfigurasi Default Tenor</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Jumlah Tenor (Termin)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={defaultTenor}
                onChange={(e) => setDefaultTenor(Number(e.target.value))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Satuan Periode Default
              </label>
              <select
                value={defaultTenorUnit}
                onChange={(e) => setDefaultTenorUnit(e.target.value as TenorUnit)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="bulan">Bulan (Cicilan Bulanan)</option>
                <option value="minggu">Minggu (Cicilan Mingguan)</option>
                <option value="hari">Hari (Cicilan Harian)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Message Templates (Multi-Tenant Isolated) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Template Pesan WhatsApp Kustom</h3>
          </div>

          <p className="text-xs text-slate-500">
            Gunakan variabel penampung berikut dalam teks Anda:
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;nama&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;barang&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;nominal&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;jatuh_tempo&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;sisa_piutang&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;no_kwitansi&#125;</code>,
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 font-mono text-[11px]">&#123;nama_usaha&#125;</code>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Template Pengingat Tagihan Jatuh Tempo (WhatsApp Reminder)
            </label>
            <textarea
              rows={3}
              value={whatsappReminderTemplate}
              onChange={(e) => setWhatsappReminderTemplate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Template Bukti Penerimaan Pembayaran (WhatsApp Kwitansi)
            </label>
            <textarea
              rows={3}
              value={whatsappReceiptTemplate}
              onChange={(e) => setWhatsappReceiptTemplate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>
        </div>

        {/* Section 4: Subscription Status (SaaS-Ready Architecture - Requirement #23) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold">Status Paket Langganan Tenant</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
              {currentTenant?.subscriptionStatus || 'ACTIVE'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <span className="text-slate-400 block">Paket Bisnis</span>
              <strong className="text-white uppercase font-mono">{currentTenant?.subscriptionPlan || 'PRO'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Identitas Tenant</span>
              <strong className="text-emerald-400 font-mono truncate block">{currentTenant?.tenantId}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Masa Berlaku</span>
              <strong className="text-white font-mono">1 Tahun Aktif</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Kapasitas Nasabah</span>
              <strong className="text-white font-mono">Unlimited</strong>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
