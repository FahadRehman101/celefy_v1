import React, { useState, useEffect } from 'react';
import { User, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import userProfileService from '@/services/userProfileService';

const ProfileSetupModal = ({ isOpen, onClose, onComplete, user }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || user?.email?.split('@')[0] || '',
    birthday: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        displayName: user?.displayName || user?.email?.split('@')[0] || '',
        birthday: ''
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Birthday is required';
    } else {
      const selectedDate = new Date(formData.birthday);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.birthday = 'Birthday cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log('🎯 Saving profile to Firebase...');
      
      // Save profile to Firebase
      const result = await userProfileService.createOrUpdateProfile(user.uid, {
        displayName: formData.displayName.trim(),
        email: user.email,
        birthday: formData.birthday,
        profileCreatedAt: new Date().toISOString()
      });

      if (result.success) {
        console.log('✅ Profile saved successfully:', result);
        
        // Call onComplete to notify parent component
        onComplete({
          success: true,
          profile: result.data,
          message: 'Profile setup completed successfully!'
        });
        
        // Close modal
        onClose();
      } else {
        throw new Error('Failed to save profile');
      }
      
    } catch (error) {
      console.error('❌ Profile setup failed:', error);
      setErrors({
        general: `Failed to save profile: ${error.message}`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-lg w-full"
    >
      {/* Step 1: Information Input */}
      {step === 1 && (
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome to Celefy! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
              Let's set up your profile to get started
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6 text-left">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Your Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${
                  errors.displayName 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800'
                }`}
                placeholder="Enter your full name"
                maxLength={50}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Your Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 ${
                  errors.birthday 
                    ? 'border-red-300 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800'
                }`}
              />
              {errors.birthday && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.birthday}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8">
            <Button
              onClick={handleNext}
              disabled={!formData.displayName.trim() || !formData.birthday}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Confirm */}
      {step === 2 && (
        <div className="text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-3">
              Review Your Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg">
              Please confirm your information before we save it
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>

          {/* Review Information */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {formData.displayName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Birthday</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(formData.birthday).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.general}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Back
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProfileSetupModal;

