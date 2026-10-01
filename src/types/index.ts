export type UserStatus = 'active' | 'suspended';

export interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  tenantId: string;
  createdAt: string;
  lastLoginAt: string;
  status: UserStatus;
}

export type SubscriptionPlan = 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trial' | 'expired';

export interface Tenant {
  tenantId: string;
  ownerUid: string;
  businessName: string;
  ownerName: string;
  phone: string;
  businessAddress: string;
  logoUrl?: string;
  status: 'active' | 'suspended';
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStartedAt: string;
  subscriptionExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CustomerStatus = 'active' | 'archived' | 'bad_debt';

export interface Customer {
  id: string;
  tenantId: string;
  ownerId: string;
  name: string;
  phone: string;
  address: string;
  photoUrl?: string;
  notes?: string;
  status: CustomerStatus;
  isBadDebt?: boolean; // Penanda Nasabah Gagal Bayar (Macet)
  badDebtReason?: string;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LoanType = 'barang' | 'uang';
export type TenorUnit = 'bulan' | 'minggu' | 'hari';
export type LoanStatus = 'active' | 'paid_off' | 'defaulted' | 'cancelled';

export interface Loan {
  id: string;
  tenantId: string;
  ownerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: LoanType;
  itemName: string;
  itemPrice: number;
  downPayment: number;
  totalLoanAmount: number;
  totalPaid: number;
  remainingAmount: number;
  installmentAmount: number;
  tenor: number;
  tenorUnit: TenorUnit;
  startDate: string;
  dueDate: string;
  notes?: string;
  status: LoanStatus;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InstallmentStatus = 'pending' | 'partial' | 'paid' | 'late';

export interface Installment {
  id: string;
  tenantId: string;
  ownerId: string;
  loanId: string;
  customerId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentStatus;
  paidAt?: string;
  isDeleted?: boolean;
}

export type PaymentMethod = 'cash' | 'transfer' | 'qris';
export type PaymentStatus = 'valid' | 'void';

export interface Payment {
  id: string;
  tenantId: string;
  ownerId: string;
  loanId: string;
  installmentId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  receiptNumber: string;
  notes?: string;
  status: PaymentStatus;
  voidReason?: string;
  voidedAt?: string;
  isDeleted?: boolean;
  createdAt: string;
}

export interface TenantSettings {
  tenantId: string;
  ownerId: string;
  defaultTenor: number;
  defaultTenorUnit: TenorUnit;
  whatsappReminderTemplate: string;
  whatsappReceiptTemplate: string;
  invoiceHeader: string;
  currency: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  tenantId: string;
  ownerId: string;
  title: string;
  message: string;
  type: 'due_today' | 'overdue' | 'payment_received' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  tenantId: string;
  ownerId: string;
  uid: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  description: string;
  timestamp: string;
}
