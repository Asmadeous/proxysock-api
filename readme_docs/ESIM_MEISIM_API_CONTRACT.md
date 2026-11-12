# eSIM API Contract: MeiSIM (frontend)

Backend changes for build-plan feature 18 (MeiSIM eSIMs). This covers every
endpoint the frontend uses for eSIMs: what changed, the exact request and
response shapes, and what to remove.

**Summary for the frontend**

1. eSIMs now come from two providers: eSIM Access (unchanged) and **MeiSIM**
   (new). Both are `product_type: "esim"`.
2. MeiSIM sells **travel data plans** and **US prepaid carrier lines** (with a
   US phone number).
3. Some US lines need **IMEI** and **EID** from the customer's phone at
   checkout. The product tells you which (`requires_imei`, `requires_eid`, `accepts_address`).
4. **USA eSIM (`product_type: "usa_esim"`) is gone**, and so are the
   Lyca/Colt/Lebara inventory eSIMs and the admin USA eSIM credential screens.
5. Ordered US lines return a `phone_number`.

---

## 1. Conventions

| API | Base path | Auth header |
|---|---|---|
| Storefront / user dashboard | `/web/api` | `Authorization: Bearer <user JWT>` from `POST /web/api/auth/login` |
| Reseller API | `/api/v1` | `Authorization: Bearer <reseller JWT>` |
| Admin | `/admin/api` | `Authorization: Bearer <employee JWT>` |

All prices are USD. Error bodies come in these shapes, depending on the endpoint:

```json
{ "errors": { "metadata": ["imei must be exactly 15 digits"], "quantity": ["..."] } }
{ "error": "Validation failed: Metadata imei must be exactly 15 digits" }
{ "error": "Insufficient balance. Required: $53.04, Available: $10.0" }
```

Each endpoint below says which shape it uses.

---

## 2. Catalog

### 2.1 `GET /web/api/products` (public, no auth)

Lists active products. Use it for the storefront eSIM pages.

| Query param | Notes |
|---|---|
| `product_type=esim` | All eSIMs (eSIM Access and MeiSIM) |
| `category_slug=esim` | Same set via the category |
| `page`, `per_page` | Default 100 per page; `per_page=all` returns everything |

There is **no server-side country, provider, or line filter**. MeiSIM alone
has about 1,729 plans (38 US lines, about 1,690 travel plans), so fetch
`per_page=all` once, cache it, and filter by `countries` / `meisim_line` on the
client.

Response:

```json
{
  "products": [ /* product objects, see below */ ],
  "meta": { "current_page": 1, "total_pages": 18, "total_count": 1729 }
}
```

**MeiSIM product object** (real example, US line):

```json
{
  "id": "0cf1fe4c-c82b-4a15-9de5-62daf21ea00f",
  "name": "AT&T Prepaid · $35 Unlimited Saver",
  "slug": "meisim-p3-2-629",
  "description": null,
  "product_type": "esim",
  "category": "eSIM",
  "category_slug": "esim",
  "price": "53.04",
  "currency": "USD",
  "provider": "meisim",
  "provider_type": "meisim",
  "pricings": [
    {
      "id": "…",
      "duration_type": null,
      "duration_value": null,
      "selling_price": 53.04,
      "user_selling_price": 53.04,
      "currency": "USD"
    }
  ],
  "meisim_line": "us_prepaid",
  "esim_type": "voice_data_sms",
  "countries": ["US"],
  "regions": ["United States"],
  "network": "AT&T Prepaid",
  "data_limit": "See plan",
  "data_unit": null,
  "validity_days": 30,
  "usage_tracking": null,
  "requires_imei": true,
  "requires_eid": true
}
```

Travel plan example (fields that differ):

```json
{
  "name": "World 1 GB",
  "price": "19.19",
  "meisim_line": "travel",
  "esim_type": "data_only",
  "countries": ["AL", "DZ", "…", "JP", "…", "US"],
  "regions": ["Asia", "Europe", "…"],
  "network": "4G/LTE",
  "data_limit": "1",
  "data_unit": "GB",
  "validity_days": 30,
  "usage_tracking": "Realtime, in-app",
  "requires_imei": false,
  "requires_eid": false
}
```

