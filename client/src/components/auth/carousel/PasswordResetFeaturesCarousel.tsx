import AuthCarousel from "./AuthCarousel";
import {
  ShieldCheckIcon,
  BoltIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ServerIcon,
  CircleStackIcon
} from "@heroicons/react/24/outline";

const passwordResetFeatures = [
  {
    icon: ShieldCheckIcon,
    title: "Secure Reset",
    description: "Reset your password securely with advanced encryption and protection."
  },
  {
    icon: BoltIcon,
    title: "Quick Recovery",
    description: "Get back to your account quickly with instant email delivery."
  },
  {
    icon: GlobeAltIcon,
    title: "Global Access",
    description: "Access your account from anywhere with our worldwide infrastructure."
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Mobile Friendly",
    description: "Reset your password on any device with our responsive design."
  },
  {
    icon: ServerIcon,
    title: "Reliable Service",
    description: "Depend on our enterprise-grade servers for consistent performance."
  },
  {
    icon: CircleStackIcon,
    title: "Data Protection",
    description: "Your account information is protected by industry-leading security measures."
  },
];

export default function PasswordResetFeaturesCarousel() {
  return <AuthCarousel features={passwordResetFeatures} carouselId="reset-feature" />;
}
