import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDarkMode } from '../../../contexts/DarkModeContext';
import { hiringApi, type Hiring } from '../../../api/hiring';
import { WorkMessaging } from '../../../components/messaging/WorkMessaging';
import { 
  Users, MessageCircle, Calendar, DollarSign, 
  Briefcase, Clock, CheckCircle, User, Mail
} from 'lucide-react';

export const HiredTab: React.FC = () => {
  const { token } = useAuth();
  const { darkMode } = useDarkMode();
  const dm = darkMode;
  
  const [hires, setHires] = useState<Hiring[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHire, setSelectedHire] = useState<Hiring | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHires();
  }, []);

  const loadHires = async () => {
    if (!token) return;
    
    try {
      setError(null);
      const data = await hiringApi.getMyHires();
      setHires(data.hires);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMessaging = (hire: Hiring) => {
    setSelectedHire(hire);
    setShowMessaging(true);
  };

  const card = dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200';
  const text = dm ? 'text-white' : 'text-gray-900';
  const muted = dm ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showMessaging) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMessaging(false)}
              className={`p-2 rounded-lg transition-colors ${
                dm ? 'hover:bg-gray-700' : 'hover:bg-slate-100'
              }`}
            >
              ←
            </button>
            <div>
              <h2 className={`text-lg font-semibold ${text}`}>
                Messaging with {selectedHire?.talent_name}
              </h2>
              <p className={`text-sm ${muted}`}>{selectedHire?.job_title}</p>
            </div>
          </div>
        </div>
        
        <WorkMessaging userRole="employer" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${text}`}>Hired Talents</h2>
          <p className={`text-sm ${muted} mt-1`}>
            Manage your hired talents and ongoing projects
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${
          dm ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
        }`}>
          {hires.length} Active Hires
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {hires.length === 0 ? (
        <div className={`rounded-xl border p-12 text-center ${card}`}>
          <Users className={`w-12 h-12 mx-auto mb-4 ${muted}`} />
          <h3 className={`text-lg font-semibold mb-2 ${text}`}>No Hired Talents Yet</h3>
          <p className={`text-sm ${muted} mb-6`}>
            When you hire talents and complete payments, they'll appear here
          </p>
          <button
            onClick={() => window.location.href = '/employer/dashboard?tab=applications'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Applications
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {hires.map((hire) => (
            <div key={hire.hiring_id} className={`rounded-xl border overflow-hidden ${card}`}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {hire.talent_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${text}`}>{hire.talent_name}</h3>
                      <p className={`text-sm ${muted} flex items-center gap-1`}>
                        <Mail className="w-3 h-3" />
                        {hire.talent_email}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          hire.hiring_status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <CheckCircle className="w-3 h-3" />
                          {hire.hiring_status === 'active' ? 'Active' : hire.hiring_status}
                        </span>
                        <span className={`text-xs ${muted} flex items-center gap-1`}>
                          <Calendar className="w-3 h-3" />
                          Hired {new Date(hire.hired_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleStartMessaging(hire)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>

                {/* Job Details */}
                <div className={`rounded-lg border p-4 ${dm ? 'bg-gray-700/50 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <h4 className={`font-medium ${text}`}>{hire.job_title}</h4>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        {hire.budget_min && hire.budget_max && (
                          <span className={`flex items-center gap-1 ${muted}`}>
                            <DollarSign className="w-3 h-3" />
                            {hire.budget_min.toLocaleString()} - {hire.budget_max.toLocaleString()} {hire.currency}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleStartMessaging(hire)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-medium transition-colors ${
                      dm 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-slate-300 text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Start Conversation
                  </button>
                  
                  <button
                    onClick={() => window.location.href = `/employer/escrow-payment/${hire.job_id}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium transition-colors ${
                      dm 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-slate-300 text-gray-700 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    View Escrow
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};