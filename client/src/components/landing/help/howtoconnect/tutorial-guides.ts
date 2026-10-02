export interface Tutorial {
  id: string;
  label: string;
  title: string;
  description: string;
  steps: [string, string][];
  code: string;
  language: string;
  filename: string;
  note: string;
  source?: [string, string];
}
export interface TutorialService {
  id: string;
  name: string;
  description: string;
  dashboard: string;
  guides: Tutorial[];
}

export const proxyCommand = `# Replace these placeholders with your proxy details
curl --proxy http://PROXY_HOST:PROXY_PORT \\
  --proxy-user 'USERNAME:PASSWORD' \\
  --connect-timeout 15 \\
  https://httpbin.org/ip`;

export const tutorialServices: TutorialService[] = [
  {
    id: "proxies", name: "Proxies", description: "Connect your browser, device or application.", dashboard: "/dashboard/proxies",
    guides: [
      {
        id: "quick-start", label: "Quick start", title: "Make your first proxy connection.",
        description: "Start with a small request to check that your endpoint and credentials work together.",
        steps: [
          ["Find your connection details", "Open your proxy service in the dashboard. Copy its host, port and authentication details, and check which protocol it supports."],
          ["Adapt the example", "Replace the uppercase placeholders with your service details. This example uses an HTTP proxy with username and password authentication."],
          ["Check the response", "Run the command in a terminal with curl installed. The IP response should show the proxy's exit address. For rotating services, that address may change."],
        ],
        code: proxyCommand, language: "bash", filename: "connection-check.sh",
        note: "On Windows PowerShell, use curl.exe on one line. If your plan uses IP authentication, allow your client IP in the dashboard and omit --proxy-user.",
        source: ["curl proxy documentation", "https://curl.se/docs/manpage.html"],
      },
      {
        id: "socks5", label: "SOCKS5", title: "Connect through SOCKS5.",
        description: "Use your SOCKS5 endpoint when your service and application support it.",
        steps: [["Check your endpoint", "Use the SOCKS5 host and port supplied for your service; these may differ from its HTTP endpoint."], ["Add your credentials", "Replace the placeholders with your proxy credentials. Keep the quoted username and password together."], ["Send a test request", "Run the example. socks5h asks the proxy to resolve the destination hostname as well as handle the connection."]],
        code: `curl --proxy socks5h://PROXY_HOST:PROXY_PORT \\
  --proxy-user 'USERNAME:PASSWORD' \\
  --connect-timeout 15 \\
  https://httpbin.org/ip`, language: "bash", filename: "socks5-check.sh",
        note: "Choose the protocol listed in your service details. Changing the URL prefix alone does not add SOCKS5 support to an HTTP-only endpoint.",
        source: ["curl proxy documentation", "https://curl.se/docs/manpage.html"],
      },
      {
        id: "windows", label: "Windows", title: "Set up your Windows proxy.", description: "Configure apps that use your Windows proxy settings.",
        steps: [["Open proxy settings", "Go to Settings → Network & internet → Proxy."], ["Enter the endpoint", "Under Manual proxy setup, enable Use a proxy server and enter your service's address and port. Save your changes."], ["Check your application", "Open an application that uses system proxy settings. Supply your proxy credentials if prompted; some apps need their own authentication settings."]],
        code: `# Connection details from your dashboard
Address   PROXY_HOST
Port      PROXY_PORT
Username  YOUR_USERNAME
Password  YOUR_PASSWORD`, language: "text", filename: "windows-proxy.txt",
        note: "System proxy settings do not cover every application. Configure the proxy inside the app if it uses its own network settings.",
        source: ["Microsoft proxy setup guide", "https://support.microsoft.com/en-us/windows/experience/connectivity-networking/use-a-proxy-server-in-windows"],
      },
      {
        id: "macos", label: "macOS", title: "Configure a proxy on your Mac.", description: "Choose the proxy protocol for your active network connection.",
        steps: [["Find your network", "Open System Settings → Network. Select your active connection, then Details → Proxies."], ["Choose the protocol", "Enable the proxy type supported by your service and enter its server and port. Add your username and password if required."], ["Save and verify", "Save the settings, then check your connection in an app that uses the system proxy."]],
        code: `# Use the protocol supplied with your service
Server    PROXY_HOST
Port      PROXY_PORT
Username  YOUR_USERNAME
Password  YOUR_PASSWORD`, language: "text", filename: "macos-proxy.txt",
        note: "Use the settings for your current network connection. Switching networks can change which configuration applies.",
        source: ["Apple proxy settings guide", "https://support.apple.com/guide/mac-help/change-proxy-settings-on-mac-mchlp2591/mac"],
      },
      {
        id: "mobile", label: "Mobile", title: "Configure your Wi-Fi proxy.", description: "Apply your proxy to a Wi-Fi connection on your phone.",
        steps: [["Choose your Wi-Fi network", "Open the settings for your connected Wi-Fi network. These settings apply to that network, rather than your mobile-data connection."], ["Enter your proxy", "On iPhone, open the network details and Configure Proxy → Manual. On Android, edit the network and look for Proxy under its advanced options. Enter your host and port."], ["Save and check", "Save your settings and test an app that supports the Wi-Fi proxy. Authentication support varies by app and device; enter credentials where supported."]],
        code: `# Wi-Fi proxy reference\nMode      Manual\nServer    PROXY_HOST\nPort      PROXY_PORT\nScope     This Wi-Fi network`, language: "text", filename: "wifi-proxy.txt",
        note: "An app may ignore the system proxy. For Android menu details, check your device manufacturer's Wi-Fi instructions.",
        source: ["Apple Wi-Fi settings guide", "https://support.apple.com/guide/iphone/manage-wi-fi-settings-iphw5gjwl8k2/ios"],
      },
      {
        id: "python", label: "Python", title: "Add proxies to your Python requests.", description: "A small Requests example using an authenticated HTTP proxy.",
        steps: [["Prepare your project", "Install the requests package in your Python environment."], ["Set your proxy URL", "Provide PROXY_URL in your environment using your host, port and credentials. URL-encode special characters in the username or password."], ["Make the request", "Run the example to view the exit IP. The same HTTP proxy can tunnel requests to HTTPS destinations."]],
        code: `import os
import requests

# PROXY_URL: http://USERNAME:PASSWORD@HOST:PORT
proxy_url = os.environ["PROXY_URL"]
response = requests.get(
    "https://httpbin.org/ip",
    proxies={"http": proxy_url, "https": proxy_url},
    timeout=30,
)
response.raise_for_status()
print(response.json())`, language: "python", filename: "proxy_request.py",
        note: "Keep credentials out of source control. Use the scheme your proxy endpoint supports; the destination's HTTPS scheme does not determine the proxy's scheme.",
        source: ["Requests proxy documentation", "https://docs.python-requests.org/en/latest/user/advanced/#proxies"],
      },
      {
        id: "nodejs", label: "Node.js", title: "Connect your Node.js application.", description: "Configure an HTTP proxy for an Axios request on the server.",
        steps: [["Install Axios", "Add axios to your Node.js project and configure the environment variables shown in the example."], ["Use your service details", "Provide the host, numeric port, username and password from your proxy service."], ["Run your request", "Run the script in Node.js. Check the returned IP and handle any connection or authentication error in your application."]],
        code: `const axios = require("axios");

axios.get("https://httpbin.org/ip", {
  proxy: {
    protocol: "http",
    host: process.env.PROXY_HOST,
    port: Number(process.env.PROXY_PORT),
    auth: {
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD,
    },
  },
  timeout: 30000,
}).then(({ data }) => console.log(data))
  .catch((error) => console.error(error.message));`, language: "javascript", filename: "proxy-request.cjs",
        note: "This is a Node.js example. Browser JavaScript cannot set the browser's proxy using Axios's proxy configuration.",
        source: ["Axios request configuration", "https://axios-http.com/docs/req_config"],
      },
    ],
  },
  {
    id: "vps", name: "VPS", description: "Access your server and manage your environment.", dashboard: "/dashboard/vps",
    guides: [
      {
        id: "ssh", label: "SSH access", title: "Your server, one connection away.", description: "Connect to a Linux VPS with the SSH client on your computer.",
        steps: [["Get your server details", "Wait for provisioning to finish, then open your service to find its IP address, username and SSH port."], ["Open your terminal", "Use Terminal on macOS or Linux, or an installed OpenSSH client on Windows. Replace the placeholders in one of the example commands."], ["Verify and sign in", "On your first connection, verify the server host-key fingerprint through a trusted source. Enter the supplied password or use your configured private key."]],
        code: `# Standard connection
ssh USERNAME@SERVER_IP

# Use the SSH port supplied for your server
ssh -p SSH_PORT USERNAME@SERVER_IP

# Connect with your configured private key
ssh -i /path/to/private_key USERNAME@SERVER_IP`, language: "bash", filename: "connect.sh",
        note: "Choose the command that matches your server. For a Windows desktop, use the RDP guides and your service's RDP credentials.",
        source: ["OpenSSH manual", "https://man.openbsd.org/ssh"],
      },
      {
        id: "files", label: "File transfer", title: "Move your files with SCP or SFTP.", description: "Transfer files over your server's SSH connection.",
        steps: [["Confirm SSH access", "Check that you can sign in to the server with the same username and authentication method."], ["Choose a destination", "Replace the local and remote paths with the files and directories you want to use. Your account needs permission to write to the destination."], ["Transfer your files", "Run the upload or download command you need. For a graphical client, select SFTP and enter your SSH host, port and credentials."]],
        code: `# Upload a file
scp local_file.txt USERNAME@SERVER_IP:/remote/path/

# Download a file
scp USERNAME@SERVER_IP:/remote/file.txt ./

# Upload a directory
scp -r local_directory/ USERNAME@SERVER_IP:/remote/path/`, language: "bash", filename: "transfer.sh",
        note: "For a custom SSH port, add -P SSH_PORT to scp. Existing destination files with the same name may be overwritten.",
        source: ["SCP manual", "https://man.openbsd.org/scp"],
      },
      {
        id: "management", label: "Server management", title: "Get to know your environment.", description: "Check resource use before changing your server's configuration.",
        steps: [["Inspect your system", "Check the operating system, storage and memory using the commands shown."], ["Review running services", "On a systemd-based Linux server, replace SERVICE_NAME with the service you want to inspect."], ["Plan your changes", "Use the package manager and administration tools for your operating system. Follow the vendor's current installation guide for any control panel you add."]],
        code: `# Operating system and kernel
uname -a

# Disk and memory usage
df -h
free -h

# Running processes (press q to exit)
top

# Service status on systemd-based Linux
systemctl status SERVICE_NAME`, language: "bash", filename: "server-checks.sh",
        note: "Run these checks inside your VPS session. Windows and non-systemd systems use different management tools.",
      },
    ],
  },
  {
    id: "rdp", name: "RDP", description: "Open your remote desktop from your device.", dashboard: "/dashboard/rdp",
    guides: [
      {
        id: "windows", label: "Windows", title: "Bring your remote desktop into view.", description: "Use Remote Desktop Connection to access your Windows server.",
        steps: [["Open the client", "Press Windows + R, type mstsc and press Enter."], ["Add your computer", "Enter the server IP and RDP port supplied in your dashboard. Select Connect."], ["Sign in to your desktop", "Enter your server username and password. Verify the server identity if a certificate prompt appears."]],
        code: `# Enter in Remote Desktop Connection
Computer  SERVER_IP:RDP_PORT
Username  YOUR_RDP_USERNAME
Password  YOUR_RDP_PASSWORD`, language: "text", filename: "remote-desktop.txt",
        note: "Use your server credentials, which may differ from your ProxySock account login.",
        source: ["Microsoft Remote Desktop guide", "https://support.microsoft.com/en-us/windows/experience/connectivity-networking/how-to-use-remote-desktop"],
      },
      {
        id: "mac-mobile", label: "Mac & mobile", title: "Take your workspace with you.", description: "Connect from a supported Mac, iPhone, iPad or Android client.",
        steps: [["Install a compatible client", "Get Microsoft's Windows App for your supported device from its official store."], ["Add your remote PC", "Choose the option to add a PC and enter the server IP and RDP port. Save your connection."], ["Open your session", "Select the saved PC and enter the server credentials when prompted. Check the server identity before accepting a certificate."]],
        code: `# Create a remote PC connection
PC name       SERVER_IP:RDP_PORT
User account  YOUR_RDP_USERNAME
Friendly name My ProxySock desktop`, language: "text", filename: "remote-pc.txt",
        note: "Client menus vary by platform. Display resolution, clipboard and device sharing are configured in the client's connection settings.",
        source: ["Microsoft Windows App guide", "https://learn.microsoft.com/windows-app/get-started-connect-devices-desktops-apps"],
      },
    ],
  },
  {
    id: "vpn", name: "VPN", description: "Import your configuration and establish a connection.", dashboard: "/dashboard/vpn",
    guides: [
      {
        id: "wireguard", label: "WireGuard", title: "Set up your WireGuard connection.", description: "Use the configuration issued for your VPN service.",
        steps: [["Download your configuration", "Open your active VPN service and download its WireGuard configuration when available."], ["Import the file", "Install the official WireGuard client for your device. Use its import option to add your downloaded .conf file."], ["Activate your tunnel", "Select the imported tunnel and activate it. Check the client's status and your connection."]],
        code: `# Setup checklist
Client          WireGuard
Configuration   Your downloaded .conf file
Action          Import the existing configuration
Connection      Activate the imported tunnel`, language: "text", filename: "wireguard-setup.txt",
        note: "Use the protocol provided with your service. Keep configuration files private: they can contain authentication keys.",
        source: ["Official WireGuard clients", "https://www.wireguard.com/install/"],
      },
      {
        id: "openvpn", label: "OpenVPN", title: "Import your OpenVPN profile.", description: "Connect with the .ovpn profile provided for your VPN service.",
        steps: [["Get your profile", "Download the OpenVPN configuration from your active service, if that is its supported protocol."], ["Import into OpenVPN Connect", "Open the client, choose to import a file and select the downloaded .ovpn profile."], ["Connect", "Enter service credentials if requested, then connect. Use the client status to confirm the connection is established."]],
        code: `# Setup checklist
Client          OpenVPN Connect
Profile         Your downloaded .ovpn file
Action          Import profile from file
Authentication  Service credentials, if requested`, language: "text", filename: "openvpn-setup.txt",
        note: "The VPN profile and your ProxySock account login are separate. Use the authentication details supplied with your service.",
        source: ["OpenVPN profile import guide", "https://openvpn.net/connect-docs/import-profile.html"],
      },
    ],
  },
  {
    id: "esim", name: "eSIM", description: "Install your plan and get ready to connect.", dashboard: "/dashboard/esim",
    guides: [
      {
        id: "iphone", label: "iPhone", title: "A new connection on your iPhone.", description: "Install a QR-based eSIM on a compatible, carrier-unlocked iPhone.",
        steps: [["Prepare your device", "Connect to Wi-Fi and confirm your exact iPhone model and region support eSIM. Have the installation details for your plan ready."], ["Add your eSIM", "Open Settings → Cellular or Mobile Service → Add eSIM. Choose Use QR Code and scan the code supplied with your plan."], ["Choose your line", "Follow the setup prompts and label the new line. Select it for mobile data when your plan's activation instructions say to do so."]],
        code: `# Before activation
Device          eSIM compatible and carrier-unlocked
Connection      Wi-Fi available for installation
Installation    QR code or supplied activation details
Mobile data     Select your new eSIM when ready
Roaming         Follow your plan's instructions`, language: "text", filename: "iphone-checklist.txt",
        note: "Some plans use a different activation process. Follow the instructions in your order; validity and activation-location rules vary by plan.",
        source: ["Apple eSIM setup guide", "https://support.apple.com/118669"],
      },
      {
        id: "android", label: "Android", title: "Add your eSIM on Android.", description: "Use the eSIM setup menu on your supported device.",
        steps: [["Check compatibility", "Confirm your exact device supports eSIM and is carrier-unlocked. Connect to Wi-Fi."], ["Open SIM settings", "On Pixel, open Settings → Network & internet → SIMs → Add SIM and choose the eSIM setup option. Other manufacturers may use SIM manager or Add eSIM."], ["Install your plan", "Scan the supplied QR code or follow your order's installation instructions. Select the eSIM for data and use the roaming settings required by your plan."]],
        code: `# Before activation
Device          Confirm exact model and region
Network         Connected to Wi-Fi
SIM settings    Add eSIM / Set up an eSIM
Installation    Use your plan's activation details
Data line       Select the installed eSIM`, language: "text", filename: "android-checklist.txt",
        note: "Menu names vary by phone and software version. Check your manufacturer's instructions if the eSIM option is missing.",
        source: ["Google Pixel eSIM guide", "https://support.google.com/pixelphone/answer/16115470"],
      },
      {
        id: "activation", label: "Before activation", title: "Make sure your plan is ready for you.", description: "Check the details that matter before installing or activating your eSIM.",
        steps: [["Review coverage and validity", "Check your destination, plan allowance and when validity begins. Some plans require activation in a specific country."], ["Prepare device details", "US phone-number plans require your phone's IMEI and EID at checkout. Dial *#06# on the device to find them."], ["Keep your installation details", "Follow your order instructions and keep the profile installed while troubleshooting. Contact support before deleting an eSIM you may not be able to reinstall."]],
        code: `# Check your selected plan
Coverage        Your destination is included
Validity        Activation and expiry rules reviewed
Device          Compatible and carrier-unlocked
US phone line   IMEI and EID ready, when required
Installation    Follow your order's instructions`, language: "text", filename: "activation-checklist.txt",
        note: "Data-only plans do not include a regular phone number. Voice and SMS availability depend on the phone-number plan you purchase.",
      },
    ],
  },
];