**Field guide (MeiSIM products)**

| Field | Use |
|---|---|
| `price` | **The price to show a user.** Equals `user_selling_price`. Sent as a string (`"53.04"`); parse it. |
| `pricings[].selling_price` / `user_selling_price` | Both equal the user price in the public view. |
| `provider` | `"meisim"` or `"esim_access"`. |
| `meisim_line` | `"travel"` (data only) or `"us_prepaid"` (US carrier line with phone number). |
| `countries` | ISO-2 codes the plan covers. Multi-country plans list many. |
| `regions` | Region names when MeiSIM provides them. |
| `data_limit` + `data_unit` | e.g. `"1"` + `"GB"`. US lines often say `"See plan"` with no unit. `"Unlimited"` is possible. |
| `validity_days` | Plan validity in days. |
| `network` | Carrier or network label to display. |
| `requires_imei` | `true` → checkout **must** collect the phone's IMEI (15 digits). |
| `requires_eid` | `true` → checkout **must** also collect the EID (32 digits). |
| `usage_tracking` | Non-null on travel plans that report data usage. |

Which US lines need device details today:

| Carrier (product `network`) | `requires_imei` | `requires_eid` |
|---|---|---|
| AT&T, T-Mobile, MobileX, LinkUp, Lycamobile | true | true |
| Moxee | true | false |
| Any travel plan | false | false |

Always read the flags; don't hard-code carriers.

**Reseller view.** If the request carries a valid **reseller** token (the
reseller dashboard already sends one), each `pricings[]` entry also has
`reseller_selling_price`, and `selling_price` becomes the reseller price. This is
what the existing `/reseller` interceptor in `services/api.ts` reads. Anonymous
and user requests never receive reseller prices. The token is only checked,
not consumed.

**Removed from all catalog responses:** `api_price` (top level and in
`pricings`), and the metadata keys `retail_price`, `provider_name`,
`synced_at`, `cost_price`. Do not rely on them.

eSIM Access products keep their existing shape (`location_name`,
`data_gb`, `duration`, …) and have no `meisim_line` / `requires_*` fields.

### 2.2 `GET /web/api/products/:id` (public)

`{ "product": { …same object as above… } }`. 404 `{ "error": "Product not found" }`
for unknown or inactive products.

### 2.3 `GET /api/v1/products` and `GET /api/v1/products/:id` (reseller)

Unchanged shape plus two **new** fields:

```json
{
  "id": "…",
  "name": "AT&T Prepaid · $35 Unlimited Saver",
  "category": "eSIM",
  "base_price": 44.2,
  "currency": "USD",
  "provider_type": "meisim",
  "product_type": "esim",
  "requires_imei": true,
  "requires_eid": true,
  "esim": {
    "esim_type": "voice_data_sms",
    "meisim_line": "us_prepaid",
    "countries": ["US"],
    "regions": ["United States"],
    "network": "AT&T Prepaid",
    "data_limit": "See plan",
    "data_unit": null,
    "validity_days": 30,
    "usage_tracking": null
  }
}
```

`base_price` is the reseller price (MeiSIM retail) times the reseller's price
multiplier. 20 per page. `esim` is present only on `product_type: "esim"`; it
holds the same plan fields as the web catalog (eSIM Access products carry their
own keys here: `location_name`, `location_code`, `data_gb`, `duration`,
`duration_unit`).

---

## 3. Placing orders

### 3.1 Device details (US carrier lines only)

Send these inside the order's `metadata` when the product has
`requires_imei: true`:

| Key | Required when | Rule |
|---|---|---|
| `metadata.imei` | `requires_imei` | Exactly 15 digits |
| `metadata.eid` | `requires_eid` | Exactly 32 digits |
| `metadata.address` | Required when the product has `accepts_address: true` (every US line except Moxee); otherwise optional (E911 and area code) | If sent, all rules below apply |
| `metadata.address.address_line_1` | with address | Must start with a street number (`"120 Main St"`) |
| `metadata.address.city` | with address | At least 2 characters |
| `metadata.address.state` | with address | 2-letter code (`"AZ"`; lowercase accepted) |
| `metadata.address.zip_code` | with address | Exactly 5 digits |
| `metadata.address.address_line_2`, `first_name`, `last_name`, `phone` | optional | Free text |

