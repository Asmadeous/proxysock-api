import railsApi from "../lib/railsApi";
import { Transaction } from "../types/index";

// Fetch transactions
export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const response = await railsApi.get<{ transactions: Transaction[] } | Transaction[]>(
      "/billing/transactions"
    );

    const data = response.data;
    return Array.isArray(data) ? data : data.transactions || [];
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return null;
  }
};

// Fetch billing history
export const fetchBillingHistory = async (): Promise<any[] | null> => {
  try {
    const response = await railsApi.get("/billing/history");
    return response.data.history || response.data || [];
  } catch (error) {
    console.error("Error fetching billing history:", error);
    return null;
  }
};

// Fetch wallet balance
export const fetchWalletBalance = async (): Promise<number> => {
  try {
    const response = await railsApi.get<{ balance: number }>("/billing/balance");
    return response.data.balance || 0;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
};