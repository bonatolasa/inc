import React from 'react';
import { Activity } from '../../../types/activity.types';
import { formatDate } from '../../../utils/formatters';

interface ActivityLogProps {
  activities: Activity[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity._id} className="flex border-b pb-4 last:border-0 dark:border-gray-700">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold mr-4 shrink-0">
             {typeof activity.user === 'object' ? activity.user.name.charAt(0) : 'U'}
          </div>
          <div>
            <p className="text-sm">
              <span className="font-semibold text-foreground">
                {typeof activity.user === 'object' ? activity.user.name : activity.user}
              </span>{' '}
              {activity.action}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.createdAt)}</p>
          </div>
        </div>
      ))}
      
      {activities.length === 0 && (
         <div className="text-center text-gray-500 py-8">
            No activity found.
         </div>
      )}
    </div>
  );
};

export default ActivityLog;
