import React, { useState } from "react";
import {
  FiBarChart,
  FiUsers,
  FiDollarSign,
  FiAlertTriangle,
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReportType =
  | "loanSummary"
  | "clientSummary"
  | "paymentHistory"
  | "overdueLoans";

// Enhanced Stats Card with gradients and animations
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning" | "danger";
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  variant,
  subtitle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
          cardBg:
            "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-200/50 dark:border-green-800/50",
        };
      case "warning":
        return {
          iconBg: "bg-gradient-to-br from-yellow-500 to-orange-600",
          cardBg:
            "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
          text: "text-yellow-700 dark:text-yellow-300",
          border: "border-yellow-200/50 dark:border-yellow-800/50",
        };
      case "danger":
        return {
          iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
          cardBg:
            "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-200/50 dark:border-red-800/50",
        };
      default:
        return {
          iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
          cardBg:
            "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-200/50 dark:border-blue-800/50",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 border-2 ${styles.border} ${styles.cardBg} hover-lift group`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {title}
        </CardTitle>
        <div
          className={`p-3 rounded-xl ${styles.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <div className="text-white">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${styles.text} transition-colors`}>
          {value}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1 mt-2">
            <FiTrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Reports: React.FC = () => {
  const [selectedReport, setSelectedReport] =
    useState<ReportType>("loanSummary");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const loanSummaryData = [
    { month: "January", newLoans: 12, totalAmount: 45000, avgInterest: 8.5 },
    { month: "February", newLoans: 15, totalAmount: 52000, avgInterest: 8.2 },
    { month: "March", newLoans: 18, totalAmount: 67000, avgInterest: 7.9 },
    { month: "April", newLoans: 14, totalAmount: 55000, avgInterest: 8.1 },
    { month: "May", newLoans: 16, totalAmount: 61000, avgInterest: 8.0 },
  ];

  const clientSummaryData = [
    {
      id: 1,
      name: "John Doe",
      totalLoans: 3,
      activeLoans: 2,
      totalBorrowed: 15000,
      paymentStatus: "Good",
    },
    {
      id: 2,
      name: "Jane Smith",
      totalLoans: 1,
      activeLoans: 1,
      totalBorrowed: 10000,
      paymentStatus: "Good",
    },
    {
      id: 3,
      name: "Michael Johnson",
      totalLoans: 2,
      activeLoans: 1,
      totalBorrowed: 7500,
      paymentStatus: "Warning",
    },
    {
      id: 4,
      name: "Sarah Williams",
      totalLoans: 1,
      activeLoans: 1,
      totalBorrowed: 5000,
      paymentStatus: "Good",
    },
    {
      id: 5,
      name: "Robert Brown",
      totalLoans: 2,
      activeLoans: 0,
      totalBorrowed: 8000,
      paymentStatus: "Completed",
    },
  ];

  const paymentHistoryData = [
    {
      date: "2024-05-01",
      totalPayments: 12,
      totalAmount: 4850,
      onTimePayments: 10,
      latePayments: 2,
    },
    {
      date: "2024-05-02",
      totalPayments: 8,
      totalAmount: 3200,
      onTimePayments: 8,
      latePayments: 0,
    },
    {
      date: "2024-05-03",
      totalPayments: 5,
      totalAmount: 2100,
      onTimePayments: 4,
      latePayments: 1,
    },
    {
      date: "2024-05-04",
      totalPayments: 10,
      totalAmount: 4050,
      onTimePayments: 9,
      latePayments: 1,
    },
    {
      date: "2024-05-05",
      totalPayments: 15,
      totalAmount: 6200,
      onTimePayments: 14,
      latePayments: 1,
    },
  ];

  const overdueLoansData = [
    {
      id: 3,
      clientName: "Michael Johnson",
      daysOverdue: 15,
      amountDue: 750,
      totalBalance: 1500,
      contactInfo: "(555) 456-7890",
    },
    {
      id: 7,
      clientName: "Emily Davis",
      daysOverdue: 30,
      amountDue: 1200,
      totalBalance: 4800,
      contactInfo: "(555) 222-3333",
    },
    {
      id: 12,
      clientName: "David Wilson",
      daysOverdue: 10,
      amountDue: 450,
      totalBalance: 3750,
      contactInfo: "(555) 777-8888",
    },
    {
      id: 15,
      clientName: "Jennifer Garcia",
      daysOverdue: 5,
      amountDue: 650,
      totalBalance: 5850,
      contactInfo: "(555) 111-9999",
    },
  ];

  // Calculate summary stats
  const totalLoans = loanSummaryData.reduce(
    (sum, item) => sum + item.newLoans,
    0
  );
  const totalAmount = loanSummaryData.reduce(
    (sum, item) => sum + item.totalAmount,
    0
  );
  const avgInterest = (
    loanSummaryData.reduce((sum, item) => sum + item.avgInterest, 0) /
    loanSummaryData.length
  ).toFixed(2);
  const overdueCount = overdueLoansData.length;

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReport(e.target.value as ReportType);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const handleExport = () => {
    setIsGenerating(true);
    // Simulate export process
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Good":
        return (
          <Badge
            variant="success"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Good
          </Badge>
        );
      case "Warning":
        return (
          <Badge
            variant="warning"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Warning
          </Badge>
        );
      case "Completed":
        return (
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Completed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderReportContent = () => {
    const reportConfigs = {
      loanSummary: {
        title: "Loan Summary Report",
        description:
          "Monthly summary of new loans, total amount disbursed, and average interest rates.",
        icon: <FiBarChart className="h-5 w-5" />,
        color: "text-blue-600 dark:text-blue-400",
        data: loanSummaryData,
        columns: [
          "Month",
          "New Loans",
          "Total Amount",
          "Average Interest Rate",
        ],
        renderRow: (item: any, index: number) => (
          <TableRow
            key={index}
            className="hover:bg-muted/40 transition-all duration-300"
          >
            <TableCell className="font-medium">{item.month}</TableCell>
            <TableCell>{item.newLoans}</TableCell>
            <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
            <TableCell>{item.avgInterest}%</TableCell>
          </TableRow>
        ),
      },
      clientSummary: {
        title: "Client Summary Report",
        description:
          "Summary of clients' borrowing history and current loan status.",
        icon: <FiUsers className="h-5 w-5" />,
        color: "text-green-600 dark:text-green-400",
        data: clientSummaryData,
        columns: [
          "Client ID",
          "Name",
          "Total Loans",
          "Active Loans",
          "Total Borrowed",
          "Payment Status",
        ],
        renderRow: (client: any) => (
          <TableRow
            key={client.id}
            className="hover:bg-muted/40 transition-all duration-300"
          >
            <TableCell className="font-medium">#{client.id}</TableCell>
            <TableCell>{client.name}</TableCell>
            <TableCell>{client.totalLoans}</TableCell>
            <TableCell>{client.activeLoans}</TableCell>
            <TableCell>{formatCurrency(client.totalBorrowed)}</TableCell>
            <TableCell>{getStatusBadge(client.paymentStatus)}</TableCell>
          </TableRow>
        ),
      },
      paymentHistory: {
        title: "Payment History Report",
        description:
          "Daily record of payments received, including on-time and late payments.",
        icon: <FiDollarSign className="h-5 w-5" />,
        color: "text-purple-600 dark:text-purple-400",
        data: paymentHistoryData,
        columns: [
          "Date",
          "Total Payments",
          "Total Amount",
          "On-Time Payments",
          "Late Payments",
        ],
        renderRow: (item: any, index: number) => (
          <TableRow
            key={index}
            className="hover:bg-muted/40 transition-all duration-300"
          >
            <TableCell className="font-medium">{item.date}</TableCell>
            <TableCell>{item.totalPayments}</TableCell>
            <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
            <TableCell>{item.onTimePayments}</TableCell>
            <TableCell>{item.latePayments}</TableCell>
          </TableRow>
        ),
      },
      overdueLoans: {
        title: "Overdue Loans Report",
        description:
          "List of loans with overdue payments that require follow-up.",
        icon: <FiAlertTriangle className="h-5 w-5" />,
        color: "text-red-600 dark:text-red-400",
        data: overdueLoansData,
        columns: [
          "Loan ID",
          "Client Name",
          "Days Overdue",
          "Amount Due",
          "Total Balance",
          "Contact Info",
          "Actions",
        ],
        renderRow: (loan: any) => (
          <TableRow
            key={loan.id}
            className="hover:bg-muted/40 transition-all duration-300"
          >
            <TableCell className="font-medium">#{loan.id}</TableCell>
            <TableCell>{loan.clientName}</TableCell>
            <TableCell>
              <Badge variant="danger" className="text-xs">
                {loan.daysOverdue} days
              </Badge>
            </TableCell>
            <TableCell>{formatCurrency(loan.amountDue)}</TableCell>
            <TableCell>{formatCurrency(loan.totalBalance)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <FiPhone className="w-3 h-3" />
                <span className="text-xs">{loan.contactInfo}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <FiPhone className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <FiMail className="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ),
      },
    };

    const config = reportConfigs[selectedReport];

    return (
      <Card className="hover-lift animate-fade-in-right border-border/50 bg-gradient-to-br from-background via-background to-muted/5 overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className={`${config.color}`}>{config.icon}</div>
              {config.title}
            </CardTitle>
            <Button
              onClick={handleExport}
              disabled={isGenerating}
              className="hover-lift"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FiDownload className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">{config.description}</p>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-muted/30">
              {config.columns.map((column) => (
                <TableHead key={column} className="font-semibold">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.data.map((item: any, index: number) =>
              config.renderRow(item, index)
            )}
          </TableBody>
        </Table>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 animate-slide-down">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <FiBarChart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Reports & Analytics
                </h1>
                <p className="text-muted-foreground text-lg">
                  Generate comprehensive reports and insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Controls */}
      <Card className="hover-lift animate-scale-in border-border/50 bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <FiFilter className="w-5 h-5 text-primary" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Report Type
              </label>
              <select
                value={selectedReport}
                onChange={handleReportChange}
                className="w-full px-3 py-2 border border-border/50 bg-background rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              >
                <option value="loanSummary">Loan Summary</option>
                <option value="clientSummary">Client Summary</option>
                <option value="paymentHistory">Payment History</option>
                <option value="overdueLoans">Overdue Loans</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                From Date
              </label>
              <Input
                type="date"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
                className="border-border/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <Input
                type="date"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                className="border-border/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {renderReportContent()}
    </div>
  );
};

export default Reports;
