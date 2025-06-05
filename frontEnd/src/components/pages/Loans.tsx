import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiFilter,
  FiCreditCard,
  FiDollarSign,
  FiUsers,
  FiAlertTriangle,
  FiCalendar,
  FiEye,
  FiMoreVertical,
  FiTrendingUp,
  FiDownload,
  FiClock,
  FiTarget,
  FiPercent,
  FiFileText,
  FiActivity,
  FiCheck,
  FiXCircle,
  FiCheckCircle,
  FiSettings, // Add this missing import
} from "react-icons/fi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import LoanForm from "../forms/LoanForm";
import type {
  Loan,
  LoanFilters,
  LoanFormData,
  LoanStats,
} from "../../types/loan";
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  getLoanStats,
} from "../../services/loanService";

// Enhanced Modal component with glassmorphism
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      ></div>
      <Card className="relative max-w-md w-full shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl animate-scale-in">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <FiTrash2 className="w-4 h-4 text-destructive" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onCancel} className="hover-lift">
              {cancelText}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="hover-lift"
            >
              {confirmText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Form Modal
interface FormModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      <Card className="relative max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl animate-scale-in">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <FiCreditCard className="w-4 h-4 text-primary" />
              </div>
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover-lift"
            >
              <FiX className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)] thin-scrollbar">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

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

