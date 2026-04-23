export interface IfoodConnection {
  id: string;
  merchantId: string;
  merchantName: string;
  status: string; // 'active' | 'inactive' | 'error'
  createdAt: string;
  ifoodStatus?: string | null; // 'OPEN' | 'CLOSED' | 'PAUSED' | null
}

export type PeriodType = '1D' | '7D' | '15D' | '30D' | 'custom';

export interface Period {
  type: PeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface DashboardSummary {
  totalSales: number;
  totalOrders: number;
  averageTicket: number;
  uniqueCustomers: number;
  cancelledOrders: number;
  topItems: Array<{ name: string; quantity: number }>;
  salesByHour: Array<{ hour: number; orders: number; revenue: number }>;
  salesByDay: Array<{ date: string; orders: number; revenue: number }>;
  prevTotalSales: number;
  prevTotalOrders: number;
  prevAverageTicket: number;
  prevUniqueCustomers: number;
}

export interface RealtimeOrder {
  orderId: string;
  displayId: string;
  customerName: string | null;
  totalAmount: number;
  items: Array<{ name: string; quantity: number }>;
  createdAt: string;
  status: string;
}

export interface RealtimeData {
  recentOrders: RealtimeOrder[];
  merchantStatus: string | null;
  lastOrderMinutesAgo: number | null;
  lastOrderDescription: string | null;
}
