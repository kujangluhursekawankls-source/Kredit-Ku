import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  User
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../lib/firebase';
import { dbService } from '../services/dbService';
import { Tenant, TenantSettings, UserRecord } from '../types';

interface OnboardingInput {
  businessName: string;
  ownerName: string;
  phone: string;
  businessAddress: string;
}

export type ProfileMode = 'google' | 'test_user_a' | 'test_user_b' | 'test_user_c';

interface AuthAndTenantContextType {
  currentUser: UserRecord | null;
  currentTenant: Tenant | null;
  settings: TenantSettings | null;
  currentUid: string;
  currentTenantId: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  profileMode: ProfileMode;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: (data: OnboardingInput) => Promise<void>;
  logout: () => Promise<void>;
  updateTenantProfile: (updates: Partial<Tenant>) => Promise<void>;
  updateSettings: (updates: Partial<TenantSettings>) => Promise<void>;
  switchProfileMode: (mode: ProfileMode) => Promise<void>;
}

const AuthAndTenantContext = createContext<AuthAndTenantContextType | undefined>(undefined);

const APP_ICON_URL = 'https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2';

const TEST_USERS: Record<'test_user_a' | 'test_user_b' | 'test_user_c', {
  user: UserRecord;
  tenant: Tenant;
  settings: TenantSettings;
}> = {
  test_user_a: {
    user: {
      uid: 'user_a_berkah',
      email: 'pemilik.berkah@gmail.com',
      displayName: 'H. Budi Santoso (Toko A)',
      tenantId: 'tenant_berkah_001',
      createdAt: '2026-09-01T08:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    },
    tenant: {
      tenantId: 'tenant_berkah_001',
      ownerUid: 'user_a_berkah',
      businessName: 'Toko Berkah Elektronik & Mebel',
      ownerName: 'H. Budi Santoso',
      phone: '081234567890',
      businessAddress: 'Jl. Pasar Baru No. 12, Bandung',
      logoUrl: APP_ICON_URL,
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'pro',
      subscriptionStartedAt: '2026-09-01T08:00:00.000Z',
      subscriptionExpiresAt: '2027-09-01T08:00:00.000Z',
      createdAt: '2026-09-01T08:00:00.000Z',
      updatedAt: '2026-09-01T08:00:00.000Z'
    },
    settings: {
      tenantId: 'tenant_berkah_001',
      ownerId: 'user_a_berkah',
      defaultTenor: 10,
      defaultTenorUnit: 'bulan',
      whatsappReminderTemplate: 'Halo Bpk/Ibu *{nama}*, tagihan angsuran *{barang}* sebesar *Rp{nominal}* jatuh tempo *{jatuh_tempo}*. Sisa tagihan: *Rp{sisa_piutang}*. - *Toko Berkah Elektronik*',
      whatsappReceiptTemplate: 'Kwitansi Resmi *Toko Berkah Elektronik*: Terima kasih Bpk/Ibu *{nama}*, pembayaran kredit *{barang}* Rp{nominal} telah diterima pada {tanggal}. No: {no_kwitansi}.',
      invoiceHeader: 'Toko Berkah Elektronik & Mebel',
      currency: 'IDR',
      updatedAt: '2026-09-01T08:00:00.000Z'
    }
  },
  test_user_b: {
    user: {
      uid: 'user_b_cahaya',
      email: 'andi.cahaya@gmail.com',
      displayName: 'Andi Wijaya (Toko B)',
      tenantId: 'tenant_cahaya_002',
      createdAt: '2026-09-10T09:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    },
    tenant: {
      tenantId: 'tenant_cahaya_002',
      ownerUid: 'user_b_cahaya',
      businessName: 'Cahaya Mandiri Kredit HP & Laptop',
      ownerName: 'Andi Wijaya',
      phone: '085678901234',
      businessAddress: 'Ruko Simpang Lima No. 5, Semarang',
      logoUrl: APP_ICON_URL,
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'basic',
      subscriptionStartedAt: '2026-09-10T09:00:00.000Z',
      subscriptionExpiresAt: '2027-09-10T09:00:00.000Z',
      createdAt: '2026-09-10T09:00:00.000Z',
      updatedAt: '2026-09-10T09:00:00.000Z'
    },
    settings: {
      tenantId: 'tenant_cahaya_002',
      ownerId: 'user_b_cahaya',
      defaultTenor: 6,
      defaultTenorUnit: 'bulan',
      whatsappReminderTemplate: 'Salam {nama}, jangan lupa jatuh tempo cicilan HP {barang} Anda Rp{nominal} tanggal {jatuh_tempo}. Terima kasih dari Cahaya Mandiri.',
      whatsappReceiptTemplate: 'Struk Pembayaran Cahaya Mandiri: Pembayaran Rp{nominal} untuk {barang} sukses tercatat.',
      invoiceHeader: 'Cahaya Mandiri Kredit HP & Laptop',
      currency: 'IDR',
      updatedAt: '2026-09-10T09:00:00.000Z'
    }
  },
  test_user_c: {
    user: {
      uid: 'user_c_lancar',
      email: 'siti.kredit@gmail.com',
      displayName: 'Ibu Siti Rahma (Toko C)',
      tenantId: 'tenant_lancar_003',
      createdAt: '2026-09-15T10:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
      status: 'active'
    },
    tenant: {
      tenantId: 'tenant_lancar_003',
      ownerUid: 'user_c_lancar',
      businessName: 'Kredit Lancar Abadi (Kredit Harian)',
      ownerName: 'Ibu Siti Rahma',
      phone: '087890123456',
      businessAddress: 'Kawasan Niaga Beringharjo Blok C, Yogyakarta',
      logoUrl: APP_ICON_URL,
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'enterprise',
      subscriptionStartedAt: '2026-09-15T10:00:00.000Z',
      subscriptionExpiresAt: '2027-09-15T10:00:00.000Z',
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T10:00:00.000Z'
    },
    settings: {
      tenantId: 'tenant_lancar_003',
      ownerId: 'user_c_lancar',
      defaultTenor: 30,
      defaultTenorUnit: 'hari',
      whatsappReminderTemplate: 'Assalamualaikum Bpk/Ibu {nama}, tagihan harian/mingguan {barang} sebesar Rp{nominal} sudah jatuh tempo. Mohon disiapkan. Terima kasih - Kredit Lancar Abadi.',
      whatsappReceiptTemplate: 'Alhamdulillah, pembayaran angsuran {barang} Rp{nominal} telah diterima. Sisa kewajiban: Rp{sisa_piutang}.',
      invoiceHeader: 'Kredit Lancar Abadi',
      currency: 'IDR',
      updatedAt: '2026-09-15T10:00:00.000Z'
    }
  }
};

export const AuthAndTenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [profileMode, setProfileMode] = useState<ProfileMode>('google');

  useEffect(() => {
    testConnection();
  }, []);

  useEffect(() => {
    if (profileMode !== 'google') return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const userRec = await dbService.getUserRecord(user.uid);
          if (userRec) {
            setCurrentUser(userRec);
            const tenant = await dbService.getTenant(userRec.tenantId);
            const tenantSettings = await dbService.getSettings(userRec.tenantId);
            setCurrentTenant(tenant);
            setSettings(tenantSettings);
            setNeedsOnboarding(false);
          } else {
            // Auto bootstrap tenant & user profile immediately so user is never in an invalid state
            const defaultOwnerName = user.displayName || (user.email ? user.email.split('@')[0] : 'Pemilik Usaha');
            const defaultBusinessName = user.displayName ? `Toko ${user.displayName}` : `KreditKu ${defaultOwnerName}`;

            const { user: newUser, tenant: newTenant } = await dbService.createUserAndTenant(
              {
                uid: user.uid,
                email: user.email || '',
                displayName: defaultOwnerName,
                photoURL: user.photoURL || undefined
              },
              {
                businessName: defaultBusinessName,
                ownerName: defaultOwnerName,
                phone: '',
                businessAddress: ''
              }
            );

            setCurrentUser(newUser);
            setCurrentTenant(newTenant);
            const tenantSettings = await dbService.getSettings(newTenant.tenantId);
            setSettings(tenantSettings);
            setNeedsOnboarding(false);
          }
        } catch (error) {
          console.error('Error fetching tenant details:', error);
        }
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
        setCurrentTenant(null);
        setSettings(null);
        setNeedsOnboarding(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profileMode]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setProfileMode('google');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-In failed:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    setProfileMode('google');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error: any) {
      setIsLoading(false);
      let msg = 'Gagal masuk. Periksa email dan kata sandi Anda.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Email atau kata sandi salah. Silakan coba lagi.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Format email tidak valid.';
      }
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setIsLoading(true);
    setProfileMode('google');
    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(res.user, { displayName: name.trim() });
      }
      setFirebaseUser(res.user);
      setNeedsOnboarding(true);
    } catch (error: any) {
      setIsLoading(false);
      let msg = 'Gagal mendaftar. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Email ini sudah terdaftar. Silakan langsung masuk.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Kata sandi minimal 6 karakter.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Format email tidak valid.';
      }
      throw new Error(msg);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error: any) {
      let msg = 'Gagal mengirim email reset password.';
      if (error.code === 'auth/user-not-found') {
        msg = 'Email belum terdaftar di sistem.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Format email tidak valid.';
      }
      throw new Error(msg);
    }
  };

  const completeOnboarding = async (businessData: OnboardingInput) => {
    if (!firebaseUser) throw new Error('Tidak ada sesi akun login aktif');
    setIsLoading(true);
    try {
      const { user, tenant } = await dbService.createUserAndTenant(
        {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || businessData.ownerName,
          photoURL: firebaseUser.photoURL || undefined
        },
        businessData
      );

      setCurrentUser(user);
      setCurrentTenant(tenant);
      const tenantSettings = await dbService.getSettings(tenant.tenantId);
      setSettings(tenantSettings);
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Onboarding failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        await signOut(auth);
      }
      setFirebaseUser(null);
      setCurrentUser(null);
      setCurrentTenant(null);
      setSettings(null);
      setNeedsOnboarding(false);
      setProfileMode('google');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchProfileMode = async (mode: ProfileMode) => {
    setIsLoading(true);
    setProfileMode(mode);

    if (mode === 'google') {
      if (auth.currentUser) {
        const userRec = await dbService.getUserRecord(auth.currentUser.uid);
        if (userRec) {
          setCurrentUser(userRec);
          const tenant = await dbService.getTenant(userRec.tenantId);
          const tenantSettings = await dbService.getSettings(userRec.tenantId);
          setCurrentTenant(tenant);
          setSettings(tenantSettings);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        setCurrentUser(null);
        setCurrentTenant(null);
        setSettings(null);
        setNeedsOnboarding(false);
      }
    } else {
      const preset = TEST_USERS[mode];
      setCurrentUser(preset.user);
      setCurrentTenant(preset.tenant);
      setSettings(preset.settings);
      setNeedsOnboarding(false);
    }
    setIsLoading(false);
  };

  const updateTenantProfile = async (updates: Partial<Tenant>) => {
    if (!currentTenant || !currentUser) return;
    try {
      await dbService.updateTenant(currentTenant.tenantId, currentUser.uid, updates);
      setCurrentTenant(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      throw error;
    }
  };

  const updateSettings = async (updates: Partial<TenantSettings>) => {
    if (!currentTenant || !currentUser) return;
    try {
      await dbService.updateSettings(currentTenant.tenantId, currentUser.uid, updates);
      setSettings(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const currentUid = currentUser?.uid || firebaseUser?.uid || auth.currentUser?.uid || '';
  const currentTenantId = currentTenant?.tenantId || currentUser?.tenantId || (currentUid ? `tenant_${currentUid.substring(0, 8)}` : '');
  const isAuthenticated = Boolean(currentUser || (firebaseUser && currentTenantId) || (auth.currentUser && currentTenantId));

  return (
    <AuthAndTenantContext.Provider
      value={{
        currentUser,
        currentTenant,
        settings,
        currentUid,
        currentTenantId,
        isAuthenticated,
        isLoading,
        needsOnboarding,
        profileMode,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        completeOnboarding,
        logout,
        updateTenantProfile,
        updateSettings,
        switchProfileMode
      }}
    >
      {children}
    </AuthAndTenantContext.Provider>
  );
};

export const useAuthAndTenant = () => {
  const context = useContext(AuthAndTenantContext);
  if (!context) {
    throw new Error('useAuthAndTenant must be used within an AuthAndTenantProvider');
  }
  return context;
};
