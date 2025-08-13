import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Star, Heart, Sparkles } from 'lucide-react';


const CelebrityBirthdays = ({ celebrityBirthdays }) => {
  return (
    <div className="space-y-8">
      <Card className="p-8 text-center bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 text-white shadow-2xl" elegant={false}>
        <div className="mb-4">
          <Star className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h1 className="text-3xl font-bold mb-2">🌟 Celebrity Birthdays</h1>
        <p className="text-pink-100 text-lg">Famous people celebrating today - August 3rd</p>
      </Card>

      <div className="grid gap-6">
        {celebrityBirthdays.map((celebrity) => (
          <Card key={celebrity.id} className="p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" elegant={true}>
            <div className="flex items-start space-x-6">
              <div className="text-6xl bg-gradient-to-br from-yellow-400 to-orange-500 w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl">
                {celebrity.image}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-2xl text-gray-900 mb-2">{celebrity.name}</h3>
                <p className="text-pink-600 font-bold text-lg mb-3">🎂 {celebrity.date}</p>
                <p className="text-gray-700 text-base leading-relaxed">{celebrity.bio}</p>
                <div className="mt-4 flex space-x-3">
                  <Button variant="elegant" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Celebrate
                  </Button>
                  <Button variant="secondary" size="sm">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 text-center" elegant={true}>
        <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-4" />
        <p className="text-gray-600">
          Celebrity data updates daily with more personalities! ✨
        </p>
      </Card>
    </div>
  );
};

export default CelebrityBirthdays;
