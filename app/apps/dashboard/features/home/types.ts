/** MVP dashboard stats (GET /api/dashboard/stats) */
export type DashboardStats = {
  totalEvents: number;
  activeEvents: number;
  endedEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  checkinRate: number;
};

export type ChartRegistrationsPoint = { date: string; count: number };
export type ChartRevenuePoint = { date: string; amount: number };