Also, for these lines, **`quantity` must be 1** (one device per line).

Validation happens **before any payment**. Invalid orders are never charged.

Error messages (exact strings):

- `imei must be exactly 15 digits`
- `eid must be exactly 32 digits`
- `address.address_line_1 must start with a street number`
- `address.city must be at least 2 characters`
- `address.state must be a 2-letter code`
- `address.zip_code must be 5 digits`
- `must be 1 for US carrier eSIMs (one device per line)` (on `quantity`)

UX hints: on iPhone and Android, IMEI and EID are under Settings > General > About
(or dial `*#06#`). EID only exists on eSIM-capable phones.

### 3.2 `POST /web/api/orders` (single product)

```json
{
  "product_id": "0cf1fe4c-…",
  "payment_method": "wallet",
  "gateway": "rexpay",
  "quantity": 1,
  "promo_code": "OPTIONAL",
  "metadata": {
    "imei": "356938035643809",
    "eid": "89049032000001000000000000000001",
    "address": { "address_line_1": "120 Main St", "city": "Phoenix", "state": "AZ", "zip_code": "85001" }
  }
}
```

Travel plans: omit `metadata` (or send `{}`).

| Status | Body |
|---|---|
| 201 (wallet) | Order object (section 5.1) plus `available_balance`, `promo_discount`. Order status is `pending`; provisioning runs in the background. |
| 202 (gateway) | `{ order, payment_url, payment_amount, payment_currency, promo_discount, message }` |
| 422 | `{ "errors": { "metadata": [...], "quantity": [...] } }` (device validation) or `{ "error": "Invalid promo code" }` etc. |
| 402 | `{ "error": "Insufficient balance. Required: $X, Available: $Y" }` |
| 404 | Unknown product |

### 3.3 Cart (`/web/api/cart`)

Device details are **per cart item**:

```
POST /web/api/cart/add_item
{ "product_id": "…", "pricing_id": "<pricings[0].id>", "quantity": 1,
  "metadata": { "imei": "…", "eid": "…", "address": { … } } }
```

Keep US-line cart items at quantity 1. Calling `add_item` again for the same
product **merges** metadata into the existing item, so two US lines for two
phones cannot share one cart item. Order them separately.

```
POST /web/api/cart/checkout   { "payment_method": "wallet" | "<gateway>" }
```

| Status | Body |
|---|---|
| 201 | `{ "message": "Checkout successful", "orders": [{ "id", "status" }] }` |
| 202 | `{ "message": "Redirect to payment gateway", "payment_url", "reference", "checkout_session_id" }` |
| 422 | `{ "error": "Validation failed: Metadata imei must be exactly 15 digits" }`. Nothing is charged. |

### 3.4 `POST /web/api/orders/checkout_cart`

Same device rules, per item: `items[].metadata.imei`, etc. Errors return 422
`{ "error": "Validation failed: …" }` with nothing charged.

### 3.5 Reseller: `POST /api/v1/orders`

Balance-based resellers:

```json
{ "product_id": "…", "quantity": 1, "metadata": { "imei": "…", "eid": "…" } }
```

| Status | Body |
|---|---|
| 202 | `{ "id", "order_number", "status": "pending", "message", "available_balance" }` |
| 422 | `{ "errors": { "metadata": [...] } }` |

Infrastructure resellers (gateway payment) also send `customer_email`
(required). 202 returns `payment_url` etc. Invalid device details return
422 `{ "errors": {…} }` **before** a payment link is created.

### 3.6 Reseller: `POST /api/v1/orders/checkout_cart`

`items[].metadata` carries device details. A bad item returns
422 `{ "errors": {…}, "product_id": "<the offending product>" }` before any
payment link is created.

---

## 4. Order lifecycle (what to show while waiting)

