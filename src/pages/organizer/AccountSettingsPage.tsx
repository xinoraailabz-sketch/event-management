import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Building,
  User,
  Zap,
  Check,
  Key,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PRICING_PLANS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export const AccountSettingsPage: React.FC = () => {
  const { currentOrg, updateOrganization, navigateTo } = useApp();

  const [activeTab, setActiveTab] = useState<string>('billing');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [orgName, setOrgName] = useState(currentOrg.name);
  const [ownerName, setOwnerName] = useState(currentOrg.ownerName);
  const [ownerEmail, setOwnerEmail] = useState(currentOrg.ownerEmail);
  const [phone, setPhone] = useState(currentOrg.phone);
  const [city, setCity] = useState(currentOrg.city);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOrganization({
      name: orgName,
      ownerName,
      ownerEmail,
      phone,
      city,
    });
  };

  const handleSelectPlan = async (planId: string) => {
    await updateOrganization({ plan: planId as any });
    setIsUpgradeModalOpen(false);
  };

  const currentPlan = PRICING_PLANS.find((p) => p.id === currentOrg.plan) || PRICING_PLANS[1];

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Workspace & Subscription"
        subtitle={`Manage ${currentOrg.name} account, plan limits, and team access.`}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => navigateTo('/app') },
          { label: 'Settings' },
        ]}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="h-10 p-1">
          <TabsTrigger value="billing" className="text-xs">
            Plan & Billing Usage
          </TabsTrigger>
          <TabsTrigger value="org" className="text-xs">
            Organization Profile
          </TabsTrigger>
          <TabsTrigger value="api" className="text-xs">
            API Keys & Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          {/* Plan Banner */}
          <div className="bg-[#1A1A1A] text-white p-6 sm:p-8 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#C49A3C] bg-white/10 px-3 py-1 rounded-full border border-white/10">
                Current Plan
              </span>
              <h3 className="text-2xl font-extrabold">{currentPlan.name} Tier</h3>
              <p className="text-xs text-white/70 max-w-md">{currentPlan.tagline}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C49A3C] hover:bg-[#B08830] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>Change Plan</span>
              </button>
            </div>
          </div>

          {/* Usage Meters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3">
              <div className="flex justify-between text-xs font-semibold text-[#1A1A1A]">
                <span>Registrations Quota</span>
                <span className="text-[#C49A3C]">{regUsagePct}% Used</span>
              </div>
              <Progress value={regUsagePct} />
              <p className="text-xs text-[#6B6B6B]">
                {(currentOrg.totalRegistrationsCount || 0).toLocaleString()} of {currentPlan.registrationLimit.toLocaleString()} used
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3">
              <div className="flex justify-between text-xs font-semibold text-[#1A1A1A]">
                <span>Active Events</span>
                <span className="text-[#C49A3C]">{eventsUsagePct}% Used</span>
              </div>
              <Progress value={eventsUsagePct} />
              <p className="text-xs text-[#6B6B6B]">
                {currentOrg.activeEventsCount || 0} of {currentPlan.eventsAllowed} active events
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-3">
              <div className="flex justify-between text-xs font-semibold text-[#1A1A1A]">
                <span>WhatsApp Credits</span>
                <span className="text-emerald-600 font-semibold">Active</span>
              </div>
              <Progress value={45} indicatorColor="bg-emerald-600" />
              <p className="text-xs text-[#6B6B6B]">
                {currentPlan.whatsappMessages.toLocaleString()} credits / month
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Org Profile Tab */}
        <TabsContent value="org">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <form onSubmit={handleSaveOrg} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A9A9A] border-b border-[#F0EDE8] pb-2">
                Company & Organizer Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-xs font-semibold text-[#1A1A1A]">Organization Name</Label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <Input
                      id="orgName"
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ownerName" className="text-xs font-semibold text-[#1A1A1A]">Primary Owner Name</Label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <Input
                      id="ownerName"
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ownerEmail" className="text-xs font-semibold text-[#1A1A1A]">Contact Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <Input
                      id="ownerEmail"
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-[#1A1A1A]">Phone</Label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-[#1A1A1A]">City</Label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A9A9A]" />
                    <Input
                      id="city"
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="pl-10 h-10 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-[#F0EDE8]">
                <Button type="submit" variant="primary" size="md" className="rounded-xl">
                  Save Workspace Profile
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#9A9A9A] border-b border-[#F0EDE8] pb-2">
              Developer API Keys
            </h3>

            <div className="p-4 rounded-2xl bg-[#FAFAF7] border border-[#E8E5DF] flex items-center justify-between text-xs font-mono">
              <div className="truncate">
                <p className="font-bold text-[#1A1A1A] font-sans text-xs">Production Live API Key</p>
                <p className="text-[#6B6B6B] mt-0.5 truncate">ef_live_9482947291847192847291847291</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText('ef_live_9482947291847192847291847291');
                }}
                leftIcon={<Key className="w-3.5 h-3.5" />}
              >
                Copy Key
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upgrade Plan Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Upgrade EventFlow Plan"
        maxWidth="4xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2">
          {PRICING_PLANS.map((p) => (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border flex flex-col justify-between ${
                currentOrg.plan === p.id ? 'border-[#C49A3C] ring-2 ring-[#C49A3C]/20 bg-[#F5EDD8]/20' : 'border-[#E8E5DF]'
              }`}
            >
              <div>
                <h4 className="font-bold text-[#1A1A1A] text-sm">{p.name}</h4>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5 min-h-[28px]">{p.tagline}</p>
                <div className="mt-3 mb-4">
                  <span className="text-2xl font-extrabold text-[#1A1A1A]">
                    {p.monthlyPrice === 0 ? 'Free' : formatCurrency(p.monthlyPrice)}
                  </span>
                  {p.monthlyPrice > 0 && <span className="text-[10px] text-[#9A9A9A]">/mo</span>}
                </div>

                <ul className="text-[11px] text-[#6B6B6B] space-y-2 border-t border-[#F0EDE8] pt-3">
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
                  className="w-full text-xs rounded-xl"
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
