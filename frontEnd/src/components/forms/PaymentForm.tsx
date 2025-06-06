import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiUser,
  FiInfo,
  FiSave,
  FiFileText,
  FiGlobe,
  FiAlertTriangle,
  FiLoader,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiHash,
  FiUsers,
  FiAlertCircle,
  FiChevronsRight,
  FiRepeat,
} from "react-icons/fi";

// Import services with correct exports
import * as clientService from "../../services/clientService";
import { getLoans } from "../../services/loanService"; // Use the correct function name
import { Client } from "../../services/clientService";
import { Loan } from "../../services/loanService";
import { Payment, PaymentFormData } from "../../types/payment";

// Helper functions moved outside the component for early availability
const formatCurrency = (
  amount: number | null | undefined,
  showFree = false
) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showFree ? "$0.00" : "";
  }
  if (showFree && Number(amount) === 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

const formatNumberForInput = (
  value: string | number | null | undefined
): string => {
  if (value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9.]/g, ""); // Keep only digits and one dot
  const parts = numStr.split(".");
  if (parts.length > 1) {
    return parts[0] + "." + parts[1].slice(0, 2); // Ensure only two decimal places
  }
  return numStr;
};

interface PaymentFormProps {
  initialData?: Partial<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const paymentMethods = [
  { value: "cash", label: "Cash", icon: FiDollarSign },
  { value: "bank_transfer", label: "Bank Transfer", icon: FiCreditCard },
  { value: "credit_card", label: "Credit Card", icon: FiCreditCard },
  { value: "check", label: "Check", icon: FiCheck },
  { value: "online", label: "Online", icon: FiCreditCard },
];

type PaymentOptionType = "custom" | "nextTerm" | "full";

// Define a type for the form's internal state where amount can be a string for input handling
interface PaymentFormInputState {
  client_id: number | null; // Add this property
  loan_id: number | null; // Add this property
  amount: string; // For input field
  payment_date: string;
  payment_method: string;
  reference_number: string;
  notes: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<PaymentFormInputState>({
    client_id: initialData.client_id || null,
    loan_id: initialData.loan_id || null,
    amount:
      initialData.amount !== undefined
        ? formatNumberForInput(initialData.amount)
        : "",
    payment_date:
      initialData.payment_date || new Date().toISOString().split("T")[0],
    payment_method: initialData.payment_method || "cash",
    reference_number: initialData.reference_number || "",
    notes: initialData.notes || "",
  });

