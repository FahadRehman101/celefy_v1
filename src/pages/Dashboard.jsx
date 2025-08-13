import React, { useState } from 'react';
import BirthdayList from '@/components/birthday/BirthdayList';
import {
  Gift,
  Calendar,
  TrendingUp,
  Search,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import AddBirthdayModal from '@/components/birthday/AddBirthdayModal';
import { calculateDaysUntilBirthday } from '@/utils/dates';
import { mockBirthdays } from '@/utils/placeholders';

const Dashboard = ({ user }) => {
  const [birthdays, setBirthdays] = useState(mockBirthdays);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

 const handleAddBirthday = (newBirthday) => {
  setBirthdays((prev) => [...prev, newBirthday]);
};

  const filteredBirthdays = birthdays.filter((b) => {
    const nameMatch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
    const today = new Date();
    const bday = new Date(b.date);
    const daysUntil = calculateDaysUntilBirthday(b.date);

    switch (selectedFilter) {
      case 'Today':
        return (
          bday.getDate() === today.getDate() &&
          bday.getMonth() === today.getMonth() &&
          nameMatch
        );
      case 'This Month':
        return bday.getMonth() === today.getMonth() && nameMatch;
      case 'Upcoming':
        return daysUntil <= 7 && nameMatch;
      default:
        return nameMatch;
    }
  });

  const countToday = birthdays.filter((b) => {
    const today = new Date();
    const bday = new Date(b.date);
    return (
      bday.getDate() === today.getDate() &&
      bday.getMonth() === today.getMonth()
    );
  }).length;

  const countMonth = birthdays.filter((b) => {
    const today = new Date();
    return new Date(b.date).getMonth() === today.getMonth();
  }).length;

  const countUpcoming = birthdays.filter(
    (b) => calculateDaysUntilBirthday(b.date) <= 7
  ).length;

  return (
    <div className="space-y-8">
      <Card variant="gradient" padding="lg">
        <div className="flex items-start justify-between text-white">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Friend'}!
            </h1>
            <p>{countUpcoming} celebrations coming in the next 7 days 🎉</p>
          </div>
          <div className="text-6xl opacity-20 hidden md:block">🎂</div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { icon: <Gift />, count: birthdays.length, label: 'All Friends' },
          { icon: <Calendar />, count: countToday, label: 'Today' },
          { icon: <Calendar />, count: countMonth, label: 'This Month' },
          { icon: <TrendingUp />, count: countUpcoming, label: 'Upcoming' },
        ].map((item, idx) => (
          <Card key={idx} variant="elevated" padding="lg" className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 bg-pink-100 rounded-full flex items-center justify-center">
              {item.icon}
            </div>
            <div className="text-xl font-bold">{item.count}</div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </Card>
        ))}
      </div>

      <Card variant="default" padding="lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder="Search birthdays..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div className="flex gap-3">
            {['All', 'Today', 'This Month', 'Upcoming'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedFilter === filter
                    ? 'bg-pink-500 text-white'
                    : 'bg-white border border-pink-200 text-pink-600'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full shadow hover:opacity-90"
          >
            + Add Birthday
          </button>
        </div>
      </Card>

      <BirthdayList filteredBirthdays={filteredBirthdays} />

     <AddBirthdayModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onAdd={handleAddBirthday}
/>

    </div>
  );
};

export default Dashboard;
