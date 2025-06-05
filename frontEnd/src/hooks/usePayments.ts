import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats, // Add this import
} from "../services/paymentService";
import type {
  Payment,
  PaymentFormData,
  PaymentFilters,
} from "../types/payment";

export const usePayments = (filters: PaymentFilters) => {
  return useQuery({
    queryKey: ["payments", filters],
    queryFn: async () => {
      try {
        const response = await getPayments(filters);
        return response.data;
      } catch (error) {
        console.error("Error fetching payments:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData: PaymentFormData) => {
      const response = await createPayment(paymentData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => {
      console.error("Error creating payment:", error);
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<PaymentFormData>;
    }) => {
      const response = await updatePayment(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => {
      console.error("Error updating payment:", error);
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await deletePayment(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment-stats"] });
    },
    onError: (error) => {
      console.error("Error deleting payment:", error);
    },
  });
};

// Add the missing usePaymentStats hook
export const usePaymentStats = () => {
  return useQuery({
    queryKey: ["payment-stats"],
    queryFn: async () => {
      try {
        const response = await getPaymentStats();
        return response.data;
      } catch (error) {
        console.error("Error fetching payment stats:", error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
