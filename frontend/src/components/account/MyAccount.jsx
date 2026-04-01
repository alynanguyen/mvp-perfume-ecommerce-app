import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import OrdersTab from './OrdersTab';
import AccountSettingsTab from './AccountSettingsTab';
import NotificationsTab from './NotificationsTab';
import ScentProfileTab from './ScentProfileTab';

const MyAccount = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['orders', 'notifications', 'settings', 'scent-profile'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/account?tab=${tabId}`, { replace: true });
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: '📦' },
    { id: 'scent-profile', label: 'Scent Profile', icon: '🌸' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'settings', label: 'Account Settings', icon: '⚙️' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'scent-profile' && <ScentProfileTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'settings' && <AccountSettingsTab />}
        </div>
      </div>
    </div>
  );
};

export default MyAccount;