| Order `status` | Web API shows | Meaning for MeiSIM | UI |
|---|---|---|---|
| `pending` | `pending` | Created, job queued | "Processing…" |
| `processing` | `processing` | Sent to MeiSIM; waiting for activation | "Activating your eSIM…" |
| `active` | **`completed`** (web API maps it) | eSIM delivered; email sent | Show the eSIM (section 5) |
| `failed` | `failed` | MeiSIM rejected it | "Failed". A refund follows automatically. |
| `refunded` | `refunded` | Money returned to wallet (or gateway) | "Refunded" |

Timing:

- Most MeiSIM orders are delivered within seconds of the background job running.
- Some come back `pending` from MeiSIM. The backend re-checks every 5 minutes;
  keep showing "Activating…".
- Rarely MeiSIM times out and the outcome is unknown. The order **stays
  `processing`** and support is alerted to check it by hand. The order JSON then
  has **`review_pending: true`**; show "We're confirming your eSIM, support
  will follow up" rather than an error.

Polling: after placing an order, poll `GET /web/api/orders/:id` every 5-10 s
for the first minute, then every 30-60 s, until the status is `completed`,
`failed`, or `refunded`.

---

## 5. Reading an eSIM

### 5.1 `GET /web/api/orders/:id` (and each item in `GET /web/api/orders`)

eSIM part of the order object:

```json
{
  "id": "…",
  "order_number": "…",
  "product_type": "esim",
  "product_name": "AT&T Prepaid · $35 Unlimited Saver",
  "status": "completed",
  "total_amount": "53.04",
  "esim_order_no": "<MeiSIM order id>",
  "package_code": "p3:2:629",
  "package_name": "AT&T Prepaid · $35 Unlimited Saver",
  "quantity": 1,
  "profiles": [
    {
      "id": "…",
      "iccid": "89049032000001000096650386218347",
      "qr_code_data": "LPA:1$SMDP.EXAMPLE$ABC123",
      "qr_code_url": "LPA:1$SMDP.EXAMPLE$ABC123",
      "activation_code": "LPA:1$SMDP.EXAMPLE$ABC123",
      "phone_number": "3415128315",
      "pin1": "1234",
      "puk1": null,
      "total_volume": 1000,
      "used_volume": 250,
      "location_name": "US",
      "expired_time": "2026-10-23T00:00:00Z",
      "status": "active"
    }
  ],
  "credentials_list": [ /* same as profiles */ ],
  "review_pending": false,
  "metadata": { /* order metadata merged with product metadata, including the customer's own imei/eid */ }
}
```

| Field | Notes |
|---|---|
| `activation_code` | LPA string. **Render the QR code from this** client-side. |
| `qr_code_url` / `qr_code_data` | Despite the name, both hold the same LPA string (existing behavior). |
| `phone_number` | **New.** The line's US number for `us_prepaid`; `null` for travel. |
| `pin1` | SIM PIN when the carrier provides one (e.g. Lycamobile); otherwise `null`. |
| `total_volume` / `used_volume` | MB. Travel plans only; refreshed every 30 minutes. US lines show 0 (carriers expose no usage). |
| `expired_time` | Set by the usage sync for travel plans once known. |
| `location_name` | ISO-2 country for single-country plans, `"global"` for multi-country plans. |
| `status` | `active` or `expired`. |
| `review_pending` | **New**, top level. `true` while support checks an order whose MeiSIM outcome was unknown. |

Manual install fallback: split `activation_code` on `$` to show the SM-DP+
address (second part) and matching ID (third part).

### 5.2 `GET /web/api/orders/:id/credentials`

Only for orders in status `active`; otherwise 400 `{ "error": "Order not active" }`.
Returns the **first** eSIM:

```json
{
  "type": "esim",
  "iccid": "…",
  "qr_code": "LPA:1$…",
  "activation_code": "LPA:1$…",
  "phone_number": "3415128315",
  "pin1": null,
  "puk1": null
}
```

### 5.3 Reseller: `GET /api/v1/orders/:id/credentials`

`GET /api/v1/orders/:id` returns the generic order summary only (no eSIM
details). Use the credentials endpoint for the eSIM:

