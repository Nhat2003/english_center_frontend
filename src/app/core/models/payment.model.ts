export interface Payment {
  id?: number;
  studentId: number;
  studentName?: string;
  classId: number;
  className?: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  status: 'PENDING' | 'COMPLETED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  description?: string;
  transactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentRequest {
  studentId: number;
  classId: number;
  amount: number;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD';
  description?: string;
  transactionId?: string;
}

export interface PaymentSummary {
  totalAmount: number;
  totalPayments: number;
  pendingAmount: number;
  completedAmount: number;
  monthlyRevenue: { month: string; amount: number }[];
}