  // Add the missing clients state variable
  const [clients, setClients] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    initialData.client_id || null
  );
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loadingClients, setLoadingClients] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const [paymentOptionType, setPaymentOptionType] =
    useState<PaymentOptionType>("custom");

  // Load clients on component mount - simplified version
  const loadClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      setClientError(null);
      console.log("[PaymentForm] Loading clients...");

      // Try to get clients directly from the API
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/clients?limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("[PaymentForm] Raw API response:", data);

      if (data.success && data.data) {
        // Handle different possible response structures
        const clientsData = data.data.clients || data.data || [];
        setClients(Array.isArray(clientsData) ? clientsData : []);
        console.log("[PaymentForm] Loaded clients:", clientsData.length);
      } else {
        throw new Error(data.message || "Failed to load clients");
      }
    } catch (error: any) {
      console.error("[PaymentForm] Error loading clients:", error);
      setClientError(error.message || "Failed to load clients");
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  // Load clients on mount
  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const fetchLoansForClient = useCallback(
    async (clientIdToFetch?: number) => {
      const currentClientId = clientIdToFetch || selectedClientId;
      if (!currentClientId) {
        setLoans([]);
        setSelectedLoan(null);
        setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
        setPaymentOptionType("custom");
        return;
      }

      setLoadingLoans(true);
      setLoanError("");
      try {
        // Use the correct function with client_id filter
        const response = await getLoans({
          client_id: currentClientId,
          limit: 100,
        });

        if (response.success && response.data) {
          // Handle different possible response structures
          const loansData = response.data.loans || response.data || [];
          // Include approved, active, and defaulted loans for payments
          const activeOrOverdueLoans = loansData.filter(
            (loan: any) =>
              loan.status?.toLowerCase() === "active" ||
              loan.status?.toLowerCase() === "approved" ||
              loan.status?.toLowerCase() === "defaulted" ||
              loan.status?.toLowerCase() === "overdue"
          );
          setLoans(activeOrOverdueLoans);

          if (activeOrOverdueLoans.length === 0) {
            setLoanError(
              "No active, approved, or overdue loans found for this client."
            );
            setSelectedLoan(null);
            setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
          } else {
            // Try to pre-select if initialData.loan_id is provided and matches a fetched loan
            const initialLoanToSelect = initialData.loan_id
              ? activeOrOverdueLoans.find((l) => l.id === initialData.loan_id)
              : null;

            if (initialLoanToSelect) {
              setSelectedLoan(initialLoanToSelect);
              setFormData((prev) => ({
                ...prev,
                loan_id: initialLoanToSelect.id,
              }));
              console.log("Set loan from props:", initialLoanToSelect);
            } else if (
              selectedLoan &&
              !activeOrOverdueLoans.some((l) => l.id === selectedLoan.id)
            ) {
              // If previously selected loan is no longer in the list (e.g. paid off), deselect it
              setSelectedLoan(null);
              setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
            } else if (
              !selectedLoan &&
              activeOrOverdueLoans.length === 1 &&
              !initialData.loan_id
            ) {
              // If no loan is selected, and there's only one loan, auto-select it (only for new forms)
              setSelectedLoan(activeOrOverdueLoans[0]);
              setFormData((prev) => ({
                ...prev,
                loan_id: activeOrOverdueLoans[0].id,
              }));
            }
          }
        } else {
          setLoanError(response.message || "Failed to load loans.");
          setLoans([]);
          setSelectedLoan(null);
          setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
        }
      } catch (error: any) {
        console.error(
          `Error fetching loans for client ${currentClientId}:`,
          error
        );
        setLoanError(
          error.message || "An unexpected error occurred while fetching loans."
        );
        setLoans([]);
        setSelectedLoan(null);
        setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
      } finally {
        setLoadingLoans(false);
      }
    },
    [selectedClientId, initialData.loan_id, selectedLoan]
  );

  useEffect(() => {
    if (selectedClientId) {
      fetchLoansForClient(selectedClientId);
    } else {
      setLoans([]);
      setSelectedLoan(null);
      setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
      setPaymentOptionType("custom");
    }
  }, [selectedClientId, fetchLoansForClient]);

  useEffect(() => {
    if (!selectedLoan) {
      if (paymentOptionType !== "custom") {
        setFormData((prev) => ({ ...prev, amount: "" }));
      }
      return;
    }

    let newAmount = formData.amount; // Keep custom amount if that's the type
    if (paymentOptionType === "full") {
      newAmount = selectedLoan.remaining_balance?.toString() || "0";
    } else if (paymentOptionType === "nextTerm") {
      // Calculate installment amount based on loan amount and term
      const installmentAmount =
        selectedLoan.loan_amount && selectedLoan.term_months
          ? selectedLoan.loan_amount / selectedLoan.term_months
          : 0;
      newAmount = installmentAmount?.toString() || "0";
    }

    setFormData((prev) => ({
      ...prev,
      amount: formatNumberForInput(newAmount),
    }));
  }, [selectedLoan, paymentOptionType]); // formData.amount removed to prevent loop with custom input

  // Fix handleInputChange function
  const handleInputChange = (name: string, value: any) => {
    if (name === "client_id") {
      setSelectedClientId(value);
      setSelectedLoan(null);
      setFormData((prev) => ({
        ...prev,
        client_id: value,
        loan_id: null,
        amount: "",
      }));
      setLoans([]);
      setLoanError("");
      setPaymentOptionType("custom");
      if (errors.client_id)
        setErrors((prev) => ({ ...prev, client_id: undefined }));
      if (errors.loan_id)
        setErrors((prev) => ({ ...prev, loan_id: undefined }));
    } else if (name === "loan_id") {
      const loan = loans.find((l) => l.id === value);
      setSelectedLoan(loan || null);
      setFormData((prev) => ({ ...prev, loan_id: value }));
      if (errors.loan_id)
        setErrors((prev) => ({ ...prev, loan_id: undefined }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (paymentOptionType !== "custom") return;

    const rawValue = e.target.value;
    setFormData({ ...formData, amount: formatNumberForInput(rawValue) });
    if (errors.amount) {
      setErrors({ ...errors, amount: undefined });
    }
  };

  const handleAmountBlur = () => {
    if (paymentOptionType === "custom") {
      setFormData((prev) => ({
        ...prev,
        amount: formatNumberForInput(prev.amount),
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof PaymentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    setFormData((prev) => ({ ...prev, payment_method: value }));
    if (errors.payment_method)
      setErrors((prev) => ({ ...prev, payment_method: undefined }));
  };

  // Fix the validateField function to handle proper form data
  const validateField = (name: keyof PaymentFormData, value: any): string => {
    switch (name) {
      case "client_id":
        if (!value || !selectedClientId) return "Client selection is required.";
        return "";
      case "loan_id":
        if (!value || !selectedLoan) return "Loan selection is required.";
        return "";
      case "amount":
        const numericAmount =
          typeof value === "string" ? parseFloat(value) : value;
        if (isNaN(numericAmount) || numericAmount <= 0) {
          return "Payment amount must be a positive number.";
        }
        if (selectedLoan && selectedLoan.remaining_balance !== undefined) {
          if (numericAmount > selectedLoan.remaining_balance + 0.001) {
            return `Amount cannot exceed remaining balance of ${formatCurrency(
              selectedLoan.remaining_balance,
              true
            )}.`;
          }
        }
        return "";
      case "payment_date":
        if (!value) return "Please select a payment date";
        return "";
      case "payment_method":
        if (!value) return "Payment method is required.";
        return "";
      case "reference_number":
        if (
          formData.payment_method &&
          formData.payment_method !== "cash" &&
          !value
        ) {
          return "Reference number is required for non-cash payments";
        }
        return "";
      default:
        return "";
    }
  };

  // Fix the handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentErrors: Record<string, string> = {};
    let isValid = true;

    // Create proper PaymentFormData object for validation
    const dataToValidate = {
      client_id: formData.client_id || selectedClientId,
      loan_id: formData.loan_id || selectedLoan?.id || null,
      amount: parseFloat(formData.amount),
      payment_date: formData.payment_date,
      payment_method: formData.payment_method,
      reference_number: formData.reference_number,
      notes: formData.notes,
    };

    // Validate all fields
    (Object.keys(dataToValidate) as Array<keyof PaymentFormData>).forEach(
      (key) => {
        const error = validateField(key, dataToValidate[key]);
        if (error) {
          currentErrors[key] = error;
          isValid = false;
        }
      }
    );

    setErrors(currentErrors);

    if (isValid) {
      console.log("[PaymentForm] Submitting payment data:", dataToValidate);
      onSubmit(dataToValidate);
    } else {
      console.warn("[PaymentForm] Validation failed:", currentErrors);
    }
  };

  const getLoanDisplayLabel = (loan: Loan): string => {
    return `ID: ${loan.id} (Bal: ${formatCurrency(
      loan.remaining_balance,
      true
    )}, Term: ${loan.term_months}m)`;
  };

  const currentlySelectedClient = clients.find(
    (c) => c.id === selectedClientId
  );

  const paymentOptionButtons = [
    {
      id: "custom" as PaymentOptionType,
      label: "Custom Amount",
      icon: FiDollarSign,
      disabled: !selectedLoan,
    },
    {
      id: "nextTerm" as PaymentOptionType,
      label: `Next Term (${formatCurrency(
        selectedLoan?.loan_amount && selectedLoan?.term_months
          ? selectedLoan.loan_amount / selectedLoan.term_months
          : 0,
        true
      )})`,
      icon: FiChevronsRight,
      disabled:
        !selectedLoan ||
        !(selectedLoan.loan_amount && selectedLoan.term_months) ||
        (selectedLoan.loan_amount && selectedLoan.term_months
          ? selectedLoan.loan_amount / selectedLoan.term_months
          : 0) <= 0 ||
        (selectedLoan.remaining_balance !== undefined &&
          (selectedLoan.loan_amount && selectedLoan.term_months
            ? selectedLoan.loan_amount / selectedLoan.term_months
            : 0) > selectedLoan.remaining_balance),
    },
    {
      id: "full" as PaymentOptionType,
      label: `Pay Full (${formatCurrency(
        selectedLoan?.remaining_balance,
        true
      )})`,
      icon: FiRepeat,
      disabled:
        !selectedLoan ||
        !selectedLoan.remaining_balance ||
        selectedLoan.remaining_balance <= 0,
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center">
          <FiUsers className="mr-3 text-primary" /> Client & Loan Selection
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select the client and their loan for this payment.
        </p>

        {/* Client Selection */}
        <div className="mb-6">
          <Label
            htmlFor="client_id"
            className="text-sm font-medium text-foreground"
          >
            Select Client <span className="text-destructive">*</span>
          </Label>
          {loadingClients ? (
            <div className="mt-2 flex items-center text-muted-foreground">
              <FiRefreshCw className="animate-spin mr-2" /> Loading clients...
            </div>
          ) : clientError ? (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              <FiAlertTriangle className="inline mr-2" /> {clientError}
            </div>
          ) : (
            <Select
              onValueChange={(value) =>
                handleInputChange("client_id", parseInt(value, 10))
              }
              value={selectedClientId ? String(selectedClientId) : ""}
              disabled={clients.length === 0}
            >
              <SelectTrigger id="client_id" className="mt-1">
                <SelectValue
                  placeholder={
                    clients.length === 0
                      ? "No clients available"
                      : "Select a client"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.first_name} {client.last_name} (ID: {client.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.client_id && (
            <p className="text-xs text-destructive mt-1">{errors.client_id}</p>
          )}
        </div>

        {/* Loan Selection */}
        <div>
          <Label
            htmlFor="loan_id"
            className="text-sm font-medium text-foreground"
          >
            Select Loan <span className="text-destructive">*</span>
          </Label>
          {loadingLoans && selectedClientId && (
            <div className="mt-2 flex items-center text-muted-foreground">
              <FiRefreshCw className="animate-spin mr-2" /> Loading loans for
              selected client...
            </div>
          )}
          {loanError && selectedClientId && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
              <FiAlertTriangle className="inline mr-2" /> {loanError}
            </div>
          )}
          {!selectedClientId && (
            <p className="text-xs text-muted-foreground mt-1">
              Please select a client first to see their loans.
            </p>
          )}
          {selectedClientId &&
            !loadingLoans &&
            !loanError &&
            loans.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                No active loans found for this client.
              </p>
            )}
          {selectedClientId &&
            !loadingLoans &&
            !loanError &&
            loans.length > 0 && (
              <Select
                onValueChange={(value) =>
                  handleInputChange("loan_id", parseInt(value, 10))
                }
                value={selectedLoan ? String(selectedLoan.id) : ""}
                disabled={!selectedClientId || loans.length === 0}
              >
                <SelectTrigger id="loan_id" className="mt-1">
                  <SelectValue
                    placeholder={
                      !selectedClientId
                        ? "Select client first"
                        : loans.length === 0
                        ? "No active loans"
                        : "Select a loan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {loans.map((loan) => (
                    <SelectItem key={loan.id} value={String(loan.id)}>
                      Loan ID: {loan.id} - Amount:{" "}
                      {formatCurrency(loan.approved_amount || loan.loan_amount)}{" "}
                      (Bal: {formatCurrency(loan.remaining_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          {errors.loan_id && (
            <p className="text-xs text-destructive mt-1">{errors.loan_id}</p>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <FiDollarSign className="text-primary h-5 w-5" />
          <h4 className="text-sm font-semibold text-foreground">
            Payment Details
          </h4>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Payment Option</Label>
          <div className="flex flex-wrap gap-2 pt-1">
            {paymentOptionButtons.map((option) => (
              <Button
                key={option.id}
                type="button"
                variant={
                  paymentOptionType === option.id ? "default" : "outline"
                }
                onClick={() => {
                  if (option.disabled) return;
                  setPaymentOptionType(option.id as PaymentOptionType);
                }}
                disabled={isSubmitting || option.disabled}
                className={`flex-grow md:flex-grow-0 items-center gap-2 transition-all duration-200 hover:shadow-md ${
                  paymentOptionType === option.id
                    ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-background"
                    : ""
                } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                size="sm"
              >
                <option.icon
                  className={`h-4 w-4 ${
                    paymentOptionType === option.id
                      ? ""
                      : "text-muted-foreground"
                  }`}
                />
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Payment Amount <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="amount"
                name="amount"
                type="text"
                value={formData.amount}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                readOnly={
                  paymentOptionType !== "custom" ||
                  isSubmitting ||
                  !selectedLoan
                }
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                  errors.amount
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                } ${
                  paymentOptionType !== "custom"
                    ? "bg-muted/50 cursor-not-allowed dark:bg-muted/20"
                    : ""
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" /> {errors.amount}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_date" className="text-sm font-medium">
              Payment Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="payment_date"
                name="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={handleChange}
                disabled={isSubmitting || !selectedLoan}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                  errors.payment_date
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                }`}
              />
            </div>
            {errors.payment_date && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" /> {errors.payment_date}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method" className="text-sm font-medium">
            Payment Method <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Select
              value={formData.payment_method}
              onValueChange={handlePaymentMethodChange}
              disabled={isSubmitting || !selectedLoan}
            >
              <SelectTrigger
                id="payment_method"
                className={`w-full ${
                  errors.payment_method ? "border-red-500" : "border-border"
                }`}
              >
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center">
                      <method.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {method.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {errors.payment_method && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <FiAlertCircle className="w-4 h-4" /> {errors.payment_method}
            </p>
          )}
        </div>

        {formData.payment_method && formData.payment_method !== "cash" && (
          <div className="space-y-2">
            <Label htmlFor="reference_number" className="text-sm font-medium">
              Reference Number <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="reference_number"
                name="reference_number"
                type="text"
                value={formData.reference_number}
                onChange={handleChange}
                disabled={isSubmitting || !selectedLoan}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                  errors.reference_number
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                }`}
                placeholder="e.g., Check #, Transaction ID"
              />
            </div>
            {errors.reference_number && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" /> {errors.reference_number}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm font-medium">
            Notes (Optional)
          </Label>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isSubmitting || !selectedLoan}
              className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground"
              placeholder="Any additional notes about this payment..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-3 pt-4 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          <FiX className="h-4 w-4" /> Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            isSubmitting || !selectedLoan || loadingClients || loadingLoans
          }
          className="flex items-center gap-2"
        >
          {isSubmitting ? (
            <FiLoader className="animate-spin h-4 w-4" />
          ) : (
            <FiCheck className="h-4 w-4" />
          )}
          {initialData.id || initialData.loan_id
            ? "Update Payment"
            : "Record Payment"}
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;
