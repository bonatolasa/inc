import React, { useEffect, useState } from 'react';
import { activityService } from '../../../services/activity.service';
import { Activity } from '../../../types/activity.types';
import ActivityLog from '../components/ActivityLog';
import { Loader } from '../../../common/components';

const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await activityService.getAllActivities();
        if (response.success) {
          setActivities(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch activities", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activity Log</h1>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <ActivityLog activities={activities} />
        </div>
      )}
    </div>
  );
};

export default ActivitiesPage;
