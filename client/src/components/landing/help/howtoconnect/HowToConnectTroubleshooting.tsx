import { FAQList } from "@/components/landing/FAQList";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const issues = [
  ["My connection is timing out.", "Check that your service is active and that the host, port and protocol match your dashboard. Confirm that your network allows that connection and inspect the relevant firewall rule. For a server, check its running state before trying again."],
  ["My credentials aren't being accepted.", "Copy your service username and password again and check for extra spaces. Service credentials can differ from your account login. For IP-authenticated proxies, check that your current client IP is allowed."],
  ["My eSIM is installed but has no data.", "Check the plan's coverage, activation rules and remaining allowance. Select the eSIM as your mobile-data line and use the roaming settings specified in your order. Contact support before deleting the installed profile."],
  ["What should I include when contacting support?", "Share the affected service or order ID, your device and client, the exact error and when it happened. Remove passwords, private keys and eSIM activation codes from screenshots or logs."],
];

export const HowToConnectTroubleshooting = () => (
  <>
    <section className="tutorial-troubleshooting" aria-labelledby="troubleshooting-title">
      <div><p className="proxy-eyebrow">When something doesn't connect</p><h2 id="troubleshooting-title">A few checks.<br /><em>A clearer answer.</em></h2></div>
      <FAQList items={issues.map(([question, answer]) => ({ question, answer }))} />
    </section>
    <section className="proxy-closing tutorial-closing" aria-labelledby="tutorial-support-title"><div><p className="proxy-eyebrow">You're not on your own</p><h2 id="tutorial-support-title">Let's get you<br /><span>connected.</span></h2></div><div className="proxy-closing-actions"><Link to="/contact" className="proxy-button proxy-button-dark">Contact support <ArrowUpRight size={16} aria-hidden="true" /></Link><Link to="/dashboard" className="proxy-button proxy-button-outline">Open dashboard <ArrowUpRight size={16} aria-hidden="true" /></Link></div></section>
  </>
);
