import AuthCarousel from "./AuthCarousel";
import {
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ServerIcon,
  CircleStackIcon
} from "@heroicons/react/24/outline";

const registerBenefits = [
  {
    icon: ShieldCheckIcon,
    title: "Account Security",
    description: "Your data is protected with enterprise-grade security and encryption."
  },
  {
    icon: BoltIcon,
    title: "Quick Setup",
    description: "Get started in minutes with our streamlined registration process."
  },
  {
    icon: GlobeAltIcon,
    title: "Worldwide Access",
    description: "Access your account and proxies from anywhere globally."
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Multi-Device Support",
    description: "Manage your proxies across all your devices seamlessly."
  },
  {
    icon: ServerIcon,
    title: "High Performance",
    description: "Experience blazing-fast proxy speeds with our optimized infrastructure."
  },
  {
    icon: CircleStackIcon,
    title: "Reliable Service",
    description: "99.9% uptime guarantee with our robust server network."
  },
];

export default function RegisterBenefitsCarousel() {
  return <AuthCarousel features={registerBenefits} carouselId="register-benefit" />;
}
