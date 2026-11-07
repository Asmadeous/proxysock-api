export type ServiceKind = "vps" | "rdp" | "vpn" | "esim";
export interface ServiceOption { name: string; title: string; description: string; facts: [string, string][]; features: string[]; preview: string; }
export interface ServicePlan { name: string; price: number; specs: string[]; popular?: boolean; }
export interface ServicePageContent {
  kind: ServiceKind; label: string; title: string; description: string; hero: [string, string, string];
  purchaseHref: string; purchaseLabel: string; optionsTitle: [string, string]; options: ServiceOption[];
  plans?: ServicePlan[]; plansTitle: string; useCasesTitle: [string, string]; useCases: [string, string][];
  steps: [string, string][]; faqs: [string, string][]; closing: [string, string];
}

const vmPlans = (kind: "vps" | "rdp"): ServicePlan[] => [
  { name: "Basic", price: kind === "vps" ? 35 : 40, specs: ["1 vCPU", "2 GB RAM", "40 GB SSD"] },
  { name: "Standard", price: kind === "vps" ? 50 : 95, specs: ["2 vCPU", "4 GB RAM", "80 GB SSD"], popular: true },
  { name: "Premium", price: kind === "vps" ? 65 : 150, specs: ["3 vCPU", "6 GB RAM", kind === "vps" ? "120 GB NVMe SSD" : "120 GB SSD"] },
  { name: "Ultra", price: kind === "vps" ? 100 : 220, specs: ["4 vCPU", "8 GB RAM", kind === "vps" ? "160 GB NVMe SSD" : "160 GB SSD"] },
];

