export const getCategoryColor = (slug: string) => {
  switch (slug) {
    case "mobile":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10";
    case "datacenter":
      return "text-blue-600 dark:text-blue-400 bg-blue-500/10";
    case "residential-rotating":
      return "text-purple-600 dark:text-purple-400 bg-purple-500/10";
    case "isp":
      return "text-orange-600 dark:text-orange-400 bg-orange-500/10";
    case "premium-isp":
      return "text-pink-600 dark:text-pink-400 bg-pink-500/10";
    case "static-residential":
      return "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10";
    case "global-isp":
      return "text-teal-600 dark:text-teal-400 bg-teal-500/10";
    default:
      return "text-gray-600 dark:text-gray-400 bg-gray-500/10";
  }
};