const Loans: React.FC = () => {
  // State for loans data and pagination
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalLoans, setTotalLoans] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);

  // State for filtering and pagination
  const [filters, setFilters] = useState<LoanFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  // State for loan form
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Partial<Loan> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<number | null>(null);

  // State for loan approval
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loanToApprove, setLoanToApprove] = useState<Loan | null>(null);
  const [approvalData, setApprovalData] = useState({
    approved_amount: 0,
    notes: "",
    action: "approve" as "approve" | "reject",
  });
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Fetch loans on component mount and when filters change
  useEffect(() => {
    fetchLoans();
    fetchLoanStats();
  }, [filters]);

  // Function to fetch loans from API with comprehensive null checks
  const fetchLoans = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getLoans(filters);
      console.log("Loans response:", response); // Debug log

      // Comprehensive null checks for the response
      if (response && typeof response === "object") {
        const responseData = response.data || response;

        // Handle different response structures with proper type checking
        if (responseData && typeof responseData === "object") {
          // Use type assertion or proper checking
          const loansArray =
            "loans" in responseData
              ? responseData.loans
              : "data" in responseData &&
                responseData.data &&
                "loans" in responseData.data
              ? responseData.data.loans
              : [];

          const pagination =
            "pagination" in responseData
              ? responseData.pagination
              : "data" in responseData &&
                responseData.data &&
                "pagination" in responseData.data
              ? responseData.data.pagination
              : {};

          setLoans(Array.isArray(loansArray) ? loansArray : []);
          setTotalLoans(
            pagination.total ||
              (Array.isArray(loansArray) ? loansArray.length : 0)
          );
          setTotalPages(
            pagination.totalPages ||
              Math.ceil(
                (pagination.total ||
                  (Array.isArray(loansArray) ? loansArray.length : 0)) /
                  (filters.limit || 10)
              )
          );
        } else {
          // Handle case where response.data is not an object
          setLoans([]);
          setTotalLoans(0);
          setTotalPages(0);
        }
      } else {
        // Handle case where response is not an object
        setLoans([]);
        setTotalLoans(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Error fetching loans:", err);
      setError("Failed to fetch loans. Please try again later.");
      // Set safe defaults on error
      setLoans([]);
      setTotalLoans(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch loan statistics with comprehensive null checks
  const fetchLoanStats = async () => {
    try {
      const response = await getLoanStats();
      console.log("Loan stats response:", response); // Debug log

      if (response && typeof response === "object") {
        const statsData = response.data || response;

        if (statsData && typeof statsData === "object") {
          // Use proper type checking for stats data
          const getStatValue = (key: string) => {
            if (
              "data" in statsData &&
              statsData.data &&
              typeof statsData.data === "object"
            ) {
              return Number((statsData.data as any)[key]) || 0;
            }
            return Number((statsData as any)[key]) || 0;
          };

          setLoanStats({
            total_loans: getStatValue("total_loans"),
            total_loan_amount: getStatValue("total_loan_amount"),
            active_loans: getStatValue("active_loans"),
            average_interest_rate: getStatValue("average_interest_rate"),
            completed_loans: getStatValue("completed_loans"),
            pending_loans: getStatValue("pending_loans"),
            overdue_loans: getStatValue("overdue_loans"),
          });
        } else {
          // Set default stats if statsData is not an object
          setLoanStats({
            total_loans: 0,
            total_loan_amount: 0,
            active_loans: 0,
            average_interest_rate: 0,
            completed_loans: 0,
            pending_loans: 0,
            overdue_loans: 0,
          });
        }
      } else {
        // Set default stats if response is not an object
        setLoanStats({
          total_loans: 0,
          total_loan_amount: 0,
          active_loans: 0,
          average_interest_rate: 0,
          completed_loans: 0,
          pending_loans: 0,
          overdue_loans: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching loan stats:", err);
      // Set default stats on error
      setLoanStats({
        total_loans: 0,
        total_loan_amount: 0,
        active_loans: 0,
        average_interest_rate: 0,
        completed_loans: 0,
        pending_loans: 0,
        overdue_loans: 0,
      });
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Open form for creating a new loan
  const handleAddLoan = () => {
    setEditingLoan(null);
    setShowLoanForm(true);
  };

  // Open form for editing a loan
  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  // Handle loan form submission with comprehensive error handling
  const handleLoanSubmit = async (data: LoanFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log("=== LOAN SUBMISSION START ===");
      console.log("Form data received:", data);
      console.log("Editing loan:", editingLoan);

      // Comprehensive client-side validation
      const validationErrors = [];

      if (!data.client_id || data.client_id === 0) {
        validationErrors.push("Please select a client");
      }
      if (!data.loan_amount || data.loan_amount <= 0) {
        validationErrors.push(
          "Please enter a valid loan amount greater than 0"
        );
      }
      if (data.loan_amount > 10000000) {
        validationErrors.push("Loan amount cannot exceed $10,000,000");
      }
      if (!data.interest_rate || data.interest_rate <= 0) {
        validationErrors.push(
          "Please enter a valid interest rate greater than 0"
        );
      }
      if (data.interest_rate > 100) {
        validationErrors.push("Interest rate cannot exceed 100%");
      }
      if (!data.term_months || data.term_months <= 0) {
        validationErrors.push("Please select a loan term");
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(". "));
      }

      // Prepare the submission data with proper type conversion
      const submissionData: LoanFormData = {
        client_id: Number(data.client_id),
        loan_amount: Number(data.loan_amount),
        interest_rate: Number(data.interest_rate),
        term_months: Number(data.term_months),
        purpose: data.purpose?.trim() || "",
        start_date: data.start_date || new Date().toISOString().split("T")[0],
        status: data.status || "pending",
        approved_amount: data.approved_amount
          ? Number(data.approved_amount)
          : Number(data.loan_amount),
      };

      console.log("Prepared submission data:", submissionData);

      let response;
      if (editingLoan && editingLoan.id) {
        console.log("Updating existing loan with ID:", editingLoan.id);
        response = await updateLoan(editingLoan.id, submissionData);
      } else {
        console.log("Creating new loan");
        response = await createLoan(submissionData);
      }

      console.log("Loan submission response:", response);
      console.log("=== LOAN SUBMISSION SUCCESS ===");

      // Refresh loan list and stats
      console.log("Refreshing loan data...");
      await Promise.all([fetchLoans(), fetchLoanStats()]);

      // Close the form
      setShowLoanForm(false);
      setEditingLoan(null);

      // Show success message (you can add a toast notification here)
      console.log("Loan saved successfully!");
    } catch (err: any) {
      console.error("=== LOAN SUBMISSION ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);

      // Extract meaningful error message
      let errorMessage = "Failed to save loan. Please try again.";

      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      console.error("Final error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      console.log("=== LOAN SUBMISSION END ===");
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (id: number) => {
    setLoanToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Handle loan deletion
  const handleDeleteConfirm = async () => {
    if (loanToDelete === null) return;

    try {
      await deleteLoan(loanToDelete);
      await Promise.all([fetchLoans(), fetchLoanStats()]);
    } catch (err) {
      console.error("Error deleting loan:", err);
      setError("Failed to delete loan. Please try again.");
    } finally {
      setDeleteConfirmOpen(false);
      setLoanToDelete(null);
    }
  };

  // Handle loan approval click
  const handleApprovalClick = (loan: Loan, action: "approve" | "reject") => {
    setLoanToApprove(loan);
    setApprovalData({
      approved_amount: action === "approve" ? loan.loan_amount : 0,
      notes: "",
      action,
    });
    setShowApprovalModal(true);
  };

  // Handle loan approval submission
  const handleApprovalSubmit = async () => {
    if (!loanToApprove) return;

    setIsProcessingApproval(true);
    setError(null);

    try {
      // Create proper LoanFormData object
      const submissionData: LoanFormData = {
        client_id: loanToApprove.client_id,
        loan_amount: loanToApprove.loan_amount,
        interest_rate: loanToApprove.interest_rate,
        term_months: loanToApprove.term_months,
        purpose: loanToApprove.purpose || "", // Ensure purpose is provided
        start_date:
          loanToApprove.start_date || new Date().toISOString().split("T")[0],
        status: approvalData.action === "approve" ? "active" : "rejected",
        approved_amount:
          approvalData.action === "approve" ? approvalData.approved_amount : 0,
      };

      await updateLoan(loanToApprove.id, submissionData);

      // Refresh loan list and stats
      await Promise.all([fetchLoans(), fetchLoanStats()]);

      setShowApprovalModal(false);
      setLoanToApprove(null);
    } catch (err: any) {
      console.error("Error processing loan approval:", err);
      setError(`Failed to ${approvalData.action} loan. Please try again.`);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  // Enhanced status badge without approval actions
  const getStatusBadge = (status: string | null | undefined) => {
    const safeStatus = status || "pending";
    switch (safeStatus) {
      case "active":
        return (
          <Badge
            variant="success"
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5 animate-pulse"></div>
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white/70 rounded-full mr-1.5"></div>
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="warning"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="danger"
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
          </Badge>
        );
    }
  };

  // Add the missing formatDate function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  // Add the missing formatCurrency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
                <FiCreditCard className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Loan Management
                </h1>
                <p className="text-muted-foreground text-lg">
                  Track and manage all loan applications and disbursements
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
              <FiDownload className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={handleAddLoan}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 hover-lift pulse-glow"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              New Loan Application
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards Grid */}
      {loanStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
          <div className="stagger-item">
            <StatsCard
              title="Total Loans"
              value={(loanStats.total_loans || 0).toString()}
              icon={<FiCreditCard className="h-5 w-5" />}
              variant="default"
            />
          </div>
          <div className="stagger-item">
            <StatsCard
              title="Portfolio Value"
              value={formatCurrency(loanStats.total_loan_amount || 0)}
              icon={<FiDollarSign className="h-5 w-5" />}
              variant="success"
            />
          </div>
          <div className="stagger-item">
            <StatsCard
              title="Active Loans"
              value={(loanStats.active_loans || 0).toString()}
              icon={<FiTrendingUp className="h-5 w-5" />}
              variant="warning"
            />
          </div>
          <div className="stagger-item">
            <StatsCard
              title="Avg Interest Rate"
              value={`${(loanStats.average_interest_rate || 0).toFixed(2)}%`}
              icon={<FiPercent className="h-5 w-5" />}
              variant="danger"
            />
          </div>
        </div>
      )}

      {/* Enhanced Search and Filters with Approval Filter */}
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
                placeholder="Search loans by client name, loan ID, or purpose..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-12 h-12 text-base border-border/50 focus:border-primary/50 bg-background transition-all duration-200"
              />
            </div>
            <div className="relative min-w-[220px]">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="w-full pl-12 pr-4 h-12 text-base border border-border/50 bg-background rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
              >
                <option value="">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant={filters.status === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: filters.status === "pending" ? "" : "pending",
                }))
              }
              className="hover-lift"
            >
              <FiClock className="w-3 h-3 mr-1" />
              Pending ({loanStats?.pending_loans || 0})
            </Button>
            <Button
              variant={filters.status === "active" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: filters.status === "active" ? "" : "active",
                }))
              }
              className="hover-lift"
            >
              <FiCheckCircle className="w-3 h-3 mr-1" />
              Active ({loanStats?.active_loans || 0})
            </Button>
            <Button
              variant={filters.status === "overdue" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  status: filters.status === "overdue" ? "" : "overdue",
                }))
              }
              className="hover-lift"
            >
              <FiAlertTriangle className="w-3 h-3 mr-1" />
              Overdue ({loanStats?.overdue_loans || 0})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Card className="border-destructive bg-destructive/5 animate-bounce-in">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-destructive font-medium mb-1">
                  Error saving loan
                </p>
                <p className="text-destructive/80 text-sm leading-relaxed">
                  {error}
                </p>
                {error.includes("authentication") ||
                  (error.includes("Session expired") && (
                    <p className="text-destructive/60 text-xs mt-2">
                      Please refresh the page and log in again.
                    </p>
                  ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="hover:bg-destructive/10 -mt-1 -mr-1"
              >
                <FiX className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Content with comprehensive null checks */}
      {loading ? (
        <Card className="animate-scale-in border-border/50">
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary absolute top-0 left-0"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Loading loans...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : !loans || loans.length === 0 ? (
        <Card className="animate-fade-in-left border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="p-16">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-bounce-in">
                  <FiCreditCard className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">No loans found</h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {filters.search || filters.status
                    ? "Try adjusting your search criteria or filters to find what you're looking for"
                    : "Get started by creating your first loan to begin managing your portfolio"}
                </p>
              </div>
              <Button
                onClick={handleAddLoan}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
              >
                <FiPlus className="mr-2 h-5 w-5" />
                Create Your First Loan
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-lift animate-fade-in-right border-border/50 bg-gradient-to-br from-background via-background to-muted/5 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FiCreditCard className="w-5 h-5 text-primary" />
                Loan Portfolio
                <Badge variant="secondary" className="ml-2">
                  {totalLoans || 0} total
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/30">
                <TableHead className="font-semibold">Loan Details</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Terms</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans &&
                loans.map((loan, index) => (
                  <TableRow
                    key={loan?.id || index}
                    className="hover:bg-muted/40 transition-all duration-300 border-border/30 group stagger-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          Loan #{loan?.id || "N/A"}
                        </div>
                        {loan?.purpose && (
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {loan.purpose}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Interest: {loan?.interest_rate || 0}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-xs shadow-md">
                          {loan?.client_name
                            ? loan.client_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "??"}
                        </div>
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {loan?.client_name || "Unknown Client"}
                          </div>
                          {loan?.client_email && (
                            <div className="text-sm text-muted-foreground">
                              {loan.client_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-lg">
                          {formatCurrency(loan?.loan_amount)}
                        </div>
                        {loan?.approved_amount &&
                          loan.approved_amount !== loan.loan_amount && (
                            <div className="text-sm text-green-600">
                              Approved: {formatCurrency(loan.approved_amount)}
                            </div>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {loan?.term_months || 0} months
                        </div>
                        {loan?.start_date && (
                          <div className="text-sm text-muted-foreground">
                            Starts: {formatDate(loan.start_date)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(loan?.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end space-x-1 transition-opacity duration-300">
                        {loan.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleApprovalClick(loan, "approve")}
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 hover-lift"
                            title="Review Loan"
                          >
                            <FiSettings className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => loan && handleEditLoan(loan)}
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover-lift"
                          title="Edit Loan"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => loan?.id && handleDeleteClick(loan.id)}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover-lift"
                          title="Delete Loan"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {/* Enhanced Pagination with null checks */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-transparent animate-fade-in">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {loans?.length || 0}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalLoans || 0}
                </span>{" "}
                loans
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={filters.page === 1}
                  className="hover-lift border-border/50 hover:border-primary/50"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={filters.page === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8 hover-lift"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={filters.page === totalPages}
                  className="hover-lift border-border/50 hover:border-primary/50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Loan Approval Modal */}
      {showApprovalModal && loanToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowApprovalModal(false)}
          ></div>
          <Card className="relative max-w-2xl w-full shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl animate-scale-in">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FiSettings className="w-4 h-4 text-primary" />
                  </div>
                  Review Loan Application
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowApprovalModal(false)}
                  className="hover-lift"
                >
                  <FiX className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Loan Summary */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <FiFileText className="w-4 h-4" />
                  Loan Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <div className="font-medium">
                      {loanToApprove.client_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loan ID:</span>
                    <div className="font-medium">#{loanToApprove.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Requested Amount:
                    </span>
                    <div className="font-medium">
                      {formatCurrency(loanToApprove.loan_amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Interest Rate:
                    </span>
                    <div className="font-medium">
                      {loanToApprove.interest_rate}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term:</span>
                    <div className="font-medium">
                      {loanToApprove.term_months} months
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Purpose:</span>
                    <div className="font-medium">
                      {loanToApprove.purpose || "Not specified"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Selection */}
              <div className="space-y-4">
                <h4 className="font-semibold">Choose Action</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() =>
                      setApprovalData((prev) => ({
                        ...prev,
                        action: "approve",
                      }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      approvalData.action === "approve"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-border hover:border-green-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          approvalData.action === "approve"
                            ? "bg-green-500 text-white"
                            : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        <FiCheckCircle className="w-6 h-6" />
                      </div>
                      <span
                        className={`font-medium ${
                          approvalData.action === "approve"
                            ? "text-green-700 dark:text-green-300"
                            : ""
                        }`}
                      >
                        Approve Loan
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() =>
                      setApprovalData((prev) => ({ ...prev, action: "reject" }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                      approvalData.action === "reject"
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : "border-border hover:border-red-300"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          approvalData.action === "reject"
                            ? "bg-red-500 text-white"
                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        <FiXCircle className="w-6 h-6" />
                      </div>
                      <span
                        className={`font-medium ${
                          approvalData.action === "reject"
                            ? "text-red-700 dark:text-red-300"
                            : ""
                        }`}
                      >
                        Reject Loan
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Approval Form */}
              {approvalData.action === "approve" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Approved Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="number"
                        value={approvalData.approved_amount}
                        onChange={(e) =>
                          setApprovalData((prev) => ({
                            ...prev,
                            approved_amount: Number(e.target.value),
                          }))
                        }
                        className="pl-10"
                        placeholder="Enter approved amount"
                        min="0"
                        max={loanToApprove.loan_amount}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum: {formatCurrency(loanToApprove.loan_amount)}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {approvalData.action === "approve"
                    ? "Approval Notes"
                    : "Rejection Reason"}
                </label>
                <textarea
                  value={approvalData.notes}
                  onChange={(e) =>
                    setApprovalData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full p-3 border border-border/50 rounded-md bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200"
                  rows={3}
                  placeholder={`Enter ${
                    approvalData.action === "approve"
                      ? "approval notes"
                      : "reason for rejection"
                  }...`}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={() => setShowApprovalModal(false)}
                  disabled={isProcessingApproval}
                  className="hover-lift"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprovalSubmit}
                  disabled={
                    isProcessingApproval ||
                    (approvalData.action === "approve" &&
                      !approvalData.approved_amount)
                  }
                  className={`hover-lift ${
                    approvalData.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isProcessingApproval ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {approvalData.action === "approve" ? (
                        <FiCheckCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <FiXCircle className="mr-2 h-4 w-4" />
                      )}
                      {approvalData.action === "approve"
                        ? "Approve Loan"
                        : "Reject Loan"}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <FormModal
        isOpen={showLoanForm}
        title={editingLoan ? "Edit Loan" : "New Loan Application"}
        onClose={() => setShowLoanForm(false)}
      >
        <div className="animate-scale-in">
          <LoanForm
            initialData={editingLoan || {}}
            onSubmit={handleLoanSubmit}
            onCancel={() => {
              console.log("Canceling loan form");
              setShowLoanForm(false);
              setEditingLoan(null);
              setError(null);
            }}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Loan"
        message="Are you sure you want to delete this loan? This action cannot be undone and will remove all associated data."
        confirmText="Delete Loan"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default Loans;
