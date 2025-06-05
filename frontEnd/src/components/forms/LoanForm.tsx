import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FiUser,
  FiDollarSign,
  FiPercent,
  FiClock,
  FiCalendar,
  FiFileText,
  FiSave,
  FiX,
  FiAlertCircle,
} from "react-icons/fi";
import type { LoanFormData } from "../../types/loan";
import { getClients } from "../../services/clientService";

interface LoanFormProps {
  initialData?: Partial<LoanFormData>;
  onSubmit: (data: LoanFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const LoanForm: React.FC<LoanFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<LoanFormData>({
    client_id: initialData.client_id || 0,
    loan_amount: initialData.loan_amount || 0,
    interest_rate: initialData.interest_rate || 0,
    term_months: initialData.term_months || 0,
    purpose: initialData.purpose || "",
    start_date: initialData.start_date || "",
    status: initialData.status || "pending",
    approved_amount: initialData.approved_amount || 0,
  });

  const [clients, setClients] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await getClients({ page: 1, limit: 100 });
      // Add null checks for the response
      if (response && response.data && response.data.clients) {
        setClients(response.data.clients);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format number with commas
  const formatNumberWithCommas = (value: number | string): string => {
    if (value === "" || value === 0) return "";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US");
  };

  // Helper function to parse formatted number string
  const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, "");
    const num = parseFloat(cleanValue);
    return isNaN(num) ? 0 : num;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (
      name === "loan_amount" ||
      name === "interest_rate" ||
      name === "approved_amount"
    ) {
      // Handle number formatting for amount fields
      const numericValue = parseFormattedNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else if (name === "client_id" || name === "term_months") {
      setFormData((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  // Special handler for formatted number inputs
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    if (!formData.client_id || formData.client_id === 0) {
      newErrors.client_id = true;
    }
    if (!formData.loan_amount || formData.loan_amount <= 0) {
      newErrors.loan_amount = true;
    }
    if (!formData.interest_rate || formData.interest_rate <= 0) {
      newErrors.interest_rate = true;
    }
    if (!formData.term_months || formData.term_months <= 0) {
      newErrors.term_months = true;
    }

    // Additional business logic validation
    if (formData.loan_amount && formData.loan_amount > 1000000) {
      newErrors.loan_amount = true;
      console.error("Loan amount exceeds maximum limit");
    }
    if (formData.interest_rate && formData.interest_rate > 100) {
      newErrors.interest_rate = true;
      console.error("Interest rate exceeds maximum limit");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Form submission attempted with data:", formData);

    if (!validateForm()) {
      console.error("Form validation failed");
      return;
    }

    // Ensure proper date formatting - fix the date issue
    const formatDateForSubmission = (dateString: string): string => {
      if (!dateString) {
        return new Date().toISOString().split("T")[0];
      }

      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }

      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return new Date().toISOString().split("T")[0];
        }
        // Always return YYYY-MM-DD format, never ISO string
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error formatting date:", error);
        return new Date().toISOString().split("T")[0];
      }
    };

    // Ensure all numeric fields are properly converted and date is formatted
    const submissionData: LoanFormData = {
      client_id: Number(formData.client_id),
      loan_amount: Number(formData.loan_amount),
      interest_rate: Number(formData.interest_rate),
      term_months: Number(formData.term_months),
      purpose: String(formData.purpose || "").trim(),
      start_date: formatDateForSubmission(formData.start_date),
      status: String(formData.status || "pending"),
      approved_amount: formData.approved_amount
        ? Number(formData.approved_amount)
        : Number(formData.loan_amount),
    };

    console.log("Submitting processed data:", submissionData);
    onSubmit(submissionData);
  };

  // Function to handle date selection
  const handleDateSelect = (date: string) => {
    // Ensure the date is in YYYY-MM-DD format
    const formattedDate = date.includes("T") ? date.split("T")[0] : date;
    setFormData((prev) => ({ ...prev, start_date: formattedDate }));
    setShowDatePicker(false);
  };

  // Function to format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 custom-scrollbar pt-6">
      <form onSubmit={handleSubmit} className="space-y-6 custom-scrollbar">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="client_id" className="text-sm font-medium">
            Client <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              disabled={isSubmitting || loading}
              className={`w-full pl-10 py-3 px-4 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 ${
                errors.client_id
                  ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                  : "border-border bg-background"
              }`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} - {client.email}
                </option>
              ))}
            </select>
          </div>
          {errors.client_id && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="w-4 h-4" />
              Please select a client
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loan_amount" className="text-sm font-medium">
              Loan Amount <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                id="loan_amount"
                type="text"
                name="loan_amount"
                value={formatNumberWithCommas(formData.loan_amount)}
                onChange={handleNumberInputChange}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                  errors.loan_amount
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                }`}
                placeholder="Enter loan amount"
                maxLength={15} // Prevent extremely large numbers
              />
            </div>
            {errors.loan_amount && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <FiAlertCircle className="w-4 h-4" />
                {formData.loan_amount > 1000000
                  ? "Loan amount exceeds maximum limit of $1,000,000"
                  : "Please enter a valid loan amount"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest_rate" className="text-sm font-medium">
              Interest Rate (%) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiPercent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                id="interest_rate"
                type="text"
                name="interest_rate"
                value={
                  formData.interest_rate === 0
                    ? ""
                    : formData.interest_rate.toString()
                }
                onChange={handleNumberInputChange}
                disabled={isSubmitting}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${
                  errors.interest_rate
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border"
                }`}
                placeholder="Enter interest rate"
                maxLength={6} // Prevent extremely large rates
              />
            </div>
            {errors.interest_rate && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <FiAlertCircle className="w-4 h-4" />
                {formData.interest_rate > 100
                  ? "Interest rate cannot exceed 100%"
                  : "Please enter a valid interest rate"}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="term_months" className="text-sm font-medium">
              Term (Months) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <select
                id="term_months"
                name="term_months"
                value={formData.term_months}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full pl-10 py-3 px-4 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 ${
                  errors.term_months
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : "border-border bg-background"
                }`}
              >
                <option value="">Select term</option>
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
                <option value="24">24 months</option>
                <option value="36">36 months</option>
                <option value="48">48 months</option>
                <option value="60">60 months</option>
              </select>
            </div>
            {errors.term_months && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <FiAlertCircle className="w-4 h-4" />
                Please select a loan term
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium">
              Start Date
            </Label>
            <div className="relative">
              <div
                className="w-full pl-12 pr-4 py-3 border border-border/50 bg-background rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 cursor-pointer hover:border-primary/30 flex items-center justify-between"
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-primary transition-colors z-10" />
                <span
                  className={`text-sm ${
                    formData.start_date
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {formData.start_date
                    ? formatDateForDisplay(formData.start_date)
                    : "Select start date"}
                </span>
              </div>

              {/* Custom Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border/50 rounded-lg shadow-lg p-4 animate-scale-in">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-foreground">
                      Select Date
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowDatePicker(false)}
                      className="h-6 w-6"
                    >
                      <FiX className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick Date Options */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDateSelect(new Date().toISOString().split("T")[0])
                      }
                      className="text-xs"
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        handleDateSelect(tomorrow.toISOString().split("T")[0]);
                      }}
                      className="text-xs"
                    >
                      Tomorrow
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        handleDateSelect(nextWeek.toISOString().split("T")[0]);
                      }}
                      className="text-xs"
                    >
                      Next Week
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const nextMonth = new Date();
                        nextMonth.setMonth(nextMonth.getMonth() + 1);
                        handleDateSelect(nextMonth.toISOString().split("T")[0]);
                      }}
                      className="text-xs"
                    >
                      Next Month
                    </Button>
                  </div>

                  {/* Native Date Input */}
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => {
                        handleDateSelect(e.target.value);
                      }}
                      className="w-full py-2 px-3 border border-border/50 bg-background rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-foreground"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {/* Clear button */}
                  {formData.start_date && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            start_date: "",
                          }));
                          setShowDatePicker(false);
                        }}
                        className="w-full text-muted-foreground hover:text-destructive"
                      >
                        Clear Date
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden native input for form submission */}
              <input
                type="hidden"
                name="start_date"
                value={formData.start_date}
              />
            </div>
          </div>
        </div>

        {/* Loan Purpose */}
        <div className="space-y-2">
          <Label htmlFor="purpose" className="text-sm font-medium">
            Loan Purpose
          </Label>
          <div className="relative">
            <FiFileText className="absolute left-3 top-3 text-muted-foreground h-4 w-4" />
            <Textarea
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              disabled={isSubmitting}
              className="pl-10 min-h-[100px] resize-none"
              placeholder="Enter the purpose of this loan..."
            />
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
            <FiX className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground/20 border-t-primary-foreground mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2 h-4 w-4" />
                Save Loan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;
