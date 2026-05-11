import React, { useState } from 'react';
import TalentsList from './components/TalentsList';
import PayoutsList from './components/PayoutsList';
import PayoutSummary from './components/PayoutSummary';
import { Users, DollarSign, BarChart3 } from 'lucide-react';

export const PayoutsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('talents');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Payouts Management</h1>
          <p className="text-slate-600">Manage talent payouts with automatic 5% escrow fee calculation</p>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="grid w-full grid-cols-3 mb-6 bg-white shadow-sm rounded-lg p-1">
            <button
              onClick={() => setActiveTab('talents')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'talents'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Talents</span>
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'payouts'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Payouts</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Summary</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="space-y-4">
            {activeTab === 'talents' && (
              <TalentsList onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'payouts' && (
              <PayoutsList onRefresh={handleRefresh} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'summary' && (
              <PayoutSummary refreshTrigger={refreshTrigger} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayoutsPanel;
