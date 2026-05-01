import React from 'react';
import { Settings2, Bell, ShieldCheck, Globe, Database } from 'lucide-react';

const SettingsPage = () => {
  const sections = [
    {
      title: 'General Settings',
      icon: Settings2,
      description: 'Manage your workspace name, logo, and general appearance.',
      items: ['Workspace Name', 'Appearance (Light/Dark)', 'Timezone']
    },
    {
      title: 'Notifications',
      icon: Bell,
      description: 'Configure how and when you receive system alerts.',
      items: ['Email Notifications', 'Real-time Alerts', 'Weekly Digest']
    },
    {
      title: 'Security',
      icon: ShieldCheck,
      description: 'Control authentication methods and session timeouts.',
      items: ['Two-Factor Auth', 'Password Requirements', 'Active Sessions']
    },
    {
      title: 'API & Integrations',
      icon: Database,
      description: 'Connect with 3rd party tools and manage API keys.',
      items: ['Webhooks', 'OAuth Settings', 'Developer API Keys']
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
          <Settings2 className="w-8 h-8 mr-4 text-primary" />
          Admin Configuration
        </h1>
        <p className="text-gray-500 font-medium mt-2 max-w-2xl">
          Centralized control center for system behavior, security protocols, and third-party integrations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl text-primary group-hover:scale-110 transition-transform">
                <section.icon className="w-6 h-6" />
              </div>
              <button className="text-xs font-bold text-primary bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors">
                Configure
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
              {section.description}
            </p>
            <div className="space-y-2 pt-4 border-t border-gray-50">
              {section.items.map(item => (
                <div key={item} className="flex items-center text-xs font-bold text-gray-400">
                  <div className="w-1.5 h-1.5 bg-blue-200 rounded-full mr-2"></div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
               <Globe className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h4 className="text-xl font-bold">System Status: Optimal</h4>
              <p className="text-slate-400 text-sm font-medium mt-1">All services are operating within normal latency parameters.</p>
            </div>
          </div>
          <button className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black hover:bg-blue-50 transition-colors shadow-lg">
            View Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
