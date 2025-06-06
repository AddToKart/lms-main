import React, { useState, useEffect, useCallback } from "react";
import {
  FiBarChart,
  FiDollarSign,
  FiAlertTriangle,
  FiDownload,
  FiCalendar,
  FiTrendingUp,
  FiFilter,
  FiRefreshCw,
  FiCreditCard,
} from "react-icons/fi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  getPaymentHistoryReport,
  getOverdueLoansReport,
  getLoanAnalytics,
  exportReport,
  LoanSummaryData,
  PaymentHistoryData,
  OverdueLoanData,
  LoanAnalytics,
} from "../../services/reportService";
import { ApiResponse } from "../../services/api";

type ReportType = "loanSummary" | "paymentHistory" | "overdueLoans";

// Helper functions
const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === null || amount === undefined || String(amount).trim() === "")
    return "$0.00";
  const num = parseFloat(String(amount));
  if (isNaN(num)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
};

const formatDate = (dateString: string | Date | undefined) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (e) {
    return "Invalid Date";
  }
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

  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [loanSummaryData, setLoanSummaryData] = useState<LoanSummaryData[]>([]);
  const [paymentHistoryData, setPaymentHistoryData] = useState<
    PaymentHistoryData[]
  >([]);
  const [overdueLoansData, setOverdueLoansData] = useState<OverdueLoanData[]>(
    []
  );
  const [loanAnalytics, setLoanAnalytics] = useState<LoanAnalytics | null>(
    null
  );

  // Simple toast function
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      const toast = document.createElement("div");
      toast.className = `fixed top-4 right-4 z-[1000] px-4 py-2 rounded-md shadow-lg text-white font-medium ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      }`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    },
    []
  );

  const loadReportData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      try {
        console.log(`Loading ${selectedReport} data...`);

        let response: ApiResponse<any>;
        switch (selectedReport) {
          case "loanSummary":
            response = await getLoanSummaryReport(
              dateRange.from,
              dateRange.to,
              signal
            );
            if (response.success) {
              setLoanSummaryData(
                Array.isArray(response.data) ? response.data : []
              );
              console.log("Loan summary data loaded:", response.data);
            } else {
              console.error("Loan summary failed:", response.message);
              showToast(
                response.message || "Failed to load loan summary.",
                "error"
              );
            }
            break;

          case "paymentHistory":
            response = await getPaymentHistoryReport(
              dateRange.from,
              dateRange.to,
              signal
            );
            if (response.success) {
              setPaymentHistoryData(
                Array.isArray(response.data) ? response.data : []
              );
              console.log("Payment history data loaded:", response.data);
            } else {
              console.error("Payment history failed:", response.message);
              showToast(
                response.message || "Failed to load payment history.",
                "error"
              );
            }
            break;

          case "overdueLoans":
            response = await getOverdueLoansReport(signal);
            if (response.success) {
              setOverdueLoansData(
                Array.isArray(response.data) ? response.data : []
              );
              console.log("Overdue loans data loaded:", response.data);
            } else {
              console.error("Overdue loans failed:", response.message);
              showToast(
                response.message || "Failed to load overdue loans.",
                "error"
              );
            }
            break;
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log(
            `Request for '${selectedReport}' report data was cancelled`
          );
        } else {
          console.error("Error loading report data:", error);
          showToast(error.message || "Failed to load report data.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedReport, dateRange.from, dateRange.to, showToast]
  );

  const loadLoanAnalytics = useCallback(
    async (signal?: AbortSignal) => {
      try {
        console.log("Loading loan analytics...");
        const response = await getLoanAnalytics(
          dateRange.from,
          dateRange.to,
          signal
        );
        if (response.success) {
          setLoanAnalytics(response.data);
          console.log("Loan analytics loaded:", response.data);
        } else {
          console.error("Loan analytics failed:", response.message);
          showToast(
            response.message || "Failed to load loan analytics.",
            "error"
          );
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Loan analytics request was cancelled");
        } else {
          console.error("Error loading loan analytics:", error);
          showToast(error.message || "Failed to load loan analytics.", "error");
        }
      }
    },
    [dateRange.from, dateRange.to, showToast]
  );

  // Load report data when dependencies change
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      loadReportData(controller.signal);
    }, 300); // Debounce API calls

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedReport, dateRange.from, dateRange.to]);

  // Load analytics separately with debouncing
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      loadLoanAnalytics(controller.signal);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [dateRange.from, dateRange.to]);

  const handleExport = async (format: "excel" | "json" | "csv") => {
    if (!selectedReport) return;
    setIsExporting(true);
    try {
      await exportReport(selectedReport, format, dateRange.from, dateRange.to);
      showToast("Report exported successfully!", "success");
    } catch (error: any) {
      console.error("Export error:", error);
      showToast(error.message || "An error occurred during export.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Handle input changes without excessive re-renders
  const handleReportTypeChange = (value: ReportType) => {
    setSelectedReport(value);
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
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
        return loanSummaryData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No loan summary data available for the selected date range.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">New Loans</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Avg Interest</TableHead>
                <TableHead className="text-right">Approved</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Principal Repaid</TableHead>
                <TableHead className="text-right">Interest Repaid</TableHead>
                <TableHead className="text-right">Fully Paid</TableHead>
                <TableHead className="text-right">Avg Term (M)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loanSummaryData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {/* Ensure item.month is in 'YYYY-MM' format */}
                    {new Date(item.month + "-02").toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </TableCell>
                  <TableCell className="text-right">{item.new_loans}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {parseFloat(String(item.avg_interest)).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {item.approved_count}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    {item.rejected_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_principal_repaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_interest_repaid)}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.fully_paid_loans_count}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.avg_loan_term_months
                      ? parseFloat(String(item.avg_loan_term_months)).toFixed(1)
                      : "0.0"}{" "}
                    M
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      case "paymentHistory":
        return paymentHistoryData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment history data available for the selected date range.
          </div>
        ) : (
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
        );
      case "overdueLoans":
        return overdueLoansData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No overdue loans found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Days Overdue</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Loan Amount</TableHead>
                <TableHead>Severity</TableHead>
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
                      <div className="text-sm">{loan.phone}</div>
                      <div className="text-sm">{loan.email}</div>
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
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        loan.overdue_severity === "Severe"
                          ? "bg-red-100 text-red-800"
                          : loan.overdue_severity === "Moderate"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {loan.overdue_severity}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      default:
        return (
          <div className="text-center py-8">Please select a report type.</div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold text-foreground">
          Reports Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // Manual refresh without cancelling ongoing requests
              const controller = new AbortController();
              loadLoanAnalytics(controller.signal);
              loadReportData(controller.signal);
            }}
            disabled={isLoading}
          >
            <FiRefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
          <Button
            onClick={() => handleExport("excel")}
            disabled={isExporting || isLoading}
          >
            {isExporting ? (
              <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FiDownload className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={isExporting || isLoading}
          >
            {isExporting ? (
              <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FiDownload className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </header>

      {/* Analytics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
            <FiDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loanAnalytics?.total_outstanding || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total outstanding balance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <FiCreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loanAnalytics?.total_active_loans || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active loans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Collections
            </CardTitle>
            <FiTrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loanAnalytics?.monthly_collections || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month's collections
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Loan</CardTitle>
            <FiAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(loanAnalytics?.average_loan_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Average loan amount</p>
          </CardContent>
        </Card>
      </section>

      {/* Report Filters and Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FiFilter className="mr-2 h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="reportType"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Report Type
            </label>
            <Select
              value={selectedReport}
              onValueChange={handleReportTypeChange}
            >
              <SelectTrigger id="reportType">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loanSummary">
                  <div className="flex items-center">
                    <FiBarChart className="mr-2 h-4 w-4" />
                    Loan Summary
                  </div>
                </SelectItem>
                <SelectItem value="paymentHistory">
                  <div className="flex items-center">
                    <FiDollarSign className="mr-2 h-4 w-4" />
                    Payment History
                  </div>
                </SelectItem>
                <SelectItem value="overdueLoans">
                  <div className="flex items-center">
                    <FiAlertTriangle className="mr-2 h-4 w-4" />
                    Overdue Loans
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Date From
            </label>
            <Input
              id="dateFrom"
              type="date"
              value={dateRange.from}
              onChange={(e) => handleDateChange("from", e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              Date To
            </label>
            <Input
              id="dateTo"
              type="date"
              value={dateRange.to}
              onChange={(e) => handleDateChange("to", e.target.value)}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Content Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {selectedReport === "loanSummary" && (
              <FiBarChart className="mr-2 h-5 w-5" />
            )}
            {selectedReport === "paymentHistory" && (
              <FiDollarSign className="mr-2 h-5 w-5" />
            )}
            {selectedReport === "overdueLoans" && (
              <FiAlertTriangle className="mr-2 h-5 w-5" />
            )}
            {
              {
                loanSummary: "Loan Summary Report",
                paymentHistory: "Payment History Report",
                overdueLoans: "Overdue Loans Report",
              }[selectedReport]
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {renderReportContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
