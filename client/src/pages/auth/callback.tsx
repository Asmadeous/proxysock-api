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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">Redirecting...</h2>
          <p className="text-gray-400 text-sm">Please wait...</p>
        </div>
      </div>
    </div>
  );
}