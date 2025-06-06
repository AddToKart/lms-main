import React, { useEffect, useState } from "react";
import {
  FiActivity,
  FiUsers,
  FiCreditCard,
  FiTrendingUp,
  FiTarget,
  FiCalendar,
  FiFilter,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiZap,
  FiMoreVertical,
  FiEye,
  FiStar,
  FiAward,
  FiGift,
  FiArrowUpRight,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const Dashboard: React.FC = () => {
  // State for real data
  const [summaryData, setSummaryData] = useState({
    totalLoans: 0,
    totalLoanAmount: 0,
    activeClients: 0,
    collectedThisMonth: 0,
    pendingApprovals: 0,
    overduePayments: 0,
    defaultRate: 0,
    averageLoanAmount: 0,
  });

  const [monthlyCollectionData, setMonthlyCollectionData] = useState([]);
  const [loanStatusData, setLoanStatusData] = useState([]);
  const [weeklyApplications, setWeeklyApplications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper functions with better validation
  const safeParseFloat = (value: any, defaultValue = 0) => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const safeParseInt = (value: any, defaultValue = 0) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const getDateXMonthsAgo = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - months);
    return date.toISOString().split("T")[0];
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getDefaultWeeklyData = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((day) => ({ day, applications: 0, approvals: 0 }));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return `${diffDays} days ago`;
    }
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const processMonthlyData = (paymentData: any[]) => {
    // Initialize with empty months if no data
    if (!Array.isArray(paymentData) || paymentData.length === 0) {
      const emptyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        emptyData.push({
          month: monthName,
          collected: 0,
          target: 5000, // Default target
        });
      }
      return emptyData;
    }

    // Group payments by month and calculate totals
    const monthlyMap = new Map();

    paymentData.forEach((payment) => {
      try {
        const date = new Date(
          payment.date || payment.payment_date || payment.created_at
        );
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", { month: "short" });

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            month: monthName,
            collected: 0,
            target: 0,
          });
        }

        const existing = monthlyMap.get(monthKey);
        const amount = safeParseFloat(
          payment.total_amount || payment.amount,
          0
        );
        existing.collected += amount;
      } catch (error) {
        console.warn("Error processing payment data:", error, payment);
      }
    });

    // Convert to array and calculate average for targets
    const result = Array.from(monthlyMap.values());
    const avgCollection =
      result.length > 0
        ? result.reduce((sum, item) => sum + item.collected, 0) / result.length
        : 5000; // Default if no data

    result.forEach((item) => {
      item.target = Math.max(Math.round(avgCollection * 1.1), 1000); // Minimum target of 1000
    });

    // Fill in missing months and ensure we have 6 months
    const sixMonthsData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const existingData = result.find((item) => item.month === monthName);
      sixMonthsData.push(
        existingData || {
          month: monthName,
          collected: 0,
          target: Math.max(Math.round(avgCollection * 1.1), 1000),
        }
      );
    }

    return sixMonthsData;
  };

  const processLoanStatusData = (statusData: any[]) => {
    if (!Array.isArray(statusData) || statusData.length === 0) {
      // Return default data if no status data available
      return [
        { name: "Active", value: 0, color: "#22C55E" },
        { name: "Completed", value: 0, color: "#3B82F6" },
        { name: "Pending", value: 0, color: "#F59E0B" },
        { name: "Overdue", value: 0, color: "#EF4444" },
      ];
    }

    const statusMap = {
      active: { name: "Active", color: "#22C55E" },
      completed: { name: "Completed", color: "#3B82F6" },
      paid_off: { name: "Completed", color: "#3B82F6" },
      pending: { name: "Pending", color: "#F59E0B" },
      overdue: { name: "Overdue", color: "#EF4444" },
      rejected: { name: "Pending", color: "#F59E0B" },
      defaulted: { name: "Overdue", color: "#EF4444" },
    };

    const groupedData = new Map();

    statusData.forEach((item) => {
      try {
        const status = statusMap[item.status as keyof typeof statusMap];
        if (status) {
          const key = status.name;
          const count = safeParseInt(item.count, 0);

          if (groupedData.has(key)) {
            groupedData.set(key, {
              ...groupedData.get(key),
              value: groupedData.get(key).value + count,
            });
          } else {
            groupedData.set(key, {
              name: status.name,
              value: count,
              color: status.color,
            });
          }
        }
      } catch (error) {
        console.warn("Error processing loan status data:", error, item);
      }
    });

    const result = Array.from(groupedData.values()).filter(
      (item) => item.value > 0
    );

    // Ensure we have at least some default data
    if (result.length === 0) {
      return [
        { name: "Active", value: 0, color: "#22C55E" },
        { name: "Completed", value: 0, color: "#3B82F6" },
        { name: "Pending", value: 0, color: "#F59E0B" },
        { name: "Overdue", value: 0, color: "#EF4444" },
      ];
    }

    return result;
  };

  const fetchWeeklyApplications = async (API_URL: string, headers: any) => {
    try {
      const loansResponse = await fetch(`${API_URL}/api/loans?limit=1000`, {
        headers,
      });
      if (!loansResponse.ok) {
        setWeeklyApplications(getDefaultWeeklyData());
        return;
      }

      const loansData = await loansResponse.json();
      const loans = loansData.data?.loans || [];

      // Process weekly data
      const weeklyData = [];
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];

        const dayLoans = loans.filter((loan: any) => {
          try {
            const loanDate = new Date(loan.created_at);
            return (
              !isNaN(loanDate.getTime()) &&
              loanDate.toDateString() === date.toDateString()
            );
          } catch {
            return false;
          }
        });

        const applications = safeParseInt(dayLoans.length, 0);
        const approvals = safeParseInt(
          dayLoans.filter(
            (loan: any) =>
              loan.status === "approved" || loan.status === "active"
          ).length,
          0
        );

        weeklyData.push({
          day: dayName,
          applications,
          approvals,
        });
      }

      setWeeklyApplications(weeklyData);
    } catch (error) {
      console.error("Error fetching weekly applications:", error);
      setWeeklyApplications(getDefaultWeeklyData());
    }
  };

  const fetchRecentActivities = async (API_URL: string, headers: any) => {
    try {
      // Fetch recent payments and loans
      const [paymentsResponse, loansResponse] = await Promise.all([
        fetch(`${API_URL}/api/payments?limit=10`, { headers }),
        fetch(`${API_URL}/api/loans?limit=10`, { headers }),
      ]);

      const activities = [];

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        const payments = paymentsData.data?.payments || [];

        payments.slice(0, 5).forEach((payment: any) => {
          activities.push({
            id: `payment-${payment.id}`,
            type: "payment",
            client: payment.client_name || "Unknown Client",
            loanId: `LN-${payment.loan_id}`,
            amount: safeParseFloat(payment.amount, 0),
            status: payment.status === "completed" ? "completed" : "pending",
            time: formatTimeAgo(payment.created_at),
            icon: FiCheckCircle,
            color:
              payment.status === "completed"
                ? "text-green-600"
                : "text-yellow-600",
          });
        });
      }

      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        const loans = loansData.data?.loans || [];

        loans.slice(0, 3).forEach((loan: any) => {
          let activityType = "application";
          let status = loan.status;
          let icon = FiCreditCard;
          let color = "text-blue-600";

          if (loan.status === "approved" || loan.status === "active") {
            activityType = "approval";
            status = "approved";
            icon = FiCheckCircle;
            color = "text-green-600";
          } else if (loan.status === "overdue") {
            activityType = "overdue";
            status = "overdue";
            icon = FiAlertTriangle;
            color = "text-red-600";
          }

          activities.push({
            id: `loan-${loan.id}`,
            type: activityType,
            client: loan.client_name || "Unknown Client",
            loanId: `LN-${loan.id}`,
            amount: safeParseFloat(loan.loan_amount, 0),
            status: status,
            time: formatTimeAgo(loan.created_at),
            icon: icon,
            color: color,
          });
        });
      }

      // Sort by most recent and limit to 4
      activities.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      setRecentActivities(activities.slice(0, 4));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setRecentActivities([]);
    }
  };

  const fetchUpcomingPayments = async (API_URL: string, headers: any) => {
    try {
      // Fetch loans with upcoming due dates
      const loansResponse = await fetch(
        `${API_URL}/api/loans?status=active&limit=100`,
        { headers }
      );
      if (!loansResponse.ok) return;

      const loansData = await loansResponse.json();
      const loans = loansData.data?.loans || [];

      const upcoming = loans
        .filter(
          (loan: any) =>
            loan.next_due_date && new Date(loan.next_due_date) >= new Date()
        )
        .sort(
          (a: any, b: any) =>
            new Date(a.next_due_date).getTime() -
            new Date(b.next_due_date).getTime()
        )
        .slice(0, 4)
        .map((loan: any) => ({
          client: loan.client_name || "Unknown Client",
          amount: safeParseFloat(
            loan.installment_amount || loan.loan_amount / loan.term_months,
            0
          ),
          dueDate: formatDueDate(loan.next_due_date),
          loanId: `LN-${loan.id}`,
        }));

      setUpcomingPayments(upcoming);
    } catch (error) {
      console.error("Error fetching upcoming payments:", error);
      setUpcomingPayments([]);
    }
  };

  const fetchFallbackData = async (
    API_URL: string,
    headers: any,
    analytics: any,
    loanAnalytics: any,
    monthlyPayments: any[],
    loanStatusDistribution: any[]
  ) => {
    try {
      const [loansResponse, paymentsResponse, clientsResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/loans?limit=1000`, { headers }),
          fetch(`${API_URL}/api/payments?limit=1000`, { headers }),
          fetch(`${API_URL}/api/clients?limit=1000`, { headers }),
        ]);

      let loans = [];
      let payments = [];
      let clients = [];

      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        loans = loansData.data?.loans || [];
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        payments = paymentsData.data?.payments || [];
      }

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        clients = clientsData.data?.clients || [];
      }

      // Calculate analytics from fetched data with safe parsing
      const activeLoans = loans.filter(
        (loan) => loan.status === "active" || loan.status === "approved"
      );

      const totalLoanAmount = loans.reduce(
        (sum, loan) => sum + safeParseFloat(loan.loan_amount, 0),
        0
      );

      const totalOutstanding = loans.reduce(
        (sum, loan) =>
          sum + safeParseFloat(loan.remaining_balance || loan.loan_amount, 0),
        0
      );

      // Calculate monthly collections with date validation
      const currentDate = new Date();
      const monthlyCollections = payments
        .filter((payment) => {
          try {
            const paymentDate = new Date(
              payment.payment_date || payment.created_at
            );
            if (isNaN(paymentDate.getTime())) return false;

            return (
              paymentDate.getMonth() === currentDate.getMonth() &&
              paymentDate.getFullYear() === currentDate.getFullYear()
            );
          } catch {
            return false;
          }
        })
        .reduce((sum, payment) => sum + safeParseFloat(payment.amount, 0), 0);

      // Update analytics object with safe values
      Object.assign(analytics, {
        total_active_loans: safeParseInt(activeLoans.length, 0),
        total_active_clients: safeParseInt(clients.length, 0),
        monthly_collections: safeParseFloat(monthlyCollections, 0),
        total_loan_amount: safeParseFloat(totalLoanAmount, 0),
      });

      // Update loan analytics
      Object.assign(loanAnalytics, {
        total_outstanding: safeParseFloat(totalOutstanding, 0),
        average_loan_amount:
          loans.length > 0
            ? safeParseFloat(totalLoanAmount / loans.length, 0)
            : 0,
      });

      // Create loan status distribution with safe counting
      const statusCounts = loans.reduce((acc, loan) => {
        const status = loan.status || "pending";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      loanStatusDistribution.splice(
        0,
        loanStatusDistribution.length,
        ...Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count: safeParseInt(count as any, 0),
        }))
      );

      // Process payments for monthly data with validation
      const validPayments = payments
        .filter((payment) => {
          try {
            const date = new Date(payment.payment_date || payment.created_at);
            return !isNaN(date.getTime());
          } catch {
            return false;
          }
        })
        .map((payment) => ({
          date: payment.payment_date || payment.created_at,
          total_amount: safeParseFloat(payment.amount, 0),
        }));

      monthlyPayments.splice(0, monthlyPayments.length, ...validPayments);
    } catch (error) {
      console.error("Error fetching fallback data:", error);
      // Set safe defaults
      Object.assign(analytics, {
        total_active_loans: 0,
        total_active_clients: 0,
        monthly_collections: 0,
        total_loan_amount: 0,
      });
      Object.assign(loanAnalytics, {
        total_outstanding: 0,
        average_loan_amount: 0,
      });
    }
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Get API URL
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("No authentication token found");
        }

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // Initialize with safe default values
        let analytics = {
          total_active_loans: 0,
          total_active_clients: 0,
          monthly_collections: 0,
          total_loan_amount: 0,
        };
        let loanAnalytics = {
          total_outstanding: 0,
          average_loan_amount: 0,
        };
        let monthlyPayments = [];
        let loanStatusDistribution = [];

        // Try to fetch analytics with error handling
        try {
          const analyticsResponse = await fetch(
            `${API_URL}/api/reports/analytics`,
            { headers }
          );
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json();
            const statsData = analyticsData.data?.overall_stats || {};

            analytics = {
              total_active_loans: safeParseInt(statsData.total_active_loans, 0),
              total_active_clients: safeParseInt(
                statsData.total_active_clients,
                0
              ),
              monthly_collections: safeParseFloat(
                statsData.monthly_collections,
                0
              ),
              total_loan_amount: safeParseFloat(statsData.total_loan_amount, 0),
            };

            loanStatusDistribution = Array.isArray(
              analyticsData.data?.loan_status_distribution
            )
              ? analyticsData.data.loan_status_distribution
              : [];
          }
        } catch (error) {
          console.warn("Analytics endpoint not available, using fallback data");
        }

        // Try to fetch loan analytics
        try {
          const loanAnalyticsResponse = await fetch(
            `${API_URL}/api/reports/loan-analytics`,
            { headers }
          );
          if (loanAnalyticsResponse.ok) {
            const loanAnalyticsData = await loanAnalyticsResponse.json();
            const loanData = loanAnalyticsData.data || {};

            loanAnalytics = {
              total_outstanding: safeParseFloat(loanData.total_outstanding, 0),
              average_loan_amount: safeParseFloat(
                loanData.average_loan_amount,
                0
              ),
            };
          }
        } catch (error) {
          console.warn(
            "Loan analytics endpoint not available, calculating from loans"
          );
        }

        // Try to fetch payment history
        try {
          const monthlyResponse = await fetch(
            `${API_URL}/api/reports/payment-history?date_from=${getDateXMonthsAgo(
              6
            )}&date_to=${getCurrentDate()}`,
            { headers }
          );
          if (monthlyResponse.ok) {
            const monthlyData = await monthlyResponse.json();
            monthlyPayments = Array.isArray(monthlyData.data)
              ? monthlyData.data
              : [];
          }
        } catch (error) {
          console.warn(
            "Payment history endpoint not available, using recent payments"
          );
        }

        // If endpoints failed, fetch basic data from existing endpoints
        if (
          analytics.total_active_loans === 0 &&
          analytics.total_active_clients === 0
        ) {
          await fetchFallbackData(
            API_URL,
            headers,
            analytics,
            loanAnalytics,
            monthlyPayments,
            loanStatusDistribution
          );
        }

        // Process and set summary data with validation
        setSummaryData({
          totalLoans: safeParseInt(analytics.total_active_loans, 0),
          totalLoanAmount: safeParseFloat(
            loanAnalytics.total_outstanding || analytics.total_loan_amount,
            0
          ),
          activeClients: safeParseInt(analytics.total_active_clients, 0),
          collectedThisMonth: safeParseFloat(analytics.monthly_collections, 0),
          pendingApprovals: 0,
          overduePayments: 0,
          defaultRate: 0,
          averageLoanAmount: safeParseFloat(
            loanAnalytics.average_loan_amount,
            0
          ),
        });

        // Process chart data with validation
        const processedMonthlyData = processMonthlyData(monthlyPayments);
        setMonthlyCollectionData(processedMonthlyData);

        const processedStatusData = processLoanStatusData(
          loanStatusDistribution
        );
        setLoanStatusData(processedStatusData);

        // Update summary data with calculated values
        const pendingCount =
          loanStatusDistribution.find((s) => s.status === "pending")?.count ||
          0;
        const overdueCount =
          loanStatusDistribution.find((s) => s.status === "overdue")?.count ||
          0;
        const totalLoans = loanStatusDistribution.reduce(
          (sum, s) => sum + safeParseInt(s.count, 0),
          0
        );
        const defaultedCount =
          loanStatusDistribution.find((s) => s.status === "defaulted")?.count ||
          0;

        setSummaryData((prev) => ({
          ...prev,
          pendingApprovals: safeParseInt(pendingCount, 0),
          overduePayments: safeParseInt(overdueCount, 0),
          defaultRate:
            totalLoans > 0
              ? safeParseFloat((defaultedCount / totalLoans) * 100, 0)
              : 0,
        }));

        // Fetch additional data
        await fetchWeeklyApplications(API_URL, headers);
        await fetchRecentActivities(API_URL, headers);
        await fetchUpcomingPayments(API_URL, headers);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <FiActivity className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FiAlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Compact Enhanced Header with glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 animate-slide-down">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]"></div>
        <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-secondary/20 to-transparent rounded-full blur-xl animate-pulse"></div>

        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/25">
                <FiActivity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
                <FiZap className="w-2 h-2 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Welcome back! Here&apos;s what&apos;s happening with your loans
                today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hover-lift border-primary/20 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm"
            >
              <FiFilter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 hover-lift pulse-glow">
              <FiCalendar className="mr-2 h-4 w-4" />
              This Month
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid with real data */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover-lift group stagger-item">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Total Loans
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiCreditCard className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 transition-colors">
              {summaryData.totalLoans.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <FiTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">Active loans</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover-lift group stagger-item">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Total Outstanding
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiDollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-700 dark:text-green-300 transition-colors">
              {formatCurrency(summaryData.totalLoanAmount)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <FiTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">
                Outstanding balance
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-2 border-purple-200/50 dark:border-purple-800/50 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 hover-lift group stagger-item">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Active Clients
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiUsers className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-700 dark:text-purple-300 transition-colors">
              {summaryData.activeClients.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <FiTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">Active clients</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-2 border-orange-200/50 dark:border-orange-800/50 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 hover-lift group stagger-item">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Collections (Month)
            </CardTitle>
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <FiTarget className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 transition-colors">
              {formatCurrency(summaryData.collectedThisMonth)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <FiTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              <span className="text-green-600 font-medium">This month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section with real data */}
      <div className="grid gap-8 lg:grid-cols-2 animate-slide-up">
        {/* Enhanced Monthly Collections Chart */}
        <Card className="relative overflow-hidden hover-lift border-border/50 bg-gradient-to-br from-background via-background to-muted/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/2 to-transparent"></div>
          <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <FiTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  Monthly Collections
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-lg"></div>
                </CardTitle>
                <CardDescription className="text-base">
                  Collection vs Target Performance
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover-lift hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                <FiMoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-8">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyCollectionData}>
                  <defs>
                    {/* Enhanced gradients with more stops */}
                    <linearGradient
                      id="collectedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop
                        offset="25%"
                        stopColor="#3B82F6"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="50%"
                        stopColor="#3B82F6"
                        stopOpacity={0.2}
                      />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="targetGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop
                        offset="50%"
                        stopColor="#10B981"
                        stopOpacity={0.15}
                      />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    {/* Glow effect */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted-foreground))"
                    strokeOpacity={0.15}
                    strokeWidth={1}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{
                      fontSize: 13,
                      fill: "hsl(var(--muted-foreground))",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{
                      fontSize: 13,
                      fill: "hsl(var(--muted-foreground))",
                      fontWeight: 500,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value / 1000}k`}
                    dx={-10}
                  />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `$${value.toLocaleString()}`,
                      name === "collected" ? "Collected" : "Target",
                    ]}
                    labelStyle={{
                      color: "hsl(var(--foreground))",
                      fontWeight: "600",
                      fontSize: "14px",
                    }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                      fontSize: "13px",
                      padding: "16px 20px",
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      backdropFilter: "blur(8px)",
                    }}
                    cursor={{
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2,
                      strokeDasharray: "5 5",
                      strokeOpacity: 0.5,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="collected"
                    stroke="#3B82F6"
                    strokeWidth={4}
                    fill="url(#collectedGradient)"
                    dot={{
                      fill: "#3B82F6",
                      strokeWidth: 3,
                      r: 6,
                      filter: "url(#glow)",
                    }}
                    activeDot={{
                      r: 8,
                      stroke: "#3B82F6",
                      strokeWidth: 3,
                      fill: "#ffffff",
                      filter: "url(#glow)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="#10B981"
                    strokeWidth={3}
                    strokeDasharray="10 5"
                    fill="url(#targetGradient)"
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      stroke: "#10B981",
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced Monthly Performance Metrics */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {monthlyCollectionData.slice(-4).map((month) => {
                  const achievement = (
                    (month.collected / month.target) *
                    100
                  ).toFixed(1);
                  const isAboveTarget = month.collected >= month.target;

                  return (
                    <div
                      key={month.month}
                      className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 hover:to-muted/10 transition-all duration-500 cursor-pointer hover-lift border border-border/30 hover:border-border/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-4 h-4 rounded-full shadow-lg transition-all duration-500 group-hover:scale-125 ${
                              isAboveTarget
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50"
                                : "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-blue-500/50"
                            }`}
                          ></div>
                          {isAboveTarget && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                              <FiStar className="w-2 h-2 text-white m-0.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                              {month.month}
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isAboveTarget
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            >
                              {achievement}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="w-full bg-muted/60 rounded-full h-2 mr-3 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                  isAboveTarget
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                    : "bg-gradient-to-r from-blue-500 to-cyan-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    parseFloat(achievement),
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                              ${(month.collected / 1000).toFixed(0)}k
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Summary Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      $
                      {(
                        monthlyCollectionData.reduce(
                          (sum, month) => sum + month.collected,
                          0
                        ) / 1000
                      ).toFixed(0)}
                      k
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Total Collected
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                      {(
                        (monthlyCollectionData.reduce(
                          (sum, month) => sum + month.collected,
                          0
                        ) /
                          monthlyCollectionData.reduce(
                            (sum, month) => sum + month.target,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Overall Achievement
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-200/50 dark:border-orange-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                      $
                      {(
                        monthlyCollectionData[monthlyCollectionData.length - 1]
                          ?.target / 1000 || 0
                      ).toFixed(0)}
                      k
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      June Target
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Loan Status Distribution */}
        <Card className="relative overflow-hidden hover-lift border-border/50 bg-gradient-to-br from-background via-background to-muted/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/2 to-transparent"></div>
          <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-900/10">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                    <FiActivity className="w-5 h-5 text-white" />
                  </div>
                  Loan Status Distribution
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg"></div>
                </CardTitle>
                <CardDescription className="text-base">
                  Current loan portfolio breakdown
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover-lift hover:bg-purple-50 dark:hover:bg-purple-900/30"
              >
                <FiEye className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative z-10 p-8">
            <div className="relative">
              {/* Enhanced Pie Chart */}
              <div className="h-80 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {/* Enhanced gradients for each segment */}
                      <linearGradient
                        id="activeGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#22C55E" stopOpacity={1} />
                        <stop
                          offset="50%"
                          stopColor="#16A34A"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#15803D"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="completedGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop
                          offset="50%"
                          stopColor="#1D4ED8"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#1E40AF"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="pendingGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                        <stop
                          offset="50%"
                          stopColor="#D97706"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#B45309"
                          stopOpacity={0.8}
                        />
                      </linearGradient>
                      <linearGradient
                        id="overdueGradient"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                        <stop
                          offset="50%"
                          stopColor="#DC2626"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor="#B91C1C"
                          stopOpacity={0.8}
                        />
                      </linearGradient>

                      {/* Enhanced drop shadow filter */}
                      <filter
                        id="dropshadow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%"
                      >
                        <feDropShadow
                          dx="0"
                          dy="6"
                          stdDeviation="12"
                          floodColor="rgba(0,0,0,0.15)"
                        />
                      </filter>
                    </defs>
                    <Pie
                      data={loanStatusData.map((item, index) => ({
                        ...item,
                        fill:
                          index === 0
                            ? "url(#activeGradient)"
                            : index === 1
                            ? "url(#completedGradient)"
                            : index === 2
                            ? "url(#pendingGradient)"
                            : "url(#overdueGradient)",
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={140}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                      filter="url(#dropshadow)"
                      animationBegin={300}
                      animationDuration={2000}
                    >
                      {loanStatusData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          className="hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: string) => [
                        `${value} loans (${(
                          (value /
                            loanStatusData.reduce(
                              (sum, item) => sum + item.value,
                              0
                            )) *
                          100
                        ).toFixed(1)}%)`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                        borderRadius: "16px",
                        color: "#1a1a1a",
                        fontSize: "14px",
                        padding: "16px 20px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        backdropFilter: "blur(8px)",
                      }}
                      labelStyle={{
                        color: "#1a1a1a",
                        fontWeight: "700",
                        marginBottom: "6px",
                        fontSize: "15px",
                      }}
                      wrapperStyle={{
                        outline: "none",
                        zIndex: 1000,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Enhanced center content */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-background/90 backdrop-blur-lg rounded-full w-28 h-28 flex flex-col items-center justify-center border-2 border-border/50 shadow-2xl">
                    <div className="text-2xl font-bold text-foreground">
                      {loanStatusData.reduce(
                        (sum, item) => sum + item.value,
                        0
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold">
                      Total Loans
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <FiAward className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Legend */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              {loanStatusData.map((item, index) => {
                const percentage = (
                  (item.value /
                    loanStatusData.reduce((sum, i) => sum + i.value, 0)) *
                  100
                ).toFixed(1);
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-muted/30 to-transparent hover:from-muted/50 hover:to-muted/10 transition-all duration-500 cursor-pointer hover-lift border border-border/30 hover:border-border/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-4 h-4 rounded-full shadow-lg transition-all duration-500 group-hover:scale-125"
                          style={{
                            background: `linear-gradient(135deg, ${item.color}E6, ${item.color})`,
                            boxShadow: `0 4px 8px ${item.color}40`,
                          }}
                        ></div>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse">
                            <FiGift className="w-2 h-2 text-white m-0.5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.name}
                          </span>
                          <span className="text-sm font-bold text-foreground">
                            {item.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="w-full bg-muted/60 rounded-full h-2 mr-3 overflow-hidden">
                            <div
                              className="h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{
                                width: `${percentage}%`,
                                background: `linear-gradient(90deg, ${item.color}CC, ${item.color})`,
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Additional Stats */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-300">
                      {(
                        ((loanStatusData[0]?.value || 0) /
                          loanStatusData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Healthy Rate
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                      {(
                        ((loanStatusData[1]?.value || 0) /
                          loanStatusData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Success Rate
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50 hover-lift group">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent"></div>
                  <div className="relative z-10">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
                      {(
                        ((loanStatusData[3]?.value || 0) /
                          loanStatusData.reduce(
                            (sum, item) => sum + item.value,
                            0
                          )) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Risk Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Weekly Applications Chart */}
      <Card className="relative overflow-hidden hover-lift animate-scale-in border-border/50 bg-gradient-to-br from-background via-background to-muted/5 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/2 to-transparent"></div>
        <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-900/10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <FiActivity className="w-5 h-5 text-white" />
                </div>
                Weekly Applications & Approvals
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse shadow-lg"></div>
              </CardTitle>
              <CardDescription className="text-base">
                Application trends for this week
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-800/50">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-md"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  Applications
                </span>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50">
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-md"></div>
                <span className="text-sm font-medium text-muted-foreground">
                  Approvals
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-8">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyApplications} barCategoryGap="25%">
                <defs>
                  <linearGradient
                    id="applicationGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient
                    id="approvalGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                    <stop offset="50%" stopColor="#10B981" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient
                    id="applicationHover"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient
                    id="approvalHover"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                    <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--muted-foreground))"
                  strokeOpacity={0.15}
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="day"
                  tick={{
                    fontSize: 13,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{
                    fontSize: 13,
                    fill: "hsl(var(--muted-foreground))",
                    fontWeight: 500,
                  }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    color: "hsl(var(--foreground))",
                    fontSize: "13px",
                    padding: "16px 20px",
                    boxShadow:
                      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    backdropFilter: "blur(8px)",
                  }}
                  cursor={{
                    fill: "hsl(var(--muted))",
                    fillOpacity: 0.1,
                    stroke: "hsl(var(--border))",
                    strokeWidth: 1,
                  }}
                  formatter={(value: any, name: string) => [
                    value,
                    name === "applications" ? "Applications" : "Approvals",
                  ]}
                  labelStyle={{
                    color: "hsl(var(--foreground))",
                    fontWeight: "600",
                    fontSize: "14px",
                  }}
                />
                <Bar
                  dataKey="applications"
                  fill="url(#applicationGradient)"
                  radius={[6, 6, 0, 0]}
                  name="Applications"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => {
                    // Apply hover effect
                    const bars = document.querySelectorAll(
                      `[name="Applications"]`
                    );
                    if (bars[index]) {
                      bars[index].setAttribute(
                        "fill",
                        "url(#applicationHover)"
                      );
                    }
                  }}
                  onMouseLeave={(_, index) => {
                    // Remove hover effect
                    const bars = document.querySelectorAll(
                      `[name="Applications"]`
                    );
                    if (bars[index]) {
                      bars[index].setAttribute(
                        "fill",
                        "url(#applicationGradient)"
                      );
                    }
                  }}
                />
                <Bar
                  dataKey="approvals"
                  fill="url(#approvalGradient)"
                  radius={[6, 6, 0, 0]}
                  name="Approvals"
                  stroke="#10B981"
                  strokeWidth={2}
                  onMouseEnter={(_, index) => {
                    // Apply hover effect
                    const bars =
                      document.querySelectorAll(`[name="Approvals"]`);
                    if (bars[index]) {
                      bars[index].setAttribute("fill", "url(#approvalHover)");
                    }
                  }}
                  onMouseLeave={(_, index) => {
                    // Remove hover effect
                    const bars =
                      document.querySelectorAll(`[name="Approvals"]`);
                    if (bars[index]) {
                      bars[index].setAttribute(
                        "fill",
                        "url(#approvalGradient)"
                      );
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Bottom Section */}
      <div className="grid gap-8 lg:grid-cols-2 animate-fade-in-left">
        {/* Enhanced Recent Activities */}
        <Card className="relative overflow-hidden hover-lift border-border/50 bg-gradient-to-br from-background via-background to-muted/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/2 to-transparent"></div>
          <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-900/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                  <FiActivity className="w-5 h-5 text-white" />
                </div>
                Recent Activities
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="hover-lift hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              >
                <FiClock className="w-4 h-4 mr-2" />
                Real-time
              </Button>
            </div>
            <CardDescription className="text-base">
              Latest loan activities
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            <div className="space-y-0">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={`relative p-6 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all duration-300 hover-lift stagger-item border-l-4 border-transparent hover:border-primary/50 ${
                    index !== recentActivities.length - 1
                      ? "border-b border-border/30"
                      : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br from-muted to-muted/80 ${activity.color} shadow-lg hover:scale-110 transition-transform duration-300`}
                    >
                      <activity.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-base font-semibold hover:text-primary transition-colors">
                            {activity.client}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.loanId} • {activity.type}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <FiClock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {activity.time}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-base font-bold">
                            {formatCurrency(activity.amount)}
                          </p>
                          <Badge
                            variant={
                              activity.status === "completed"
                                ? "success"
                                : activity.status === "pending"
                                ? "warning"
                                : activity.status === "approved"
                                ? "default"
                                : "danger"
                            }
                            className="shadow-md"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="relative z-10 p-6 border-t border-border/50 bg-gradient-to-r from-muted/10 to-transparent">
            <Button
              variant="ghost"
              className="w-full hover-lift hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-base py-6"
            >
              View all activities
              <FiArrowUpRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Enhanced Upcoming Payments */}
        <Card className="relative overflow-hidden hover-lift border-border/50 bg-gradient-to-br from-background via-background to-muted/5 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/2 to-transparent"></div>
          <CardHeader className="relative z-10 border-b border-border/50 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg">
                  <FiCalendar className="w-5 h-5 text-white" />
                </div>
                Upcoming Payments
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-lg"></div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="hover-lift hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                <FiTarget className="w-4 h-4 mr-2" />
                Targets
              </Button>
            </div>
            <CardDescription className="text-base">
              Payments due this week
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 p-0">
            <div className="space-y-0">
              {upcomingPayments.map((payment, index) => (
                <div
                  key={index}
                  className={`relative p-6 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all duration-300 hover-lift stagger-item border-l-4 border-transparent hover:border-amber-500/50 ${
                    index !== upcomingPayments.length - 1
                      ? "border-b border-border/30"
                      : ""
                  }`}
                  style={{ animationDelay: `${(index + 4) * 0.1}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/50">
                        <FiDollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold hover:text-primary transition-colors">
                          {payment.client}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.loanId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-base font-bold">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          payment.dueDate === "Tomorrow"
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        Due {payment.dueDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="relative z-10 p-6 border-t border-border/50 bg-gradient-to-r from-muted/10 to-transparent">
            <Button
              variant="ghost"
              className="w-full hover-lift hover:bg-amber-50 dark:hover:bg-amber-900/30 text-base py-6"
            >
              View payment schedule
              <FiArrowUpRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
