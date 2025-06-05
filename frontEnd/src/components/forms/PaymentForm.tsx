import React, { useState, useEffect, useCallback } from "react";
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
import {
  FiUser,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiCheck,
  FiFileText,
  FiHash,
  FiAlertCircle,
  FiInfo,
  FiLoader,
  FiX,
  FiBriefcase,
  FiChevronsRight, // For Pay Next Term
  FiRepeat, // For Pay in Full (or a better icon like FiZap for full payment)
} from "react-icons/fi";
import type { PaymentFormData } from "../../types/payment";
import {
  getClientsWithLoans,
  getLoans,
  getLoanById,
} from "../../services/loanService";
import type {
  Client,
  Loan,
  LoanFilters,
} from "../../services/loanService";

// Helper functions moved outside the component for early availability
const formatCurrency = (amount: number | null | undefined, showFree = false) => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return showFree ? "$0.00" : "";
  }
  if (showFree && Number(amount) === 0) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

const formatNumberForInput = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return "";
  const numStr = String(value).replace(/[^0-9.]/g, ""); // Keep only digits and one dot
  const parts = numStr.split('.');
  if (parts.length > 1) {
    return parts[0] + '.' + parts[1].slice(0, 2); // Ensure only two decimal places
  }
  return numStr;
};

