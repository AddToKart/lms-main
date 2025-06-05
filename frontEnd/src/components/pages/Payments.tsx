import React, { useState, useEffect } from "react";
import type {
  Payment,
  PaymentFilters,
  PaymentFormData,
  PaymentStats,
  PaymentMutationResponseData,
} from "../../types/payment";
import type { ApiResponse, PaginatedResponse } from "../../types/common";
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats,
} from "../../services/paymentService";
import PaymentForm from "../forms/PaymentForm";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiFilter,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertCircle, // Added FiAlertCircle here
  FiDownload,
  FiList,
  FiTrendingUp,
  FiAlertTriangle, // Added FiAlertTriangle for error display
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Stats Card Component (adapted from previous advanced version or Loans.tsx style)
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  variant?: "default" | "success" | "warning" | "danger";
  isLoading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  variant = "default",
  isLoading = false,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
          cardBg:
            "bg-gradient-to-br from-green-50/70 to-emerald-50/70 dark:from-green-900/30 dark:to-emerald-900/30",
          text: "text-green-700 dark:text-green-300",
          border: "border-green-200/50 dark:border-green-800/50",
        };
      case "warning":
        return {
          iconBg: "bg-gradient-to-br from-yellow-500 to-orange-600",
          cardBg:
            "bg-gradient-to-br from-yellow-50/70 to-orange-50/70 dark:from-yellow-900/30 dark:to-orange-900/30",
          text: "text-yellow-700 dark:text-yellow-300",
          border: "border-yellow-200/50 dark:border-yellow-800/50",
        };
      case "danger":
        return {
          iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
          cardBg:
            "bg-gradient-to-br from-red-50/70 to-rose-50/70 dark:from-red-900/30 dark:to-rose-900/30",
          text: "text-red-700 dark:text-red-300",
          border: "border-red-200/50 dark:border-red-800/50",
        };
      default: // default and info
        return {
          iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
          cardBg:
            "bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-900/30 dark:to-indigo-900/30",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-200/50 dark:border-blue-800/50",
        };
    }
  };

  const styles = getVariantStyles();

  if (isLoading) {
    return (
      <Card
        className={`animate-pulse border-2 ${styles.border} ${styles.cardBg} group`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          <div className={`p-3 rounded-xl ${styles.iconBg} opacity-50`}>
            <div className="w-5 h-5"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted-foreground/30 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-muted-foreground/10 rounded w-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 border-2 ${styles.border} ${styles.cardBg} hover-lift group`}
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
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const Payments: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<PaymentFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
    payment_method: "",
    loan_id: undefined,
    date_from: "",
    date_to: "",
  });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<
    (Partial<PaymentFormData> & { id?: number }) | null
  >(null);
  const [formError, setFormError] = useState<string | null>(null); // For form-specific errors

  // Fetch Payments using useQuery
  const paymentsQuery = useQuery<
    ApiResponse<PaginatedResponse<Payment>>,
    Error
  >({
    queryKey: ["payments", filters],
    queryFn: () => getPayments(filters),
    placeholderData: (previousData) => previousData,
  });

  const paymentsData = paymentsQuery.data;
  const paymentsLoading = paymentsQuery.isLoading;
  const paymentsIsError = paymentsQuery.isError;

  const payments: Payment[] = paymentsData?.data.payments || [];
  const totalPaymentsCount: number = paymentsData?.data.pagination.total || 0;
  const totalPages: number = paymentsData?.data.pagination.totalPages || 0;

  // Fetch Payment Stats using useQuery
  const {
    data: paymentStatsData,
    isLoading: paymentStatsLoading,
    // isError: paymentStatsIsError, // Can be used if specific error handling for stats is needed
    // error: paymentStatsErrorData, // Can be used if specific error handling for stats is needed
  } = useQuery({
    queryKey: ["paymentStats"],
    queryFn: getPaymentStats,
  });

  const paymentStats: PaymentStats | null = paymentStatsData?.data || null;

  // Debounce for search input
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDebouncedSearch(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormError(null);
    setShowPaymentForm(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment({ ...payment });
    setFormError(null);
    setShowPaymentForm(true);
  };

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: (response: ApiResponse<PaymentMutationResponseData>) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
      
      const responseData = response.data; // Access the actual data payload
      // Backend createPayment returns: { message, paymentId, loan_id, client_id, ... }
      if (responseData && responseData.client_id && responseData.loan_id && responseData.paymentId) {
        const event = new CustomEvent("paymentMade", {
          detail: { 
            clientId: responseData.client_id, 
            loanId: responseData.loan_id, 
            paymentId: responseData.paymentId 
          },
        });
        window.dispatchEvent(event);
        console.log("Dispatched paymentMade event after create for client:", responseData.client_id, "loan:", responseData.loan_id, "payment:", responseData.paymentId);
      } else {
        console.warn("paymentMade event not dispatched after create: client_id, loan_id or paymentId missing in response data", responseData);
      }

      setShowPaymentForm(false);
      setEditingPayment(null);
    },
    onError: (error: any) => {
      console.error("Error creating payment:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create payment."
      );
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) => {
      if (!editingPayment?.id)
        throw new Error("Payment ID is missing for update.");
      return updatePayment(editingPayment.id, data);
    },
    onSuccess: (response: ApiResponse<PaymentMutationResponseData>) => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });

      const responseData = response.data; // Access the actual data payload
      // The 'responseData' here is from the updatePayment backend endpoint.
      // It should contain payment_id (or paymentId), loan_id, and client_id.
      // The PaymentMutationResponseData interface has both paymentId and payment_id to handle potential inconsistencies.
      const paymentIdentifier = responseData?.paymentId || responseData?.payment_id;
      if (responseData && responseData.client_id && responseData.loan_id && paymentIdentifier) {
        const event = new CustomEvent("paymentMade", {
          detail: { 
            clientId: responseData.client_id, 
            loanId: responseData.loan_id, 
            paymentId: paymentIdentifier 
          },
        });
        window.dispatchEvent(event);
        console.log("Dispatched paymentMade event after update for client:", responseData.client_id, "loan:", responseData.loan_id, "payment:", paymentIdentifier);
      } else {
        console.warn("paymentMade event not dispatched after update: client_id, loan_id, or payment_id missing in response data", responseData);
      }

      setShowPaymentForm(false);
      setEditingPayment(null);
    },
    onError: (error: any) => {
      console.error("Error updating payment:", error);
      setFormError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update payment."
      );
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
    onError: (error: any) => {
      console.error("Error deleting payment:", error);
      // Display a more general error for deletion, or use a toast notification system
      alert(
        `Failed to delete payment: ${
          error.response?.data?.message || error.message
        }`
      );
    },
  });

  const handlePaymentSubmit = async (data: PaymentFormData) => {
    setFormError(null); // Clear previous form errors
    if (editingPayment && editingPayment.id) {
      updatePaymentMutation.mutate(data);
    } else {
      createPaymentMutation.mutate(data);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this payment?")) {
      deletePaymentMutation.mutate(id);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0, // Changed from 2 to 0 for whole numbers
      maximumFractionDigits: 0, // Changed from 2 to 0 for whole numbers
    }).format(amount);
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return (
          <Badge
            variant="success"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
          >
            <FiCheckCircle className="inline-block w-3 h-3 mr-1.5" /> Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="warning"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
          >
            <FiClock className="inline-block w-3 h-3 mr-1.5" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="danger"
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md"
          >
            <FiAlertCircle className="inline-block w-3 h-3 mr-1.5" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const handleCloseForm = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleCloseForm();
  };

  const isLoading =
    paymentsLoading ||
    createPaymentMutation.isPending ||
    updatePaymentMutation.isPending;
  const isSubmitting =
    createPaymentMutation.isPending || updatePaymentMutation.isPending;

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 animate-slide-down">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <FiDollarSign className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Payment Management
                </h1>
                <p className="text-muted-foreground text-lg">
                  Track and manage all loan payments efficiently
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="hover-lift border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <FiDownload className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button
              onClick={handleAddPayment}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 hover-lift pulse-glow"
            >
              <FiPlus className="mr-2 h-5 w-5" /> Record Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 animate-slide-up">
        <StatsCard
          title="Total Payments"
          value={formatNumber(paymentStats?.total_payments)}
          icon={<FiList className="h-5 w-5" />}
          variant="default"
          isLoading={paymentStatsLoading}
        />
        <StatsCard
          title="Total Collected"
          value={formatCurrency(paymentStats?.total_amount)}
          icon={<FiDollarSign className="h-5 w-5" />}
          variant="success"
          isLoading={paymentStatsLoading}
        />
        <StatsCard
          title="Avg. Payment"
          value={formatCurrency(paymentStats?.average_payment)}
          icon={<FiTrendingUp className="h-5 w-5" />}
          variant="default"
          isLoading={paymentStatsLoading}
        />
        <StatsCard
          title="Completed"
          value={formatNumber(paymentStats?.completed_payments)}
          icon={<FiCheckCircle className="h-5 w-5" />}
          variant="success"
          isLoading={paymentStatsLoading}
        />
        <StatsCard
          title="Pending"
          value={formatNumber(paymentStats?.pending_payments)}
          icon={<FiClock className="h-5 w-5" />}
          variant="warning"
          isLoading={paymentStatsLoading}
        />
        <StatsCard
          title="Failed"
          value={formatNumber(paymentStats?.failed_payments)}
          icon={<FiAlertCircle className="h-5 w-5" />}
          variant="danger"
          isLoading={paymentStatsLoading}
        />
      </div>

      {/* Search and Filters */}
      <Card className="hover-lift animate-scale-in border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Search & Filters</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <Input
                placeholder="Search payments by client, loan ID, ref no..."
                value={debouncedSearch}
                onChange={handleSearchChange}
                className="pl-12 h-12 text-base border-border/50 focus:border-primary/50 bg-background"
              />
            </div>
            <div className="relative min-w-[220px]">
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="w-full pl-4 pr-4 h-12 text-base border border-border/50 bg-background rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {paymentsIsError && (
        <Card className="border-destructive bg-destructive/5 animate-bounce-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-destructive font-medium mb-1">
                  Error Fetching Payments
                </p>
                <p className="text-destructive/80 text-sm leading-relaxed">
                  {(paymentsQuery.error as any)?.message ||
                    "An unknown error occurred."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  queryClient.refetchQueries({
                    queryKey: ["payments", filters],
                  })
                }
                className="hover:bg-destructive/10 -mt-1 -mr-1"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Area */}
      {paymentsLoading && !paymentsData ? ( // Show full page loader only on initial load
        <Card className="animate-scale-in border-border/50">
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary absolute top-0 left-0"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Loading payments...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : payments.length === 0 && !paymentsIsError ? (
        <Card className="animate-fade-in-left border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="p-16">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-bounce-in">
                  <FiDollarSign className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">No Payments Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {filters.search || filters.status
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by recording your first payment."}
                </p>
              </div>
              <Button
                onClick={handleAddPayment}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
              >
                <FiPlus className="mr-2 h-5 w-5" /> Record First Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-lift animate-fade-in-right border-border/50 bg-gradient-to-br from-background via-background to-muted/5 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <FiDollarSign className="w-5 h-5 text-primary" /> Payment Records
              <Badge variant="secondary" className="ml-2">
                {totalPaymentsCount} total
              </Badge>
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/30">
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Payment ID
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Client
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Loan ID
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Amount
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Method
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="px-6 py-4 text-left align-middle font-semibold text-muted-foreground">
                  Processed By
                </TableHead>
                <TableHead className="px-6 py-4 text-right align-middle font-semibold text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment, index) => {
                const isCompleted =
                  payment.status?.toLowerCase() === "completed";
                return (
                  <TableRow
                    key={payment.id}
                    className="hover:bg-muted/40 transition-all duration-300 border-border/30 group"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <TableCell className="px-6 py-4 align-middle font-medium">
                      #{payment.id}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/70 to-primary/50 flex items-center justify-center text-primary-foreground text-xs font-semibold shadow-md">
                          {payment.client_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "N/A"}
                        </div>
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {payment.client_name || "N/A"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.client_email || ""}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      <Badge variant="outline" className="font-mono">
                        LOAN-{payment.loan_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      {formatDate(payment.payment_date)}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      <Badge variant="secondary">
                        {payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      {getStatusBadge(payment.status || "completed")}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle text-sm text-muted-foreground">
                      {payment.processed_by_name || "System"}
                    </TableCell>
                    <TableCell className="px-6 py-4 align-middle">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPayment(payment)}
                          disabled={
                            deletePaymentMutation.isPending || isCompleted
                          }
                          className={`h-9 w-9 transition-all duration-200 ${
                            isCompleted
                              ? "opacity-50 cursor-not-allowed text-muted-foreground"
                              : "hover:bg-primary/10 hover:text-primary hover-lift"
                          }`}
                          title={
                            isCompleted
                              ? "Completed payments cannot be edited"
                              : "Edit Payment"
                          }
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePayment(payment.id)}
                          disabled={
                            deletePaymentMutation.isPending ||
                            createPaymentMutation.isPending ||
                            updatePaymentMutation.isPending
                          }
                          className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive hover-lift transition-all duration-200"
                          title="Delete Payment"
                        >
                          {deletePaymentMutation.isPending &&
                          deletePaymentMutation.variables === payment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive"></div>
                          ) : (
                            <FiTrash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && !paymentsLoading && payments.length > 0 && (
        <div className="flex items-center justify-between px-2 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-transparent animate-fade-in">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            Showing{" "}
            <span className="font-semibold text-foreground">
              {payments.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">
              {totalPaymentsCount}
            </span>{" "}
            payments
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, filters.page! - 1))}
              disabled={filters.page === 1}
              className="hover-lift border-border/50 hover:border-primary/50"
            >
              Previous
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              Page {filters.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(Math.min(totalPages, filters.page! + 1))
              }
              disabled={filters.page === totalPages}
              className="hover-lift border-border/50 hover:border-primary/50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal (styling from previous step is maintained) */}
      {showPaymentForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={handleBackdropClick}
        >
          <Card
            className="relative w-full max-w-2xl bg-background text-foreground shadow-2xl rounded-xl max-h-[90vh] flex flex-col border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b border-border p-5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-semibold flex items-center gap-2 text-foreground">
                  <FiDollarSign className="h-5 w-5 text-primary" />
                  {editingPayment?.id ? "Edit Payment" : "Record New Payment"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseForm}
                  className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto thin-scrollbar flex-grow">
              {formError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <PaymentForm
                initialData={editingPayment || {}}
                onSubmit={handlePaymentSubmit}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payments;
