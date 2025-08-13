import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Bell, Gift, Sparkles, Calendar } from 'lucide-react';
import { requestPermission } from '@/utils/onesignal';

const BirthdayNotificationPrompt = ({ isOpen, onClose, friendName }) => {
  const [isEnabling, setIsEnabling] = useState(false);

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const granted = await requestPermission();
      
      if (granted) {
        // Success - show celebration
        onClose('success');
      } else {
        // Permission denied - show alternative
        onClose('denied');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      onClose('error');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleMaybeLater = () => {
    // Store that user said "maybe later" - ask again in a week
    localStorage.setItem('notificationPromptDelay', Date.now() + (7 * 24 * 60 * 60 * 1000));
    onClose('later');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => onClose('dismissed')} showCloseButton={false}>
      <div className="text-center space-y-6 p-2">
        {/* Beautiful Header */}
        <div className="relative">
          <div className="bg-gradient-to-r from-pink-400 via-purple-500 to-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl relative overflow-hidden">
            <Bell className="w-10 h-10 text-white z-10" />
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
          
          {/* Floating icons */}
          <Gift className="absolute top-2 left-1/4 w-6 h-6 text-pink-400 animate-bounce" style={{animationDelay: '0.2s'}} />
          <Sparkles className="absolute top-4 right-1/4 w-5 h-5 text-purple-400 animate-bounce" style={{animationDelay: '0.4s'}} />
          <Calendar className="absolute bottom-2 left-1/3 w-5 h-5 text-blue-400 animate-bounce" style={{animationDelay: '0.6s'}} />
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            🎉 Never Miss {friendName ? `${friendName}'s` : 'a'} Birthday Again!
          </h3>
          
          <p className="text-gray-600 text-lg leading-relaxed">
            Get gentle reminders <span className="font-semibold text-purple-600">7 days before</span> and 
            <span className="font-semibold text-pink-600"> on the day</span> of every birthday you've added.
          </p>
        </div>

        {/* Benefits */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>Never forget a birthday celebration</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span>Time to plan the perfect surprise</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-700">
            <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
            <span>Make every celebration special</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleEnableNotifications}
            disabled={isEnabling}
            variant="elegant"
            size="lg"
            className="w-full"
          >
            {isEnabling ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enabling...
              </div>
            ) : (
              <>
                <Bell className="w-5 h-5 mr-2" />
                Yes, Remind Me! 🎂
              </>
            )}
          </Button>
          
          <Button
            onClick={handleMaybeLater}
            variant="secondary"
            size="md"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-400">
          You can change this anytime in your browser settings
        </p>
      </div>
    </Modal>
  );
};

export default BirthdayNotificationPrompt;