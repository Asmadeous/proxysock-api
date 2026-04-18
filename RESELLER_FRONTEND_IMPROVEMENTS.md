# Reseller Dashboard — Issues & Improvement Plan

> Audited: 2026-04-18
> Scope: `client/src/pages/Reseller/` — all components, pages, and the reseller API service
> Goal: Fix production bugs, harden error handling, and improve consistency with the admin dashboard patterns

---

## Table of Contents

1. [Dynamic Tailwind Color Maps](#1-dynamic-tailwind-color-maps)
2. [Error Handling](#2-error-handling)
3. [Error Boundary](#3-error-boundary)
4. [ConfirmModal for Destructive Actions](#4-confirmmodal-for-destructive-actions)
5. [Accessibility](#5-accessibility)
6. [Loading States](#6-loading-states)
7. [TypeScript Cleanup](#7-typescript-cleanup)
8. [ResUserManagement Stub](#8-resusermanagement-stub)
9. [Suggested Order of Work](#suggested-order-of-work)
10. [Progress Tracker](#progress-tracker)

---

## 1. Dynamic Tailwind Color Maps

**Severity: Critical — breaks in production builds**

Multiple components construct Tailwind class names using template literals. Tailwind's compiler does a static scan at build time and cannot detect dynamically built class strings — they get purged and the colors disappear in production.

### Affected files

| File | Example |
|------|---------|
| `ResStore.tsx` | `` `bg-${cat.color}-500/10` ``, `` `text-${cat.color}-500` `` |
| `ResOrders.tsx` | `` `bg-${s.color}/10` `` |
| `ResManagement.tsx` | `` `bg-${product.color}-500/10` ``, `` `text-${product.color}-500` `` |
| `ResWallet.tsx` | `` `bg-${paymentGateway === "paystack" ? "primary/10" : "muted"}` `` |
| `ResProducts.tsx` | Hardcoded `"bg-emerald-600"` inline strings |

### Fix
Replace template literals with a static `COLOR_MAP` object (same pattern used in `ProductsTab.tsx`):

```ts
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
    blue:    { bg: "bg-blue-500/10",    text: "text-blue-500" },
    green:   { bg: "bg-green-500/10",   text: "text-green-500" },
    red:     { bg: "bg-red-500/10",     text: "text-red-500" },
    purple:  { bg: "bg-purple-500/10",  text: "text-purple-500" },
    orange:  { bg: "bg-orange-500/10",  text: "text-orange-500" },
    yellow:  { bg: "bg-yellow-500/10",  text: "text-yellow-500" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
    indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-500" },
};
```

---

## 2. Error Handling

**Severity: High — silent failures give users no feedback**

Every component uses one of:
- `catch { }` — empty, swallows everything
- `catch (err: any)` — typed as any, no structured extraction
- `catch (error: any)` — same

The `getApiError()` utility already exists at `client/src/pages/SuperAdmin/utils/errors.ts`. It needs to be applied consistently across all reseller components.

### Affected files & patterns

| File | Lines | Pattern |
|------|-------|---------|
| `ResOverview.tsx` | 35 | `catch (err)` — silent |
| `ResOrders.tsx` | 71 | `catch { toast.error(...) }` — untyped |
| `ResProducts.tsx` | 89 | `catch (err: any)` |
| `ResWallet.tsx` | 71, 101 | `catch (error: any)` |
| `ResSettings.tsx` | 43, 74 | `let payload: any` |
| `ResProxyManagement.tsx` | 164 | `catch (err: any)` |
| `ResVPSManagement.tsx` | 64 | `catch (error) { }` — empty |
| `ResRDPManagement.tsx` | 61 | empty catch |
| `ResWebhookConfig.tsx` | 59, 98, 112, 125 | multiple empty catches |
| `ResTickets.tsx` | 23, 42, 57 | empty catches |
| `ResellerCheckout.tsx` | multiple | mixed patterns |

### Fix
```ts
import { getApiError } from "../../SuperAdmin/utils/errors";

// Before
catch (err: any) {
    toast.error(err.response?.data?.error || "Something went wrong");
}

// After
catch (err) {
    toast.error(getApiError(err));
}
```

---

## 3. Error Boundary

**Severity: High — a single lazy-load failure crashes the whole dashboard**

`ResellerDashboard.tsx` wraps lazy-loaded tabs in `<Suspense>` but has no error boundary. If any tab throws (network error, bad data, etc.), the entire dashboard white-screens.

### Fix
Import and wrap with `AdminErrorBoundary` (already exists at `SuperAdmin/components/AdminErrorBoundary.tsx`):

```tsx
import AdminErrorBoundary from "../SuperAdmin/components/AdminErrorBoundary";

<AdminErrorBoundary>
    <Suspense fallback={<TabLoader />}>
        <ActiveComponent />
    </Suspense>
</AdminErrorBoundary>
```

---

## 4. ConfirmModal for Destructive Actions

**Severity: Medium — native browser dialogs are unthemed and inaccessible**

`ResWebhookConfig.tsx` uses `window.confirm()` for the "delete webhook" confirmation. The browser confirm dialog:
- Ignores the app's dark/light theme
- Can't be styled or branded
- Blocks the main thread
- Fails WCAG accessibility requirements

### Fix
Replace with the `ConfirmModal` component (already exists at `SuperAdmin/components/ConfirmModal.tsx`):

```tsx
// Before
if (!confirm("Are you sure you want to delete this webhook?")) return;
await deleteWebhook(id);

// After
<ConfirmModal
    open={deleteTarget !== null}
    onClose={() => setDeleteTarget(null)}
    onConfirm={() => deleteWebhook(deleteTarget!)}
    title="Delete Webhook"
    message="This will permanently remove the webhook endpoint. Any active integrations using this URL will stop receiving events."
    confirmLabel="Delete"
    destructive
/>
```

---

## 5. Accessibility

**Severity: Medium**

### 5a. Icon-only buttons missing aria-label

| File | Location | Button |
|------|----------|--------|
| `ResProxyManagement.tsx` | Modal close | `<XCircleIcon>` with no label |
| `ResVPSManagement.tsx` | Password toggle | Eye icon, no label |
| `ResRDPManagement.tsx` | Password toggle, action buttons | No labels |
| `ResApiDocs.tsx` | Category nav buttons | Icon + text but no aria on icon |

### 5b. Table headers missing scope

`ResOrders.tsx` — all `<th>` elements lack `scope="col"`.

### 5c. Custom modal in ResProxyManagement has no ARIA

Uses a raw `<div className="fixed inset-0...">` overlay with no `role="dialog"`, `aria-modal`, `aria-labelledby`. Replace with `FormModal` or add ARIA manually.

### 5d. Form inputs without label association

`ResProxyManagement.tsx` — `<label>` elements exist but are not linked to inputs via `htmlFor`/`id`.

### Fix
- Add `aria-label` to all icon-only buttons
- Add `scope="col"` to `<th>` elements
- Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to custom modals
- Wire `htmlFor` ↔ `id` on all form field pairs

---

## 6. Loading States

**Severity: Medium**

`ResOverview.tsx` has a top-level `isLoading` boolean but renders stat cards as empty while loading — no skeleton. Users see blank numbers briefly before data arrives.

### Fix
Replace the empty loading branch with skeleton cards matching the pattern from `SuperAdmin/components/TableSkeleton.tsx`:

```tsx
{isLoading ? (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)}
    </div>
) : (
    // real stats
)}
```

---

## 7. TypeScript Cleanup

**Severity: Medium**

### 7a. Untyped localStorage reads
Every component that reads from localStorage does:
```ts
JSON.parse(localStorage.getItem("resellerUser") || "{}")
```
No type safety — property access on the result is `any`. Define a `ResellerUser` interface and use it consistently.

### 7b. Loose payload types
`ResSettings.tsx` — `let payload: any` (line 43). Should be `FormData | { reseller: Record<string, string | number> }`.

### 7c. CustomEvent type
`ResellerDashboard.tsx` line 128:
```ts
const updateCartCount = (e: any) => ...
// Should be:
const updateCartCount = (e: CustomEvent<{ count: number }>) => ...
```

### 7d. API response fallbacks
`ResOrders.tsx` line 68:
```ts
r.data.orders || r.data  // assumes backend consistency
```
Should check with `Array.isArray()` guard (same pattern as overview.queries.ts).

---

## 8. ResUserManagement Stub

**Severity: Low**

`ResUserManagement.tsx` is 19 lines of non-functional UI — a search input and a "Create User" button with no handlers attached. It either needs to be implemented or removed from the sidebar entirely to avoid confusing resellers.

**Options:**
- A: Implement basic user listing + invite flow
- B: Hide from sidebar until implemented (`hidden` or feature flag)
- C: Show a proper "Coming Soon" empty state instead of broken UI

---

## Suggested Order of Work

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Dynamic Tailwind color maps | 30 min |
| 2 | Error handling — `getApiError()` across all catch blocks | 1 hr |
| 3 | Error boundary wrapping in ResellerDashboard | 15 min |
| 4 | `confirm()` → ConfirmModal in ResWebhookConfig | 30 min |
| 5 | Accessibility: aria-labels, table scopes, modal ARIA | 1 hr |
| 6 | Loading skeletons for ResOverview | 30 min |
| 7 | TypeScript cleanup | 1 hr |
| 8 | ResUserManagement — stub or implement | TBD |

---

## Progress Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Dynamic Tailwind color maps | ✅ Done |
| 2 | Error handling | ✅ Done |
| 3 | Error boundary | ✅ Done |
| 4 | ConfirmModal for destructive actions | ✅ Done |
| 5 | Accessibility | ✅ Done |
| 6 | Loading states | ✅ Done |
| 7 | TypeScript cleanup | ✅ Done |
| 8 | ResUserManagement stub | ✅ Done (Option C: Coming Soon state) |
