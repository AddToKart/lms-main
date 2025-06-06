import React, { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  getClients,
  deleteClient,
  createClient,
  updateClient,
  getClientStats,
  getClientDetailsById, // Add this import
  Client,
  ClientFormData,
  ClientFilters,
  ClientStats,
} from "../../services/clientService";
import ClientForm from "../forms/ClientForm";
import { ClientDetailsData } from "../../types/client";

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

// Stats Card Component - fix the interface
interface StatsCardProps {
  title: string;
  value: number | string;
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
          {typeof value === "number" ? value.toLocaleString() : value}
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

  // If there's an error and no client details at all, we might want to show a simpler error modal
  // or let the main content area handle the error if clientDetails is partially available.

  return (
    <FormModal
      isOpen={isOpen}
      title={
        clientDetails
          ? `Client Details: ${clientDetails.first_name} ${clientDetails.last_name}`
          : "Client Details"
      }
      onClose={onClose}
      size="large" // Use the new size prop for a "big modal"
    >
      {isFetchingClientDetails && (
        <div className="flex items-center justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-muted-foreground">
            Loading client details...
          </p>
        </div>
      )}
      {fetchClientDetailsError && !isFetchingClientDetails && (
        <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-md">
          <div className="flex items-center">
            <FiAlertTriangle className="h-6 w-6 text-destructive mr-3" />
            <h3 className="text-lg font-semibold text-destructive">
              Error Fetching Details
            </h3>
          </div>
          <p className="mt-2 text-destructive/80">{fetchClientDetailsError}</p>
          <Button
            variant="outline"
            onClick={onClose}
            className="mt-4 hover-lift"
          >
            Close
          </Button>
        </div>
      )}
      {!isFetchingClientDetails &&
        !fetchClientDetailsError &&
        clientDetails && (
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
                  <span className="font-medium text-muted-foreground">
                    Email:
                  </span>
                  <p className="text-foreground">
                    {clientDetails.email || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Phone:
                  </span>
                  <p className="text-foreground">
                    {clientDetails.phone || "N/A"}
                  </p>
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
                  <span className="font-medium text-muted-foreground">
                    Status:
                  </span>
                  {/* Changed <p> to <div> to avoid nesting div (from Badge) inside p */}
                  <div>{getStatusBadge(clientDetails.status)}</div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    Joined:
                  </span>
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
                    {clientDetails.total_remaining_balance.toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
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
              <CardContent className="p-0">
                {clientDetails.loans.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            ID
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Type
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium text-right">
                            Amount
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium text-right">
                            Remaining
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium text-right">
                            Rate
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Next Due
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientDetails.loans.map((loan) => (
                          <TableRow
                            key={loan.id}
                            className="border-b border-border/50 hover:bg-muted/50"
                          >
                            <TableCell className="h-8 px-4 py-2 text-sm font-medium">
                              {loan.id}
                            </TableCell>
                            <TableCell
                              className="h-8 px-4 py-2 text-sm max-w-[120px] truncate"
                              title={loan.loan_type}
                            >
                              {loan.loan_type}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm text-right font-medium">
                              $
                              {loan.loan_amount.toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm text-right font-medium">
                              $
                              {loan.remaining_balance.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }
                              )}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm text-right">
                              {loan.interest_rate.toFixed(1)}%
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm">
                              {loan.next_due_date
                                ? formatDate(loan.next_due_date)
                                : "N/A"}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2">
                              <Badge
                                variant={
                                  loan.status === "Overdue"
                                    ? "danger"
                                    : loan.status === "Paid"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs px-2 py-1"
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
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 px-4">
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
              <CardContent className="p-0">
                {clientDetails.upcoming_payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b">
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Loan ID
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Type
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium text-right">
                            Amount Due
                          </TableHead>
                          <TableHead className="h-10 px-4 text-xs font-medium">
                            Due Date
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientDetails.upcoming_payments.map((payment) => (
                          <TableRow
                            key={payment.loan_id + payment.due_date}
                            className="border-b border-border/50 hover:bg-muted/50"
                          >
                            <TableCell className="h-8 px-4 py-2 text-sm font-medium">
                              {payment.loan_id}
                            </TableCell>
                            <TableCell
                              className="h-8 px-4 py-2 text-sm max-w-[120px] truncate"
                              title={payment.loan_type}
                            >
                              {payment.loan_type}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm text-right font-medium">
                              $
                              {payment.amount_due.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="h-8 px-4 py-2 text-sm">
                              {formatDate(payment.due_date)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 px-4">
                    No upcoming payments found for this client.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="hover-lift"
              >
                <FiX className="mr-2 h-4 w-4" /> Close
              </Button>
            </div>
          </div>
        )}
    </FormModal>
  );
};

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClients, setTotalClients] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [clientStats, setClientStats] = useState<ClientStats>({
    // Use the imported ClientStats type
    total: 0,
    active: 0,
    inactive: 0,
    blacklisted: 0,
  });
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
  const [fetchClientDetailsError, setFetchClientDetailsError] = useState<
    string | null
  >(null);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);

  // State for Client Details Modal
  const [selectedClientForDetails, setSelectedClientForDetails] =
    useState<ClientDetailsData | null>(null);
  const [isClientDetailsModalOpen, setIsClientDetailsModalOpen] =
    useState(false);

  const queryClient = useQueryClient();

  // Fetch clients on component mount and when filters change
  useEffect(() => {
    fetchClientsAndStats();
  }, [filters]);

  // Function to fetch clients from API
  const fetchClientsAndStats = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch clients
      const clientsApiResponse = await getClients(filters);
      console.log(
        "[Clients.tsx] Raw clientsApiResponse from getClients service:",
        JSON.stringify(clientsApiResponse, null, 2)
      );
      if (
        clientsApiResponse &&
        clientsApiResponse.success &&
        clientsApiResponse.data
      ) {
        setClients(clientsApiResponse.data.clients);
        setTotalClients(clientsApiResponse.data.total);
        setTotalPages(clientsApiResponse.data.totalPages);
      } else {
        const clientsErrorMsg =
          clientsApiResponse?.message || "Failed to process client list data.";
        console.error(
          "[Clients.tsx] Error fetching clients list:",
          clientsErrorMsg,
          "Full response:",
          JSON.stringify(clientsApiResponse, null, 2)
        );
        setError(clientsErrorMsg);
        setClients([]);
        setTotalClients(0);
        setTotalPages(0);
      }

      // Fetch client stats
      const statsApiResponse = await getClientStats();
      console.log(
        "[Clients.tsx] Raw statsApiResponse from getClientStats service:",
        JSON.stringify(statsApiResponse, null, 2)
      );
      if (
        statsApiResponse &&
        statsApiResponse.success &&
        statsApiResponse.data
      ) {
        setClientStats(statsApiResponse.data); // Directly set the data if it matches ClientStats
      } else {
        const statsErrorMsg =
          statsApiResponse?.message || "Failed to process client statistics.";
        console.error(
          "[Clients.tsx] Error fetching client stats:",
          statsErrorMsg,
          "Full response:",
          JSON.stringify(statsApiResponse, null, 2)
        );
        // Optionally set error for stats or use default/fallback stats
        // For now, we'll just log the error and keep existing/default stats
      }
    } catch (err: any) {
      console.error(
        "[Clients.tsx] Exception in fetchClientsAndStats:",
        err.message,
        err.stack
      );
      setError(err.message || "An unexpected error occurred.");
      setClients([]);
      setTotalClients(0);
      setTotalPages(0);
      setClientStats({ total: 0, active: 0, inactive: 0, blacklisted: 0 }); // Reset stats on major error
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
      fetchClientsAndStats();
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
      fetchClientsAndStats();
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
  const handleViewClientDetails = useCallback(async (client: any) => {
    console.log("[Clients] Viewing details for client:", client);

    setSelectedClientForDetails(null);
    setFetchClientDetailsError("");
    setIsClientDetailsModalOpen(true);
    setIsFetchingClientDetails(true);

    try {
      console.log(`[Clients] Fetching details for client ID: ${client.id}`);
      const response = await getClientDetailsById(client.id);

      console.log("[Clients] Client details response:", response);

      if (response.success && response.data) {
        setSelectedClientForDetails(response.data);
        setFetchClientDetailsError("");
      } else {
        throw new Error(response.message || "Failed to fetch client details");
      }
    } catch (error: any) {
      console.error("[Clients] Error fetching client details:", error);
      setFetchClientDetailsError(
        error.message || "Failed to load client details"
      );
      setSelectedClientForDetails(null);
    } finally {
      setIsFetchingClientDetails(false);
    }
  }, []);

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
      const customEvent = event as CustomEvent<{
        clientId: number;
        loanId: number;
      }>;
      if (
        customEvent.detail &&
        typeof customEvent.detail.clientId === "number"
      ) {
        console.log(
          "PaymentMade event received in Clients.tsx for client:",
          customEvent.detail.clientId
        ); // For debugging
        refreshOpenClientDetails(customEvent.detail.clientId);
      }
    };

    window.addEventListener("paymentMade", handlePaymentMade);
    return () => {
      window.removeEventListener("paymentMade", handlePaymentMade);
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
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold">Client Management</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={handleAddClient}
            className="bg-primary text-white rounded-md shadow-md hover:bg-primary/90 transition-all duration-200 flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            Add New Client
          </Button>
          <Button
            variant="outline"
            className="border-primary text-primary rounded-md shadow-md hover:bg-primary/10 transition-all duration-200 flex items-center gap-2"
          >
            <FiDownload className="w-5 h-5" />
            Export Clients
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Clients"
          value={clientStats.total || 0}
          icon={<FiUsers className="w-6 h-6" />}
          variant="default"
        />
        <StatsCard
          title="Active Clients"
          value={clientStats.active || 0}
          icon={<FiUserCheck className="w-6 h-6" />}
          variant="success"
        />
        <StatsCard
          title="Inactive Clients"
          value={clientStats.inactive || 0}
          icon={<FiUserX className="w-6 h-6" />}
          variant="warning"
        />
        <StatsCard
          title="Blacklisted"
          value={clientStats.blacklisted || 0}
          icon={<FiUserMinus className="w-6 h-6" />}
          variant="danger"
        />
      </div>

      <Card className="hover-lift animate-scale-in border-border/50 bg-card">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-primary" />
              </div>
              Clients ({totalClients})
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <select
                value={filters.status}
                onChange={handleStatusChange}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklisted">Blacklisted</option>
              </select>

              <Button
                onClick={handleAddClient}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover-lift"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading clients...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-md">
              <div className="flex items-center">
                <FiAlertTriangle className="h-6 w-6 text-destructive mr-3" />
                <h3 className="text-lg font-semibold text-destructive">
                  Error Loading Clients
                </h3>
              </div>
              <p className="mt-2 text-destructive/80">{error}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-10">
              <FiUsers className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Clients Found
              </h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.status
                  ? "No clients match your current filters."
                  : "Get started by adding your first client."}
              </p>
              <Button onClick={handleAddClient} className="hover-lift">
                <FiPlus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/50">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Contact</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Joined</TableHead>
                    <TableHead className="font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewClientDetails(client)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {client.first_name?.[0]}
                              {client.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {client.first_name} {client.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {client.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.email && (
                            <div className="flex items-center space-x-1 text-sm">
                              <FiMail className="h-3 w-3 text-muted-foreground" />
                              <span
                                className="truncate max-w-[150px]"
                                title={client.email}
                              >
                                {client.email}
                              </span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center space-x-1 text-sm">
                              <FiPhone className="h-3 w-3 text-muted-foreground" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm">
                          <FiMapPin className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {[client.city, client.state, client.country]
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(client.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewClientDetails(client);
                            }}
                            className="hover-lift"
                          >
                            <FiEye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClient(client);
                            }}
                            className="hover-lift"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(client.id);
                            }}
                            className="hover-lift text-destructive hover:text-destructive"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min((filters.page - 1) * filters.limit + 1, totalClients)}{" "}
                to {Math.min(filters.page * filters.limit, totalClients)} of{" "}
                {totalClients} clients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                  className="hover-lift"
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={filters.page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="hover-lift"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                  className="hover-lift"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Form Modal */}
      <FormModal
        isOpen={showClientForm}
        title={editingClient ? "Edit Client" : "Add New Client"}
        onClose={() => setShowClientForm(false)}
      >
        <ClientForm
          initialData={editingClient || {}}
          onSubmit={handleClientSubmit}
          onCancel={() => setShowClientForm(false)}
          isSubmitting={isSubmitting}
        />
      </FormModal>

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={isClientDetailsModalOpen}
        onClose={() => {
          setIsClientDetailsModalOpen(false);
          setSelectedClientForDetails(null);
        }}
        clientDetails={selectedClientForDetails}
        isFetchingClientDetails={isFetchingClientDetails}
        fetchClientDetailsError={fetchClientDetailsError}
        formatDate={formatDate}
        getStatusBadge={getStatusBadge}
      />

      {/* Delete Confirmation Modal */}
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
