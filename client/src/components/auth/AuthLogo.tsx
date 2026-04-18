import { Link } from "react-router-dom";
import logoDark from "@/assets/images/PROXY PNG.webp";
import logoLight from "@/assets/images/PROXY SOCKS DARK FONT.webp";

interface AuthLogoProps {
    variant?: "dark" | "auto";
    size?: "sm" | "md";
}

export default function AuthLogo({ variant = "auto", size = "md" }: AuthLogoProps) {
    const imgClass = size === "sm" ? "h-7 w-auto" : "h-9 w-auto";

    return (
        <Link to="/" aria-label="Back to home">
            {variant === "dark" ? (
                <img src={logoDark} alt="ProxySock" className={imgClass} />
            ) : (
                <>
                    <img src={logoDark} alt="ProxySock" className={`${imgClass} hidden dark:block`} />
                    <img src={logoLight} alt="ProxySock" className={`${imgClass} dark:hidden`} />
                </>
            )}
        </Link>
    );
}
