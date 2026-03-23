# Wallet & Financial System

ProxySock uses a production-grade, immutable transaction ledger to ensure absolute precision in financial reporting and reseller balances.

## ⚖️ Immutable Ledger Architecture

The balance of a Reseller or User is **never** a standalone mutable column. Instead:
1.  Every financial event (Deposit, Purchase, Refund, Payout) is recorded as a new row in the `Transactions` table.
2.  The `Wallet` balance is a cached rollup of these transactions.
3.  Database constraints and application-level logic prevent the deletion or modification of historic transactions.

---

## 🏦 Wallet Types

### 1. Main Wallet (`wallet_type: 'main'`)
- Used for all inbound deposits and outbound service purchases.
- Primary balance used by API-only resellers.

### 2. Earnings Wallet (`wallet_type: 'earnings'`)
- Exists for Enterprise Resellers.
- Accrues profit shares from customer purchases.
- Funds in this wallet can be requested for **Payout**.

---

## 💸 Transaction Types

- **`credit`**: Funds entering the system (via Deposit or Refund).
- **`debit`**: Funds leaving the system (via Purchase or Payout).
- **`pending`**: Gateway payment initiated but not yet confirmed.
- **`success`**: Transaction confirmed and finalized.
- **`failed` / `cancelled`**: Terminal states for unsuccessful payments.

---

## 🔁 Payout Process (Enterprise)
Resellers can utilize their earnings balance:
1.  Reseller requests a payout in the dashboard.
2.  A `payout` transaction is created with status `pending`.
3.  Admin reviews and approves the payout.
4.  Funds are transferred externally and the transaction is marked `success`.

---

## 🛡️ Concurrency & Integrity
We use **Pessimistic Locking** (`lock!`) during checkout and deposit processing to ensure that no race conditions can lead to duplicate spending or over-crediting.
