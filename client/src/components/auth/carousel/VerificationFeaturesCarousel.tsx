import AuthCarousel from "./AuthCarousel";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  GlobeAltIcon,
  UserGroupIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";

const verificationFeatures = [
  {
    icon: ShieldCheckIcon,
    title: "Secure Verification",
    description: "Your email verification is protected by enterprise-grade security measures."
  },
  {
    icon: CheckCircleIcon,
    title: "Account Activation",
    description: "Complete your verification to unlock full access to ProxySock services."
  },
  {
    icon: ClockIcon,
    title: "Quick Process",
    description: "Verification usually takes just a few minutes with instant email delivery."
  },
  {
    icon: GlobeAltIcon,
    title: "Global Support",
    description: "Access your account from anywhere with our worldwide infrastructure."
  },
  {
    icon: UserGroupIcon,
    title: "Trusted Platform",
    description: "Join thousands of users who trust ProxySock for their proxy needs."
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Multi-Device Access",
    description: "Verify once and access your account from any device, anywhere."
  },
];

export default function VerificationFeaturesCarousel() {
  return <AuthCarousel features={verificationFeatures} carouselId="verification-feature" />;
}
