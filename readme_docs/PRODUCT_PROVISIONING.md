# Product Provisioning & Lifecycle

ProxySock automates the activation of various cloud and network resources through a unified service layer.

## 🚀 Provisioning Engine
The `OrderProvisioningService` is the central hub for resource activation. It is triggered automatically after payment confirmation.

### 1. Proxies (`proxy`)
- **Providers**: XProxy, MyProxyApi, and internal inventory mapping.
- **Internal Mapping**: For categories like `static-datacenter` or `static-residential`, the system picks an available proxy from the `ProxyInventory` table and assigns it to the order.
- **External APIs**: For dynamic mobile or rotating proxies, the system calls the provider's API (e.g., MyProxyApi) and stores the resulting credentials.

### 2. Virtual Machines (`vm` / `vps` / `rdp`)
- **Technology**: Proxmox VE.
- **Workflow**:
  1. `VmProvisioningJob` is queued.
  2. The job interacts with the Proxmox API to clone a template (Ubuntu, Windows, etc.).
  3. Network configuration and SSH/RDP setup are handled via Ansible.
  4. Once booted, the IP and credentials are saved to the `Vm` record.

### 3. eSIMs (`esim`)
- **Technology**: eSIM Access API.
- **Workflow**:
  1. System checks for country coverage and data quota.
  2. Request is sent to the provider to generate a QR code/ICCID.
  3. The eSIM profile is attached to the order and emailed to the customer.

### 4. VPNs (`vpn`)
- **Technology**: OpenVPN / WireGuard.
- **Workflow**:
  1. Backend generates cryptographic keys and user config files.
  2. The configuration is stored as an attachment (Active Storage).
  3. The user can download the `.ovpn` or `.conf` file from their dashboard.

---

## 🔄 Order Lifecycle

- **`pending`**: Order created but payment not yet confirmed.
- **`awaiting_payment`**: Specific to gateway payments before webhook arrival.
- **`processing`**: Payment received; provisioning jobs are running.
- **`active`**: Resource is live and credentials are available.
- **`failed`**: Provisioning error occurred (Support notified).
- **`expired`**: Subscription period has ended.
- **`cancelled`**: Order revoked (often with refund).

## 📩 Notification Logic
Upon successful activation, the system triggers `InvoiceMailer` or `ProxyMailer` to send credentials. Resellers also receive an HMAC-signed webhook.
