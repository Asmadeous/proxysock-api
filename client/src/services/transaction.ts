import api from "./api";
import { Transaction } from "../types/index";

export const fetchTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const { data } = await api.get("/web/api/billing/transactions");
    return data.transactions || data || [];
  } catch (error) {
    console.error("Error fetching transactions:", error instanceof Error ? error.message : String(error));
    return null;
  }
};