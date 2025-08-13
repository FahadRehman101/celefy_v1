import React, { useState } from 'react';
import { useSmartNotifications } from '@/hooks/useSmartNotifications';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Plus } from 'lucide-react';

const AddBirthdayModal = ({ isOpen, onClose, onAdd }) => {
  const { triggerNotificationPrompt } = useSmartNotifications();
  const [form, setForm] = useState({
    name: '',
    date: '',
    relation: '',
    avatar: '🎉',
    isOnline: true,
  });

 


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.relation) return;

    const newBirthday = {
      ...form,
      id: Date.now().toString(),
    };

    onAdd(newBirthday); // <- update parent state

    triggerNotificationPrompt(form.name);

    onClose();
    setForm({
      name: '',
      date: '',
      relation: '',
      avatar: '🎉',
      isOnline: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Add a Birthday 🎂</h3>
          <p className="text-gray-600">Manually add a friend’s birthday to start celebrating!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Friend's Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Enter name"
            required
          />
          <Input
            label="Birthday"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Input
            label="Relation"
            value={form.relation}
            onChange={(e) => setForm({ ...form, relation: e.target.value })}
            placeholder="Best friend, cousin, coworker…"
            required
          />
          <div className="text-right">
            <Button type="submit" className="w-full" variant="elegant">
              Save Birthday
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AddBirthdayModal;
