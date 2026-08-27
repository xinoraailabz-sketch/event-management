import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { QrCode, Shield, Layers, UserCheck, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const LoginPage: React.FC = () => {
  const { navigateTo, setCurrentRole, activeEvent } = useApp();
  const [email, setEmail] = useState('anand@abcevents.in');
  const [password, setPassword] = useState('••••••••••••');

  const handleLogin = (role: 'organizer' | 'staff' | 'platform_admin') => {
    setCurrentRole(role);
    if (role === 'staff') {
      navigateTo(activeEvent ? `/app/events/${activeEvent.id}/scanner` : '/app');
    } else if (role === 'platform_admin') {
      navigateTo('/admin');
    } else {
      navigateTo('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <QrCode className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign in to EventFlow
        </h2>
        <p className="mt-1.5 text-center text-xs text-slate-500">
          Enter your credentials or pick a demo persona below
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-8">
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin('organizer'); }}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" variant="primary" size="md" className="w-full mt-2">
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Fast 1-Click Demo Login
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleLogin('organizer')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-950">Event Organizer</p>
                    <p className="text-[10px] text-slate-500">Anand Kumar (ABC Events)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-500" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin('staff')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-950">Check-in Staff (Scanner)</p>
                    <p className="text-[10px] text-slate-500">Rahul Sundar (Universal Scanner)</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-500" />
              </button>

              <button
                type="button"
                onClick={() => handleLogin('platform_admin')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-950">Platform Admin</p>
                    <p className="text-[10px] text-slate-500">Multi-tenant management</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigateTo('/')}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
};
