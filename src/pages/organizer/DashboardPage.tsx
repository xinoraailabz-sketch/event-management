import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Users,
  CheckCircle2,
  QrCode,
  Plus,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  MapPin,
  Clock,
  Sparkles,
  Share2,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { formatDate, formatDateTime } from '../../lib/utils';

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

  const recentAttendees = [...attendees]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Overview
            </h1>
            <Badge variant="default" className="text-xs">
              {currentOrg.name}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Welcome back, {currentOrg.ownerName}. Live metrics and active events for your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeEvent && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateTo(`/app/events/${activeEvent.id}/scanner`)}
              leftIcon={<QrCode className="w-4 h-4 text-indigo-600" />}
            >
              Open QR Scanner
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigateTo('/app/events/new')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={orgEvents.length}
          subtext="Active in your workspace"
          icon={<Calendar className="w-4 h-4 text-indigo-600" />}
          change="+2 this month"
          isPositive={true}
        />
        <StatCard
          title="Upcoming Events"
          value={upcomingCount}
          subtext="Scheduled & open for registration"
          icon={<Clock className="w-4 h-4 text-sky-600" />}
        />
        <StatCard
          title="Total Registrations"
          value={totalRegs.toLocaleString()}
          subtext="Across all summit forms"
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          change="+18.4%"
          isPositive={true}
        />
        <StatCard
          title="Total Check-ins"
          value={totalChecked.toLocaleString()}
          subtext={`${totalRegs > 0 ? Math.round((totalChecked / totalRegs) * 100) : 0}% average turnout`}
          icon={<CheckCircle2 className="w-4 h-4 text-amber-600" />}
          progress={totalRegs > 0 ? Math.round((totalChecked / totalRegs) * 100) : 0}
        />
      </div>

      {/* Upcoming Events Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Upcoming & Active Events</h2>
            <p className="text-xs text-slate-500">Manage registrations, gates, and real-time attendance</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigateTo('/app/events')} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            View All ({orgEvents.length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {orgEvents.slice(0, 3).map((event) => {
            const regs = event.stats?.totalRegistrations || 0;
            const checked = event.stats?.totalCheckedIn || 0;
            const pct = Math.round((regs / (event.settings?.capacity || 1)) * 100);
            return (
              <div
                key={event.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Event Cover Banner */}
                <div className="h-32 bg-slate-900 relative overflow-hidden">
                  {event.branding?.coverImageUrl ? (
                    <img
                      src={event.branding.coverImageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-700 to-slate-900" />
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge status={event.status} size="sm" className="shadow-xs bg-white/95 backdrop-blur-xs font-bold" />
                  </div>
                  <div className="absolute bottom-2 right-3 text-white text-[11px] font-semibold bg-slate-900/70 px-2 py-0.5 rounded backdrop-blur-xs">
                    {event.city}
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {event.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(event.date)}</span>
                      <span>•</span>
                      <span>{event.startTime}</span>
                    </p>
                  </div>

                  {/* Attendance & Capacity Meter */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Registrations</span>
                      <span className="font-bold text-slate-900">
                        {regs.toLocaleString()} / {(event.settings?.capacity || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Checked In: <strong className="text-emerald-700">{checked}</strong></span>
                      <span className="font-semibold text-indigo-600">{event.stats?.attendancePercentage || 0}% turn-out</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}`);
                      }}
                      className="text-xs px-2"
                    >
                      Overview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}/registrations`);
                      }}
                      className="text-xs px-2"
                    >
                      Attendees
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setActiveEventId(event.id);
                        navigateTo(`/app/events/${event.id}/scanner`);
                      }}
                      className="text-xs px-2"
                      leftIcon={<QrCode className="w-3 h-3" />}
                    >
                      Scan
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Live Attendance Chart & Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (7 cols): Attendance Breakdown by Ticket Tier */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Check-In Velocity & Ticket Breakdown</h3>
              <p className="text-xs text-slate-500">Live admission progress for {activeEvent?.name}</p>
            </div>
            <Badge status="live" size="sm" dot={true} />
          </div>

          <div className="space-y-4 my-6">
            {[
              { name: 'VIP & Keynote Delegates', count: 48, total: 50, color: '#4f46e5' },
              { name: 'Early Bird Pass Holders', count: 180, total: 200, color: '#0284c7' },
              { name: 'Standard Conference Attendees', count: 120, total: 150, color: '#059669' },
            ].map((tier) => {
              const sharePct = Math.round((tier.count / tier.total) * 100);
              return (
                <div key={tier.name} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{tier.name}</span>
                    <span className="font-bold text-slate-900">{tier.count}/{tier.total} admitted ({sharePct}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: tier.color,
                        width: `${Math.min(100, sharePct)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>Peak check-in window: <strong>09:30 AM – 10:45 AM</strong></span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateTo(activeEvent ? `/app/events/${activeEvent.id}/reports` : '/app/events')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              View Full Analytics
            </Button>
          </div>
        </div>

        {/* Right (5 cols): Recent Registrations Table Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Registrations</h3>
                <p className="text-xs text-slate-500">Live stream of delegate sign-ups</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateTo(activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/events')}
                className="text-xs"
              >
                See All
              </Button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAttendees.map((att) => (
                <div key={att.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-xs">
                      {att.fullName.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate">{att.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{att.company || att.city}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-bold text-slate-600 block">
                      {att.registrationId}
                    </span>
                    <Badge status={att.status} size="sm" className="mt-0.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => navigateTo(activeEvent ? `/app/events/${activeEvent.id}/registrations` : '/app/events')}
            >
              Manage All Attendees
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
