import React from 'react';
import { Gift, Sparkles, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';



const Login = ({ handleGoogleLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/90 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-pink-200">
        {/* Branding Section */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-2xl shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Welcome to Celefy
            </h1>
          </div>
          <p className="text-gray-700 text-lg mb-4">
            The ultimate app to celebrate birthdays like never before 🎉
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-pink-400" />
              Get reminders 7 days and 1 day before each birthday
            </li>
            <li className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
              See celebrity birthdays and stories
            </li>
            <li className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
              Add fun stories and countdowns
            </li>
          </ul>
        </div>

        {/* Login Form */}
        <div className="flex flex-col justify-center items-center">
          <div className="w-full">
            <Button
              onClick={handleGoogleLogin}
              variant="elegant"
              size="lg"
              className="w-full flex items-center justify-center"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
          </div>

          <p className="mt-6 text-sm text-gray-500 text-center">
            We respect your privacy. Your data is safe with us. 🔐
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
