import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Shield,
  Building,
  Calendar,
  Users,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Zap,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatCurrency } from '../../lib/utils';
import { mockPricingPlans } from '../../mockData/organizations';

export const AdminOverviewPage: React.FC = () => {
  const {
    organizations,
    events,
    attendees,
    setCurrentOrgId,
    setCurrentRole,
    navigateTo,
    addToast,
  } = useApp();

  const totalRegs = events.reduce((a, e) => a + (e.stats?.totalRegistrations || 0), 0);
  const totalChecked = events.reduce((a, e) => a + (e.stats?.totalCheckedIn || 0), 0);

  const handleSwitchTenant = (orgId: string, orgName: string) => {
    setCurrentOrgId(orgId);
    setCurrentRole('organizer');
    addToast({
      type: 'info',
      title: 'Tenant Switched',
      description: `Now managing ${orgName} workspace.`,
    });
    navigateTo('/app');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Platform Administration Console"
        subtitle="Multi-tenant supervision, tenant usage tracking, and SaaS infrastructure health."
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Overview' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentRole('organizer');
              navigateTo('/app');
            }}
          >
            Switch to Organizer View
          </Button>
        }
      />

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Organizations"
          value={organizations.length}
          subtext="Multi-tenant clients"
          icon={<Building className="w-4 h-4 text-purple-600" />}
          change="+3 this week"
          isPositive={true}
        />
        <StatCard
          title="Platform MRR"
          value="₹3,45,000"
          subtext="Monthly recurring subscription"
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
          change="+24.6% MoM"
          isPositive={true}
        />
        <StatCard
          title="Global Registrations"
          value={totalRegs.toLocaleString()}
          subtext="Across all summits"
          icon={<Users className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          title="Verified Check-ins"
          value={totalChecked.toLocaleString()}
          subtext="Fast 0.3s QR verification"
          icon={<CheckCircle2 className="w-4 h-4 text-sky-600" />}
        />
      </div>

      {/* Organizations Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tenant Workspaces Directory</h3>
            <p className="text-xs text-slate-500">Switch workspace or inspect quota consumption</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Owner / Contact</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Quota Usage</th>
                <th className="py-3 px-4">Active Events</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((org) => {
                const orgEvts = events.filter((e) => e.organizationId === org.id);
                const planInfo = mockPricingPlans.find((p) => p.id === org.plan) || mockPricingPlans[0];
                const regCount = org.totalRegistrationsCount ?? orgEvts.reduce((sum, e) => sum + (e.stats?.totalRegistrations || 0), 0);
                return (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-xs">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{org.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{org.slug}.eventflow.in</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{org.ownerName}</p>
                      <p className="text-[11px] text-slate-400">{org.ownerEmail}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] uppercase">
                        {org.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-800">
                        {regCount.toLocaleString()} / {planInfo.registrationLimit.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {planInfo.whatsappMessages.toLocaleString()} WA credits
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {orgEvts.length} events
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchTenant(org.id, org.name)}
                        className="text-xs"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
                      >
                        Enter Workspace
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
