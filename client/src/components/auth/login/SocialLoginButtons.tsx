import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { LoaderCircle } from "lucide-react";

interface SocialLoginButtonsProps {
  onGoogleSignIn: () => void;
  onXSignIn: () => void;
  googleLoading: boolean;
  xLoading: boolean;
  isOAuthDisabled: boolean;
}

export default function SocialLoginButtons({ onGoogleSignIn, onXSignIn, googleLoading, xLoading, isOAuthDisabled }: SocialLoginButtonsProps) {
  return (
    <div className="login-social">
      <button type="button" onClick={onGoogleSignIn} disabled={isOAuthDisabled} aria-label="Continue with Google">
        {googleLoading ? <LoaderCircle className="login-spinner" size={17} aria-hidden="true" /> : <FontAwesomeIcon icon={faGoogle} aria-hidden="true" />}
        <span>{googleLoading ? "Connecting..." : "Google"}</span>
      </button>
      <button type="button" onClick={onXSignIn} disabled={isOAuthDisabled} aria-label="Continue with X">
        {xLoading ? <LoaderCircle className="login-spinner" size={17} aria-hidden="true" /> : <FontAwesomeIcon icon={faXTwitter} aria-hidden="true" />}
        <span>{xLoading ? "Connecting..." : "X / Twitter"}</span>
      </button>
    </div>
  );
}
