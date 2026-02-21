<<<<<<< HEAD
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
// import { storeSession, updateLastActivity } from '../../services/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // If we land here, it might be a legacy Supabase Oauth callback or a new Rails one.
    // For now, we just redirect to login as Rails Oauth flow is different or not fully wired here.
    const handleAuthCallback = async () => {
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 800));

      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        // Check if there is a token in URL (Rails simplified flow)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
          // If Rails passed a token, we could store it.
          // But for now, let's just redirect to login to be safe.
          // storeSession(token);
          // navigate('/dashboard');
          toast.error("Please log in with your credentials.");
          navigate('/login');
        } else {
          navigate('/login');
        }
      }
    };

    handleAuthCallback();
  }, [navigate, isAuthenticated]);
=======
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
        if (oauthToken) {
          storeSession(oauthToken);
          updateLastActivity();
          toast.success('Welcome! You have been signed in.');
          setTimeout(() => navigate('/dashboard'), 1000);
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
<<<<<<< HEAD
          <h2 className="text-xl font-semibold text-white mb-2">Redirecting...</h2>
          <p className="text-gray-400 text-sm">Please wait...</p>
=======
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
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
        </div>
      </div>
    </div>
  );
}