import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Building,
  CheckCircle2,
  Users,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PRICING_PLANS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

interface SupabaseProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

export const AdminOverviewPage: React.FC = () => {
  const {
    organizations,
    events,
    currentUser,
    setCurrentOrgId,
    setCurrentRole,
    navigateTo,
    addToast,
  } = useApp();

  const [profiles, setProfiles] = useState<SupabaseProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

  useEffect(() => {
    async function loadSupabaseUsers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setProfiles(data);
        } else if (currentUser) {
          setProfiles([
            {
              id: currentUser.id,
              email: currentUser.email,
              full_name: currentUser.fullName,
              avatar_url: currentUser.avatarUrl,
              role: currentUser.role,
              created_at: currentUser.createdAt || new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching Supabase profiles:', err);
      } finally {
        setIsLoadingProfiles(false);
      }
    }

    loadSupabaseUsers();
  }, [currentUser]);

  const totalRegs = events.reduce((a, e) => a + (e.stats?.totalRegistrations || 0), 0);
  const totalChecked = events.reduce((a, e) => a + (e.stats?.totalCheckedIn || 0), 0);

  const handleSwitchTenant = (orgId: string, orgName: string) => {
    if (setCurrentOrgId) setCurrentOrgId(orgId);
    setCurrentRole('admin');
    addToast({
      type: 'info',
      title: 'Tenant Switched',
      description: `Now managing ${orgName} workspace.`,
    });
    navigateTo('/app');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        title="Admin Console"
        subtitle="Multi-tenant supervision, Supabase authenticated accounts, and SaaS infrastructure health."
        breadcrumbs={[
          { label: 'Admin Portal' },
          { label: 'Overview' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentRole('admin');
              navigateTo('/app');
            }}
            className="rounded-xl"
          >
            Back to Dashboard
          </Button>
        }
      />

      {/* Global Platform KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Organizations"
          value={organizations.length}
          subtext="Multi-tenant clients"
          icon={<Building className="w-4 h-4 text-[#C49A3C]" />}
          change="+3 this week"
          isPositive={true}
        />
        <StatCard
          title="Platform MRR"
          value="₹3,45,000"
          subtext="Recurring subscription"
          icon={<CreditCard className="w-4 h-4 text-emerald-600" />}
          change="+24.6% MoM"
          isPositive={true}
        />
        <StatCard
          title="Global Registrations"
          value={totalRegs.toLocaleString()}
          subtext="Across all summits"
          icon={<Users className="w-4 h-4 text-[#1A1A1A]" />}
        />
        <StatCard
          title="Verified Check-ins"
          value={totalChecked.toLocaleString()}
          subtext="Fast 0.3s QR verification"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Supabase Authenticated Accounts Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-bold text-[#1A1A1A]">
                Supabase Authenticated Accounts
              </h3>
            </div>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Google OAuth and email accounts stored in your connected Supabase database
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
            Supabase Connected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#6B6B6B]">
            <thead className="bg-[#FAFAF7] border-b border-[#F0EDE8] text-[#1A1A1A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Auth Provider</th>
                <th className="py-3.5 px-4 text-right">Joined At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {profiles.map((prof) => (
                <tr key={prof.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 border border-[#E8E5DF]">
                        {prof.avatar_url && (
                          <AvatarImage src={prof.avatar_url} alt={prof.full_name} />
                        )}
                        <AvatarFallback className="text-xs font-bold bg-[#F5EDD8] text-[#8B6914]">
                          {prof.full_name ? prof.full_name.charAt(0) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-[#1A1A1A]">{prof.full_name}</p>
                        <p className="text-[10px] text-[#9A9A9A] font-mono">
                          {prof.id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#1A1A1A]">
                    {prof.email}
                  </td>

                  <td className="py-3.5 px-4">
                    <select
                      value={prof.role === 'staff' ? 'staff' : 'admin'}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        try {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ role: newRole })
                            .eq('id', prof.id);
                          if (error) throw error;
                          setProfiles((prev) =>
                            prev.map((p) => (p.id === prof.id ? { ...p, role: newRole } : p))
                          );
                          addToast({
                            type: 'success',
                            title: 'Role Updated',
                            description: `${prof.full_name}'s role changed to ${newRole === 'staff' ? 'Check-in Staff' : 'Administrator'}.`,
                          });
                        } catch (err: any) {
                          addToast({
                            type: 'error',
                            title: 'Update Failed',
                            description: err.message || 'Could not update role.',
                          });
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#FAFAF7] border border-[#E8E5DF] text-xs font-semibold text-[#1A1A1A] cursor-pointer"
                    >
                      <option value="admin">Administrator</option>
                      <option value="staff">Check-in Staff</option>
                    </select>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-[#3A3A3A] font-medium text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Supabase Auth
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right text-[#9A9A9A] font-mono text-[11px]">
                    {prof.created_at ? prof.created_at.split('T')[0] : 'Just now'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Organizations Management Table */}
      <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1A1A1A]">Tenant Workspaces Directory</h3>
            <p className="text-xs text-[#6B6B6B]">Switch workspace or inspect quota consumption</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#6B6B6B]">
            <thead className="bg-[#FAFAF7] border-b border-[#F0EDE8] text-[#1A1A1A] font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Organization</th>
                <th className="py-3.5 px-4">Owner / Contact</th>
                <th className="py-3.5 px-4">Current Plan</th>
                <th className="py-3.5 px-4">Quota Usage</th>
                <th className="py-3.5 px-4">Active Events</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EDE8]">
              {organizations.map((org) => {
                const orgEvts = events.filter((e) => e.organizationId === org.id);
                const planInfo = PRICING_PLANS.find((p) => p.id === org.plan) || PRICING_PLANS[0];
                const regCount = org.totalRegistrationsCount ?? orgEvts.reduce((sum, e) => sum + (e.stats?.totalRegistrations || 0), 0);
                return (
                  <tr key={org.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#F5EDD8] border border-[#E8E5DF] flex items-center justify-center font-bold text-[#8B6914] text-xs">
                          {org.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#1A1A1A]">{org.name}</p>
                          <p className="text-[11px] text-[#9A9A9A] font-mono">{org.slug}.eventflow.in</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-[#1A1A1A]">{org.ownerName}</p>
                      <p className="text-[11px] text-[#9A9A9A]">{org.ownerEmail}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F0EDE8] text-[#5A5A5A] font-bold text-[10px] uppercase">
                        {org.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-medium text-[#1A1A1A]">
                        {regCount.toLocaleString()} / {planInfo.registrationLimit.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-[#9A9A9A]">
                        {planInfo.whatsappMessages.toLocaleString()} WA credits
                      </p>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#1A1A1A]">
                      {orgEvts.length} events
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchTenant(org.id, org.name)}
                        className="text-xs rounded-xl"
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
