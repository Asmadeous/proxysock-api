import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from "sonner";
import { useAuth } from '../../context/AuthContext';
import { storeSession, updateLastActivity } from '../../services/auth';
import api from '../../services/api';

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Completing sign in...</h2>
          <p className="text-gray-400 text-sm">Please wait while we set up your account.</p>

          <div className="mt-6 w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-1000 animate-pulse"
              style={{ width: '60%' }}
            ></div>
          </div>

          <p className="text-gray-500 text-xs mt-4">
            If this takes longer than expected, please try refreshing the page.
          </p>
        </div>
      </div>
    </div>
  );
}