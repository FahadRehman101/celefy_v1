/**
 * Birthday Card Component
 * Individual birthday card showing person's info and actions
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Heart, 
  Trash2, 
  Edit3, 
  Gift, 
  Clock,
  User
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { 
  formatDate, 
  isBirthdayToday, 
  getDaysUntilBirthday, 
  getTimeUntilBirthday,
  calculateAge 
} from '@/utils/dates';


const BirthdayCard = ({
  birthday,
  onEdit,
  onDelete,
  className = ''
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isToday = isBirthdayToday(birthday.date);
  const daysUntil = getDaysUntilBirthday(birthday.date);
  const timeUntil = getTimeUntilBirthday(birthday.date);
  const age = calculateAge(birthday.date);
  
  // Handle delete with loading state
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(birthday.id);
    } catch (error) {
      console.error('Error deleting birthday:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Get badge variant based on days until birthday
  const getBadgeVariant = () => {
    if (isToday) return 'success';
    if (daysUntil <= 7) return 'warning';
    if (daysUntil <= 30) return 'info';
    return 'default';
  };
  
  // Get relationship icon
  const getRelationshipIcon = () => {
    const relation = birthday.relation?.toLowerCase();
    if (['family', 'parent', 'sibling', 'child'].includes(relation)) {
      return <Heart className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  return (
    <Card
      variant={isToday ? 'gradient' : 'default'}
      hover
      className={`relative overflow-hidden ${className}`}
    >
      {/* Today indicator */}
      {isToday && (
        <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-r-[40px] border-t-primary-500 border-r-transparent">
          <Gift className="absolute -top-8 -right-6 w-4 h-4 text-white" />
        </div>
      )}
      
      <Card.Content>
        {/* Header with name and age */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate">
              {birthday.name}
            </h3>
            {age > 0 && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {isToday ? `Turning ${age + 1}` : `Age ${age}`}
              </p>
            )}
          </div>
          
          {/* Time until badge */}
          <Badge variant={getBadgeVariant()} size="sm">
            {timeUntil}
          </Badge>
        </div>
        
        {/* Relationship and date info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            {getRelationshipIcon()}
            <span className="ml-2">{birthday.relation}</span>
          </div>
          
          <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span className="ml-2">{formatDate(birthday.date, 'long')}</span>
          </div>
          
          {!isToday && (
            <div className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
              <Clock className="w-4 h-4" />
              <span className="ml-2">
                {daysUntil === 0 ? 'Today!' : 
                 daysUntil === 1 ? 'Tomorrow' : 
                 `${daysUntil} days to go`}
              </span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(birthday)}
              icon={<Edit3 className="w-4 h-4" />}
              className="text-neutral-600 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400"
            >
              Edit
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            icon={<Trash2 className="w-4 h-4" />}
            className="text-neutral-600 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
          >
            Delete
          </Button>
        </div>
        
        {/* Special styling for today's birthdays */}
        {isToday && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 pointer-events-none rounded-xl" />
        )}
      </Card.Content>
    </Card>
  );
};

export default BirthdayCard;