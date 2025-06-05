import React from "react";
import {
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiCreditCard,
  FiCalendar,
  FiMoreVertical,
  FiArrowUpRight,
  FiEye,
  FiFilter,
  FiAward,
  FiTarget,
  FiActivity,
  FiStar,
  FiZap,
  FiClock,
  FiGift,
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

const Dashboard: React.FC = () => {
  // Mock data for loan management system
  const summaryData = {
    totalLoans: 1247,
    totalLoanAmount: 2450000,
    activeClients: 892,
    collectedThisMonth: 345780,
    pendingApprovals: 23,
    overduePayments: 15,
    defaultRate: 2.3,
    averageLoanAmount: 15500,
  };

  // Mock chart data
  const monthlyCollectionData = [
    { month: "Jan", collected: 280000, target: 300000 },
    { month: "Feb", collected: 320000, target: 310000 },
    { month: "Mar", collected: 290000, target: 305000 },
    { month: "Apr", collected: 350000, target: 320000 },
    { month: "May", collected: 345780, target: 330000 },
    { month: "Jun", collected: 0, target: 340000 },
  ];

  const loanStatusData = [
    { name: "Active", value: 756, color: "#22C55E" },
    { name: "Completed", value: 398, color: "#3B82F6" },
    { name: "Pending", value: 63, color: "#F59E0B" },
    { name: "Overdue", value: 30, color: "#EF4444" },
  ];

  const weeklyApplications = [
    { day: "Mon", applications: 12, approvals: 8 },
    { day: "Tue", applications: 18, approvals: 14 },
    { day: "Wed", applications: 15, approvals: 10 },
    { day: "Thu", applications: 22, approvals: 18 },
    { day: "Fri", applications: 20, approvals: 15 },
    { day: "Sat", applications: 8, approvals: 6 },
    { day: "Sun", applications: 5, approvals: 3 },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "payment",
      client: "John Doe",
      loanId: "LN-2024-001",
      amount: 2500,
      status: "completed",
      time: "2 minutes ago",
      icon: FiCheckCircle,
      color: "text-green-600",
    },
    {
      id: 2,
      type: "application",
      client: "Sarah Wilson",
      loanId: "LN-2024-089",
      amount: 15000,
      status: "pending",
      time: "15 minutes ago",
      icon: FiCreditCard,
      color: "text-blue-600",
    },
    {
      id: 3,
      type: "overdue",
      client: "Mike Johnson",
      loanId: "LN-2024-045",
      amount: 1200,
      status: "overdue",
      time: "1 hour ago",
      icon: FiAlertTriangle,
      color: "text-red-600",
    },
    {
      id: 4,
      type: "approval",
      client: "Emma Davis",
      loanId: "LN-2024-090",
      amount: 8500,
      status: "approved",
      time: "2 hours ago",
      icon: FiCheckCircle,
      color: "text-green-600",
    },
  ];

  const upcomingPayments = [
    {
      client: "Alex Thompson",
      amount: 1850,
      dueDate: "Tomorrow",
      loanId: "LN-2024-023",
    },
    {
      client: "Lisa Chen",
      amount: 2200,
      dueDate: "Dec 28",
      loanId: "LN-2024-034",
    },
    {
      client: "Robert Miller",
      amount: 1600,
      dueDate: "Dec 29",
      loanId: "LN-2024-056",
    },
    {
      client: "Maria Garcia",
      amount: 3100,
      dueDate: "Dec 30",
      loanId: "LN-2024-067",
    },
  ];

  // Helper function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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

      {/* Enhanced Stats Grid with improved design */}
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
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 border-2 border-green-200/50 dark:border-green-800/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover-lift group stagger-item">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-xl"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              Total Loan Amount
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
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="ml-1">vs last month</span>
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
              <span className="text-green-600 font-medium">+5.3%</span>
              <span className="ml-1">vs last month</span>
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
              <FiTrendingDown className="mr-1 h-3 w-3 text-red-500" />
              <span className="text-red-600 font-medium">-2.1%</span>
              <span className="ml-1">vs target</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Charts Section with better spacing and design */}
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
