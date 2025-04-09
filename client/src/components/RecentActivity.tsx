import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRecentActivity } from '@/lib/api';
import { ActivityItem } from '@/types';

export default function RecentActivity() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['/api/recent-activity'],
    queryFn: () => getRecentActivity(3)
  });

  if (isLoading) {
    return (
      <div>
        <h3 className="text-md font-medium mb-2">Recent Activity</h3>
        <div className="text-xs text-gray-400 py-1">Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-md font-medium mb-2">Recent Activity</h3>
        <div className="text-xs text-red-500 py-1">Failed to load activities</div>
      </div>
    );
  }

  // If no activities yet
  if (!activities || activities.length === 0) {
    return (
      <div>
        <h3 className="text-md font-medium mb-2">Recent Activity</h3>
        <div className="text-xs text-gray-500 py-1">No recent activities</div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-md font-medium mb-2">Recent Activity</h3>
      {activities.map((activity: ActivityItem) => (
        <div key={activity.id} className="text-xs text-gray-600 py-1 border-b">
          {activity.description} ({activity.timeAgo})
        </div>
      ))}
    </div>
  );
}
