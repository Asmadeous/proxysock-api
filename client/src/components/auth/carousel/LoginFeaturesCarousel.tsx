import AuthCarousel from "./AuthCarousel";
import {
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const loginFeatures = [
  {
    icon: ShieldCheckIcon,
    title: "Enterprise Security",
    description: "Military-grade encryption and SOC2-compliant infrastructure keep your data safe around the clock."
  },
  {
    icon: BoltIcon,
    title: "Lightning Fast",
    description: "Sub-millisecond response times with our globally distributed proxy network of 10M+ IPs."
  },
  {
    icon: GlobeAltIcon,
    title: "190+ Countries",
    description: "Access geo-restricted content from anywhere with residential and datacenter proxies worldwide."
  },
  {
    icon: SparklesIcon,
    title: "Premium Tools",
    description: "Advanced rotation, sticky sessions, API access, and real-time analytics at your fingertips."
  },
];

export default function LoginFeaturesCarousel() {
  return <AuthCarousel features={loginFeatures} carouselId="login-feature" />;
}
