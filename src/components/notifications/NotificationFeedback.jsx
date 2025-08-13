import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Settings } from 'lucide-react';

export const NotificationSuccessModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
    <div className="text-center space-y-4 p-2">
      <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      
      <h3 className="text-xl font-bold text-green-800">🎉 Perfect!</h3>
      <p className="text-gray-600">
        You'll get birthday reminders at just the right time. 
        No spam, just celebrations! ✨
      </p>
      
      <Button onClick={onClose} variant="elegant" className="w-full">
        Start Celebrating! 🎂
      </Button>
    </div>
  </Modal>
);

export const NotificationDeniedModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
    <div className="text-center space-y-4 p-2">
      <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
        <Settings className="w-10 h-10 text-orange-600" />
      </div>
      
      <h3 className="text-xl font-bold text-orange-800">No Problem!</h3>
      <p className="text-gray-600">
        You can still use Celefy perfectly. If you change your mind, 
        look for the 🔔 icon in your browser's address bar.
      </p>
      
      <Button onClick={onClose} variant="secondary" className="w-full">
        Continue Without Notifications
      </Button>
    </div>
  </Modal>
);
