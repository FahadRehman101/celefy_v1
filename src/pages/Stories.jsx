import React from 'react';
import Card  from '@/components/ui/Card';
import  Input  from '@/components/ui/Input';
import  Button  from '@/components/ui/Button';
import { Plus, Heart, BookOpen, Sparkles, Star } from 'lucide-react';


const Stories = ({ storyForm, setStoryForm, handleAddStory, stories, handleLikeStory }) => {
  return (
    <div className="space-y-8">
      <Card className="p-8 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white shadow-2xl" elegant={false}>
        <div className="mb-4">
          <BookOpen className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h1 className="text-3xl font-bold mb-2">😂 Funny Birthday Stories</h1>
        <p className="text-blue-100 text-lg">Share and discover hilarious birthday moments from our community</p>
      </Card>

      <Card className="p-8" elegant={true}>
        <div className="text-center mb-6">
          <div className="bg-gradient-to-r from-pink-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-2">Share Your Hilarious Story! 🎉</h3>
          <p className="text-gray-600">Got a funny birthday moment? Share it with our community!</p>
        </div>
        
        <div className="space-y-6">
          <Input
            label="Story Title"
            value={storyForm.title}
            onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
            placeholder="Give your story a catchy, funny title..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Hilarious Story</label>
            <textarea
              value={storyForm.story}
              onChange={(e) => setStoryForm({ ...storyForm, story: e.target.value })}
              placeholder="Tell us about your funny birthday experience... don't hold back the laughs! 😄"
              rows={5}
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-300 resize-none"
            />
          </div>
          <Button onClick={handleAddStory} variant="elegant" className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Share My Story
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent text-center">
          Community Stories ✨
        </h2>
        
        {stories.map(story => (
          <Card key={story.id} className="p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2" elegant={true}>
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2">{story.title}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">{story.author.charAt(0)}</span>
                    </div>
                    <span className="font-medium">{story.author}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(story.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeStory(story.id)}
                    className="flex items-center"
                  >
                    <Heart className="w-4 h-4 mr-1 text-pink-400" />
                    <span className="text-pink-600 font-medium">{story.likes}</span>
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">{story.story}</p>
            <div className="mt-6 pt-4 border-t border-pink-100">
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button className="flex items-center text-gray-500 hover:text-pink-500 transition-colors">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center text-gray-500 hover:text-purple-500 transition-colors">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
                <span className="text-xs text-gray-400">#{story.id}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-8 text-center" elegant={true}>
        <div className="mb-4">
          <div className="flex justify-center space-x-2">
            <Heart className="w-6 h-6 text-pink-400" />
            <Sparkles className="w-6 h-6 text-purple-400" />
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <p className="text-gray-600 text-lg">
          Keep the stories coming! Every birthday has a story worth sharing 📖✨
        </p>
      </Card>
    </div>
  );
};

export default Stories;
