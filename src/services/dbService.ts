import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Customer,
  Loan,
  Installment,
  Payment,
  TenantSettings,
  NotificationItem,
  AuditLogItem,
  Tenant,
  UserRecord
} from '../types';

export const dbService = {
  // --- USERS & TENANTS ---
  async getUserRecord(uid: string): Promise<UserRecord | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserRecord;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async createUserAndTenant(
    userProfile: { uid: string; email: string; displayName: string; photoURL?: string },
    businessData: { businessName: string; ownerName: string; phone: string; businessAddress: string }
  ): Promise<{ user: UserRecord; tenant: Tenant }> {
    const tenantId = `tenant_${userProfile.uid.substring(0, 8)}_${Date.now().toString(36)}`;
    const now = new Date().toISOString();

    const tenant: Tenant = {
      tenantId,
      ownerUid: userProfile.uid,
      businessName: businessData.businessName || 'Usaha Kredit Saya',
      ownerName: businessData.ownerName || userProfile.displayName || 'Pemilik Usaha',
      phone: businessData.phone || '',
      businessAddress: businessData.businessAddress || '',
      logoUrl: 'https://lh3.googleusercontent.com/d/1hegjwSy60MA1CEMmyFtftAXXMtXfkxt2',
      status: 'active',
      subscriptionStatus: 'active',
      subscriptionPlan: 'basic',
      subscriptionStartedAt: now,
      subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now,
      updatedAt: now
    };

    const user: UserRecord = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: businessData.ownerName || userProfile.displayName || 'Pengguna',
      photoURL: userProfile.photoURL || '',
      tenantId,
      createdAt: now,
      lastLoginAt: now,
      status: 'active'
    };

    const defaultSettings: TenantSettings = {
      tenantId,
      ownerId: userProfile.uid,
      defaultTenor: 10,
      defaultTenorUnit: 'bulan',
      whatsappReminderTemplate: 'Halo Bpk/Ibu *{nama}*, mengingatkan tagihan angsuran kredit *{barang}* sebesar *Rp{nominal}* jatuh tempo pada *{jatuh_tempo}*. Sisa tagihan: *Rp{sisa_piutang}*. Terima kasih. - *{nama_usaha}*',
      whatsappReceiptTemplate: 'Terima kasih Bpk/Ibu *{nama}*! Pembayaran angsuran kredit *{barang}* sebesar *Rp{nominal}* telah kami terima pada *{tanggal}* (Kwitansi: {no_kwitansi}). Sisa tagihan Anda: *Rp{sisa_piutang}*. - *{nama_usaha}*',
      invoiceHeader: businessData.businessName || 'KreditKu - Buku Kredit',
      currency: 'IDR',
      updatedAt: now
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'users', userProfile.uid), user);
    batch.set(doc(db, 'tenants', tenantId), tenant);
    batch.set(doc(db, 'settings', tenantId), defaultSettings);

    const logId = `log_${Date.now()}_init`;
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      tenantId,
      ownerId: userProfile.uid,
      uid: userProfile.uid,
      userName: user.displayName,
      action: 'TENANT_REGISTERED',
      entityType: 'tenant',
      entityId: tenantId,
      description: `Pendaftaran tenant baru: ${tenant.businessName}`,
      timestamp: now
    });

    try {
      await batch.commit();
      return { user, tenant };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tenants/${tenantId}`);
      throw error;
    }
  },

  async getTenant(tenantId: string): Promise<Tenant | null> {
    try {
      const snap = await getDoc(doc(db, 'tenants', tenantId));
      if (snap.exists()) {
        return snap.data() as Tenant;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `tenants/${tenantId}`);
      return null;
    }
  },

  async updateTenant(tenantId: string, ownerUid: string, updates: Partial<Tenant>): Promise<void> {
    try {
      const ref = doc(db, 'tenants', tenantId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await this.logAudit(tenantId, ownerUid, ownerUid, updates.ownerName || 'User', 'TENANT_UPDATED', 'tenant', tenantId, 'Profil usaha diperbarui');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tenants/${tenantId}`);
    }
  },

  // --- SETTINGS ---
  async getSettings(tenantId: string): Promise<TenantSettings | null> {
    try {
      const snap = await getDoc(doc(db, 'settings', tenantId));
      if (snap.exists()) {
        return snap.data() as TenantSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `settings/${tenantId}`);
      return null;
    }
  },

  async updateSettings(tenantId: string, ownerId: string, updates: Partial<TenantSettings>): Promise<void> {
    try {
      const ref = doc(db, 'settings', tenantId);
      await setDoc(ref, {
        ...updates,
        tenantId,
        ownerId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await this.logAudit(tenantId, ownerId, ownerId, 'User', 'SETTINGS_UPDATED', 'settings', tenantId, 'Pengaturan usaha diperbarui');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${tenantId}`);
    }
  },

  // --- CUSTOMERS ---
  listenCustomers(
    tenantId: string,
    ownerId: string,
    callback: (customers: Customer[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'customers'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as Customer;
        if (!item.isDeleted) {
          items.push(item);
        }
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'customers');
    });
  },

  async createCustomer(
    tenantId: string,
    ownerId: string,
    userName: string,
    customerData: Omit<Customer, 'id' | 'tenantId' | 'ownerId' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<Customer> {
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const customer: Customer = {
      ...customerData,
      id: customerId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      status: customerData.status || 'active',
      isBadDebt: customerData.isBadDebt || false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    };

    if (!auth.currentUser) {
      // Demo / simulation mode: return record directly without contacting Firestore
      return customer;
    }

    try {
      await setDoc(doc(db, 'customers', customerId), customer);
      await this.logAudit(resolvedTenantId, resolvedOwnerId, resolvedOwnerId, userName, 'CUSTOMER_CREATED', 'customer', customerId, `Nasabah baru ditambahkan: ${customer.name}`);
      return customer;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `customers/${customerId}`);
      throw error;
    }
  },

  async toggleCustomerBadDebt(
    tenantId: string,
    ownerId: string,
    userName: string,
    customerId: string,
    customerName: string,
    isBadDebt: boolean,
    reason?: string
  ): Promise<void> {
    if (!auth.currentUser) return;
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    try {
      const ref = doc(db, 'customers', customerId);
      await updateDoc(ref, {
        status: isBadDebt ? 'bad_debt' : 'active',
        isBadDebt,
        badDebtReason: reason || '',
        updatedAt: new Date().toISOString()
      });
      await this.logAudit(
        resolvedTenantId,
        resolvedOwnerId,
        resolvedOwnerId,
        userName,
        isBadDebt ? 'CUSTOMER_MARKED_BAD_DEBT' : 'CUSTOMER_RESTORED_ACTIVE',
        'customer',
        customerId,
        isBadDebt
          ? `Nasabah ditandai GAGAL BAYAR (Macet): ${customerName}. Alasan: ${reason || 'Tunggakan macet'}`
          : `Nasabah dipulihkan ke status LANCAR: ${customerName}`
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    }
  },

  async updateCustomer(
    tenantId: string,
    ownerId: string,
    userName: string,
    customerId: string,
    updates: Partial<Customer>
  ): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const ref = doc(db, 'customers', customerId);
      await updateDoc(ref, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      await this.logAudit(tenantId, ownerId, ownerId, userName, 'CUSTOMER_UPDATED', 'customer', customerId, `Data nasabah diperbarui: ${updates.name || customerId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    }
  },

  async softDeleteCustomer(
    tenantId: string,
    ownerId: string,
    userName: string,
    customerId: string,
    customerName: string
  ): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const ref = doc(db, 'customers', customerId);
      await updateDoc(ref, {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });
      await this.logAudit(tenantId, ownerId, ownerId, userName, 'CUSTOMER_DELETED', 'customer', customerId, `Nasabah diarsipkan/dihapus lunak: ${customerName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `customers/${customerId}`);
    }
  },

  // --- LOANS & INSTALLMENTS ---
  listenLoans(
    tenantId: string,
    ownerId: string,
    callback: (loans: Loan[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'loans'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: Loan[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as Loan;
        if (!item.isDeleted) {
          items.push(item);
        }
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'loans');
    });
  },

  listenInstallments(
    tenantId: string,
    ownerId: string,
    callback: (installments: Installment[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'installments'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: Installment[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as Installment;
        if (!item.isDeleted) {
          items.push(item);
        }
      });
      items.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'installments');
    });
  },

  async createLoan(
    tenantId: string,
    ownerId: string,
    userName: string,
    loanData: Omit<Loan, 'id' | 'tenantId' | 'ownerId' | 'totalPaid' | 'remainingAmount' | 'status' | 'createdAt' | 'updatedAt' | 'isDeleted'>
  ): Promise<Loan> {
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const remainingAmount = Math.max(0, loanData.totalLoanAmount - (loanData.downPayment || 0));

    const loan: Loan = {
      ...loanData,
      id: loanId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      totalPaid: loanData.downPayment || 0,
      remainingAmount,
      status: remainingAmount === 0 ? 'paid_off' : 'active',
      isDeleted: false,
      createdAt: now,
      updatedAt: now
    };

    if (!auth.currentUser) {
      // Demo / simulation mode: return created loan directly
      return loan;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'loans', loanId), loan);

    // If DP was paid, record initial DP payment
    if (loanData.downPayment && loanData.downPayment > 0) {
      const dpPaymentId = `pay_dp_${Date.now()}`;
      const dpPayment: Payment = {
        id: dpPaymentId,
        tenantId: resolvedTenantId,
        ownerId: resolvedOwnerId,
        loanId,
        customerId: loanData.customerId,
        customerName: loanData.customerName,
        amount: loanData.downPayment,
        paymentMethod: 'cash',
        paymentDate: loanData.startDate,
        receiptNumber: `DP-${Date.now().toString().slice(-6)}`,
        notes: `Uang Muka (DP) Kredit ${loanData.itemName}`,
        status: 'valid',
        isDeleted: false,
        createdAt: now
      };
      batch.set(doc(db, 'payments', dpPaymentId), dpPayment);
    }

    // Generate installments schedule
    const tenor = loanData.tenor || 1;
    const installmentAmount = loanData.installmentAmount || Math.round(remainingAmount / tenor);
    const startDate = new Date(loanData.startDate || now);

    for (let i = 1; i <= tenor; i++) {
      const dueDate = new Date(startDate);
      if (loanData.tenorUnit === 'hari') {
        dueDate.setDate(dueDate.getDate() + i);
      } else if (loanData.tenorUnit === 'minggu') {
        dueDate.setDate(dueDate.getDate() + (i * 7));
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      const installmentId = `inst_${loanId}_${i}`;
      const installment: Installment = {
        id: installmentId,
        tenantId: resolvedTenantId,
        ownerId: resolvedOwnerId,
        loanId,
        customerId: loanData.customerId,
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        paidAmount: 0,
        status: 'pending',
        isDeleted: false
      };
      batch.set(doc(db, 'installments', installmentId), installment);
    }

    // Audit log
    const logId = `log_${Date.now()}_loan`;
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      uid: resolvedOwnerId,
      userName,
      action: 'LOAN_CREATED',
      entityType: 'loan',
      entityId: loanId,
      description: `Kredit baru dibuat untuk ${loanData.customerName}: ${loanData.itemName} (${loanData.tenor} ${loanData.tenorUnit}) Total Rp${loanData.totalLoanAmount.toLocaleString('id-ID')}`,
      timestamp: now
    });

    try {
      await batch.commit();
      return loan;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `loans/${loanId}`);
      throw error;
    }
  },

  async softDeleteLoan(
    tenantId: string,
    ownerId: string,
    userName: string,
    loanId: string,
    itemName: string
  ): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const ref = doc(db, 'loans', loanId);
      await updateDoc(ref, {
        isDeleted: true,
        updatedAt: new Date().toISOString()
      });
      await this.logAudit(tenantId, ownerId, ownerId, userName, 'LOAN_DELETED', 'loan', loanId, `Kredit dibatalkan/dihapus lunak: ${itemName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `loans/${loanId}`);
    }
  },

  // --- PAYMENTS ---
  listenPayments(
    tenantId: string,
    ownerId: string,
    callback: (payments: Payment[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'payments'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: Payment[] = [];
      snapshot.forEach(docSnap => {
        const item = docSnap.data() as Payment;
        if (!item.isDeleted) {
          items.push(item);
        }
      });
      items.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });
  },

  async recordPayment(
    tenantId: string,
    ownerId: string,
    userName: string,
    loan: Loan,
    paymentAmount: number,
    paymentMethod: Payment['paymentMethod'],
    paymentDate: string,
    notes?: string,
    specificInstallmentId?: string
  ): Promise<Payment> {
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receiptNumber = `KWT-${Date.now().toString().slice(-6)}`;

    const newTotalPaid = (loan.totalPaid || 0) + paymentAmount;
    const newRemaining = Math.max(0, loan.totalLoanAmount - newTotalPaid);
    const newLoanStatus: Loan['status'] = newRemaining <= 0 ? 'paid_off' : 'active';

    const payment: Payment = {
      id: paymentId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      loanId: loan.id,
      installmentId: specificInstallmentId || '',
      customerId: loan.customerId,
      customerName: loan.customerName,
      amount: paymentAmount,
      paymentMethod,
      paymentDate: paymentDate || now.split('T')[0],
      receiptNumber,
      notes: notes || '',
      status: 'valid',
      isDeleted: false,
      createdAt: now
    };

    if (!auth.currentUser) {
      // Demo / simulation mode: return created payment directly
      return payment;
    }

    const batch = writeBatch(db);
    batch.set(doc(db, 'payments', paymentId), payment);

    // Update loan
    batch.update(doc(db, 'loans', loan.id), {
      totalPaid: newTotalPaid,
      remainingAmount: newRemaining,
      status: newLoanStatus,
      updatedAt: now
    });

    // Update targeted installment if provided
    if (specificInstallmentId) {
      batch.update(doc(db, 'installments', specificInstallmentId), {
        paidAmount: paymentAmount,
        status: 'paid',
        paidAt: now
      });
    }

    // Audit log
    const logId = `log_${Date.now()}_pay`;
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      uid: resolvedOwnerId,
      userName,
      action: 'PAYMENT_RECORDED',
      entityType: 'payment',
      entityId: paymentId,
      description: `Pembayaran diterima: Rp${paymentAmount.toLocaleString('id-ID')} (${loan.customerName} - ${loan.itemName}) [${receiptNumber}]`,
      timestamp: now
    });

    try {
      await batch.commit();
      return payment;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payments/${paymentId}`);
      throw error;
    }
  },

  async voidPayment(
    tenantId: string,
    ownerId: string,
    userName: string,
    payment: Payment,
    loan: Loan,
    voidReason: string
  ): Promise<void> {
    if (!auth.currentUser) return;
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    // Mark payment as VOID (never permanently deleted!)
    batch.update(doc(db, 'payments', payment.id), {
      status: 'void',
      voidReason: voidReason || 'Pembatalan transaksi oleh pengguna',
      voidedAt: now
    });

    // Reverse loan amounts
    const restoredTotalPaid = Math.max(0, (loan.totalPaid || 0) - payment.amount);
    const restoredRemaining = Math.max(0, loan.totalLoanAmount - restoredTotalPaid);
    batch.update(doc(db, 'loans', loan.id), {
      totalPaid: restoredTotalPaid,
      remainingAmount: restoredRemaining,
      status: 'active',
      updatedAt: now
    });

    // Revert installment if linked
    if (payment.installmentId) {
      batch.update(doc(db, 'installments', payment.installmentId), {
        status: 'pending',
        paidAmount: 0,
        paidAt: null
      });
    }

    // Audit log
    const logId = `log_${Date.now()}_void`;
    batch.set(doc(db, 'audit_logs', logId), {
      id: logId,
      tenantId: resolvedTenantId,
      ownerId: resolvedOwnerId,
      uid: resolvedOwnerId,
      userName,
      action: 'PAYMENT_VOIDED',
      entityType: 'payment',
      entityId: payment.id,
      description: `VOID Transaksi Pembayaran ${payment.receiptNumber} Rp${payment.amount.toLocaleString('id-ID')}. Alasan: ${voidReason}`,
      timestamp: now
    });

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payments/${payment.id}`);
      throw error;
    }
  },

  // --- NOTIFICATIONS & AUDIT LOGS ---
  listenNotifications(
    tenantId: string,
    ownerId: string,
    callback: (notifs: NotificationItem[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'notifications'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as NotificationItem);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });
  },

  async markNotificationRead(notifId: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        isRead: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
    }
  },

  listenAuditLogs(
    tenantId: string,
    ownerId: string,
    callback: (logs: AuditLogItem[]) => void
  ) {
    if (!auth.currentUser) {
      return () => {};
    }

    const q = query(
      collection(db, 'audit_logs'),
      where('tenantId', '==', tenantId),
      where('ownerId', '==', ownerId)
    );

    return onSnapshot(q, (snapshot) => {
      const items: AuditLogItem[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as AuditLogItem);
      });
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    });
  },

  async logAudit(
    tenantId: string,
    ownerId: string,
    uid: string,
    userName: string,
    action: string,
    entityType: string,
    entityId: string,
    description: string
  ): Promise<void> {
    if (!auth.currentUser) return;
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const resolvedOwnerId = auth.currentUser?.uid || ownerId || '';
    const resolvedTenantId = tenantId || (resolvedOwnerId ? `tenant_${resolvedOwnerId.substring(0, 8)}` : '');
    const resolvedUid = auth.currentUser?.uid || uid || '';
    try {
      await setDoc(doc(db, 'audit_logs', logId), {
        id: logId,
        tenantId: resolvedTenantId,
        ownerId: resolvedOwnerId,
        uid: resolvedUid,
        userName,
        action,
        entityType,
        entityId,
        description,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.warn('Audit log write error:', error);
    }
  }
};
