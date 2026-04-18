# Admin Dashboard — UI/UX Improvements

> Audited: 2026-04-18
> Scope: `client/src/pages/SuperAdmin/` — sidebar, overview, navigation, visual hierarchy
> Goal: Make the admin dashboard faster to navigate and more actionable

---

## Table of Contents

1. [Sidebar Grouping](#1-sidebar-grouping)
2. [Duplicate Icons](#2-duplicate-icons)
3. [Overview Tab — Actionable Dashboard](#3-overview-tab--actionable-dashboard)
4. [Stats Card Visual Hierarchy](#4-stats-card-visual-hierarchy)
5. [Global Search / Command Palette](#5-global-search--command-palette)
6. [URL Filter Persistence Across Tab Switches](#6-url-filter-persistence-across-tab-switches)
7. [Suggested Order of Work](#suggested-order-of-work)
8. [Progress Tracker](#progress-tracker)

---

## 1. Sidebar Grouping

**Severity: High — navigation clarity**

18 flat sidebar items with no visual separation force the user to scan the entire list every time. Grouping into labelled sections turns the sidebar into a scannable map.

### Proposed groups

| Group | Items |
|-------|-------|
| *(top, ungrouped)* | Overview, Analytics |
| **People** | Users, Employees, Resellers, Affiliates |
| **Commerce** | Orders, Products, Transactions, Promo Codes |
| **Content** | Blog CMS, Tickets, Support Chats, Guest Chats |
| **System** | Monitoring, Database, System Logs, Settings |

### Changes required
- `AdminSidebar.tsx` — accept `groups` prop (array of `{ label: string; items: SidebarItem[] }`) instead of a flat `items` array
- `SuperAdminDashboard.tsx` — restructure `sidebarItems` into the grouped shape
- Render a small uppercase label above each group; no label for the top ungrouped pair

---

## 2. Duplicate Icons

**Severity: Medium — visual landmarks**

Repeated icons remove the benefit of having icons at all — the eye can no longer use them as fast landmarks.

| Tab | Current icon | Fix |
|-----|-------------|-----|
| `products` | `BuildingStorefrontIcon` (same as resellers) | `CubeIcon` |
| `monitoring` | `ChartBarSquareIcon` (same as analytics) | `CpuChipIcon` |
| `guest_chats` | `ChatBubbleLeftRightIcon` (same as tickets) | `ChatBubbleOvalLeftIcon` |

### Changes required
- `SuperAdminDashboard.tsx` — swap three icon imports

---

## 3. Overview Tab — Actionable Dashboard

**Severity: High — dashboard utility**

The current overview shows numbers but doesn't help the admin act. No trend context, no alerts, no quick navigation to problems.

### Improvements

**a) Trend indicators on StatsCards**
- Show `+12% vs last week` style change on each primary stat
- `StatsCard` already accepts a `change` prop — just needs real delta data from the API

**b) "Needs Attention" alert section**
- A card at the top that surfaces: failed orders count, pending tickets, unread support chats
- Each item is a link that jumps to the relevant tab pre-filtered (e.g. `?tab=orders&status=failed`)
- Only renders if at least one alert exists; hidden when all clear

**c) Quick-action buttons on recent orders**
- "View all failed orders →" link below the recent orders table
- "Open pending tickets →" link

### Changes required
- `OverviewTab.tsx` — add attention section, trend deltas, quick-action links
- `overview.queries.ts` — extend API response type to include delta fields and alert counts (if API supports it)

---

## 4. Stats Card Visual Hierarchy

**Severity: Low — visual polish**

All `StatsCard` icons render in the same `bg-muted / text-muted-foreground` style. Adding a per-card accent color makes the grid scannable at a glance.

### Proposed accent colors

| Card | Color |
|------|-------|
| Users | blue |
| Revenue | green |
| Transactions | purple |
| Orders | orange |
| Failed Orders | red |
| Pending Orders | yellow |

### Changes required
- `StatsCard.tsx` — add optional `accent?: string` prop; render icon container with `bg-${accent}-500/10 text-${accent}-500` (use a static color map, not template literals)
- `OverviewTab.tsx` — pass accent per card

---

## 5. Global Search / Command Palette

**Severity: Medium — power user productivity**

With 18 sections of data there is no way to jump directly to e.g. "find user john@example.com" without knowing which tab to go to first. A `Cmd+K` command palette is the standard solution.

### Behaviour
- `Cmd+K` (or `Ctrl+K`) opens a modal with a search input
- Static results: jump to any tab by name
- Dynamic results (stretch): search users/orders/resellers by name/email and jump directly to that record

### Changes required
- New component `CommandPalette.tsx` in `components/`
- `SuperAdminDashboard.tsx` — mount it once; wire up `Cmd+K` keydown listener
- Phase 1 (static tab navigation) is straightforward; dynamic search requires API endpoints

---

## 6. URL Filter Persistence Across Tab Switches

**Severity: Low — quality of life**

Currently switching tabs clears all filter params — intentional for clean state but means navigating away and back loses your place (e.g. you were on page 3 of a filtered users search).

### Option
Store each tab's last-used filters in a `Map` in a Zustand store (not URL) so navigating back to a tab restores the previous filter state without polluting the URL of other tabs.

### Changes required
- New Zustand store `adminFilterStore.ts`
- `useTabFilters.ts` — read/write from store on mount/update
- Low priority; only worth doing if users complain

---

## Suggested Order of Work

| Priority | Item | Effort |
|----------|------|--------|
| 1 | Duplicate icons | 5 min |
| 2 | Sidebar grouping | 1–2 hrs |
| 3 | Overview — Needs Attention section | 1 hr |
| 4 | Overview — trend indicators | depends on API |
| 5 | StatsCard accent colors | 30 min |
| 6 | Command palette (static) | 2 hrs |
| 7 | Filter persistence across tabs | 1–2 hrs |

---

## Progress Tracker

| # | Item | Status |
|---|------|--------|
| 1 | Sidebar grouping | ✅ Done — `SidebarGroup[]` prop; 5 labelled sections (People, Commerce, Content, System); backwards-compatible `items` fallback for Employee/Reseller dashboards |
| 2 | Duplicate icons | ✅ Done — Products → CubeIcon, Monitoring → CpuChipIcon, Guest Chats → ChatBubbleOvalLeftIcon |
| 3 | Overview — Needs Attention section | ✅ Done — alert banner for failed orders, pending orders, open tickets, open support chats; each item links directly to the relevant tab pre-filtered |
| 4 | Overview — trend indicators | ⬜ Deferred — requires API delta fields not currently returned |
| 5 | StatsCard accent colors | ✅ Done — `accent` prop with static color map; blue/green/purple/orange/red/yellow applied across overview stats |
| 6 | Command palette | ✅ Done — Cmd/Ctrl+K opens palette; search + arrow key navigation + Enter to select; group labels shown; "⌘K" search button in sidebar; Escape to close |
| 7 | Filter persistence across tabs | ✅ Done — `adminFilterCache.ts` module-level Map; `handleTabChange` saves current tab filters before leaving and restores them on return; tabs with no active filters start fresh |
