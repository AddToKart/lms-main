import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActiveLoans,
  getLoanById,
  createLoan,
  updateLoan,
  deleteLoan,
} from "../services/loanService";
import type { Loan as ServiceLoan, LoanFilters } from "../services/loanService";

// Re-export the Loan interface from service
export type { Loan } from "../services/loanService";

// Custom hook for fetching active loans
export const useActiveLoans = () => {
  return useQuery({
    queryKey: ["loans", "active"],
    queryFn: async () => {
      console.log("Fetching active loans from API..."); // Debug log

      try {
        const response = await getActiveLoans();
        console.log("API Response:", response); // Debug log

        // Ensure we return an array
        if (response.success && Array.isArray(response.data)) {
          return response.data as ServiceLoan[];
        }

        console.warn("Invalid response format:", response);
        return [] as ServiceLoan[];
      } catch (error) {
        console.error("API Error:", error);
        // Return empty array instead of throwing
        return [] as ServiceLoan[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
    retry: 1,
    retryOnMount: false,
  });
};

// Custom hook for fetching loans with filters
export const useLoans = (filters: LoanFilters) => {
  return useQuery({
    queryKey: ["loans", filters],
    queryFn: async () => {
      try {
        const { getLoans } = await import("../services/loanService");
        const response = await getLoans(filters);
        return response.data;
      } catch (error) {
        console.error("Error fetching loans:", error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Custom hook for fetching a single loan
export const useLoan = (id: number) => {
  return useQuery({
    queryKey: ["loans", id],
    queryFn: async () => {
      const response = await getLoanById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Custom hook for creating loans
export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanData: any) => {
      const response = await createLoan(loanData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch loans
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error creating loan:", error);
    },
  });
};

// Custom hook for updating loans
export const useUpdateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await updateLoan(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific loan in cache
      queryClient.setQueryData(["loans", variables.id], data);
      // Invalidate loans list to refresh
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error updating loan:", error);
    },
  });
};

// Custom hook for deleting loans
export const useDeleteLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deleteLoan(id);
      return response.data;
    },
    onSuccess: (_, deletedId) => {
      // Remove the loan from cache
      queryClient.removeQueries({ queryKey: ["loans", deletedId] });
      // Invalidate loans list to refresh
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error deleting loan:", error);
    },
  });
};

// Add hooks for loan approval/rejection
export const useApproveLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      approvalData,
    }: {
      id: number;
      approvalData: { approved_amount: number; approval_notes?: string };
    }) => {
      const { approveLoan } = await import("../services/loanService");
      const response = await approveLoan(id, approvalData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific loan in cache
      queryClient.setQueryData(["loans", variables.id], data);
      // Invalidate loans list to refresh
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error approving loan:", error);
    },
  });
};

export const useRejectLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
    }: {
      id: number;
      rejectionReason?: string;
    }) => {
      const { rejectLoan } = await import("../services/loanService");
      const response = await rejectLoan(id, rejectionReason);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the specific loan in cache
      queryClient.setQueryData(["loans", variables.id], data);
      // Invalidate loans list to refresh
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error rejecting loan:", error);
    },
  });
};
