import React from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Sparkles } from 'lucide-react';

const OnboardingModal = ({
  onboardingForm,
  setOnboardingForm,
  handleCompleteOnboarding,
  showOnboarding,
  setShowOnboarding
}) => {
  return (
    <Modal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} title="Welcome to Celefy 🎉">
      <div className="space-y-6">
        <Input
          label="Full Name"
          value={onboardingForm.fullName}
          onChange={(e) =>
            setOnboardingForm({ ...onboardingForm, fullName: e.target.value })
          }
          placeholder="Enter your beautiful name"
          required
        />

        <Input
          label="Your Birthday"
          type="date"
          value={onboardingForm.birthday}
          onChange={(e) =>
            setOnboardingForm({ ...onboardingForm, birthday: e.target.value })
          }
          required
        />

        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-xl border border-pink-200">
          <p className="text-sm text-gray-700">
            <strong className="text-pink-600">Why we need this:</strong> We'll create a personalized experience and help you connect with friends for mutual birthday celebrations! 🎂
          </p>
        </div>

        <Button
          onClick={handleCompleteOnboarding}
          className="w-full"
          variant="elegant"
          size="lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start Celebrating!
        </Button>
      </div>
    </Modal>
  );
};

export default OnboardingModal;
