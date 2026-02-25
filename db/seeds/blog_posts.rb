# frozen_string_literal: true
# db/seeds/blog_posts.rb
# Seeds all 17 blog posts previously hardcoded in client/src/pages/blogPost.ts

BLOG_POSTS = [
  {
    slug:         'best-proxies-web-scraping-2025',
    title:        "Best Proxies for Web Scraping in 2025",
    excerpt:      "Discover which proxy types work best for web scraping and how to choose the right one for your needs.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '12 min',
    featured:     true,
    published:    true,
    published_at: '2025-01-15',
    tags:         ['web scraping', 'datacenter proxies', 'residential proxies', 'proxy types'],
    image_url:    nil,
    content: <<~HTML
      <h2>Why Proxy Choice Matters for Web Scraping</h2>
      <p>Web scraping at scale requires the right proxy infrastructure. The wrong choice leads to IP bans, CAPTCHAs, and wasted time. This guide helps you pick the best proxy for your specific scraping use case.</p>
      <h2>Datacenter Proxies</h2>
      <p>Datacenter proxies offer the highest speed and lowest cost. They're ideal for scraping sites without strong anti-bot measures—like public APIs and less protected e-commerce sites.</p>
      <ul><li>Speeds: 1–10 Gbps</li><li>Cost: $ per GB or per IP</li><li>Risk: easier to detect than residential IPs</li></ul>
      <h2>Residential Proxies</h2>
      <p>Residential IPs are assigned by ISPs to real home users. They're much harder for target sites to block, making them the gold standard for sophisticated scrapers.</p>
      <ul><li>Best for: Google, Amazon, social media</li><li>Higher cost per GB</li><li>Rotating pools available</li></ul>
      <h2>ISP Proxies</h2>
      <p>ISP proxies combine datacenter speed with residential IP legitimacy. They're hosted in data centres but use IP ranges registered to ISPs—offering the best of both worlds.</p>
      <h2>Which Should You Choose?</h2>
      <p>Use datacenter proxies for speed-critical tasks with low detection risk. Use residential for high-value targets. Use ISP proxies as a balanced middle ground.</p>
    HTML
  },
  {
    slug:         'rdp-security-best-practices-2025',
    title:        "RDP Security Best Practices to Protect Your Remote Desktop",
    excerpt:      "Essential security measures every RDP user should implement to prevent unauthorized access and data breaches.",
    category:     'RDP',
    author:       'Security Team',
    read_time:    '15 min',
    featured:     true,
    published:    true,
    published_at: '2025-01-20',
    tags:         ['RDP', 'security', 'remote desktop', 'cybersecurity', 'windows'],
    image_url:    nil,
    content: <<~HTML
      <h2>Why RDP Security Matters</h2>
      <p>RDP (Remote Desktop Protocol) is one of the most attacked surfaces on the internet. BlueKeep and DejaBlue exploits alone affected millions of Windows machines. Without hardening, your RDP endpoint is a doorway for ransomware operators.</p>
      <h2>1. Change the Default Port</h2>
      <p>The default RDP port is 3389. Attackers scan for this constantly. Moving to a non-standard port (e.g. 49152–65535) removes you from automated scans.</p>
      <h2>2. Use Network Level Authentication (NLA)</h2>
      <p>NLA requires credentials before the RDP session is established, blocking unauthenticated exploit attempts.</p>
      <h2>3. Enable IP Whitelisting</h2>
      <p>Restrict RDP access to known IP addresses using Windows Firewall rules or a cloud security group.</p>
      <h2>4. Strong Password Policy</h2>
      <p>Enforce 14+ character passwords with complexity requirements. Use a password manager.</p>
      <h2>5. Enable Two-Factor Authentication</h2>
      <p>Deploy Duo Security, Microsoft Authenticator, or a VPN with MFA in front of your RDP endpoint.</p>
      <h2>6. Keep Windows Updated</h2>
      <p>Apply Windows patches promptly. Critical RDP CVEs are patched regularly—an unpatched RDP host is a sitting duck.</p>
    HTML
  },
  {
    slug:         'esim-vs-physical-sim-travel',
    title:        "eSIM vs Physical SIM: Which is Better for International Travel?",
    excerpt:      "A comprehensive comparison of eSIM and traditional SIM cards for frequent travelers.",
    category:     'eSIM',
    author:       'Travel Tech Team',
    read_time:    '10 min',
    featured:     false,
    published:    true,
    published_at: '2025-01-25',
    tags:         ['eSIM', 'travel', 'international roaming', 'SIM card'],
    image_url:    nil,
    content: <<~HTML
      <h2>The SIM Card Landscape in 2025</h2>
      <p>International travelers used to juggle physical SIM cards from multiple countries. eSIM technology changes that calculus dramatically.</p>
      <h2>What is an eSIM?</h2>
      <p>An eSIM (embedded SIM) is a digital SIM built into your device. You download a carrier profile over the internet instead of inserting a physical card.</p>
      <h2>eSIM Advantages</h2>
      <ul><li>Instant activation — no waiting for mail or airport kiosks</li><li>Multiple plans on one device (dual SIM)</li><li>No risk of losing a tiny plastic card</li><li>Switch plans mid-trip with a QR code</li></ul>
      <h2>Physical SIM Advantages</h2>
      <ul><li>Available everywhere, even budget phones</li><li>Sometimes cheaper in-country</li><li>No device compatibility concerns</li></ul>
      <h2>Verdict</h2>
      <p>For modern smartphones on international trips, eSIM wins on convenience. Physical SIM makes sense for budget devices or in regions with limited eSIM coverage.</p>
    HTML
  },
  {
    slug:         'vps-vs-vds-differences',
    title:        "VPS vs VDS: Key Differences and Which to Choose",
    excerpt:      "Understanding the technical differences between VPS and VDS hosting and when each solution makes sense.",
    category:     'VPS',
    author:       'Infrastructure Team',
    read_time:    '8 min',
    featured:     false,
    published:    true,
    published_at: '2025-02-01',
    tags:         ['VPS', 'VDS', 'hosting', 'dedicated server', 'virtualization'],
    image_url:    nil,
    content: <<~HTML
      <h2>Virtual Private Server (VPS)</h2>
      <p>A VPS shares physical hardware with other tenants but uses hypervisor software (KVM, VMware) to isolate resources. CPU, RAM, and disk are shared from a pool—you get a guaranteed allocation but neighbours can impact performance under load.</p>
      <h2>Virtual Dedicated Server (VDS)</h2>
      <p>A VDS gives you dedicated physical CPU cores and RAM pinned exclusively to your VM. No resource contention. Closer to bare-metal performance.</p>
      <h2>When to Choose VPS</h2>
      <ul><li>Budget-conscious workloads</li><li>Development and staging environments</li><li>Small to medium web applications</li></ul>
      <h2>When to Choose VDS</h2>
      <ul><li>CPU-intensive tasks (video encoding, ML inference)</li><li>Low-latency databases</li><li>Guaranteed performance SLAs</li></ul>
    HTML
  },
  {
    slug:         'vpn-protocols-comparison-2025',
    title:        "VPN Protocols Compared: WireGuard vs OpenVPN vs IKEv2",
    excerpt:      "A deep dive into the most popular VPN protocols to help you choose the right one for speed, security, and compatibility.",
    category:     'VPN',
    author:       'Security Team',
    read_time:    '11 min',
    featured:     false,
    published:    true,
    published_at: '2025-02-05',
    tags:         ['VPN', 'WireGuard', 'OpenVPN', 'IKEv2', 'protocols'],
    image_url:    nil,
    content: <<~HTML
      <h2>Why Protocol Choice Matters</h2>
      <p>The VPN protocol is the encryption and tunnelling mechanism that determines speed, battery life, firewall compatibility, and security posture.</p>
      <h2>WireGuard</h2>
      <p>The newest of the major protocols. ~4,000 lines of code (vs ~400,000 for OpenVPN). Fastest speeds, lowest CPU overhead, excellent mobile battery life. The future of VPN.</p>
      <h2>OpenVPN</h2>
      <p>Battle-tested over 20+ years. Highly configurable (TCP or UDP). Slower than WireGuard but extremely audited. TCP mode penetrates firewalls that block UDP.</p>
      <h2>IKEv2/IPSec</h2>
      <p>Built into Windows, macOS, iOS, and Android. Fast reconnection on network switches—ideal for mobile users switching between Wi-Fi and cellular.</p>
      <h2>Recommendation</h2>
      <p>Choose WireGuard for speed and battery. OpenVPN for maximum firewall compatibility. IKEv2 for native mobile integration.</p>
    HTML
  },
  {
    slug:         'residential-proxy-use-cases',
    title:        "Top 10 Residential Proxy Use Cases in 2025",
    excerpt:      "Explore the most valuable use cases for residential proxies in business, research, and automation.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '13 min',
    featured:     false,
    published:    true,
    published_at: '2025-02-10',
    tags:         ['residential proxies', 'use cases', 'automation', 'business'],
    image_url:    nil,
    content: <<~HTML
      <h2>1. Price Intelligence</h2>
      <p>Monitor competitor pricing across thousands of SKUs without triggering bot detection.</p>
      <h2>2. Ad Verification</h2>
      <p>Check that your digital ads display correctly in different regions and aren't hijacked by ad fraud.</p>
      <h2>3. SEO Monitoring</h2>
      <p>Track your search rankings from a buyer's perspective — not your own office IP which Google recognises.</p>
      <h2>4. Social Media Management</h2>
      <p>Run multiple accounts with unique residential IPs to avoid account linking.</p>
      <h2>5. Market Research</h2>
      <p>Gather real-world data from local markets without geographic bias.</p>
      <h2>6. Travel Fare Aggregation</h2>
      <p>Scrape flight and hotel prices from airlines and OTAs that block datacenter IPs.</p>
      <h2>7. Brand Protection</h2>
      <p>Detect counterfeit product listings on marketplaces.</p>
      <h2>8. Content Aggregation</h2>
      <p>Build news and media aggregators that require geo-diverse access.</p>
      <h2>9. Academic Research</h2>
      <p>Collect large-scale datasets for academic studies.</p>
      <h2>10. Account Creation Automation</h2>
      <p>Create and warm up accounts on platforms that fingerprint IPs.</p>
    HTML
  },
  {
    slug:         'setting-up-rdp-windows-server',
    title:        "How to Set Up RDP on Windows Server 2022: Step-by-Step Guide",
    excerpt:      "A complete walkthrough for configuring Remote Desktop Protocol on Windows Server 2022 with security best practices.",
    category:     'RDP',
    author:       'Tech Team',
    read_time:    '18 min',
    featured:     false,
    published:    true,
    published_at: '2025-02-15',
    tags:         ['RDP', 'Windows Server', 'tutorial', 'setup', 'remote desktop'],
    image_url:    nil,
    content: <<~HTML
      <h2>Prerequisites</h2>
      <ul><li>Windows Server 2022 installed</li><li>Administrator account</li><li>Static IP or DDNS configured</li></ul>
      <h2>Step 1: Enable Remote Desktop</h2>
      <p>Open System Properties → Remote tab → Select "Allow remote connections to this computer" → Check "Allow connections only from computers running Remote Desktop with NLA".</p>
      <h2>Step 2: Configure Windows Firewall</h2>
      <p>Allow TCP 3389 (or your custom port) through Windows Firewall for your trusted IP range only.</p>
      <h2>Step 3: Add Users</h2>
      <p>Click "Select Users" → Add → type the usernames of accounts that need RDP access.</p>
      <h2>Step 4: Install Remote Desktop Services Role (for multi-user)</h2>
      <p>Server Manager → Add Roles → Remote Desktop Services → Remote Desktop Session Host.</p>
      <h2>Step 5: Test the Connection</h2>
      <p>From a client machine: Start → Run → mstsc → enter the server IP → Connect → enter credentials.</p>
    HTML
  },
  {
    slug:         'esim-global-coverage-guide',
    title:        "Global eSIM Coverage Guide: Which Countries Support eSIM in 2025",
    excerpt:      "A comprehensive breakdown of eSIM availability and major carriers offering eSIM plans worldwide.",
    category:     'eSIM',
    author:       'Travel Tech Team',
    read_time:    '9 min',
    featured:     false,
    published:    true,
    published_at: '2025-02-20',
    tags:         ['eSIM', 'global coverage', 'international', 'carriers'],
    image_url:    nil,
    content: <<~HTML
      <h2>eSIM Adoption in 2025</h2>
      <p>Over 200 countries now have carrier support for eSIM. Major adoption has been driven by Apple's move to eSIM-only iPhones in the US (iPhone 14 onwards).</p>
      <h2>North America</h2>
      <p>Complete coverage. All major carriers (AT&T, Verizon, T-Mobile, Rogers, Bell, Telcel) fully support eSIM.</p>
      <h2>Europe</h2>
      <p>Strong coverage. EEA-wide roaming makes a single EU eSIM plan usable across 30+ countries.</p>
      <h2>Asia Pacific</h2>
      <p>Variable coverage. Japan, South Korea, Australia, Singapore, India have strong support. Some South-East Asian markets still lag.</p>
      <h2>Africa & Middle East</h2>
      <p>Growing rapidly. UAE, South Africa, Kenya, and Egypt have solid support. Rural coverage in sub-Saharan Africa remains limited.</p>
      <h2>Latin America</h2>
      <p>Major cities in Brazil, Argentina, Mexico, Colombia covered. Rural areas still physical-SIM dependent.</p>
    HTML
  },
  {
    slug:         'proxy-for-social-media-management',
    title:        "Using Proxies for Social Media Management: Complete Guide",
    excerpt:      "Learn how to safely manage multiple social media accounts using proxies without getting banned.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '14 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-01',
    tags:         ['proxies', 'social media', 'account management', 'automation'],
    image_url:    nil,
    content: <<~HTML
      <h2>Why Social Media Platforms Flag Multiple Accounts</h2>
      <p>Platforms like Instagram, Twitter/X, TikTok, and Facebook use IP fingerprinting to detect and ban users running multiple accounts from the same connection.</p>
      <h2>The Right Proxy Type</h2>
      <p>Residential rotating proxies are the gold standard. Each account gets a unique residential IP that mimics a real user. Avoid datacenter IPs — platforms know their ranges.</p>
      <h2>One IP per Account Rule</h2>
      <p>Never share an IP between accounts on the same platform. Use dedicated residential IPs for high-value accounts.</p>
      <h2>Cookie and Browser Fingerprint Isolation</h2>
      <p>Combine proxies with anti-detect browsers (Multilogin, GoLogin, AdsPower) for complete session isolation.</p>
      <h2>Proxy Rotation Strategy</h2>
      <p>Use sticky sessions for the same account across a session. Rotate IPs only when switching between accounts.</p>
      <h2>Compliance Warning</h2>
      <p>Review each platform's Terms of Service. Automation for spam or manipulation violates ToS. Use proxies for legitimate management tasks only.</p>
    HTML
  },
  {
    slug:         'vps-wordpress-optimisation',
    title:        "Optimising WordPress on a VPS: Speed and Performance Guide",
    excerpt:      "Actionable tips to dramatically improve WordPress performance on a VPS hosting environment.",
    category:     'VPS',
    author:       'Infrastructure Team',
    read_time:    '16 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-05',
    tags:         ['VPS', 'WordPress', 'performance', 'optimisation', 'hosting'],
    image_url:    nil,
    content: <<~HTML
      <h2>Web Server Choice: Nginx vs Apache</h2>
      <p>Nginx handles concurrent connections more efficiently than Apache. For WordPress, use Nginx as the reverse proxy with PHP-FPM for optimal performance.</p>
      <h2>PHP-FPM Configuration</h2>
      <p>Tune pm.max_children, pm.start_servers, and pm.min_spare_servers based on available RAM. A rule of thumb: each PHP-FPM worker uses ~30–50 MB RAM.</p>
      <h2>Object Caching with Redis</h2>
      <p>Install Redis and the Redis Object Cache plugin. WordPress database queries drop dramatically when frequently accessed objects are cached in memory.</p>
      <h2>Page Caching</h2>
      <p>Use WP Rocket, W3 Total Cache, or nginx FastCGI cache to serve static HTML copies of pages, bypassing PHP entirely for cold visitors.</p>
      <h2>CDN Integration</h2>
      <p>Push static assets (images, CSS, JS) to Cloudflare or BunnyCDN. This offloads bandwidth and improves TTFB for global visitors.</p>
      <h2>Database Optimisation</h2>
      <p>Run OPTIMIZE TABLE on wp_options and wp_postmeta regularly. Clean up spam comments, post revisions, and transients with WP-Optimize.</p>
    HTML
  },
  {
    slug:         'understanding-proxy-protocols',
    title:        "Understanding Proxy Protocols: HTTP, HTTPS, SOCKS4, and SOCKS5",
    excerpt:      "A technical breakdown of the different proxy protocols and when to use each one.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '10 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-10',
    tags:         ['proxy protocols', 'SOCKS5', 'HTTP proxy', 'HTTPS', 'technical'],
    image_url:    nil,
    content: <<~HTML
      <h2>HTTP Proxies</h2>
      <p>HTTP proxies only handle web traffic (HTTP/HTTPS). They interpret the traffic and can cache, filter, or log it. Suitable for web browsing and scraping.</p>
      <h2>HTTPS Proxies (HTTP CONNECT)</h2>
      <p>Extend HTTP proxies with HTTPS support using the CONNECT method to create a tunnel for encrypted traffic. The proxy can't read the encrypted content.</p>
      <h2>SOCKS4</h2>
      <p>A general-purpose proxy protocol that tunnels any TCP traffic. Doesn't support authentication or UDP. Legacy protocol still found in older tools.</p>
      <h2>SOCKS5</h2>
      <p>The modern standard. Supports TCP and UDP, multiple authentication methods (username/password, GSSAPI), and IPv6. SOCKS5 works with any protocol — HTTP, FTP, SMTP, IRC, torrents.</p>
      <h2>Which to Use?</h2>
      <p>Choose SOCKS5 for maximum compatibility. Use HTTP(S) when the tool requires it. SOCKS4 only for legacy applications.</p>
    HTML
  },
  {
    slug:         'vpn-vs-proxy-differences',
    title:        "VPN vs Proxy: What's the Difference and Which Do You Need?",
    excerpt:      "Clear up the confusion between VPNs and proxies—understand their differences, use cases, and limitations.",
    category:     'VPN',
    author:       'Security Team',
    read_time:    '9 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-15',
    tags:         ['VPN', 'proxy', 'comparison', 'privacy', 'security'],
    image_url:    nil,
    content: <<~HTML
      <h2>What is a Proxy?</h2>
      <p>A proxy server acts as an intermediary for specific application traffic—usually HTTP(S). Your browser sends requests through the proxy, which forwards them to the website. The website sees the proxy's IP.</p>
      <h2>What is a VPN?</h2>
      <p>A VPN creates an encrypted tunnel for ALL traffic from your device at the OS level. DNS queries, app traffic, and browser requests all route through the VPN server.</p>
      <h2>Key Differences</h2>
      <table><tr><th>Feature</th><th>Proxy</th><th>VPN</th></tr><tr><td>Encryption</td><td>Usually none</td><td>Strong (AES-256)</td></tr><tr><td>Scope</td><td>Per-app</td><td>System-wide</td></tr><tr><td>Speed</td><td>Faster</td><td>Slightly slower</td></tr><tr><td>Cost</td><td>Lower</td><td>Higher</td></tr></table>
      <h2>When to Use Each</h2>
      <p>Use proxies for high-volume scraping, SEO tools, and browser automation. Use VPNs for privacy, bypassing geo-blocks on streaming, and securing public Wi-Fi connections.</p>
    HTML
  },
  {
    slug:         'datacenter-proxy-guide',
    title:        "The Complete Guide to Datacenter Proxies: Speed, IP Ranges, and Detection",
    excerpt:      "Everything you need to know about datacenter proxies—how they work, why they're fast, and how to avoid detection.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '11 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-20',
    tags:         ['datacenter proxies', 'proxy detection', 'IP ranges', 'ASN'],
    image_url:    nil,
    content: <<~HTML
      <h2>What Makes Datacenter Proxies Fast?</h2>
      <p>Datacenter proxies run on enterprise servers with 1–40 Gbps uplinks. Compare that to residential connections averaging 100–500 Mbps. For throughput-heavy scraping, datacenter proxies dominate.</p>
      <h2>IP Ranges and ASN Detection</h2>
      <p>Datacenter IPs belong to ASNs (Autonomous System Numbers) registered to cloud providers: AWS, Google Cloud, OVH, Hetzner, etc. Anti-bot systems maintain blocklists of these ASNs.</p>
      <h2>How Websites Detect Datacenter IPs</h2>
      <ul><li>ASN lookup: is this IP from a known cloud provider?</li><li>Reverse DNS: does it resolve to a hosting company?</li><li>IP reputation databases: Project Honey Pot, AbuseIPDB</li></ul>
      <h2>Avoiding Detection</h2>
      <p>Use private datacenter proxies (not shared). Rotate IPs. Set realistic request rates. Add User-Agent rotation and realistic browser headers.</p>
      <h2>Best Use Cases for Datacenter Proxies</h2>
      <ul><li>Public APIs with rate limits</li><li>Non-protected e-commerce sites</li><li>Internal data pipelines</li><li>Latency-sensitive applications</li></ul>
    HTML
  },
  {
    slug:         'esim-setup-guide-iphone-android',
    title:        "How to Set Up an eSIM on iPhone and Android: Step-by-Step",
    excerpt:      "A complete guide to activating and using eSIM on both iPhone and Android devices.",
    category:     'eSIM',
    author:       'Travel Tech Team',
    read_time:    '7 min',
    featured:     false,
    published:    true,
    published_at: '2025-03-25',
    tags:         ['eSIM', 'iPhone', 'Android', 'setup', 'activation'],
    image_url:    nil,
    content: <<~HTML
      <h2>iPhone eSIM Setup</h2>
      <ol>
        <li>Go to Settings → Cellular → Add Cellular Plan</li>
        <li>Scan the QR code provided by your carrier (or enter details manually)</li>
        <li>Follow on-screen prompts to activate</li>
        <li>Set as primary or secondary line under Cellular Plan Label</li>
      </ol>
      <h2>Android eSIM Setup (Google Pixel / Samsung Galaxy)</h2>
      <ol>
        <li>Go to Settings → Network & Internet → SIM cards → Add SIM</li>
        <li>Scan the QR code from your carrier</li>
        <li>Follow activation steps</li>
        <li>Set data preference under SIM settings</li>
      </ol>
      <h2>Troubleshooting</h2>
      <ul>
        <li>Ensure your device is unlocked (not carrier-locked)</li>
        <li>Confirm device eSIM compatibility on manufacturer website</li>
        <li>QR codes are single-use — contact your provider for a new one if it fails</li>
      </ul>
    HTML
  },
  {
    slug:         'proxy-rotation-strategies',
    title:        "Proxy Rotation Strategies: When and How to Rotate IPs",
    excerpt:      "Master the art of IP rotation to maximise scraping efficiency and minimise bans.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '12 min',
    featured:     false,
    published:    true,
    published_at: '2025-04-01',
    tags:         ['proxy rotation', 'IP rotation', 'web scraping', 'strategies'],
    image_url:    nil,
    content: <<~HTML
      <h2>Why Rotate Proxies?</h2>
      <p>Even residential proxies get blocked if you hammer the same IP against a target. Rotation distributes requests across many IPs, making you indistinguishable from organic traffic.</p>
      <h2>Rotation Strategies</h2>
      <h3>Per-Request Rotation</h3>
      <p>A new IP for every HTTP request. Maximum anonymity and minimal ban risk. Slightly slower as sessions reset each time.</p>
      <h3>Session-Based Rotation</h3>
      <p>Keep the same IP for a user session (login → browse → checkout). Rotate on session end or after a configurable number of requests.</p>
      <h3>Time-Based Rotation</h3>
      <p>Rotate IP every N minutes regardless of activity. Simple to implement, less adaptive.</p>
      <h3>Error-Based Rotation</h3>
      <p>Rotate only when a CAPTCHA, 403, or 429 is detected. Conserves IPs but reacts slower than proactive rotation.</p>
      <h2>Sticky Sessions</h2>
      <p>Some providers offer sticky sessions (same IP for 1–30 minutes). Ideal for multi-step workflows that require consistent session state.</p>
    HTML
  },
  {
    slug:         'vps-linux-server-hardening',
    title:        "Linux VPS Server Hardening: Complete Security Checklist",
    excerpt:      "A comprehensive checklist to secure your Linux VPS against common attacks and vulnerabilities.",
    category:     'VPS',
    author:       'Security Team',
    read_time:    '20 min',
    featured:     false,
    published:    true,
    published_at: '2025-04-05',
    tags:         ['VPS', 'Linux', 'security', 'hardening', 'server'],
    image_url:    nil,
    content: <<~HTML
      <h2>1. Initial Access Security</h2>
      <ul><li>Disable root SSH login (PermitRootLogin no)</li><li>Use SSH key authentication (disable password auth)</li><li>Change default SSH port</li><li>Use fail2ban to block brute-force attempts</li></ul>
      <h2>2. User Management</h2>
      <ul><li>Create a non-root sudo user for daily operations</li><li>Audit /etc/sudoers — remove unnecessary sudo grants</li><li>Disable unused system accounts</li></ul>
      <h2>3. Firewall Configuration</h2>
      <ul><li>Install ufw (Ubuntu) or firewalld (CentOS)</li><li>Default deny incoming, allow outgoing</li><li>Explicitly allow only needed ports (22, 80, 443)</li></ul>
      <h2>4. System Updates</h2>
      <ul><li>Enable unattended-upgrades for security patches</li><li>Run apt update && apt upgrade immediately after provisioning</li></ul>
      <h2>5. Intrusion Detection</h2>
      <ul><li>Install AIDE or Tripwire for file integrity monitoring</li><li>Set up auditd for system call auditing</li><li>Review /var/log/auth.log regularly</li></ul>
      <h2>6. Application Security</h2>
      <ul><li>Disable unused services (disable via systemctl)</li><li>Install and configure AppArmor or SELinux</li><li>Use HTTPS everywhere with Let's Encrypt</li></ul>
    HTML
  },
  {
    slug:         'static-isp-proxies-explained',
    title:        "Static ISP Proxies Explained: The Best of Both Worlds",
    excerpt:      "Discover why static ISP proxies are becoming the preferred choice for advanced proxy users.",
    category:     'Proxies',
    author:       'Tech Team',
    read_time:    '8 min',
    featured:     false,
    published:    true,
    published_at: '2025-04-10',
    tags:         ['ISP proxies', 'static proxies', 'proxy types', 'residential'],
    image_url:    nil,
    content: <<~HTML
      <h2>What are Static ISP Proxies?</h2>
      <p>Static ISP proxies are IP addresses obtained from Internet Service Providers but hosted on datacenter hardware. They appear as residential IPs to detection systems but deliver datacenter-grade speed and stability.</p>
      <h2>How They Differ from Residential Proxies</h2>
      <p>Unlike residential proxies (which rotate through real home users' IPs), static ISP proxies give you a dedicated, persistent IP that belongs to you for the duration of your subscription.</p>
      <h2>Speed Comparison</h2>
      <ul><li>Datacenter proxies: 100–500 ms latency, 1 Gbps+ bandwidth</li><li>Residential proxies: 300–2000 ms latency, limited by home connection</li><li>Static ISP proxies: 100–300 ms latency, 100 Mbps+</li></ul>
      <h2>Use Cases</h2>
      <ul><li>Account management requiring consistent IP identity</li><li>E-commerce automation (Nike, Supreme, SNKRS)</li><li>Financial data scraping requiring residential-looking IPs at scale</li></ul>
      <h2>Cost vs Value</h2>
      <p>Static ISP proxies cost more than datacenter but less than premium residential. For high-value automation where success rate > speed, they offer excellent ROI.</p>
    HTML
  }
].freeze

puts "📝 Seeding #{BLOG_POSTS.length} blog posts..."

BLOG_POSTS.each do |attrs|
  BlogPost.find_or_create_by!(slug: attrs[:slug]) do |p|
    p.assign_attributes(
      attrs.merge(
        published_at: attrs[:published_at] ? Time.zone.parse(attrs[:published_at].to_s) : Time.current
      )
    )
  end
end

puts "  ✅ #{BlogPost.count} blog posts"
