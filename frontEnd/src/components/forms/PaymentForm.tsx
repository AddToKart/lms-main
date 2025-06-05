import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiCheck,
  FiX,
  FiFileText,
  FiHash,
  FiAlertCircle,
  FiInfo,
} from "react-icons/fi";
import type { PaymentFormData } from "../../types/payment";
import { getActiveLoans } from "../../services/loanService";

interface PaymentFormProps {
  initialData?: Partial<PaymentFormData>;
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface Loan {
  id: number;
  client_name?: string;
  loan_amount: number;
  remaining_balance?: number;
}

const paymentMethods = [
  { value: "cash", label: "Cash", icon: FiDollarSign },
  { value: "bank_transfer", label: "Bank Transfer", icon: FiCreditCard },
  { value: "credit_card", label: "Credit Card", icon: FiCreditCard },
  { value: "check", label: "Check", icon: FiCheck },
  { value: "online", label: "Online", icon: FiCreditCard },
];

const PaymentForm: React.FC<PaymentFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    loan_id: initialData.loan_id || 0,
    amount: initialData.amount || 0,
    payment_date:
      initialData.payment_date || new Date().toISOString().split("T")[0],
    payment_method: initialData.payment_method || "",
    reference_number: initialData.reference_number || "",
    notes: initialData.notes || "",
  });

  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>("");
  const [errors, setErrors] = useState<
    Partial<Record<keyof PaymentFormData, string>>
  >({});

  // Fetch active loans on component mount
  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      setLoadError("");

      console.log("Fetching active loans..."); // Debug log
      const response = await getActiveLoans();
      console.log("Active loans response:", response); // Debug log

      // Handle different response structures
      let loansData = [];
      if (response && response.success && Array.isArray(response.data)) {
        loansData = response.data;
      } else if (Array.isArray(response)) {
        loansData = response;
      } else {
        console.warn("Unexpected response structure:", response);
        loansData = [];
      }

      console.log("Processed loans data:", loansData); // Debug log
      setLoans(loansData);

      // If editing, find and set the selected loan
      if (initialData?.loan_id && loansData.length > 0) {
        const loan = loansData.find((l: Loan) => l.id === initialData.loan_id);
        if (loan) {
          setSelectedLoan(loan);
        }
      }
    } catch (error) {
      console.error("Error fetching loans:", error);
      setLoadError("Failed to load loans. Please try again.");
      setLoans([]); // Ensure loans is always an array
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper (matching LoanForm pattern)
  const formatNumberWithCommas = (value: number | string): string => {
    if (value === "" || value === 0) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US");
  };

  // Parse formatted number helper
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, "");
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  // Special handler for formatted number inputs (matching LoanForm pattern)
  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Remove all non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    const formattedValue =
      parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : cleanValue;

    const numericValue = parseFloat(formattedValue) || 0;

    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof PaymentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "loan_id" ? Number(value) : value,
    }));

    if (name === "loan_id" && value) {
      const selected = loans.find((loan) => loan.id === Number(value));
      setSelectedLoan(selected || null);
    }

    // Clear error when user starts typing
    if (errors[name as keyof PaymentFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentFormData, string>> = {};

    if (!formData.loan_id) {
      newErrors.loan_id = "Please select a loan";
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!formData.payment_date) {
      newErrors.payment_date = "Please select a payment date";
    }
    if (!formData.payment_method) {
      newErrors.payment_method = "Please select a payment method";
    }
    if (formData.payment_method !== "cash" && !formData.reference_number) {
      newErrors.reference_number =
        "Reference number is required for non-cash payments";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6 custom-scrollbar">
      {/* Form Header */}
      <div className="pb-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData && initialData.loan_id
            ? "Edit Payment Record"
            : "New Payment Record"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the payment details below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 custom-scrollbar">
        {/* Loan Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground">
              Loan Information
            </h4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loan_id" className="text-sm font-medium">
              Select Loan <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                id="loan_id"
                name="loan_id"
                value={formData.loan_id || ""}
                onChange={handleChange}
                disabled={loading || isSubmitting}
                className={`w-full pl-10 py-3 px-4 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                  errors.loan_id
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                }`}
              >
                <option value="">
                  {loading
                    ? "Loading loans..."
                    : loadError
                    ? "Error loading loans"
                    : loans.length === 0
                    ? "No active loans available"
                    : "Select a loan"}
                </option>
                {!loading &&
                  !loadError &&
                  Array.isArray(loans) &&
                  loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.client_name} - ID: {loan.id} - Bal: $
                      {loan.remaining_balance?.toLocaleString() ||
                        loan.loan_amount.toLocaleString()}
                    </option>
                  ))}
              </select>
            </div>
            {errors.loan_id && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" />
                {errors.loan_id}
              </p>
            )}
            {loadError && (
              <div className="flex items-center justify-between p-3 mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {loadError}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={fetchLoans}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>

          {/* Show message if no loans available */}
          {!loading && !loadError && loans.length === 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <FiInfo className="w-4 h-4 flex-shrink-0" />
                No active loans found. Please create a loan first before
                recording payments.
              </p>
            </div>
          )}

          {/* Selected Loan Info */}
          {selectedLoan && (
            <div className="p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50">
              <h4 className="text-sm font-semibold mb-2 text-foreground">
                Selected Loan Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <span className="ml-1 font-medium text-foreground">
                    {selectedLoan.client_name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <span className="ml-1 font-medium text-foreground">
                    ${selectedLoan.loan_amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Remaining Balance:
                  </span>
                  <span className="ml-1 font-medium text-foreground">
                    $
                    {(
                      selectedLoan.remaining_balance ?? selectedLoan.loan_amount
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground">
              Payment Details
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  id="amount"
                  type="text"
                  name="amount"
                  value={formatNumberWithCommas(formData.amount)}
                  onChange={handleNumberInputChange}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                    errors.amount
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-border"
                  }`}
                  placeholder="Enter payment amount"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Payment Date */}
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
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                    errors.payment_date
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-border"
                  }`}
                />
              </div>
              {errors.payment_date && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.payment_date}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground">
              Payment Method
            </h4>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium block">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-2.5 p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:border-primary/70 ${
                    formData.payment_method === method.value
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border bg-background hover:bg-muted/50"
                  } ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.value}
                    checked={formData.payment_method === method.value}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className="sr-only"
                  />
                  <method.icon
                    className={`w-4 h-4 ${
                      formData.payment_method === method.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      formData.payment_method === method.value
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {method.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.payment_method && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" />
                {errors.payment_method}
              </p>
            )}
          </div>

          {/* Reference Number */}
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
                  value={formData.reference_number}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  placeholder="e.g., Transaction ID, Check No."
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                    errors.reference_number
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-border"
                  }`}
                />
              </div>
              {errors.reference_number && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle className="w-4 h-4" />
                  {errors.reference_number}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Additional Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <h4 className="text-sm font-semibold text-foreground">
              Additional Information
            </h4>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </Label>
            <div className="relative">
              <FiFileText className="absolute left-3 top-3.5 text-muted-foreground h-4 w-4" />
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Add any additional notes about this payment..."
                rows={3}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground min-h-[80px] resize-none border-border"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-border/30">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="hover-lift"
          >
            <FiX className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              loading ||
              (!loadError && loans.length === 0 && !initialData.loan_id)
            }
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground mr-2"></div>
                Recording...
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4 mr-2" />
                {initialData.loan_id ? "Update Payment" : "Record Payment"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
