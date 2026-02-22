import { motion } from "framer-motion";

interface LoadingProps {
  size?: "small" | "medium" | "large" | "full";
  text?: string;
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  small: "h-8 w-8 border-2",
  medium: "h-12 w-12 border-2",
  large: "h-16 w-16 border-3",
  full: "h-32 w-32 border-4",
};

const containerClasses = {
  small: "flex items-center justify-center p-4",
  medium: "flex items-center justify-center p-6",
  large: "flex items-center justify-center p-8",
  full: "min-h-screen flex items-center justify-center",
};

export const Loading = ({
  size = "medium",
  text,
  className = "",
  showText = true,
}: LoadingProps) => {

  return (
    <div className={`${containerClasses[size]} ${className} ${size === 'full' ? 'landing-theme' : ''}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Enhanced Spinner */}
        <div className="relative">
          <motion.div
            className={`animate-spin rounded-full ${sizeClasses[size]} border-primary border-t-transparent`}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              background: size === 'full' ? `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)` : undefined,
              boxShadow: size === 'full' ? `0 0 40px hsla(var(--primary), 0.1)` : undefined,
            }}
          />
          {/* Inner glow effect */}
          <div
            className={`absolute inset-0 rounded-full ${sizeClasses[size]} border-primary opacity-20 animate-pulse`}
            style={{
              background: size === 'full' ? `linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--card)) 100%)` : undefined,
            }}
          />
        </div>

        {/* Loading text */}
        {showText && (text || size === "full") && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-muted-foreground text-center"
          >
            {text || "Loading..."}
          </motion.p>
        )}
      </div>
    </div>
  );
};

// Legacy LoadingSpinner component for backward compatibility
export const LoadingSpinner = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => {
  return <Loading size={size} showText={false} />;
};
