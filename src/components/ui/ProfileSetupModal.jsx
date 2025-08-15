import React, { useState, useEffect } from 'react';
import { User, Calendar, Sparkles, CheckCircle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

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
    }
  }, [isOpen, user]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Please enter your display name';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters long';
    }

    if (!formData.birthday) {
      newErrors.birthday = 'Please select your birthday';
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

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle next step
  const handleNext = () => {
    if (validateForm()) {
      setStep(2);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setStep(1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the completion handler
      onComplete(formData);
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Profile setup failed:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate age from birthday
  const calculateAge = (birthday) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(formData.birthday);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      className="max-w-lg w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Welcome to Celefy! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Let's set up your profile to get started
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            step >= 1 ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-400'
          }`}>
            {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <div className={`w-16 h-0.5 ${
            step >= 2 ? 'bg-pink-500' : 'bg-gray-300'
          }`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            step >= 2 ? 'bg-pink-500 border-pink-500 text-white' : 'border-gray-300 text-gray-400'
          }`}>
            {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Tell us about yourself
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This information helps us personalize your birthday experience
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Enter your display name"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 ${
                  errors.displayName ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-pink-200 dark:border-pink-700'
                }`}
                autoFocus
              />
            </div>
            {errors.displayName && (
              <p className="text-red-500 text-sm">{errors.displayName}</p>
            )}
          </div>

          {/* Birthday */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Birthday
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-400 w-5 h-5" />
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => handleInputChange('birthday', e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-all duration-200 ${
                  errors.birthday ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-pink-200 dark:border-pink-700'
                }`}
              />
            </div>
            {errors.birthday && (
              <p className="text-red-500 text-sm">{errors.birthday}</p>
            )}
            {age !== null && (
              <p className="text-green-600 dark:text-green-400 text-sm">
                You'll be {age} years old this year! 🎂
              </p>
            )}
          </div>

          {/* Next Button */}
          <div className="pt-4">
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <span>Continue</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Confirm */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Review Your Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please confirm your information before we create your profile
            </p>
          </div>

          {/* Review Card */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Display Name:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{formData.displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Birthday:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {formData.birthday ? new Date(formData.birthday).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'Not set'}
                </span>
              </div>
              {age !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Age:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{age} years old</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handlePrevious}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold transition-all duration-200"
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Profile...</span>
                </>
              ) : (
                <>
                  <span>Create Profile</span>
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProfileSetupModal;
