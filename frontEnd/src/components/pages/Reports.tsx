import React, { useState, useEffect } from "react";
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
  FiRefreshCw,
  FiCreditCard, // Add this import
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiResponse } from "../../services/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLoanSummaryReport,
  getClientSummaryReport,
  getPaymentHistoryReport,
  getOverdueLoansReport,
  getDashboardAnalytics,
  exportReport,
  LoanSummaryData,
  ClientSummaryData,
  PaymentHistoryData,
  OverdueLoanData,
  DashboardAnalytics,
} from "../../services/reportService";

interface JsonExportApiResponse extends ApiResponse<any> {
  meta?: {
    filename?: string;
  };
}

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
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [loanSummaryData, setLoanSummaryData] = useState<LoanSummaryData[]>([]);
  const [clientSummaryData, setClientSummaryData] = useState<
    ClientSummaryData[]
  >([]);
  const [paymentHistoryData, setPaymentHistoryData] = useState<
    PaymentHistoryData[]
  >([]);
  const [overdueLoansData, setOverdueLoansData] = useState<OverdueLoanData[]>(
    []
  );
  const [dashboardAnalytics, setDashboardAnalytics] =
    useState<DashboardAnalytics | null>(null);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Reload data when date range changes
  useEffect(() => {
    if (
      selectedReport === "loanSummary" ||
      selectedReport === "paymentHistory"
    ) {
      loadReportData();
    }
  }, [dateRange, selectedReport]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadDashboardAnalytics(), loadReportData()]);
    } catch (error) {
      console.error("Error loading reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardAnalytics = async () => {
    try {
      const response = await getDashboardAnalytics();
      if (response.success) {
        setDashboardAnalytics(response.data);
      }
    } catch (error) {
      console.error("Error loading dashboard analytics:", error);
    }
  };

  const loadReportData = async () => {
    try {
      switch (selectedReport) {
        case "loanSummary":
          const loanResponse = await getLoanSummaryReport(
            dateRange.from,
            dateRange.to
          );
          if (loanResponse.success) {
            setLoanSummaryData(loanResponse.data);
          }
          break;
        case "clientSummary":
          const clientResponse = await getClientSummaryReport();
          if (clientResponse.success) {
            setClientSummaryData(clientResponse.data);
          }
          break;
        case "paymentHistory":
          const paymentResponse = await getPaymentHistoryReport(
            dateRange.from,
            dateRange.to
          );
          if (paymentResponse.success) {
            setPaymentHistoryData(paymentResponse.data);
          }
          break;
        case "overdueLoans":
          const overdueResponse = await getOverdueLoansReport();
          if (overdueResponse.success) {
            setOverdueLoansData(overdueResponse.data);
          }
          break;
      }
    } catch (error) {
      console.error("Error loading report data:", error);
    }
  };

  const handleReportChange = (value: ReportType) => {
    setSelectedReport(value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  };

  const handleExport = async (exportFormat: "json" | "excel" = "excel") => {
    setIsGenerating(true);
    try {
      const reportTypeMap = {
        loanSummary: "loan_summary" as const,
        clientSummary: "client_summary" as const,
        paymentHistory: "payment_history" as const,
        overdueLoans: "overdue_loans" as const,
      };

      const response = await exportReport(reportTypeMap[selectedReport], exportFormat);

      if (response instanceof Response) {
        // Handle raw Response (expected for Excel)
        if (response.ok) {
          console.log('Excel export initiated, browser should handle download.');
          // The browser will handle the download based on Content-Disposition
        } else {
          const errorText = await response.text();
          console.error("Error exporting report (Excel file response):", response.status, errorText);
          // TODO: Show error to user via toast or alert
        }
      } else {
        // Handle ApiResponse (expected for JSON or errors)
        const jsonResponse = response as JsonExportApiResponse;
        if (jsonResponse.success) {
          // Create and download JSON file
          const dataStr = JSON.stringify(jsonResponse.data, null, 2);
          const dataBlob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${jsonResponse.meta?.filename || reportTypeMap[selectedReport] + "_report"}.json`;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          console.error(
            "Error exporting report (JSON response):",
            jsonResponse.message
          );
          // TODO: Show error to user via toast or alert
        }
      }
    } catch (error) {
      console.error("Error in handleExport function:", error);
      // TODO: Show error to user via toast or alert
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Good":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          >
            Good
          </Badge>
        );
      case "Warning":
      case "Overdue":
        return (
          <Badge
            variant="danger"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          >
            {status}
          </Badge>
        );
      case "Completed":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          >
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderReportContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <FiRefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Loading report data...</span>
          </div>
        </div>
      );
    }

    switch (selectedReport) {
      case "loanSummary":
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Loans</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Avg Interest</TableHead>
                    <TableHead className="text-right">Approved</TableHead>
                    <TableHead className="text-right">Rejected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanSummaryData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {new Date(item.month + "-01").toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                          }
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.new_loans}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.avg_interest.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.approved_count}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.rejected_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case "clientSummary":
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Total Loans</TableHead>
                    <TableHead className="text-right">Active Loans</TableHead>
                    <TableHead className="text-right">Total Borrowed</TableHead>
                    <TableHead className="text-right">
                      Current Balance
                    </TableHead>
                    <TableHead>Payment Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSummaryData.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <FiMail className="h-3 w-3" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="h-3 w-3" />
                            {client.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {client.total_loans}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.active_loans}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(client.total_borrowed)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(client.current_balance)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(client.payment_status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case "paymentHistory":
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Payments</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">On Time</TableHead>
                    <TableHead className="text-right">Late</TableHead>
                    <TableHead className="text-right">Avg Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistoryData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.total_payments}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total_amount)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {item.on_time_payments}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {item.late_payments}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.avg_payment_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      case "overdueLoans":
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead className="text-right">Days Overdue</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Total Balance</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueLoansData.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        {loan.client_name}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <FiPhone className="h-3 w-3" />
                            {loan.phone}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <FiMail className="h-3 w-3" />
                            {loan.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-semibold ${
                            loan.days_overdue > 30
                              ? "text-red-600"
                              : loan.days_overdue > 7
                              ? "text-yellow-600"
                              : "text-orange-600"
                          }`}
                        >
                          {loan.days_overdue} days
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(loan.amount_due)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(loan.loan_amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(loan.overdue_severity)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <FiPhone className="h-3 w-3 mr-1" />
                            Call
                          </Button>
                          <Button variant="outline" size="sm">
                            <FiMail className="h-3 w-3 mr-1" />
                            Email
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 animate-slide-down">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl">
              <FiBarChart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Reports & Analytics
              </h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your loan management system
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadAllData}
              disabled={isLoading}
              className="hover-lift"
            >
              <FiRefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-primary/90 hover-lift"
            >
              <FiDownload className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Export"}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards Grid */}
      {dashboardAnalytics && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <StatsCard
            title="Active Loans"
            value={dashboardAnalytics.overall_stats.total_active_loans}
            icon={<FiCreditCard className="h-5 w-5" />}
            variant="default"
            subtitle="Current portfolio"
          />
          <StatsCard
            title="Total Outstanding"
            value={formatCurrency(
              dashboardAnalytics.overall_stats.total_outstanding
            )}
            icon={<FiDollarSign className="h-5 w-5" />}
            variant="success"
            subtitle="Amount to collect"
          />
          <StatsCard
            title="Active Clients"
            value={dashboardAnalytics.overall_stats.total_active_clients}
            icon={<FiUsers className="h-5 w-5" />}
            variant="default"
            subtitle="Borrowers with loans"
          />
          <StatsCard
            title="Monthly Collections"
            value={formatCurrency(
              dashboardAnalytics.overall_stats.monthly_collections
            )}
            icon={<FiTrendingUp className="h-5 w-5" />}
            variant="success"
            subtitle="Last 30 days"
          />
        </div>
      )}

      {/* Enhanced Search and Filters */}
      <Card className="hover-lift animate-scale-in border-border/50 bg-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FiFilter className="h-5 w-5" />
                Report Filters
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Customize your report parameters
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Report Type
              </label>
              <Select value={selectedReport} onValueChange={handleReportChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loanSummary">Loan Summary</SelectItem>
                  <SelectItem value="clientSummary">Client Summary</SelectItem>
                  <SelectItem value="paymentHistory">
                    Payment History
                  </SelectItem>
                  <SelectItem value="overdueLoans">Overdue Loans</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                name="from"
                value={dateRange.from}
                onChange={handleDateChange}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                name="to"
                value={dateRange.to}
                onChange={handleDateChange}
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={loadReportData}
                className="w-full"
                disabled={isLoading}
              >
                <FiEye className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      <Card className="hover-lift animate-fade-in border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiBarChart className="h-5 w-5" />
            {selectedReport.charAt(0).toUpperCase() +
              selectedReport.slice(1).replace(/([A-Z])/g, " $1")}
            Report
          </CardTitle>
        </CardHeader>
        <CardContent>{renderReportContent()}</CardContent>
      </Card>
    </div>
  );
};

export default Reports;
