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
    title: "Secure Login",
    description: "Advanced security measures protect your account and data at all times."
  },
  {
    icon: BoltIcon,
    title: "Fast Access",
    description: "Lightning-fast login process to get you to your dashboard instantly."
  },
  {
    icon: GlobeAltIcon,
    title: "Global Network",
    description: "Access your ProxySock account from anywhere in the world."
  },
  {
    icon: SparklesIcon,
    title: "Premium Features",
    description: "Unlock advanced proxy features and management tools."
  },
];

export default function LoginFeaturesCarousel() {
  return <AuthCarousel features={loginFeatures} carouselId="login-feature" />;
}
