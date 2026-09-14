import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  QrCode,
  Plus,
  ArrowRight,
  Sparkles,
  Clock,
  ShieldCheck,
  Zap,
  MapPin,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDate } from '../../lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const DashboardPage: React.FC = () => {
  const {
    currentOrg,
    events,
    attendees,
    activeEvent,
    setActiveEventId,
    navigateTo,
  } = useApp();

  const orgEvents = events.filter((e) => e.organizationId === currentOrg.id);
  const totalRegs = orgEvents.reduce((acc, curr) => acc + (curr.stats?.totalRegistrations || 0), 0);
  const totalChecked = orgEvents.reduce((acc, curr) => acc + (curr.stats?.totalCheckedIn || 0), 0);
  const upcomingCount = orgEvents.filter(
    (e) => e.status === 'published' || e.status === 'registration_open' || e.status === 'live'
  ).length;

  const eventAttendees = activeEvent ? attendees.filter((a) => a.eventId === activeEvent.id) : [];
  const recentAttendees = [...eventAttendees]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  // Dynamic ticket tier breakdown
  const tiers: Record<string, { total: number; checked: number }> = {};
  eventAttendees.forEach((a) => {
    const tier = a.ticketType || 'General Delegate';
    if (!tiers[tier]) tiers[tier] = { total: 0, checked: 0 };
    tiers[tier].total += 1;
    if (a.status === 'checked_in') tiers[tier].checked += 1;
  });

  const tierList = Object.entries(tiers);
  const turnoutRate = totalRegs > 0 ? Math.round((totalChecked / totalRegs) * 100) : 0;
  const targetCapacity = activeEvent?.settings?.capacity || totalRegs || 500;
  const remainingSlots = Math.max(0, targetCapacity - totalChecked);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Row with Action Pills */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1A1A1A]">
            Dashboard Overview
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-0.5">
            Here's what's happening with your events today
          </p>
        </div>

        {/* Action Pills Row */}
        <div className="flex items-center flex-wrap gap-2">
          {activeEvent && (
            <>
              <button
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/check-in`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8E5DF] bg-white hover:bg-[#FAFAF7] text-xs font-semibold text-[#1A1A1A] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C49A3C]" />
                <span>Live Check-in</span>
              </button>

              <button
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8E5DF] bg-white hover:bg-[#FAFAF7] text-xs font-semibold text-[#1A1A1A] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span>QR Scanner</span>
              </button>

              <button
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/registrations`)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E8E5DF] bg-white hover:bg-[#FAFAF7] text-xs font-semibold text-[#1A1A1A] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-[#6B6B6B]" />
                <span>Attendees</span>
              </button>
            </>
          )}

          <button
            onClick={() => navigateTo('/app/events/new')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-semibold transition-all shadow-sm cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Row 1: Full-Width 4 Equal Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrations"
          value={totalRegs.toLocaleString()}
          subtext="Delegates enrolled"
          change="+14.2%"
          icon={<Users className="w-4 h-4 text-[#C49A3C]" />}
        />
        <StatCard
          title="Checked-In"
          value={totalChecked.toLocaleString()}
          subtext={`${turnoutRate}% verified tickets`}
          isPositive={true}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          progress={turnoutRate}
        />
        <StatCard
          title="Active Events"
          value={orgEvents.length}
          subtext={`${upcomingCount} open for booking`}
          icon={<Calendar className="w-4 h-4 text-[#1A1A1A]" />}
        />
        <StatCard
          title="Scan Velocity"
          value="0.30s"
          subtext="Universal mobile scanning"
          icon={<Zap className="w-4 h-4 text-[#C49A3C]" />}
        />
      </div>

      {/* Row 2: Perfectly Balanced 2-Column Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column (5 cols): Featured Summit Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-3xl p-6 bg-gradient-to-b from-[#F5EFE0] via-[#F8F5EE] to-[#FFFFFF] border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col justify-between h-full min-h-[360px]">
            {/* Header tag */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#8B6914] bg-[#F5EDD8] px-3 py-1 rounded-full border border-[#E5D7B5]">
                {activeEvent ? 'Active Summit' : 'Workspace Ready'}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Visual Center Hologram / Graphic */}
            <div className="my-4 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#EEDDC0] to-[#FFF9EE] border border-[#E0D0B0] flex items-center justify-center shadow-[0_8px_24px_rgba(196,154,60,0.18)] mb-3">
                <Sparkles className="w-8 h-8 text-[#C49A3C]" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] line-clamp-1">
                {activeEvent ? activeEvent.name : 'Welcome to EventFlow'}
              </h3>
              <p className="text-xs text-[#6B6B6B] mt-1 max-w-[260px]">
                {activeEvent
                  ? `${activeEvent.city} • ${formatDate(activeEvent.date)}`
                  : 'Multi-tenant registration & lightning QR admission'}
              </p>
            </div>

            {/* Bottom Card Helper Box */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-[#E8E5DF]/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B6B6B] font-medium">Turnout Progress</span>
                <span className="font-bold text-[#C49A3C]">{turnoutRate}% Admitted</span>
              </div>
              <div className="w-full bg-[#F0EDE8] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#C49A3C] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, turnoutRate)}%` }}
                />
              </div>

              <button
                onClick={() => {
                  if (activeEvent) navigateTo(`/app/events/${activeEvent.id}/scanner`);
                  else navigateTo('/app/events/new');
                }}
                className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>{activeEvent ? 'Launch Universal Scanner' : 'Create First Event'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Sub-grid with Ticket Tier Breakdown & Capacity Gauge */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch">
          
          {/* Ticket Tier Breakdown */}
          <div className="rounded-3xl bg-white p-6 border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full min-h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-[#1A1A1A]">Ticket Tiers</h3>
                <Badge variant="default" className="text-[10px]">Live Sync</Badge>
              </div>
              <p className="text-xs text-[#6B6B6B] mb-4">Live admission progress by tier</p>

              {tierList.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#9A9A9A]">
                  No delegate tier registered yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {tierList.slice(0, 3).map(([name, data]) => {
                    const sharePct = data.total > 0 ? Math.round((data.checked / data.total) * 100) : 0;
                    return (
                      <div key={name} className="p-3 rounded-2xl bg-[#FAFAF7] border border-[#F0EDE8] space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">{name}</span>
                          <span className="font-bold text-[#6B6B6B]">
                            {data.checked}/{data.total} <span className="text-[#C49A3C]">({sharePct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-[#F0EDE8] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#C49A3C] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, sharePct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#F0EDE8] text-xs text-[#6B6B6B] mt-4">
              <span>Universal Gate Mode</span>
              <button
                onClick={() => navigateTo(activeEvent ? `/app/events/${activeEvent.id}/reports` : '/app/events')}
                className="font-semibold text-[#1A1A1A] hover:text-[#C49A3C] flex items-center gap-1 transition-colors cursor-pointer"
              >
                Analytics <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Event Capacity Gauge */}
          <div className="rounded-3xl bg-white p-6 border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full min-h-[360px]">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Event Capacity</h3>
              <p className="text-xs text-[#6B6B6B] mt-0.5">Target vs Admitted count</p>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="my-2 flex flex-col items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-[#F0EDE8]"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-[#C49A3C] transition-all duration-1000 ease-out"
                    strokeWidth="10"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * Math.min(100, turnoutRate)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                    {totalChecked}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#9A9A9A] tracking-wider">
                    Admitted
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-center text-xs pt-2 border-t border-[#F0EDE8]">
              <p className="font-semibold text-[#1A1A1A]">
                Capacity: {targetCapacity} delegates
              </p>
              <p className="text-[#9A9A9A] text-[11px]">
                {remainingSlots} slots remaining
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Row 3: Even 50/50 Split (Active Events on Left, Recent Registrations on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        
        {/* Left Column (50%): Active Events Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Active Events</h3>
                <p className="text-xs text-[#6B6B6B]">Manage registrations and live entrance</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo('/app/events')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                View All ({orgEvents.length})
              </Button>
            </div>

            {/* Events Stack (even layout whether 1 or multiple events) */}
            {orgEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#9A9A9A]">
                No events created in this workspace yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orgEvents.slice(0, 3).map((event) => {
                const regs = event.stats?.totalRegistrations || 0;
                const checked = event.stats?.totalCheckedIn || 0;
                const isSelected = activeEvent?.id === event.id;

                return (
                  <div
                    key={event.id}
                    onClick={() => setActiveEventId(event.id)}
                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-[#C49A3C] bg-[#FFFDF9] ring-1 ring-[#C49A3C]/40 shadow-xs'
                        : 'border-[#E8E5DF] bg-[#FAFAF7] hover:border-[#D5D0C8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A9A9A] block">
                          {event.city || 'Venue'}
                        </span>
                        <h4 className="text-sm font-bold text-[#1A1A1A] truncate">{event.name}</h4>
                      </div>
                      <Badge status={event.status} size="sm" />
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[#6B6B6B]">
                        <span>Turnout</span>
                        <span className="font-bold text-[#1A1A1A]">{checked} / {regs}</span>
                      </div>
                      <div className="w-full bg-[#E8E5DF] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#C49A3C] h-1.5 rounded-full"
                          style={{ width: `${regs > 0 ? (checked / regs) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#E8E5DF]/60">
                      <span className="text-[11px] text-[#9A9A9A] flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {formatDate(event.date)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEventId(event.id);
                          navigateTo(`/app/events/${event.id}/scanner`);
                        }}
                        className="px-3 py-1 rounded-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <QrCode className="w-3 h-3" /> Scan Pass
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#F0EDE8] mt-3">
            <button
              onClick={() => navigateTo('/app/events/new')}
              className="w-full py-2.5 rounded-xl border border-[#E8E5DF] hover:bg-[#FAFAF7] text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer text-center"
            >
              + Create New Event
            </button>
          </div>
        </div>

        {/* Right Column (50%): Recent Registrations Feed */}
        <div className="p-6 rounded-3xl bg-white border border-[#E8E5DF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between h-full min-h-[340px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Recent Registrations</h3>
                <p className="text-xs text-[#6B6B6B]">Live delegate sign-up activity</p>
              </div>
              {activeEvent && (
                <button
                  onClick={() => navigateTo(`/app/events/${activeEvent.id}/registrations`)}
                  className="text-xs font-semibold text-[#C49A3C] hover:underline cursor-pointer"
                >
                  View All
                </button>
              )}
            </div>

            {recentAttendees.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#9A9A9A]">
                No registrations yet.
              </div>
            ) : (
              <div className="divide-y divide-[#F0EDE8]">
                {recentAttendees.map((att) => (
                  <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar className="h-8 w-8 border border-[#E8E5DF] shrink-0">
                        <AvatarFallback className="text-xs font-bold bg-[#F5EDD8] text-[#8B6914]">
                          {att.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="font-semibold text-[#1A1A1A] truncate">{att.fullName}</p>
                        <p className="text-[11px] text-[#9A9A9A] truncate">{att.company || att.city || 'Delegate'}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[10px] font-bold text-[#6B6B6B] block">
                        {att.registrationId}
                      </span>
                      <Badge status={att.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeEvent && (
            <div className="pt-3 border-t border-[#F0EDE8] mt-3">
              <button
                onClick={() => navigateTo(`/app/events/${activeEvent.id}/registrations`)}
                className="w-full py-2.5 rounded-xl border border-[#E8E5DF] hover:bg-[#FAFAF7] text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer text-center"
              >
                Manage All Attendees →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
