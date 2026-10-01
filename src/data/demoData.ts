import { Customer, Loan, Installment, Payment, AuditLogItem, NotificationItem } from '../types';

export interface DemoDataset {
  customers: Customer[];
  loans: Loan[];
  installments: Installment[];
  payments: Payment[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

export const DEMO_DATASETS: Record<'test_user_a' | 'test_user_b' | 'test_user_c', DemoDataset> = {
  test_user_a: {
    customers: [
      {
        id: 'cust_demo_a1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        name: 'Budi Santoso',
        phone: '081234567890',
        address: 'Jl. Melati No. 14, Bandung',
        notes: 'Pelanggan setia, pembayaran selalu tepat waktu.',
        status: 'active',
        isBadDebt: false,
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-01T08:00:00.000Z'
      },
      {
        id: 'cust_demo_a2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        name: 'Ibu Ratna Dewi',
        phone: '085712345678',
        address: 'Komplek Griya Indah Blok B-3, Bandung',
        notes: 'Kredit mesin cuci 1 tabung.',
        status: 'active',
        isBadDebt: false,
        createdAt: '2026-09-05T09:00:00.000Z',
        updatedAt: '2026-09-05T09:00:00.000Z'
      },
      {
        id: 'cust_demo_a3',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        name: 'Joko Susilo',
        phone: '087811223344',
        address: 'Jl. Terusan Buah Batu No. 88, Bandung',
        notes: 'Tunggakan lebih dari 3 bulan, nomor sulit dihubungi.',
        status: 'bad_debt',
        isBadDebt: true,
        badDebtReason: 'Nomor WhatsApp tidak aktif dan pindah kontrakan tanpa konfirmasi.',
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-09-20T14:30:00.000Z'
      }
    ],
    loans: [
      {
        id: 'loan_demo_a1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        customerId: 'cust_demo_a1',
        customerName: 'Budi Santoso',
        customerPhone: '081234567890',
        type: 'barang',
        itemName: 'Kulkas 2 Pintu Sharp Inverter',
        itemPrice: 3200000,
        downPayment: 500000,
        totalLoanAmount: 4200000,
        totalPaid: 1610000,
        remainingAmount: 2590000,
        installmentAmount: 370000,
        tenor: 10,
        tenorUnit: 'bulan',
        startDate: '2026-09-01',
        dueDate: '2027-07-01',
        status: 'active',
        createdAt: '2026-09-01T08:30:00.000Z',
        updatedAt: '2026-09-25T10:00:00.000Z'
      },
      {
        id: 'loan_demo_a2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        customerId: 'cust_demo_a2',
        customerName: 'Ibu Ratna Dewi',
        customerPhone: '085712345678',
        type: 'barang',
        itemName: 'Mesin Cuci Panasonic 8.5 Kg',
        itemPrice: 2400000,
        downPayment: 400000,
        totalLoanAmount: 3100000,
        totalPaid: 850000,
        remainingAmount: 2250000,
        installmentAmount: 450000,
        tenor: 6,
        tenorUnit: 'bulan',
        startDate: '2026-09-05',
        dueDate: '2027-03-05',
        status: 'active',
        createdAt: '2026-09-05T09:15:00.000Z',
        updatedAt: '2026-09-20T11:00:00.000Z'
      },
      {
        id: 'loan_demo_a3',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        customerId: 'cust_demo_a3',
        customerName: 'Joko Susilo',
        customerPhone: '087811223344',
        type: 'barang',
        itemName: 'Smart TV LED Samsung 43 Inch',
        itemPrice: 3800000,
        downPayment: 500000,
        totalLoanAmount: 4800000,
        totalPaid: 930000,
        remainingAmount: 3870000,
        installmentAmount: 430000,
        tenor: 10,
        tenorUnit: 'bulan',
        startDate: '2026-08-10',
        dueDate: '2027-06-10',
        status: 'active',
        createdAt: '2026-08-10T10:30:00.000Z',
        updatedAt: '2026-09-10T10:00:00.000Z'
      }
    ],
    installments: [
      {
        id: 'inst_demo_a1_1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a1',
        customerId: 'cust_demo_a1',
        installmentNumber: 1,
        dueDate: '2026-10-01',
        amount: 370000,
        paidAmount: 370000,
        status: 'paid',
        paidAt: '2026-09-25T10:00:00.000Z'
      },
      {
        id: 'inst_demo_a1_2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a1',
        customerId: 'cust_demo_a1',
        installmentNumber: 2,
        dueDate: '2026-11-01',
        amount: 370000,
        paidAmount: 0,
        status: 'pending'
      },
      {
        id: 'inst_demo_a2_1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a2',
        customerId: 'cust_demo_a2',
        installmentNumber: 1,
        dueDate: '2026-10-05',
        amount: 450000,
        paidAmount: 450000,
        status: 'paid',
        paidAt: '2026-09-20T11:00:00.000Z'
      },
      {
        id: 'inst_demo_a3_1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a3',
        customerId: 'cust_demo_a3',
        installmentNumber: 2,
        dueDate: '2026-09-10',
        amount: 430000,
        paidAmount: 0,
        status: 'late'
      }
    ],
    payments: [
      {
        id: 'pay_demo_a1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a1',
        installmentId: 'inst_demo_a1_1',
        customerId: 'cust_demo_a1',
        customerName: 'Budi Santoso',
        amount: 370000,
        paymentMethod: 'cash',
        paymentDate: '2026-09-25',
        receiptNumber: 'KWT-928101',
        notes: 'Cicilan ke-1 Kulkas Sharp',
        status: 'valid',
        createdAt: '2026-09-25T10:00:00.000Z'
      },
      {
        id: 'pay_demo_a2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        loanId: 'loan_demo_a2',
        installmentId: 'inst_demo_a2_1',
        customerId: 'cust_demo_a2',
        customerName: 'Ibu Ratna Dewi',
        amount: 450000,
        paymentMethod: 'transfer',
        paymentDate: '2026-09-20',
        receiptNumber: 'KWT-928102',
        notes: 'Transfer Bank BCA Cicilan ke-1',
        status: 'valid',
        createdAt: '2026-09-20T11:00:00.000Z'
      }
    ],
    notifications: [
      {
        id: 'notif_demo_a1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        title: 'Pembayaran Diterima',
        message: 'Budi Santoso telah membayar angsuran Rp370.000',
        type: 'payment_received',
        isRead: false,
        createdAt: '2026-09-25T10:00:00.000Z'
      },
      {
        id: 'notif_demo_a2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        title: 'Peringatan Tunggakan',
        message: 'Joko Susilo melewati batas jatuh tempo angsuran ke-2',
        type: 'overdue',
        isRead: false,
        createdAt: '2026-09-15T08:00:00.000Z'
      }
    ],
    auditLogs: [
      {
        id: 'log_demo_a1',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        uid: 'user_a_berkah',
        userName: 'H. Budi Santoso',
        action: 'PAYMENT_RECORDED',
        entityType: 'payment',
        entityId: 'pay_demo_a1',
        description: 'Pembayaran diterima: Rp370.000 (Budi Santoso - Kulkas 2 Pintu) [KWT-928101]',
        timestamp: '2026-09-25T10:00:00.000Z'
      },
      {
        id: 'log_demo_a2',
        tenantId: 'tenant_berkah_001',
        ownerId: 'user_a_berkah',
        uid: 'user_a_berkah',
        userName: 'H. Budi Santoso',
        action: 'CUSTOMER_MARKED_BAD_DEBT',
        entityType: 'customer',
        entityId: 'cust_demo_a3',
        description: 'Nasabah ditandai GAGAL BAYAR (Macet): Joko Susilo. Alasan: Pindah kontrakan',
        timestamp: '2026-09-20T14:30:00.000Z'
      }
    ]
  },
  test_user_b: {
    customers: [
      {
        id: 'cust_demo_b1',
        tenantId: 'tenant_cahaya_002',
        ownerId: 'user_b_cahaya',
        name: 'Dimas Kurniawan',
        phone: '085299887766',
        address: 'Jl. Pandanaran No. 45, Semarang',
        notes: 'Kredit iPhone 13 128GB.',
        status: 'active',
        isBadDebt: false,
        createdAt: '2026-09-10T09:00:00.000Z',
        updatedAt: '2026-09-10T09:00:00.000Z'
      }
    ],
    loans: [
      {
        id: 'loan_demo_b1',
        tenantId: 'tenant_cahaya_002',
        ownerId: 'user_b_cahaya',
        customerId: 'cust_demo_b1',
        customerName: 'Dimas Kurniawan',
        customerPhone: '085299887766',
        type: 'barang',
        itemName: 'iPhone 13 128GB Midnight',
        itemPrice: 9500000,
        downPayment: 1500000,
        totalLoanAmount: 11500000,
        totalPaid: 3166667,
        remainingAmount: 8333333,
        installmentAmount: 1666667,
        tenor: 6,
        tenorUnit: 'bulan',
        startDate: '2026-09-10',
        dueDate: '2027-03-10',
        status: 'active',
        createdAt: '2026-09-10T09:30:00.000Z',
        updatedAt: '2026-09-20T15:00:00.000Z'
      }
    ],
    installments: [
      {
        id: 'inst_demo_b1_1',
        tenantId: 'tenant_cahaya_002',
        ownerId: 'user_b_cahaya',
        loanId: 'loan_demo_b1',
        customerId: 'cust_demo_b1',
        installmentNumber: 1,
        dueDate: '2026-10-10',
        amount: 1666667,
        paidAmount: 1666667,
        status: 'paid',
        paidAt: '2026-09-20T15:00:00.000Z'
      }
    ],
    payments: [
      {
        id: 'pay_demo_b1',
        tenantId: 'tenant_cahaya_002',
        ownerId: 'user_b_cahaya',
        loanId: 'loan_demo_b1',
        installmentId: 'inst_demo_b1_1',
        customerId: 'cust_demo_b1',
        customerName: 'Dimas Kurniawan',
        amount: 1666667,
        paymentMethod: 'transfer',
        paymentDate: '2026-09-20',
        receiptNumber: 'KWT-CM-001',
        notes: 'Angsuran 1 iPhone 13',
        status: 'valid',
        createdAt: '2026-09-20T15:00:00.000Z'
      }
    ],
    notifications: [],
    auditLogs: [
      {
        id: 'log_demo_b1',
        tenantId: 'tenant_cahaya_002',
        ownerId: 'user_b_cahaya',
        uid: 'user_b_cahaya',
        userName: 'Andi Wijaya',
        action: 'PAYMENT_RECORDED',
        entityType: 'payment',
        entityId: 'pay_demo_b1',
        description: 'Pembayaran diterima: Rp1.666.667 (Dimas Kurniawan) [KWT-CM-001]',
        timestamp: '2026-09-20T15:00:00.000Z'
      }
    ]
  },
  test_user_c: {
    customers: [
      {
        id: 'cust_demo_c1',
        tenantId: 'tenant_lancar_003',
        ownerId: 'user_c_lancar',
        name: 'Ibu Darti (Pedagang Sayur)',
        phone: '081987654321',
        address: 'Kios Pasar Beringharjo No. 12, Yogyakarta',
        notes: 'Pinjaman modal harian.',
        status: 'active',
        isBadDebt: false,
        createdAt: '2026-09-15T10:00:00.000Z',
        updatedAt: '2026-09-15T10:00:00.000Z'
      }
    ],
    loans: [
      {
        id: 'loan_demo_c1',
        tenantId: 'tenant_lancar_003',
        ownerId: 'user_c_lancar',
        customerId: 'cust_demo_c1',
        customerName: 'Ibu Darti (Pedagang Sayur)',
        customerPhone: '081987654321',
        type: 'uang',
        itemName: 'Pinjaman Modal Dagang Harian',
        itemPrice: 1000000,
        downPayment: 0,
        totalLoanAmount: 1200000,
        totalPaid: 400000,
        remainingAmount: 800000,
        installmentAmount: 40000,
        tenor: 30,
        tenorUnit: 'hari',
        startDate: '2026-09-15',
        dueDate: '2026-10-15',
        status: 'active',
        createdAt: '2026-09-15T10:15:00.000Z',
        updatedAt: '2026-09-25T08:00:00.000Z'
      }
    ],
    installments: [],
    payments: [],
    notifications: [],
    auditLogs: []
  }
};