export const servicePages: Record<ServiceKind, ServicePageContent> = {
  vps: {
    kind: "vps", label: "VPS hosting", title: "Windows & Linux VPS Hosting",
    description: "Virtual private servers for development, hosting and automation. Choose your resources and operating system, then manage your server from one account.",
    hero: ["Your server.", "Your rules.", "More possibilities."], purchaseHref: "/dashboard/vps", purchaseLabel: "Explore VPS plans",
    optionsTitle: ["Build your environment.", "Make it your own."],
    options: [
      { name: "Linux servers", title: "A foundation for your next project.", description: "Deploy your services, development tools and scripts in a server environment you control. Choose an available Linux image and configure the software your project needs.", facts: [["Access", "Root access"], ["Environment", "Linux server"]], features: ["Ubuntu, Debian and other available images", "CPU, memory and storage options", "Connection details in your account"], preview: "Linux server" },
      { name: "Windows servers", title: "Your Windows environment, online.", description: "Run your Windows-based tools on a virtual server. Choose a compatible plan and available Windows image, then configure your environment for the work ahead.", facts: [["Access", "Administrator access"], ["Environment", "Windows Server"]], features: ["Available Windows Server images", "Resources matched to your workload", "Manage your instance from your account"], preview: "Windows server" },
    ], plans: vmPlans("vps"), plansTitle: "Resources for your next idea.",
    useCasesTitle: ["From first build", "to everyday operations."],
    useCases: [["Application hosting", "Give your web services and applications a dedicated server environment."], ["Development & testing", "Create an environment for staging, experiments and your next release."], ["Automation", "Run scheduled scripts and tools without tying up your everyday computer."]],
    steps: [["Choose your resources", "Select the plan, location and operating system that fit your workload."], ["Set up your server", "Once provisioned, find your IP and credentials in your account. Follow the connection guide."], ["Make it your environment", "Install your tools, deploy your project and manage your instance from the dashboard."]],
    faqs: [["Which operating systems can I choose?", "Available images include Linux and Windows options. Check the operating-system choices for your selected plan and location before ordering."], ["How do I connect to my VPS?", "Your account contains the server IP and connection credentials after provisioning. Use the documentation for the connection method supported by your chosen operating system."], ["What is a residential VPS?", "A residential VPS pairs a virtual server with a residential or ISP-issued IP. Review the IP type offered with your selected plan."], ["How do I choose the right resources?", "Start with your application's CPU, memory and storage requirements. Compare the available plans and contact support if you need help choosing."], ["Where can I check location availability?", "Available locations and final configuration details are shown in the VPS purchase flow in your dashboard."]], closing: ["Make room for your ideas.", "Start with your own server."],
  },
  rdp: {
    kind: "rdp", label: "Remote desktop", title: "Residential RDP & Remote Desktop Hosting",
    description: "Remote desktop hosting for your applications and workflows. Choose a desktop environment and access it from your device.",
    hero: ["Your desktop.", "Beyond", "your desk."], purchaseHref: "/dashboard/rdp", purchaseLabel: "Explore RDP plans",
    optionsTitle: ["A familiar workspace.", "A different kind of freedom."],
    options: [
      { name: "Windows desktop", title: "Your tools. A familiar environment.", description: "Access a hosted Windows desktop for your applications and recurring tasks. Work from a remote environment while keeping your local device free for everything else.", facts: [["Environment", "Windows desktop"], ["Access", "Administrator access"]], features: ["Windows Server options", "Choose CPU, memory and storage", "Connect using your remote desktop client"], preview: "Windows desktop" },
      { name: "Linux desktop", title: "An open workspace for your ideas.", description: "Choose an available Linux desktop for development, research and everyday tools. Set up the applications you need in an environment built around your workflow.", facts: [["Environment", "Linux desktop"], ["Setup", "Available desktop images"]], features: ["Ubuntu and Fedora desktop options", "Resources matched to your applications", "Connection guidance in the documentation"], preview: "Linux desktop" },
    ], plans: vmPlans("rdp"), plansTitle: "A workspace that fits your work.",
    useCasesTitle: ["Keep your workspace.", "Change where you work."],
    useCases: [["Remote work", "Return to a hosted desktop and your installed tools from a compatible client."], ["Dedicated applications", "Keep your desktop software in its own environment, separate from your local device."], ["Development & research", "Set up a workspace for testing, research and repeatable tasks."]],
    steps: [["Choose your desktop", "Compare resources, locations and the available operating systems."], ["Connect from your device", "Find your desktop address and credentials in your account, then follow the setup guide."], ["Settle into your workspace", "Install your applications and return to your hosted environment whenever you need it."]],
    faqs: [["What is the difference between RDP and VPS?", "RDP hosting focuses on a remote desktop you interact with through a client. VPS hosting gives you a virtual server environment. Choose based on whether your workflow needs a desktop interface or a server."], ["Which desktop environments are available?", "The available images include Windows and Linux desktop options. Check the choices shown for your selected plan and location."], ["Can I install my own applications?", "Administrator or root access lets you configure your environment. Check that your application supports the chosen operating system and that your plan has enough resources."], ["How do I access my desktop?", "After provisioning, your account contains the connection address and credentials. Use a compatible remote desktop client and the setup documentation."], ["How many users can connect?", "The published plans are designed for one concurrent user. Review your selected plan's details before purchasing."]], closing: ["Your next workspace.", "Ready when you are."],
  },
  vpn: {
    kind: "vpn", label: "Residential VPN", title: "Residential VPN Connections",
    description: "VPN connections with downloadable configuration files. Choose your plan, configure a compatible client and manage your service from your account.",
    hero: ["Your connection.", "A more private", "way forward."], purchaseHref: "/dashboard/vpn", purchaseLabel: "Explore VPN plans",
    optionsTitle: ["Choose your connection.", "Keep the setup simple."],
    options: [
      { name: "WireGuard", title: "A configuration. A clearer connection.", description: "Set up a compatible WireGuard client using the configuration provided with your service. Your account keeps the connection details within reach.", facts: [["Client", "WireGuard-compatible"], ["Setup", "Configuration import"]], features: ["Download your configuration from your account", "Import it into a compatible client", "Manage your service in the dashboard"], preview: "WireGuard tunnel" },
      { name: "OpenVPN", title: "Connect with the tools you know.", description: "Use your service's OpenVPN configuration with a compatible client. Follow the setup guide to import the file and establish your connection.", facts: [["Client", "OpenVPN-compatible"], ["Setup", ".ovpn configuration"]], features: ["Downloadable connection files", "Client setup documentation", "Support when you need a hand"], preview: "OpenVPN tunnel" },
    ], plans: [
      { name: "Basic", price: 15, specs: ["Up to 100 Mbps", "10 locations", "2 devices"] },
      { name: "Pro", price: 25, specs: ["Up to 500 Mbps", "30 locations", "5 devices"], popular: true },
      { name: "Premium", price: 35, specs: ["Up to 1 Gbps", "50+ locations", "10 devices"] },
      { name: "Ultimate", price: 55, specs: ["Unlimited bandwidth", "50+ locations", "Unlimited devices"] },
    ], plansTitle: "A plan for the way you connect.",
    useCasesTitle: ["Everyday connections.", "More room for privacy."],
    useCases: [["Away from home", "Connect your compatible device through a VPN while working from different networks."], ["Your everyday tools", "Use a configured client alongside the applications you already rely on."], ["A consistent setup", "Keep your configuration and service details together in your ProxySock account."]],
    steps: [["Choose a plan", "Compare device limits, locations and the options available for your connection."], ["Import your configuration", "Download the configuration from your account and open it in a compatible VPN client."], ["Connect and keep working", "Follow the setup guide to establish your connection. Your client lets you connect or disconnect."]],
    faqs: [["How do I set up my VPN?", "After your service is ready, download its configuration from your account. Import the file into a client that supports the provided protocol and follow the setup guide."], ["Which protocols are available?", "The platform supports WireGuard and OpenVPN configurations. Check the protocol available for your selected service before purchasing."], ["How many devices can I use?", "Device limits vary by plan. Compare the published limits and review the details of your selected service in the dashboard."], ["Will a VPN make every activity anonymous?", "A VPN changes how your device connects through the network. Your accounts, browser settings and the services you use still affect your privacy."], ["What affects connection speed?", "Your local connection, selected location, network conditions and plan all affect performance. Published speed figures are upper limits rather than guaranteed speeds."]], closing: ["Your connection, considered.", "Find your VPN plan."],
  },
  esim: {
    kind: "esim", label: "Global eSIMs", title: "Travel Data & Phone-Number eSIM Plans",
    description: "Explore travel data and phone-number eSIM plans. Compare coverage and allowances, then activate on a compatible, unlocked device.",
    hero: ["New places.", "Same world.", "Stay connected."], purchaseHref: "/dashboard/esim", purchaseLabel: "Explore eSIM plans",
    optionsTitle: ["A connection for your trip.", "Or your everyday life."],
    options: [
      { name: "Travel data", title: "Data for wherever you're headed.", description: "Choose a data-only eSIM for your destination. Compare coverage, data allowance and validity, then follow your plan's instructions to install it on a compatible device.", facts: [["Service", "Mobile data"], ["Choose by", "Destination & allowance"]], features: ["Country and regional plan options", "Data allowance and validity shown per plan", "Digital installation details in your account"], preview: "Travel data eSIM" },
      { name: "Phone-number eSIM", title: "A number. More ways to connect.", description: "Explore available phone-number plans with calls, texts and data. Check the network, activation rules and roaming terms before selecting your line.", facts: [["Service", "Calls, texts & data"], ["Choose by", "Country & network"]], features: ["Available phone-number plans in the catalog", "US activation requires device IMEI and EID", "Review network and roaming terms"], preview: "Phone-number eSIM" },
    ], plansTitle: "Find your next connection.",
    useCasesTitle: ["Less time finding a SIM.", "More time being there."],
    useCases: [["Travel essentials", "Choose data for maps, messaging and the information you need during your trip."], ["Working on the move", "Compare data allowances and validity with your itinerary and everyday tools in mind."], ["Calls & messages", "Choose a phone-number plan when you need voice and SMS as well as mobile data."]],
    steps: [["Find your plan", "Select a destination or phone-number service, then check coverage, allowance and validity."], ["Install your eSIM", "Use the supplied installation details on a compatible, carrier-unlocked device."], ["Follow the activation guide", "Enable the eSIM as instructed by your plan. Activation location and roaming settings can vary."]],
    faqs: [["How do I know if my phone supports eSIM?", "Check your exact device model, region and carrier settings. The device must support eSIM and be carrier-unlocked. Confirm compatibility with your device manufacturer before purchasing."], ["Do data-only plans include a phone number?", "Data-only plans provide mobile data. Choose an available phone-number plan if you need calls and SMS, and review its included allowances."], ["What do I need for a US phone-number eSIM?", "US lines are activated on one phone and need that phone's IMEI and EID at checkout. Dial *#06# on your device to find these identifiers."], ["When should I activate my eSIM?", "Follow the activation instructions for your selected plan. Some plans have location requirements or validity rules that affect when you should install and activate them."], ["Can I use the same eSIM in multiple countries?", "Coverage depends on the plan. Check its covered countries and roaming terms before relying on it for a multi-country trip."]], closing: ["Your next destination.", "Your next connection."],
  },
};
