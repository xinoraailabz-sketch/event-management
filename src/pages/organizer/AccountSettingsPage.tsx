import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building,
  User,
  CreditCard,
  Zap,
  Check,
  Shield,
  Key,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { mockPricingPlans } from '../../mockData/organizations';
import { formatCurrency } from '../../lib/utils';

export const AccountSettingsPage: React.FC = () => {
  const { currentOrg, updateOrganization, navigateTo, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'org' | 'billing' | 'team' | 'api'>('billing');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [orgName, setOrgName] = useState(currentOrg.name);
  const [ownerName, setOwnerName] = useState(currentOrg.ownerName);
  const [ownerEmail, setOwnerEmail] = useState(currentOrg.ownerEmail);
  const [phone, setPhone] = useState(currentOrg.phone);
  const [city, setCity] = useState(currentOrg.city);

  const handleSaveOrg = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(currentOrg.id, {
      name: orgName,
      ownerName,
      ownerEmail,
      phone,
      city,
    });
    addToast({
      type: 'success',
      title: 'Organization Updated',
      description: 'Your workspace settings have been saved.',
    });
  };

  const handleSelectPlan = (planId: string) => {
    updateOrganization(currentOrg.id, { plan: planId });
    addToast({
      type: 'success',
      title: 'Plan Updated',
      description: `Upgraded to ${planId.toUpperCase()} tier.`,
    });
    setIsUpgradeModalOpen(false);
  };

  const currentPlan = mockPricingPlans.find((p) => p.id === currentOrg.plan) || mockPricingPlans[1];

  const regLimit = currentPlan.registrationLimit === 'Unlimited' ? 50000 : Number(currentPlan.registrationLimit);
  const eventsLimit = currentPlan.eventsAllowed === 'Unlimited' ? 100 : Number(currentPlan.eventsAllowed);

  const regUsagePct = Math.min(
    100,
    Math.round(((currentOrg.totalRegistrationsCount || 0) / (regLimit || 1)) * 100)
  );
  const eventsUsagePct = Math.min(
    100,
    Math.round(((currentOrg.activeEventsCount || 0) / (eventsLimit || 1)) * 100)
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Workspace & Subscription Settings"
        subtitle={`Manage ${currentOrg.name} account, plan limits, and team access.`}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => navigateTo('/app') },
          { label: 'Settings' },
        ]}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('billing')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'billing' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Plan & Billing Usage
        </button>
        <button
          onClick={() => setActiveTab('org')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'org' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Organization Profile
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={`px-3 py-2 rounded-xl transition-colors ${
            activeTab === 'api' ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          API Keys & Webhooks
        </button>
      </div>

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Plan Banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-700/50">
                Current Plan
              </span>
              <h3 className="text-2xl font-extrabold">{currentPlan.name} Tier</h3>
              <p className="text-xs text-slate-300 max-w-md">{currentPlan.tagline}</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsUpgradeModalOpen(true)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white shadow-xs"
                leftIcon={<Zap className="w-4 h-4" />}
              >
                Change Subscription Plan
              </Button>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Registrations Quota</span>
                <span className="text-indigo-600">{regUsagePct}% Used</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, regUsagePct)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {(currentOrg.totalRegistrationsCount || 0).toLocaleString()} of {currentPlan.registrationLimit.toLocaleString()} used
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Active Events</span>
                <span className="text-indigo-600">{eventsUsagePct}% Used</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${Math.min(100, eventsUsagePct)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {currentOrg.activeEventsCount || 0} of {currentPlan.eventsAllowed} active events
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>WhatsApp Credits</span>
                <span className="text-emerald-600">Active</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-2 rounded-full w-[45%]" />
              </div>
              <p className="text-xs text-slate-500">
                {currentPlan.whatsappMessages.toLocaleString()} credits / month
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Org Profile Tab */}
      {activeTab === 'org' && (
        <form onSubmit={handleSaveOrg} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Company & Organizer Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Owner Name</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <Button type="submit" variant="primary" size="md">
              Save Workspace Profile
            </Button>
          </div>
        </form>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Developer API Keys
          </h3>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
            <div className="truncate">
              <p className="font-bold text-slate-900 font-sans text-xs">Production Live API Key</p>
              <p className="text-slate-500 mt-0.5 truncate">ef_live_9482947291847192847291847291</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText('ef_live_9482947291847192847291847291');
                addToast({ type: 'success', title: 'API Key Copied', description: 'Ready for webhook auth.' });
              }}
            >
              Copy Key
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade Plan Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade EventFlow Plan"
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          {mockPricingPlans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-2xl border flex flex-col justify-between ${
                currentOrg.plan === p.id ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/20' : 'border-slate-200'
              }`}
            >
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 min-h-[28px]">{p.tagline}</p>
                <div className="mt-3 mb-4">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {p.monthlyPrice === 0 ? 'Free' : formatCurrency(p.monthlyPrice)}
                  </span>
                  {p.monthlyPrice > 0 && <span className="text-[10px] text-slate-500">/mo</span>}
                </div>

                <ul className="text-[11px] text-slate-600 space-y-2 border-t border-slate-100 pt-3">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p.eventsAllowed} active events</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p.registrationLimit} registrations</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{p.staffSeats} staff seats</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button
                  variant={currentOrg.plan === p.id ? 'outline' : 'primary'}
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleSelectPlan(p.id)}
                  disabled={currentOrg.plan === p.id}
                >
                  {currentOrg.plan === p.id ? 'Current Plan' : 'Select Plan'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
