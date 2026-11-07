import { servicePages } from "../services/service-pages-data";

export interface FAQItem { question: string; answer: string; }
const fromPairs = (items: [string, string][]): FAQItem[] => items.map(([question, answer]) => ({ question, answer }));
export const faqData: Record<string, FAQItem[]> = {
  general: fromPairs([
    ["What payment methods do you accept?", "The payment methods available for your order are shown at checkout. Review the payment instructions and final amount before completing your purchase."],
    ["Where can I find my service details?", "Sign in to your dashboard and open the relevant service. Once provisioning is complete, its connection details or installation instructions are available in your account."],
    ["How quickly are services activated after payment?", "Provisioning starts after payment confirmation. The time depends on the payment method, product and provider. Check your order status and contact support if it needs attention."],
    ["Do you offer refunds?", "Review the terms that apply to your order and our Terms of Service before purchasing. If a delivered service has a technical issue, contact support with the order ID so the team can investigate."],
    ["How do I contact support?", "Open support chat on the Contact page or email support@proxysock.com. For billing questions, email billing@proxysock.com. Include your service or order ID and the exact issue."],
    ["Can I upgrade or change my plan?", "Available changes depend on your service and plan. Check your service in the dashboard or contact support to discuss the options before making a new purchase."],
    ["Where can I read your privacy and service policies?", "Use the Privacy Policy and Terms of Service links in the footer for the published policies. Contact support if you have a question about your account or order."],
  ]),
  proxies: fromPairs([
    ["What types of proxies do you offer?", "Explore datacenter, ISP, static residential and rotating residential options on the Proxies page. The available plans and connection details are shown in your account."],
    ["What's the difference between static and rotating proxies?", "A static proxy keeps a consistent address for the service, while a rotating service changes addresses according to its available rotation settings. Choose based on how your application manages connections and sessions."],
    ["Which proxy protocols can I use?", "Use the HTTP or SOCKS5 endpoint supported by your selected service. Its host, port and authentication details are shown in the dashboard. Our tutorials include connection examples for both protocols."],
    ["Do all plans include unlimited bandwidth?", "Bandwidth allowances depend on the proxy type and plan. Review the limits and billing unit before purchasing."],
    ["How do I check that my proxy is working?", "Make a test request through your proxy using the setup guide, then check the exit IP returned by the request. The IP Checker can provide additional location and network details for that address."],
    ["Why is my proxy authentication failing?", "Check the host, port, protocol and service credentials. For IP-authenticated services, confirm that your current client IP is allowed. Contact support with the error message if the issue continues."],
  ]),
  vps: fromPairs(servicePages.vps.faqs),
  rdp: fromPairs(servicePages.rdp.faqs),
  vpn: fromPairs(servicePages.vpn.faqs),
  esim: fromPairs(servicePages.esim.faqs),
};
