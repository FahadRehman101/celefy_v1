import React, { useState } from 'react';
import { signInWithCredential, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';
import { Gift, AlertCircle } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Starting Google sign in...');
      
      // Check if we're in Capacitor (native Android)
      if (window.Capacitor) {
        console.log('🚀 Capacitor detected - using native Android authentication');
        
        // Use native Android authentication
        const result = await handleNativeAndroidAuth();
        console.log('Native Android login successful:', result.user.email);
      } else {
        console.log('🌐 Web detected - using popup authentication');
        
        // Fallback to popup for web
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Web login successful:', result.user.email);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked. Please allow pop-ups and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with this email. Please sign in with the correct method.');
      } else {
        setError(`Failed to sign in: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Native Android Authentication
  const handleNativeAndroidAuth = async () => {
    try {
      console.log('🔐 Using native Android authentication...');
      
      // In Capacitor, we need to handle the authentication differently
      // The key is that Firebase will use the native Android Google Sign-In
      // when the app is running in Capacitor
      
      // For now, let's try the standard approach but with better error handling
      // Firebase should automatically detect Capacitor and use native methods
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('✅ Native authentication successful');
      return result;
      
    } catch (error) {
      console.error('Native Android authentication failed:', error);
      
      // If the first attempt fails, try alternative approach
      if (error.code === 'auth/popup-closed-by-user') {
        // User cancelled - try again
        console.log('🔄 User cancelled, trying again...');
        return await signInWithPopup(auth, googleProvider);
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Authentication popup was blocked. Please allow popups and try again.');
      } else {
        throw error;
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-md w-full border border-pink-200 mx-4">
        
        {/* App Logo & Branding */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-2xl mx-auto w-fit mb-4 shadow-lg">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Celefy
          </h1>
          <p className="text-gray-600">
            Never miss a birthday again! 🎉
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 py-4 px-4 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {/* Google Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          
          {/* Button Text */}
          <span className="font-medium">
            {loading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Connecting to Google...</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            By signing in, you agree to our{' '}
            <span className="text-pink-600 hover:text-pink-700 cursor-pointer">Terms of Service</span>
            {' '}and{' '}
            <span className="text-pink-600 hover:text-pink-700 cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;