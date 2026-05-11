import React from 'react';
import { WorkMessaging } from '../components/messaging/WorkMessaging';
import { useAuth } from '../contexts/AuthContext';

export const WorkMessagesPage: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access work messages.</p>
        </div>
      </div>
    );
  }

  const userRole = user.role === 'employer' ? 'employer' : 'talent';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Work Messages</h1>
          <p className="text-gray-600 mt-2">
            {userRole === 'employer' 
              ? 'Communicate with your hired talents about ongoing projects'
              : 'Communicate with employers who have hired you'
            }
          </p>
        </div>
        
        <WorkMessaging userRole={userRole} />
      </div>
    </div>
  );
};