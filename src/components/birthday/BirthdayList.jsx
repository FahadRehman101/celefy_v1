import React, { useState } from 'react';
import { Calendar, MapPin, Heart, Trash2, Edit3, AlertTriangle, WifiOff } from 'lucide-react';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EditBirthdayModal from './EditBirthdayModal';
import { 
  calculateDaysUntilBirthday, 
  isBirthdayToday, 
  formatDate as formatDateUtil,
  calculateAge 
} from '@/utils/dates';
import { deleteBirthdayOptimized } from '@/services/firestore-cached'; // Updated import
import localStorage from '@/services/localStorage'; // Add localStorage import

const BirthdayList = ({ birthdays = [], onRefresh, loading = false, userId, onDataChange }) => {
  const [deleteModal, setDeleteModal] = useState({ show: false, birthday: null });
  const [editModal, setEditModal] = useState({ show: false, birthday: null });
  const [deleting, setDeleting] = useState(false);
  const [isOnline] = useState(localStorage.isOnline());

  console.log('🎂 BirthdayList received:', { 
    birthdays, 
    count: birthdays.length,
    firstBirthday: birthdays[0] 
  });

  /**
   * Handle delete birthday with optimized caching
   */
  const handleDelete = async (birthday) => {
    setDeleting(true);
    try {
      console.log('🗑️ Deleting birthday (optimized):', birthday.id);
      
      // Use optimized delete (instant cache removal + background sync)
      await deleteBirthdayOptimized(userId, birthday.id);
      
      // Close modal
      setDeleteModal({ show: false, birthday: null });
      
      // Notify parent component of data change
      if (onDataChange) {
        onDataChange();
      }
      
      console.log('✅ Birthday deleted successfully (optimized)');
    } catch (error) {
      console.error('❌ Failed to delete birthday:', error);
      
      // For offline deletions, they're still cached locally
      if (!isOnline) {
        // Close modal anyway since offline deletion succeeded locally
        setDeleteModal({ show: false, birthday: null });
        
        if (onDataChange) {
          onDataChange();
        }
      } else {
        alert('Failed to delete birthday. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Handle edit birthday
   */
  const handleEdit = (birthday) => {
    console.log('✏️ Edit birthday:', birthday);
    setEditModal({ show: true, birthday });
  };

  /**
   * Handle update birthday (from edit modal)
   */
  const handleUpdate = (updatedBirthday) => {
    console.log('✅ Birthday updated:', updatedBirthday);
    setEditModal({ show: false, birthday: null });
    
    // Notify parent component of data change
    if (onDataChange) {
      onDataChange();
    }
  };

  // Early return if no birthdays
  if (!Array.isArray(birthdays) || birthdays.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No birthdays found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters — or connect more friends!
            </p>
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Celebrations 🎉
          </h2>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {birthdays.length} friend{birthdays.length !== 1 ? 's' : ''}
            </div>
            
            {/* Show offline indicator if any birthdays are optimistic */}
            {birthdays.some(b => b._optimistic) && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <WifiOff className="w-3 h-3" />
                <span>Pending sync</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {birthdays.map((birthday) => (
            <BirthdayCard 
              key={birthday.id} 
              birthday={birthday}
              onEdit={() => handleEdit(birthday)}
              onDelete={() => setDeleteModal({ show: true, birthday })}
              isOptimistic={birthday._optimistic}
            />
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteModal.show} 
        onClose={() => !deleting && setDeleteModal({ show: false, birthday: null })}
        showCloseButton={!deleting}
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Birthday?
            </h3>
            <p className="text-gray-600">
              Are you sure you want to delete <strong>{deleteModal.birthday?.name}'s</strong> birthday? 
              This action cannot be undone.
            </p>
            
            {/* Offline warning */}
            {!isOnline && (
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm text-blue-700">
                  <WifiOff className="w-4 h-4" />
                  <span>Offline - will sync deletion when reconnected</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ show: false, birthday: null })}
              disabled={deleting}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteModal.birthday)}
              disabled={deleting}
              loading={deleting}
              fullWidth
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Birthday Modal */}
      <EditBirthdayModal
        isOpen={editModal.show}
        onClose={() => setEditModal({ show: false, birthday: null })}
        onUpdate={handleUpdate}
        userId={userId}
        birthday={editModal.birthday}
      />
    </>
  );
};

// Individual birthday card component with optimistic update indicators
const BirthdayCard = ({ birthday, onEdit, onDelete, isOptimistic = false }) => {
  console.log('🎂 Rendering birthday card:', birthday);
  
  const daysUntil = calculateDaysUntilBirthday(birthday.date);
  const isToday = isBirthdayToday(birthday.date);
  const age = calculateAge(birthday.date);
  
  // Determine if birthday is upcoming
  const isUpcoming = daysUntil > 0 && daysUntil <= 7;
  
  // Card styling based on status
  const getCardStyle = () => {
    let baseStyle = '';
    
    if (isToday) {
      baseStyle = 'border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50';
    } else if (isUpcoming) {
      baseStyle = 'border-l-4 border-l-purple-500 bg-purple-50';
    } else {
      baseStyle = 'hover:shadow-md transition-shadow';
    }
    
    // Add optimistic styling
    if (isOptimistic) {
      baseStyle += ' ring-2 ring-blue-200 bg-blue-50/50';
    }
    
    return baseStyle;
  };

  const formatDisplayDate = (dateString) => {
    try {
      return formatDateUtil(dateString, 'short');
    } catch (error) {
      // Fallback formatting
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric'
      });
    }
  };

  const getDaysText = () => {
    if (isToday) return 'Today! 🎉';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil > 0) return `${daysUntil} days`;
    return `${Math.abs(daysUntil)} days ago`;
  };

  return (
    <Card className={`p-6 ${getCardStyle()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl relative">
            {birthday.avatar || '🎂'}
            
            {/* Optimistic indicator */}
            {isOptimistic && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Syncing..."></div>
            )}
          </div>
          
          {/* Birthday Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {birthday.name || 'Unknown'}
              </h3>
              
              {/* Status badges */}
              {isToday && (
                <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
                  Birthday Today!
                </span>
              )}
              {isUpcoming && (
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                  Soon
                </span>
              )}
              {isOptimistic && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  Syncing...
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{birthday.relation || 'Friend'}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDisplayDate(birthday.date)}</span>
              </div>
              
              {age > 0 && age < 150 && (
                <div className="text-gray-500">
                  {isToday ? `Turning ${age + 1}` : `Age ${age}`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Days Until */}
        <div className="text-right">
          <div className={`text-lg font-semibold ${
            isToday ? 'text-yellow-600' : 
            isUpcoming ? 'text-purple-600' : 
            'text-gray-600'
          }`}>
            {getDaysText()}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mt-2">
            <button 
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit birthday"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete birthday"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Birthday Message for Today */}
      {isToday && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">
            🎉 Don't forget to wish {birthday.name} a happy birthday today!
          </p>
        </div>
      )}
    </Card>
  );
};

export default BirthdayList;