interface PaymentFormProps {
  initialData?: Partial<PaymentFormData & { client_id?: number; id?: number }>;
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
  loan_id: number;
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
    loan_id: initialData.loan_id || 0,
    amount: initialData.amount !== undefined ? formatNumberForInput(initialData.amount) : "",
    payment_date:
      initialData.payment_date || new Date().toISOString().split("T")[0],
    payment_method: initialData.payment_method || "",
    reference_number: initialData.reference_number || "",
    notes: initialData.notes || "",
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    initialData.client_id || null
  );
  const [loansByClient, setLoansByClient] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string>("");
  const [loansLoading, setLoansLoading] = useState(false);
  const [loansError, setLoansError] = useState<string>("");

  const [errors, setErrors] = useState<
    Partial<Record<keyof PaymentFormInputState | "client_id", string>>
  >({});

  const [paymentOptionType, setPaymentOptionType] =
    useState<PaymentOptionType>("custom");

  const fetchClientsAndInitialLoanClient = useCallback(async () => {
    setClientsLoading(true);
    setClientsError("");
    try {
      const response = await getClientsWithLoans();
      if (response.success && Array.isArray(response.data)) {
        setClients(response.data);
        if (initialData.loan_id && !initialData.client_id) {
          const loanResponse = await getLoanById(initialData.loan_id);
          if (loanResponse.success && loanResponse.data?.client_id) {
            setSelectedClientId(loanResponse.data.client_id);
            // fetchLoansForClient will be called by selectedClientId useEffect
          } else {
            const errorMsg = `Could not determine client for initial loan (ID: ${initialData.loan_id}).`;
            console.error(errorMsg, loanResponse.message);
            setClientsError(
              errorMsg + " Please select client manually or check loan data."
            );
          }
        } else if (initialData.client_id) {
          setSelectedClientId(initialData.client_id);
           // fetchLoansForClient will be called by selectedClientId useEffect
        }
      } else {
        setClientsError(response.message || "Failed to load clients.");
        setClients([]);
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      setClientsError(
        error.message || "An unexpected error occurred while fetching clients."
      );
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, [initialData.loan_id, initialData.client_id]); // Removed fetchLoansForClient

  useEffect(() => {
    fetchClientsAndInitialLoanClient();
  }, [fetchClientsAndInitialLoanClient]);


  const fetchLoansForClient = useCallback(async (clientIdToFetch?: number) => {
    const currentClientId = clientIdToFetch || selectedClientId;
    if (!currentClientId) {
      setLoansByClient([]);
      setSelectedLoan(null);
      setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
      setPaymentOptionType("custom");
      return;
    }

    setLoansLoading(true);
    setLoansError("");
    try {
      const filters: LoanFilters = {
        client_id: currentClientId,
        // Fetch all statuses and filter client-side, or backend should filter for 'active'/'overdue'
        status: "active", // Or fetch all and filter: loan.status === 'active' || loan.status === 'overdue'
        limit: 100, 
      };
      const response = await getLoans(filters);
      if (response.success && response.data && Array.isArray(response.data.loans)) {
        const activeOrOverdueLoans = response.data.loans.filter(
          loan => loan.status?.toLowerCase() === 'active' || loan.status?.toLowerCase() === 'overdue'
        );
        setLoansByClient(activeOrOverdueLoans);

        if (activeOrOverdueLoans.length === 0) {
          setLoansError("No active or overdue loans found for this client.");
          setSelectedLoan(null);
          setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
        } else {
           // Try to pre-select if initialData.loan_id is provided and matches a fetched loan
          const initialLoanToSelect = initialData.loan_id 
            ? activeOrOverdueLoans.find(l => l.id === initialData.loan_id) 
            : null;

          if (initialLoanToSelect) {
            setSelectedLoan(initialLoanToSelect);
            setFormData(prev => ({ ...prev, loan_id: initialLoanToSelect.id }));
          } else if (selectedLoan && !activeOrOverdueLoans.some(l => l.id === selectedLoan.id)) {
            // If previously selected loan is no longer in the list (e.g. paid off), deselect it
            setSelectedLoan(null);
            setFormData(prev => ({ ...prev, loan_id: 0, amount: "" }));
          } else if (!selectedLoan && activeOrOverdueLoans.length === 1 && !initialData.loan_id) {
            // If no loan is selected, and there's only one loan, auto-select it (only for new forms)
            setSelectedLoan(activeOrOverdueLoans[0]);
            setFormData(prev => ({ ...prev, loan_id: activeOrOverdueLoans[0].id }));
          }
        }
      } else {
        setLoansError(response.message || "Failed to load loans.");
        setLoansByClient([]);
        setSelectedLoan(null);
        setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
      }
    } catch (error: any) {
      console.error(`Error fetching loans for client ${currentClientId}:`, error);
      setLoansError(error.message || "An unexpected error occurred while fetching loans.");
      setLoansByClient([]);
      setSelectedLoan(null);
      setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
    } finally {
      setLoansLoading(false);
    }
  }, [selectedClientId, initialData.loan_id]); // Removed selectedLoan, formData.loan_id

  useEffect(() => {
    if (selectedClientId) {
        fetchLoansForClient(selectedClientId);
    } else {
        setLoansByClient([]);
        setSelectedLoan(null);
        setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
        setPaymentOptionType("custom");
    }
  }, [selectedClientId, fetchLoansForClient]);


  useEffect(() => {
    if (!selectedLoan) {
      if (paymentOptionType !== 'custom') {
         setFormData((prev) => ({ ...prev, amount: "" }));
      }
      return;
    }

    let newAmount = formData.amount; // Keep custom amount if that's the type
    if (paymentOptionType === "full") {
      newAmount = selectedLoan.remaining_balance?.toString() || "0";
    } else if (paymentOptionType === "nextTerm") {
      newAmount = selectedLoan.installment_amount?.toString() || "0";
    }
    
    setFormData((prev) => ({ ...prev, amount: formatNumberForInput(newAmount) }));

  }, [selectedLoan, paymentOptionType]); // formData.amount removed to prevent loop with custom input

  const handleClientChange = (clientIdStr: string) => {
    const clientId = parseInt(clientIdStr, 10);
    if (isNaN(clientId) || selectedClientId === clientId) return;

    setSelectedClientId(clientId);
    // Reset loan related state
    setSelectedLoan(null);
    setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
    setLoansByClient([]);
    setLoansError("");
    setPaymentOptionType("custom");
    if (errors.client_id) setErrors((prev) => ({ ...prev, client_id: undefined }));
    if (errors.loan_id) setErrors((prev) => ({ ...prev, loan_id: undefined }));
  };

  const handleLoanChange = (loanIdStr: string) => {
    const loanId = parseInt(loanIdStr, 10);
    if (isNaN(loanId)) {
      setSelectedLoan(null);
      setFormData((prev) => ({ ...prev, loan_id: 0, amount: "" }));
      setPaymentOptionType("custom");
      return;
    }
    const loan = loansByClient.find((l) => l.id === loanId);
    setSelectedLoan(loan || null);
    setFormData((prev) => ({ ...prev, loan_id: loanId || 0 }));
    // Amount will be set by the useEffect based on paymentOptionType and new selectedLoan
    // Default to custom, useEffect will then calculate if 'full' or 'nextTerm' was active
    if (paymentOptionType === 'custom' && loan) { // if custom, clear amount for new loan
        setFormData(prev => ({...prev, amount: ""}));
    } else {
        // Trigger recalculation by temporarily setting to custom if not already
        // This ensures the useEffect for amount calculation runs with the new loan
        // setPaymentOptionType("custom"); // This might be too aggressive, let useEffect handle it.
    }
    if (errors.loan_id) setErrors((prev) => ({ ...prev, loan_id: undefined }));
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
        setFormData(prev => ({...prev, amount: formatNumberForInput(prev.amount)}));
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
    if (errors.payment_method) setErrors((prev) => ({ ...prev, payment_method: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PaymentFormData | "client_id", string>> = {};
    let isValid = true;

    if (!selectedClientId) {
      newErrors.client_id = "Please select a client";
      isValid = false;
    }

    if (!formData.loan_id || formData.loan_id === 0) {
      newErrors.loan_id = "Please select a loan";
      isValid = false;
    }
    
    const amountValue = parseFloat(String(formData.amount).replace(/,/g, ""));
    if (String(formData.amount).trim() === "" || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = "Payment amount must be a positive number.";
      isValid = false;
    } else if (selectedLoan && selectedLoan.remaining_balance !== undefined) {
      if (amountValue > selectedLoan.remaining_balance + 0.001) { // Add small tolerance for float issues
        newErrors.amount = `Amount cannot exceed remaining balance of ${formatCurrency(selectedLoan.remaining_balance, true)}.`;
        isValid = false;
      }
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Please select a payment date";
      isValid = false;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = "Payment method is required.";
      isValid = false;
    }

    if (
      formData.payment_method &&
      formData.payment_method !== "cash" &&
      !formData.reference_number
    ) {
      newErrors.reference_number = "Reference number is required for non-cash payments";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Construct dataToSubmit with the correct types for PaymentFormData
      const dataToSubmit: PaymentFormData = {
        loan_id: formData.loan_id,
        amount: parseFloat(String(formData.amount).replace(/,/g, "")) || 0, // Ensure it's a number
        payment_date: formData.payment_date,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        notes: formData.notes,
      };

      // Clean up optional fields if they are empty, assuming PaymentFormData might have them as optional
      if (dataToSubmit.reference_number === "") {
        delete (dataToSubmit as Partial<PaymentFormData>).reference_number;
      }
      if (dataToSubmit.notes === "") {
        delete (dataToSubmit as Partial<PaymentFormData>).notes;
      }

      onSubmit(dataToSubmit);
    }
  };

  const getLoanDisplayLabel = (loan: Loan): string => {
    return `ID: ${loan.id} (Bal: ${formatCurrency(loan.remaining_balance, true)}, Term: ${loan.term_months}m)`;
  };
  
  const currentlySelectedClient = clients.find(c => c.id === selectedClientId);

  console.log("Selected Loan for button logic:", selectedLoan);
  if (selectedLoan) {
    console.log("installment_amount:", selectedLoan.installment_amount, typeof selectedLoan.installment_amount);
    console.log("remaining_balance:", selectedLoan.remaining_balance, typeof selectedLoan.remaining_balance);
    const isDisabledByCondition = !selectedLoan || !selectedLoan.installment_amount || selectedLoan.installment_amount <= 0 || (selectedLoan.remaining_balance !== undefined && selectedLoan.installment_amount > selectedLoan.remaining_balance);
    console.log("Calculated isDisabledByCondition for Next Term:", isDisabledByCondition);
  }

  const paymentOptionButtons = [
    {
      id: "custom" as PaymentOptionType,
      label: "Custom Amount",
      icon: FiDollarSign,
      disabled: !selectedLoan,
    },
    {
      id: "nextTerm" as PaymentOptionType,
      label: `Next Term (${formatCurrency(selectedLoan?.installment_amount, true)})`,
      icon: FiChevronsRight,
      disabled: 
        !selectedLoan || 
        !selectedLoan.installment_amount || 
        parseFloat(String(selectedLoan.installment_amount)) <= 0 || 
        (selectedLoan.remaining_balance !== undefined && 
          parseFloat(String(selectedLoan.installment_amount)) > parseFloat(String(selectedLoan.remaining_balance))
        ),
    },
    {
      id: "full" as PaymentOptionType,
      label: `Pay Full (${formatCurrency(selectedLoan?.remaining_balance, true)})`,
      icon: FiRepeat,
      disabled: 
        !selectedLoan || 
        !selectedLoan.remaining_balance || 
        parseFloat(String(selectedLoan.remaining_balance)) <= 0,
    },
  ];

  return (
    <div className="space-y-6 p-1">
      <div className="pb-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData.id || initialData.loan_id
            ? "Edit Payment Record"
            : "Record New Payment"}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the payment details below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <FiUser className="text-primary h-5 w-5" />
            <h4 className="text-sm font-semibold text-foreground">
              Client & Loan Selection
            </h4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_id" className="text-sm font-medium">
              Select Client <span className="text-red-500">*</span>
            </Label>
            {clientsLoading && (
              <div className="flex items-center text-sm text-muted-foreground p-2">
                <FiLoader className="animate-spin mr-2 h-4 w-4" /> Loading clients...
              </div>
            )}
            {!clientsLoading && clientsError && (
              <div className="p-3 my-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200 flex items-start">
                <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Error loading clients</p>
                  <p className="text-xs">{clientsError}</p>
                </div>
              </div>
            )}
             {!clientsLoading && !clientsError && clients.length > 0 && (
              <div className="relative">
                <Select
                  value={selectedClientId?.toString() || ""}
                  onValueChange={handleClientChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="client_id"
                    className={`w-full ${errors.client_id ? "border-red-500" : "border-border"}`}
                  >
                    <SelectValue placeholder="Select a client...">
                      {currentlySelectedClient
                        ? `${currentlySelectedClient.first_name} ${currentlySelectedClient.last_name}`
                        : "Select a client..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {`${client.first_name} ${client.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {errors.client_id && (
              <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                <FiAlertCircle className="w-4 h-4" /> {errors.client_id}
              </p>
            )}
          </div>

          {selectedClientId && (
            <div className="space-y-2">
              <Label htmlFor="loan_id" className="text-sm font-medium">
                Select Loan for Client <span className="text-red-500">*</span>
              </Label>
              {loansLoading && (
                <div className="flex items-center text-sm text-muted-foreground p-2">
                  <FiLoader className="animate-spin mr-2 h-4 w-4" /> Loading loans...
                </div>
              )}
              {!loansLoading && loansError && (
                 <div className="p-3 my-2 text-sm text-red-700 bg-red-100 rounded-md border border-red-200 flex items-start">
                    <FiAlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p className="text-xs">{loansError}</p>
                  </div>
              )}
              {!loansLoading && !loansError && loansByClient.length > 0 && (
                <div className="relative">
                  <Select
                    value={formData.loan_id?.toString() || ""}
                    onValueChange={handleLoanChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger
                      id="loan_id"
                      className={`w-full ${errors.loan_id ? "border-red-500" : "border-border"}`}
                    >
                      <SelectValue placeholder="Select a loan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loansByClient.map((loan) => (
                        <SelectItem key={loan.id} value={loan.id.toString()}>
                          {getLoanDisplayLabel(loan)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {errors.loan_id && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <FiAlertCircle className="w-4 h-4" /> {errors.loan_id}
                </p>
              )}
            </div>
          )}
          
          {selectedLoan && (
            <div className="p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50 mt-3">
              <h4 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center">
                <FiBriefcase className="mr-2 h-4 w-4" />
                Selected Loan Details:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div><span className="text-muted-foreground">Client:</span><span className="ml-1 font-medium text-foreground">{currentlySelectedClient?.first_name} {currentlySelectedClient?.last_name}</span></div>
                <div><span className="text-muted-foreground">Loan ID:</span><span className="ml-1 font-medium text-foreground">{selectedLoan.id}</span></div>
                <div><span className="text-muted-foreground">Loan Amount:</span><span className="ml-1 font-medium text-foreground">{formatCurrency(selectedLoan.loan_amount)}</span></div>
                <div><span className="text-muted-foreground">Balance:</span><span className="ml-1 font-bold text-primary">{formatCurrency(selectedLoan.remaining_balance, true)}</span></div>
                {selectedLoan.installment_amount && <div><span className="text-muted-foreground">Installment:</span><span className="ml-1 font-medium text-foreground">{formatCurrency(selectedLoan.installment_amount)}</span></div>}
                <div><span className="text-muted-foreground">Status:</span> <span className={`capitalize font-semibold ${selectedLoan.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>{selectedLoan.status}</span></div>
              </div>
            </div>
          )}
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
                  variant={paymentOptionType === option.id ? "default" : "outline"}
                  onClick={() => {
                    if (option.disabled) return;
                    setPaymentOptionType(option.id as PaymentOptionType);
                  }}
                  disabled={isSubmitting || option.disabled}
                  className={`flex-grow md:flex-grow-0 items-center gap-2 transition-all duration-200 hover:shadow-md ${paymentOptionType === option.id ? 'ring-2 ring-primary ring-offset-1 dark:ring-offset-background' : ''} ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  size="sm"
                >
                  <option.icon className={`h-4 w-4 ${paymentOptionType === option.id ? '' : 'text-muted-foreground'}`} />
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
                  readOnly={paymentOptionType !== "custom" || isSubmitting || !selectedLoan}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${errors.amount ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-border"} ${paymentOptionType !== 'custom' ? 'bg-muted/50 cursor-not-allowed dark:bg-muted/20' : ''}`}
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
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${errors.payment_date ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-border"}`}
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
                  className={`w-full ${errors.payment_method ? "border-red-500" : "border-border"}`}
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
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${errors.reference_number ? "border-red-500 bg-red-50 dark:bg-red-900/20" : "border-border"}`}
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
            disabled={isSubmitting || !selectedLoan || clientsLoading || loansLoading}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <FiLoader className="animate-spin h-4 w-4" />
            ) : (
              <FiCheck className="h-4 w-4" />
            )}
            {initialData.id || initialData.loan_id ? "Update Payment" : "Record Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;