import { CpuChipIcon, DevicePhoneMobileIcon, GlobeAltIcon, ServerIcon } from "@heroicons/react/24/outline";

export const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "mobile":
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case "datacenter":
        return <ServerIcon  className="w-5 h-5" />;
      case "residential":
        return <GlobeAltIcon className="w-5 h-5" />;
      default:
        return <CpuChipIcon className="w-5 h-5" />;
    }
  };