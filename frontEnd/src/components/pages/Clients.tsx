import React, { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Client, ClientFilters, ClientFormData, ClientDetailsData } from "../../types/client"; // Added ClientDetailsData
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getClientDetailsById, // Added getClientDetailsById
} from "../../services/clientService";
import ClientForm from "../forms/ClientForm";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiFilter,
  FiUser,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiUserMinus,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiEye,
  FiMoreVertical,
  FiTrendingUp,
  FiDownload,
  FiDollarSign, // Added for currency display
  FiCreditCard, // Added for loan type icon
  FiAlertTriangle, // Added for overdue status
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

// Add extended interface for editing client with ID
interface ClientFormDataWithId extends ClientFormData {
  id: number;
}

// Local interfaces ClientLoan, ClientUpcomingPayment, and ClientDetailsData removed.
// These are now imported from '../../types/client'.

// Modal component for confirmation dialogs
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

// Modal for client form
interface FormModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "default" | "large" | "xlarge" | "full"; // Added size prop
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  size = "default", // Default size
}) => {
  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case "large":
        return "max-w-6xl";
      case "xlarge":
        return "max-w-7xl";
      case "full":
        return "max-w-full w-full h-full";
      default:
        return "max-w-4xl";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      <Card
        className={`relative w-full ${getSizeClass()} max-h-[90vh] overflow-hidden shadow-2xl border-border/50 bg-background/95 backdrop-blur-xl animate-scale-in`}
      >
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-primary" />
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
        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] thin-scrollbar">
          {children}
        </CardContent>
      </Card>
    </div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning" | "danger";
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  variant,
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
          {value.toLocaleString()}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <FiTrendingUp className="w-3 h-3 text-green-500" />
          <span className="text-xs text-muted-foreground">
            +12% from last month
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

