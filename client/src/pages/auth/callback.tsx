import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '../../context/AuthContext';
import { storeSession, updateLastActivity } from '../../services/auth';
import api from '../../services/api';
import AuthPage from '@/components/auth/AuthPage';
import { LoaderCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for email confirmation token
        const confirmToken = searchParams.get('token');
        const type = searchParams.get('type');

        if (confirmToken && type === 'email_confirmation') {
          // Email confirmation flow
          const { data } = await api.get(`/web/api/auth/confirm_email?token=${confirmToken}`);

          if (data.token && data.user) {
            storeSession(data.token);
            updateLastActivity();
            toast.success('Email confirmed! Welcome to ProxySock.');
            setTimeout(() => navigate('/dashboard'), 1000);
          } else {
            toast.success(data.message || 'Email confirmed!');
            setTimeout(() => navigate('/login'), 1500);
          }
          return;
        }

        // Check for OAuth callback params (token from Rails OAuth flow)
        const oauthToken = searchParams.get('auth_token');
        const target = searchParams.get('target') || '/dashboard';

        if (oauthToken) {
          storeSession(oauthToken);
          updateLastActivity();
          toast.success('Welcome! You have been signed in.');

          // Clear URL params and navigate to target
          setTimeout(() => navigate(target), 1000);
          return;
        }

        // No valid params found
        toast.error('Invalid callback. Please try again.');
        navigate('/login');

      } catch (error: any) {
        console.error('Callback processing error:', error);
        const msg = error.response?.data?.error || 'Something went wrong.';
        toast.error(msg);
        navigate('/login?error=callback_failed');
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  // If user is already authenticated through AuthContext, redirect immediately
  useEffect(() => {
    if (isAuthenticated && user && !isProcessing) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate, isProcessing]);

  return (
    <AuthPage variant="login" title="Connecting your account" eyebrow="Signing you in"
      description="We're completing your sign-in and getting your account ready. You'll be redirected shortly."
      icon={<LoaderCircle className="login-spinner" />}>
      <div className="auth-note" role="status">Completing sign in...</div>
    </AuthPage>
  );
}
