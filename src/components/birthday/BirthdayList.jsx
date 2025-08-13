import React from 'react';
import { Calendar, Sparkles, Heart, Gift } from 'lucide-react';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { calculateDaysUntilBirthday, formatDate } from '@/utils/dates';

const BirthdayList = ({ filteredBirthdays = [] }) => {
  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
          Celebrations 🎈
        </h2>
        <span className="text-gray-500 text-sm">{filteredBirthdays.length} friend{filteredBirthdays.length !== 1 ? 's' : ''}</span>
      </div>

      {filteredBirthdays.length === 0 ? (
        <Card className="p-12 text-center" elegant={true}>
          <div className="mb-6">
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <span className="text-white text-3xl">🎂</span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">No birthdays found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search or filters — or connect more friends!
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredBirthdays.map(birthday => {
            const daysUntil = calculateDaysUntilBirthday(birthday.date);
            const isToday = daysUntil === 0;
            const isTomorrow = daysUntil === 1;

            return (
              <Card
                key={birthday.id}
                className={`p-6 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${
                  isToday ? 'ring-4 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' :
                  isTomorrow ? 'ring-2 ring-pink-300 bg-gradient-to-r from-pink-50 to-purple-50' : ''
                }`}
                elegant={true}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="relative">
                      <div className="text-4xl bg-gradient-to-r from-pink-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
                        {birthday.avatar || '🎉'}
                      </div>
                      {birthday.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-md"></div>
                      )}
                      {isToday && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1">
                          <Sparkles className="w-3 h-3 text-yellow-800" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-xl text-gray-800">{birthday.name}</h3>
                        {isToday && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md animate-pulse">
                            🎉 TODAY!
                          </span>
                        )}
                        {isTomorrow && (
                          <span className="bg-gradient-to-r from-pink-400 to-purple-400 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                            Tomorrow! 🎂
                          </span>
                        )}
                        {birthday.isOnline && (
                          <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                            Online
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-pink-400" />
                          <span className="font-medium">{formatDate(birthday.date)}</span>
                          <span className="mx-2">•</span>
                          <span>Turning {birthday.age || '??'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          {isToday ? (
                            <span className="text-yellow-600 font-bold">🎉 It's their special day!</span>
                          ) : isTomorrow ? (
                            <span className="text-pink-600 font-medium">🎂 Tomorrow is the big day!</span>
                          ) : (
                            <span className="text-gray-500">{daysUntil} days until celebration</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {isToday && (
                      <Button variant="elegant" size="sm">
                        <Heart className="w-4 h-4 mr-1" />
                        Celebrate
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      <Gift className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BirthdayList;