// ClientDetailsModal Component (New - extracted)
interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientDetails: ClientDetailsData | null;
  isFetchingClientDetails: boolean;
  fetchClientDetailsError: string | null;
  // Pass helper functions if they are not globally available or defined in a shared utility
  formatDate: (dateString: string) => string;
  getStatusBadge: (status: string) => React.ReactNode;
}

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  clientDetails,
  isFetchingClientDetails,
  fetchClientDetailsError,
  formatDate,
  getStatusBadge,
}) => {
  if (!isOpen) return null;

  // Early return if modal is open but no client details yet AND not fetching (implies an issue)
  // Or, if there's an error and no clientDetails to display partially.
  // This logic might need refinement based on how optimistic updates are handled.
  if (!clientDetails && !isFetchingClientDetails && !fetchClientDetailsError) return null;
  // If there's an error and no client details at all, we might want to show a simpler error modal
  // or let the main content area handle the error display if clientDetails is partially available.

  return (
    <FormModal
      isOpen={isOpen}
      title={clientDetails ? `Client Details: ${clientDetails.first_name} ${clientDetails.last_name}` : "Client Details"}
      onClose={onClose}
      size="large" // Use the new size prop for a "big modal"
    >
      {isFetchingClientDetails && (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">Loading client details...</p>
        </div>
      )}
      {fetchClientDetailsError && !isFetchingClientDetails && (
        <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-md">
          <div className="flex items-center">
            <FiAlertTriangle className="h-6 w-6 text-destructive mr-3" />
            <h3 className="text-lg font-semibold text-destructive">Error Fetching Details</h3>
          </div>
          <p className="mt-2 text-destructive/80">{fetchClientDetailsError}</p>
          <Button variant="outline" onClick={onClose} className="mt-4 hover-lift">
            Close
          </Button>
        </div>
      )}
      {!isFetchingClientDetails && !fetchClientDetailsError && clientDetails && (
        <div className="p-2 space-y-6 animate-scale-in">
        {" "}
        {/* Removed max-w-6xl from here */}
        {/* Client Info Summary */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FiUser className="text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Full Name:
              </span>
              <p className="text-foreground">
                {clientDetails.first_name} {clientDetails.last_name}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Email:</span>
              <p className="text-foreground">{clientDetails.email || "N/A"}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Phone:</span>
              <p className="text-foreground">{clientDetails.phone || "N/A"}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Address:
              </span>
              <p className="text-foreground">
                {clientDetails.address || "N/A"}
                {clientDetails.country && `, ${clientDetails.country}`}
                {clientDetails.state && `, ${clientDetails.state}`}
              </p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Status:</span>
              {/* Changed <p> to <div> to avoid nesting div (from Badge) inside p */}
              <div>{getStatusBadge(clientDetails.status)}</div>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Joined:</span>
              <p className="text-foreground">
                {formatDate(clientDetails.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Loans
              </CardTitle>
              <FiCreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clientDetails.active_loans_count}
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Remaining Balance
              </CardTitle>
              <FiDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {clientDetails.total_remaining_balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Upcoming Payments Due
              </CardTitle>
              <FiCalendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {clientDetails.total_upcoming_payments_amount.toLocaleString(
                  undefined,
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Active Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FiCreditCard className="text-primary" />
              Active Loans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientDetails.loans.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientDetails.loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>{loan.id}</TableCell>
                      <TableCell>{loan.loan_type}</TableCell>
                      <TableCell className="text-right">
                        $
                        {loan.loan_amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {loan.remaining_balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {loan.interest_rate.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        {loan.next_due_date ? formatDate(loan.next_due_date) : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            loan.status === "Overdue"
                              ? "danger"
                              : loan.status === "Paid"
                              ? "success"
                              : "outline"
                          }
                          className={
                            loan.status === "Overdue"
                              ? "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30"
                              : loan.status === "Paid"
                              ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
                              : ""
                          }
                        >
                          {loan.status === "Overdue" && (
                            <FiAlertTriangle className="mr-1 h-3 w-3" />
                          )}
                          {loan.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No active loans found for this client.
              </p>
            )}
          </CardContent>
        </Card>
        {/* Upcoming Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FiCalendar className="text-primary" />
              Upcoming Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientDetails.upcoming_payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan ID</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientDetails.upcoming_payments.map((payment) => (
                    <TableRow key={payment.loan_id + payment.due_date}>
                      <TableCell>{payment.loan_id}</TableCell>
                      <TableCell>{payment.loan_type}</TableCell>
                      <TableCell className="text-right">
                        $
                        {payment.amount_due.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{formatDate(payment.due_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming payments found for this client.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose} className="hover-lift">
            <FiX className="mr-2 h-4 w-4" /> Close
          </Button>
        </div>
        </div>
      )}
    </FormModal>
  );
};

const Clients: React.FC = () => {
  // State for clients data and pagination
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State for filtering and pagination
  const [filters, setFilters] = useState<ClientFilters>({
    page: 1,
    limit: 10,
    search: "",
    status: "",
  });

  // State for client form - fix type to include ID
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] =
    useState<Partial<ClientFormDataWithId> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isFetchingClientDetails, setIsFetchingClientDetails] = useState(false);
  const [fetchClientDetailsError, setFetchClientDetailsError] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  // State for Client Details Modal
  const [selectedClientForDetails, setSelectedClientForDetails] =
    useState<ClientDetailsData | null>(null);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] =
    useState(false);

  const queryClient = useQueryClient();

  // Fetch clients on component mount and when filters change
  useEffect(() => {
    fetchClients();
  }, [filters]);

  // Function to fetch clients from API
  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getClients(filters);
      setClients(response.data.clients);
      setTotalClients(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      setError("Failed to fetch clients. Please try again later.");
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  // Handle status filter change - fix type casting
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as "" | "active" | "inactive" | "blacklisted";
    setFilters((prev) => ({ ...prev, status: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  // Open form for creating a new client
  const handleAddClient = () => {
    setEditingClient(null);
    setShowClientForm(true);
  };

  // Open form for editing a client - fix type
  const handleEditClient = (client: Client) => {
    const clientData: ClientFormDataWithId = {
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      postal_code: client.postal_code || "",
      country: client.country,
      id_type: client.id_type || "",
      id_number: client.id_number || "",
      status: client.status,
    };

    setEditingClient(clientData);
    setShowClientForm(true);
  };

  // Handle client form submission
  const handleClientSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);

    try {
      if (editingClient && editingClient.id) {
        // Update existing client
        await updateClient(editingClient.id, data);
      } else {
        // Create new client
        await createClient(data);
      }

      // Refresh client list
      fetchClients();
      setShowClientForm(false);
    } catch (err) {
      console.error("Error saving client:", err);
      // Error handling would be implemented here
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open delete confirmation modal
  const handleDeleteClick = (id: number) => {
    setClientToDelete(id);
    setDeleteConfirmOpen(true);
  };

  // Handle client deletion
  const handleDeleteConfirm = async () => {
    if (clientToDelete === null) return;

    try {
      await deleteClient(clientToDelete);
      fetchClients();
    } catch (err) {
      console.error("Error deleting client:", err);
      // Error handling would be implemented here
    } finally {
      setDeleteConfirmOpen(false);
      setClientToDelete(null);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid Date";
    }
  };

  // Handle opening client details modal
  const handleViewClientDetails = async (client: Client) => {
    setIsFetchingClientDetails(true);
    setFetchClientDetailsError(null);
    // Set basic client info immediately for a better UX, details will load in
    setSelectedClientForDetails({
      ...client, // Spread basic client info
      loans: [], // Initialize with empty arrays
      upcoming_payments: [],
      active_loans_count: 0,
      total_remaining_balance: 0,
      total_upcoming_payments_amount: 0,
      // Ensure all other ClientDetailsData fields are present if not in Client
      // For example, if ClientDetailsData has fields not in Client and not fetched yet:
      // some_other_detail_field: 'Loading...',
    });
    setIsClientDetailsModalOpen(true); // Open modal, it can show loading state

    try {
      const response = await getClientDetailsById(client.id);
      if (response.success && response.data) {
        setSelectedClientForDetails(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch client details");
      }
    } catch (err: any) {
      console.error("Error fetching client details:", err);
      setFetchClientDetailsError(
        err.message || "An unexpected error occurred while fetching client details."
      );
      // Optionally, close the modal or keep it open with an error message
      // For now, we keep it open, and the modal should display the error
      // If the modal was opened optimistically, ensure it shows an error state
      // or provide a way for the user to close it if data loading fails.
    } finally {
      setIsFetchingClientDetails(false);
    }
  };

  // Function to refresh client details if the modal for them is open
  const refreshOpenClientDetails = useCallback(
    (clientIdFromEvent: number) => {
      if (
        isClientDetailsModalOpen &&
        selectedClientForDetails &&
        selectedClientForDetails.id === clientIdFromEvent
      ) {
        console.log(
          `Refreshing client details for client ID: ${clientIdFromEvent} due to paymentMade event.`
        );
        queryClient.invalidateQueries({
          queryKey: ["clientDetails", clientIdFromEvent],
        });
      }
    },
    [isClientDetailsModalOpen, selectedClientForDetails, queryClient]
  );

  // Effect to listen for paymentMade events
  useEffect(() => {
    const handlePaymentMade = (event: Event) => {
      // Type assertion for CustomEvent
      const customEvent = event as CustomEvent<{ clientId: number; loanId: number }>;
      if (customEvent.detail && typeof customEvent.detail.clientId === 'number') {
        console.log('PaymentMade event received in Clients.tsx for client:', customEvent.detail.clientId); // For debugging
        refreshOpenClientDetails(customEvent.detail.clientId);
      }
    };

    window.addEventListener('paymentMade', handlePaymentMade);
    return () => {
      window.removeEventListener('paymentMade', handlePaymentMade);
    };
  }, [refreshOpenClientDetails]); // Dependency: refreshOpenClientDetails

  // Calculate stats
  const activeClients = clients.filter(
    (client) => client.status === "active"
  ).length;
  const inactiveClients = clients.filter(
    (client) => client.status === "inactive"
  ).length;
  const blacklistedClients = clients.filter(
    (client) => client.status === "blacklisted"
  ).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
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
      case "inactive":
        return (
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white/70 rounded-full mr-1.5"></div>
            Inactive
          </Badge>
        );
      case "blacklisted":
        return (
          <Badge
            variant="danger"
            className="bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md"
          >
            <div className="w-2 h-2 bg-white rounded-full mr-1.5"></div>
            Blacklisted
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      {/* Enhanced Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 animate-slide-down">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:16px_16px]"></div>
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <FiUsers className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Client Management
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage and track all your clients in one centralized platform
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
              onClick={handleAddClient}
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg shadow-primary/25 hover-lift pulse-glow"
            >
              <FiPlus className="mr-2 h-5 w-5" />
              Add New Client
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        <div className="stagger-item">
          <StatsCard
            title="Total Clients"
            value={totalClients}
            icon={<FiUsers className="h-5 w-5" />}
            variant="default"
          />
        </div>
        <div className="stagger-item">
          <StatsCard
            title="Active Clients"
            value={activeClients}
            icon={<FiUserCheck className="h-5 w-5" />}
            variant="success"
          />
        </div>
        <div className="stagger-item">
          <StatsCard
            title="Inactive Clients"
            value={inactiveClients}
            icon={<FiUserX className="h-5 w-5" />}
            variant="warning"
          />
        </div>
        <div className="stagger-item">
          <StatsCard
            title="Blacklisted"
            value={blacklistedClients}
            icon={<FiUserMinus className="h-5 w-5" />}
            variant="danger"
          />
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="hover-lift animate-scale-in border-border/50 bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Search & Filters</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="hover-lift">
              <FiMoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <Input
                placeholder="Search clients by name, email, or phone..."
                value={filters.search}
                onChange={handleSearchChange}
                className="pl-12 h-12 text-base border-border/50 focus:border-primary/50 bg-background transition-all duration-200 hover:shadow-md focus:shadow-lg"
              />
            </div>
            <div className="relative min-w-[220px]">
              <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="w-full pl-12 pr-4 h-12 text-base border border-border/50 bg-background rounded-md focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 hover:shadow-md appearance-none cursor-pointer"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Card className="border-destructive animate-bounce-in">
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Content */}
      {loading ? (
        <Card className="animate-scale-in border-border/50">
          <CardContent className="p-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary absolute top-0 left-0"></div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Loading clients...</p>
                <p className="text-sm text-muted-foreground">
                  Please wait while we fetch your data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card className="animate-fade-in-left border-border/50 bg-gradient-to-br from-background to-muted/10">
          <CardContent className="p-16">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center animate-bounce-in">
                  <FiUsers className="w-12 h-12 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <FiPlus className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold">
                  {filters.search || filters.status
                    ? "No clients found"
                    : "No clients yet"}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {filters.search || filters.status
                    ? "Try adjusting your search criteria or filters to find what you're looking for"
                    : "Get started by adding your first client to begin managing your loan portfolio"}
                </p>
              </div>
              {!filters.search && !filters.status && (
                <Button
                  onClick={handleAddClient}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
                >
                  <FiPlus className="mr-2 h-5 w-5" />
                  Add Your First Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="hover-lift animate-fade-in-right border-border/50 bg-gradient-to-br from-background via-background to-muted/5 overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FiUsers className="w-5 h-5 text-primary" />
                Client Directory
                <Badge variant="secondary" className="ml-2">
                  {totalClients} total
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="hover-lift">
                  <FiEye className="w-4 h-4 mr-2" />
                  View Options
                </Button>
              </div>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-muted/30">
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Joined</TableHead>
                <TableHead className="text-right font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-muted/40 transition-all duration-300 border-border/30 group stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md">
                        {client.first_name.charAt(0)}
                        {client.last_name.charAt(0)}
                      </div>
                      <div>
                        <div
                          className="font-semibold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                          onClick={() => handleViewClientDetails(client)}
                        >
                          {client.first_name} {client.last_name}
                        </div>
                        {client.id_type && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span className="font-medium">
                              {client.id_type}:
                            </span>
                            <span>{client.id_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {client.email && (
                        <div className="flex items-center space-x-2 text-sm group-hover:text-primary transition-colors">
                          <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <FiMail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="truncate max-w-[200px]">
                            {client.email}
                          </span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center space-x-2 text-sm group-hover:text-primary transition-colors">
                          <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <FiPhone className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <FiMapPin className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-foreground">
                        {client.city && client.country
                          ? `${client.city}, ${client.country}`
                          : client.country || client.city || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(client.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <FiCalendar className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-foreground">
                        {formatDate(client.created_at)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end space-x-1 transition-opacity duration-300">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClient(client)}
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary hover-lift"
                        title="Edit Client"
                      >
                        <FiEdit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(client.id)}
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover-lift"
                        title="Delete Client"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-gradient-to-r from-muted/20 to-transparent animate-fade-in">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {clients.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {totalClients}
                </span>{" "}
                clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page! - 1)}
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
                  onClick={() => handlePageChange(filters.page! + 1)}
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

      {/* Client Details Modal - Render the new component */}
      <ClientDetailsModal
        isOpen={isClientDetailsModalOpen}
        onClose={() => {
          setIsClientDetailsModalOpen(false);
          setFetchClientDetailsError(null); // Clear error when closing modal
        }}
        clientDetails={selectedClientForDetails}
        isFetchingClientDetails={isFetchingClientDetails}
        fetchClientDetailsError={fetchClientDetailsError}
        formatDate={formatDate} // Pass formatDate function
        getStatusBadge={getStatusBadge} // Pass getStatusBadge function
      />

      {/* Modals with enhanced animations */}
      <FormModal
        isOpen={showClientForm}
        title={editingClient ? "Edit Client" : "Add New Client"}
        onClose={() => setShowClientForm(false)}
      >
        <div className="animate-scale-in">
          <ClientForm
            initialData={editingClient || {}}
            onSubmit={handleClientSubmit}
            onCancel={() => setShowClientForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and will remove all associated data."
        confirmText="Delete Client"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default Clients;