```json
{
  "type": "esim",
  "order_id": "…",
  "esims": [
    {
      "iccid": "…",
      "activation_code": "LPA:1$…",
      "qr_code_url": "LPA:1$…",
      "phone_number": "3415128315",
      "status": "delivered",
      "expires_at": null
    }
  ]
}
```

`phone_number` is new.

---

## 6. Removed or changed

| What | Before | Now | Frontend action |
|---|---|---|---|
| `GET /admin/api/usa_esim_credentials` | List imported USA eSIM credentials | **404** | Remove the screen and API calls |
| `POST /admin/api/usa_esim_credentials/import` | Excel + QR image import | **404** | Remove the import UI |
| `DELETE /admin/api/usa_esim_credentials/:id` | Delete a credential | **404** | Remove |
| `product_type: "usa_esim"` | USA eSIM products | No active products; not a valid type for new products | Remove `usa_esim` pages, cards, and branches |
| `?product_type=esim` on `/web/api/orders` | Also included `usa_esim` orders | eSIM orders only | None; old USA eSIM orders are hidden from that filter |
| Admin order stats `esim` bucket | Counted `esim` + `usa_esim` | `esim` only | None |
| Old USA eSIM orders | Showed imported credentials | Still listed (`product_type: "usa_esim"`) but **no profiles**; credentials endpoint has nothing to return | Show as historical, without credentials |
| Lyca / Colt / Lebara inventory eSIM products | Sold from uploaded stock | Deactivated | Remove any MOQ or "manual fulfillment" UI |
| `POST /admin/api/products/sync_esims` | Syncs eSIM Access | **Unchanged**: still eSIM Access only. MeiSIM syncs automatically daily at 04:30 server time | Don't label it "sync all eSIMs" |

Frontend files that still reference USA eSIM (from a search of `client/src`):

```
App.tsx
components/dashboard/Cart/RenderCartItemDetails.tsx
components/dashboard/Cart/hook/useCalculateOrderTotalSync.tsx
components/dashboard/Cart/hook/usePaymentCheckoutHandlers.tsx
components/dashboard/products/ESIMCard.tsx
components/landing/esim/ESIMPlansSection.tsx
pages/products/ESIMTypes.tsx
pages/products/USAESIMPlansPage.tsx
pages/Reseller/ResellerCart.tsx
pages/Reseller/ResellerDashboard.tsx
pages/Reseller/components/ResApiDocs.tsx
pages/Reseller/components/ResESIMManagement.tsx
pages/Reseller/components/ResManagement.tsx
pages/SuperAdmin/tabs/AdminESIMManagement.tsx
pages/SuperAdmin/tabs/AdminPurchaseView.tsx
pages/SuperAdmin/tabs/ProductsTab.tsx
pages/UserDashboard/Cart.tsx
pages/UserDashboard/Checkout.tsx
pages/UserDashboard/DashboardHome.tsx
pages/UserDashboard/ESIMManagement.tsx
pages/UserDashboard/EsimOrders.tsx
pages/UserDashboard/Orders.tsx
pages/UserDashboard/ProductsManagement.tsx
services/adminApi.ts
types/index.ts
utils/cart/formatData.tsx
```

---

## 7. Frontend checklist

- [ ] Storefront eSIM listing: show MeiSIM travel plans by country/region and a
      "US phone lines" section (`meisim_line: "us_prepaid"`), priced by `price`.
- [ ] Checkout: when `requires_imei` is true, collect IMEI (and EID when
      `requires_eid`), optional E911 address, force quantity 1, and send them in
      `metadata`. Show the 422 messages next to the fields.
- [ ] Cart: store device details in each cart item's `metadata`.
- [ ] Reseller dashboard: same device fields, driven by `requires_imei` /
      `requires_eid` on `/api/v1/products`.
- [ ] Order detail: render the QR code from `activation_code`, show
      `phone_number` for US lines, data usage for travel plans.
- [ ] Order status: handle `processing` with `review_pending: true`.
- [ ] Stop reading `api_price` from the catalog (it is no longer sent).
- [ ] Remove all USA eSIM screens, types, and calls listed in section 6.
