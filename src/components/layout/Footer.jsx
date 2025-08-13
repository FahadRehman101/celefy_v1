import React from 'react';
import { Gift } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-pink-200 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-2 rounded-xl mr-3">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Celefy
          </h3>
        </div>
        <p className="text-gray-600 mb-4">Making every birthday celebration magical ✨</p>
        <div className="flex justify-center space-x-6 text-sm text-gray-500">
          <span>Made with 💖 for birthday lovers</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
