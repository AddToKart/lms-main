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
  // ApiResponse, // Assuming ApiResponse is exported from loanService or a types file
} from "../../services/loanService";

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

const PaymentForm: React.FC<PaymentFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    loan_id: initialData.loan_id || 0,
    amount: initialData.amount?.toString() || "",
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
    Partial<Record<keyof PaymentFormData | "client_id", string>>
  >({});

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
          } else {
            const errorMsg = `Could not determine client for initial loan (ID: ${initialData.loan_id}).`;
            console.error(errorMsg, loanResponse.message);
            setClientsError(errorMsg + " Please select client manually or check loan data.");
          }
        } else if (initialData.client_id) {
          setSelectedClientId(initialData.client_id);
        }
      } else {
        setClientsError(response.message || "Failed to load clients.");
        setClients([]);
      }
    } catch (error: any) {
      console.error("Error fetching clients:", error);
      setClientsError(error.message || "An unexpected error occurred while fetching clients.");
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, [initialData.loan_id, initialData.client_id]);

  useEffect(() => {
    fetchClientsAndInitialLoanClient();
  }, [fetchClientsAndInitialLoanClient]);

  const fetchLoansForClient = useCallback(async (clientIdToFetch?: number) => {
    const currentClientId = clientIdToFetch || selectedClientId;
    if (!currentClientId) {
      setLoansByClient([]);
      setSelectedLoan(null);
      if (formData.loan_id !== 0) {
        setFormData((prev) => ({ ...prev, loan_id: 0 }));
      }
      return;
    }

    setLoansLoading(true);
    setLoansError("");
    try {
      const filters: LoanFilters = {
        client_id: currentClientId,
        status: "active",
        limit: 100, // Fetch up to 100 active loans for the client
      };
      const response = await getLoans(filters);
      // Assuming getLoans returns PaginatedResponse<Loan> within 'data'
      if (response.success && response.data && Array.isArray(response.data.loans)) {
        const fetchedLoans = response.data.loans;
        setLoansByClient(fetchedLoans);

        if (fetchedLoans.length === 0) {
          setLoansError("No active loans found for this client.");
        }

        // If editing, try to pre-select the loan
        if (initialData.loan_id && currentClientId === (initialData.client_id || (selectedLoan?.client_id))) {
          const loanToSelect = fetchedLoans.find(l => l.id === initialData.loan_id);
          if (loanToSelect) {
            setSelectedLoan(loanToSelect);
            if (formData.loan_id !== initialData.loan_id) {
              setFormData(prev => ({ ...prev, loan_id: initialData.loan_id! }));
            }
          } else {
            if (formData.loan_id === initialData.loan_id) {
              setSelectedLoan(null);
              setFormData(prev => ({ ...prev, loan_id: 0 }));
            }
            console.warn(`Initial loan ${initialData.loan_id} not found or not active for client ${currentClientId}.`);
          }
        } else if (selectedLoan && selectedLoan.client_id !== currentClientId) {
          setSelectedLoan(null);
          setFormData(prev => ({ ...prev, loan_id: 0 }));
        }

      } else {
        setLoansError(response.message || "Failed to load loans. Ensure the client has active loans.");
        setLoansByClient([]);
      }
    } catch (error: any) {
      console.error(`Error fetching loans for client ${currentClientId}:`, error);
      setLoansError(error.message || "An unexpected error occurred while fetching loans.");
      setLoansByClient([]);
    } finally {
      setLoansLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, initialData.loan_id, initialData.client_id, formData.loan_id]); // Removed selectedLoan from deps to avoid potential loop with setFormData

  useEffect(() => {
    if (selectedClientId) {
        fetchLoansForClient(selectedClientId);
    } else {
        setLoansByClient([]);
        setSelectedLoan(null);
    }
  }, [selectedClientId, fetchLoansForClient]);


  const handleClientChange = (clientIdStr: string) => {
    const clientId = parseInt(clientIdStr, 10);
    if (isNaN(clientId) || selectedClientId === clientId) return;

    setSelectedClientId(clientId);
    setSelectedLoan(null);
    setFormData((prev) => ({ ...prev, loan_id: 0 }));
    setLoansByClient([]);
    setLoansError("");
    if (errors.client_id) setErrors((prev) => ({ ...prev, client_id: undefined }));
    if (errors.loan_id) setErrors((prev) => ({ ...prev, loan_id: undefined }));
  };

  const handleLoanChange = (loanIdStr: string) => {
    const loanId = parseInt(loanIdStr, 10);
    if (isNaN(loanId)) {
      setSelectedLoan(null);
      setFormData((prev) => ({ ...prev, loan_id: 0 }));
      return;
    }
    const loan = loansByClient.find((l) => l.id === loanId);
    setSelectedLoan(loan || null);
    setFormData((prev) => ({ ...prev, loan_id: loanId || 0 }));
    if (errors.loan_id) setErrors((prev) => ({ ...prev, loan_id: undefined }));
  };

  const formatNumberWithCommas = (value: string | number | null | undefined): string => {
    if (value === "" || value === null || value === undefined) return "";
    const numStr = String(value).replace(/,/g, "");
    if (numStr === "" || isNaN(parseFloat(numStr))) return "";
    if (numStr.endsWith('.') && numStr.indexOf('.') === numStr.length - 1) return numStr;
    const num = parseFloat(numStr);
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let cleanValue = value.replace(/[^0-9.]/g, "");
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      cleanValue = parts[0] + "." + parts.slice(1).join("");
    }
    setFormData((prev) => ({ ...prev, amount: cleanValue }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
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
    if (!selectedClientId) {
      newErrors.client_id = "Please select a client";
    }
    if (!formData.loan_id || formData.loan_id === 0) {
      newErrors.loan_id = "Please select a loan";
    }
    const amountStr = String(formData.amount).replace(/,/g, "");
    const amountValue = parseFloat(amountStr);
    if (amountStr === "" || isNaN(amountValue) || amountValue <= 0) {
      newErrors.amount = "Please enter a valid positive amount";
    }
    if (!formData.payment_date) {
      newErrors.payment_date = "Please select a payment date";
    }
    if (!formData.payment_method) {
      newErrors.payment_method = "Please select a payment method";
    }
    if (
      formData.payment_method &&
      formData.payment_method !== "cash" &&
      !formData.reference_number
    ) {
      newErrors.reference_number = "Reference number is required for non-cash payments";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const dataToSubmit: PaymentFormData = {
        ...formData,
        loan_id: formData.loan_id!,
        amount: parseFloat(String(formData.amount).replace(/,/g, "")),
      };
      onSubmit(dataToSubmit);
    }
  };

  const getLoanDisplayLabel = (loan: Loan): string => {
    let label = `Loan ID: ${loan.id}`;
    if (loan.loan_amount) {
      label += ` (Amt: ${loan.loan_amount.toLocaleString()}`;
      if (loan.remaining_balance !== undefined && loan.remaining_balance !== null) {
        label += `, Bal: ${loan.remaining_balance.toLocaleString()})`;
      } else {
        label += `)`;
      }
    }
    return label;
  };

  const currentlySelectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6 custom-scrollbar p-1">
      <div className="pb-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-foreground">
          {initialData.id || initialData.loan_id
            ? "Edit Payment Record"
            : "New Payment Record"}
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

          {/* Client Selection */}
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
                  <Button
                    variant="link"
                    size="sm"
                    type="button"
                    className="p-0 h-auto text-xs mt-1 text-red-700 hover:text-red-800"
                    onClick={fetchClientsAndInitialLoanClient}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            {!clientsLoading && !clientsError && clients.length === 0 && (
              <div className="p-3 my-2 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200 flex items-start">
                <FiInfo className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>No clients with active loans found.</p>
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

          {/* Loan Selection */}
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
                    <div>
                      <p className="font-semibold">Error loading loans</p>
                      <p className="text-xs">{loansError}</p>
                      <Button
                        variant="link"
                        size="sm"
                        type="button"
                        className="p-0 h-auto text-xs mt-1 text-red-700 hover:text-red-800"
                        onClick={() => fetchLoansForClient(selectedClientId)}
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
              )}
              {!loansLoading && !loansError && loansByClient.length === 0 && selectedClientId && (
                <div className="p-3 my-2 text-sm text-yellow-700 bg-yellow-50 rounded-md border border-yellow-200 flex items-start">
                  <FiInfo className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>No active loans found for this client.</p>
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
           {!selectedClientId && !loansLoading && !loansError && (
             <div className="p-3 my-2 text-sm text-blue-700 bg-blue-50 rounded-md border border-blue-200 flex items-start">
                <FiInfo className="w-5 h-5 mr-2 flex-shrink-0" />
                <p>Please select a client first to see their active loans.</p>
              </div>
            )}


          {/* Selected Loan Info Box */}
          {selectedLoan && (
            <div className="p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50 mt-3">
              <h4 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center">
                <FiBriefcase className="mr-2 h-4 w-4" />
                Selected Loan Details:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Client:</span>
                  <span className="ml-1 font-medium text-foreground">
                    {currentlySelectedClient?.first_name} {currentlySelectedClient?.last_name}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan ID:</span>
                  <span className="ml-1 font-medium text-foreground">
                    {selectedLoan.id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Loan Amount:</span>
                  <span className="ml-1 font-medium text-foreground">
                    ${selectedLoan.loan_amount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Balance:</span>
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
        <div className="space-y-4 p-4 border border-border/50 rounded-lg bg-card">
          <div className="flex items-center gap-2 pb-2 border-b border-border/50">
            <FiDollarSign className="text-primary h-5 w-5" />
            <h4 className="text-sm font-semibold text-foreground">
              Payment Details
            </h4>
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
                  value={formatNumberWithCommas(formData.amount)}
                  onChange={handleAmountChange}
                  disabled={isSubmitting || !selectedLoan}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 bg-background text-foreground ${
                    errors.amount
                      ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                      : "border-border"
                  }`}
                  placeholder="Enter payment amount"
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